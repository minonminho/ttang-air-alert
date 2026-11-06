// Compact, observed (not estimated) daily minimum fare history.
// Every observation is the cheapest VERIFIED nonstop round trip seen in one
// search snapshot for an origin, exact arrival airport, city, and trip length.
// Prices across different departure dates are not the same flight's price.
import { isVerifiedFlightResult } from "./flight-validation.mjs";

export const PRICE_HISTORY_SCHEMA = 1;
export const PRICE_HISTORY_RETENTION_DAYS = 120;
const ALLOWED_DURATIONS = new Set([3, 4, 5, 6]);

export function kstDay(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("가격 기록의 수집 시각이 올바르지 않습니다.");
  return new Intl.DateTimeFormat("en-CA", {
    timeZone:"Asia/Seoul", year:"numeric", month:"2-digit", day:"2-digit",
  }).format(date);
}

export function getPriceHistoryKey(record) {
  return [record.day,record.departureCode,record.cityCode,record.arrivalAirportCode,record.tripDays].join("|");
}

export function dailyMinimumObservations(snapshot) {
  if (!snapshot || snapshot.status === "failed" || !Array.isArray(snapshot.results)) {
    throw new Error("검증된 Google Flights 결과가 없으므로 가격 이력을 갱신하지 않습니다.");
  }
  const checkedAt = new Date(snapshot.updatedAt);
  if (!Number.isFinite(checkedAt.getTime())) throw new Error("항공권 갱신 시각이 없습니다.");
  const day = kstDay(checkedAt);
  const found = new Map();
  for (const flight of snapshot.results) {
    if (!isVerifiedFlightResult(flight)) continue;
    const duration = Number(flight.tripDays);
    if (!ALLOWED_DURATIONS.has(duration)) continue;
    const departureCode = flight.departureCode || "ICN";
    const cityCode = flight.destinationCode || flight.arrivalAirportCode;
    const arrivalAirportCode = flight.arrivalAirportCode || flight.destinationCode;
    if (!/^[A-Z]{3}$/.test(String(cityCode)) || !/^[A-Z]{3}$/.test(String(arrivalAirportCode))) continue;
    const price = Number(flight.price);
    const record = {
      day, departureCode, cityCode, arrivalAirportCode,
      tripDays:duration, minPrice:price, checkedAt:checkedAt.toISOString(), sampleCount:1,
    };
    const key = getPriceHistoryKey(record);
    const previous = found.get(key);
    if (!previous) found.set(key,record);
    else {
      previous.sampleCount++;
      if (price < previous.minPrice) previous.minPrice = price;
    }
  }
  if (!found.size) throw new Error("직항·공항·날짜 검증을 통과한 가격이 없어 기록을 보존합니다.");
  return [...found.values()].sort((a,b)=>getPriceHistoryKey(a).localeCompare(getPriceHistoryKey(b)));
}

export function mergePriceHistory(existing, snapshot, {now = new Date(), retentionDays = PRICE_HISTORY_RETENTION_DAYS} = {}) {
  if (!Number.isInteger(retentionDays) || retentionDays < 31) throw new Error("이력 보관 기간이 올바르지 않습니다.");
  if (existing && (existing.schemaVersion !== PRICE_HISTORY_SCHEMA || !Array.isArray(existing.observations))) {
    throw new Error("지원하지 않는 기존 가격 기록 구조입니다. 덮어쓰지 않습니다.");
  }
  const snapshotTime = new Date(snapshot.updatedAt);
  const nowTime = new Date(now);
  if (!Number.isFinite(nowTime.getTime()) || !Number.isFinite(snapshotTime.getTime()) ||
      snapshotTime.getTime() > nowTime.getTime() + 3600000 ||
      nowTime.getTime() - snapshotTime.getTime() > 36 * 3600000) {
    throw new Error("최신 검색이 아니므로 오래된 가격으로 이력을 생성하지 않습니다.");
  }
  const added = dailyMinimumObservations(snapshot);
  const cutoff = new Date(nowTime.getTime() - (retentionDays-1)*86400000);
  const cutoffDay = kstDay(cutoff);
  const all = new Map();
  for (const row of existing?.observations || []) {
    if (typeof row?.day !== "string" || row.day < cutoffDay || !Number.isFinite(row.minPrice) || row.minPrice <= 0) continue;
    all.set(getPriceHistoryKey(row),row);
  }
  for (const row of added) {
    if (row.day < cutoffDay) continue;
    const key = getPriceHistoryKey(row);
    if (!all.has(key) || new Date(row.checkedAt).getTime() >= new Date(all.get(key).checkedAt).getTime()) {
      all.set(key,row);
    }
  }
  const observations = [...all.values()].sort((a,b)=>getPriceHistoryKey(a).localeCompare(getPriceHistoryKey(b)));
  return {
    schemaVersion:PRICE_HISTORY_SCHEMA,
    updatedAt:nowTime.toISOString(),
    retentionDays,
    source:"Google Flights verified nonstop round-trip daily route-duration minimum",
    interpretation:"Each price is a daily observed minimum across different flight departure dates for the same origin, destination airport and trip length; not a price change for an identical ticket.",
    observations,
  };
}
