#!/usr/bin/env node

import { pathToFileURL } from "node:url";

export const SOURCE_ID = "hanatour";
export const SOURCE_NAME = "하나투어";
export const SOURCE_URL = "https://www.hanatour.com/trp/air/CHPC0AIR0233M200";

const API_URL = "https://api.hanatour.com/svc/mciAir/schLstChnc?_siteId=hanatour";
const DEFAULT_DEPARTURE_CODE = "ICN";
const DEFAULT_MAX_PRICE = 300000;
const USER_AGENT = "Mozilla/5.0 (compatible; TtangDealRadar/0.1; +https://ttang-air-alert.vividfox6.chatgpt.site)";

function formatDate(value) {
  const date = String(value ?? "");
  const match = date.match(/^(\d{4})(\d{2})(\d{2})$/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : date;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function adultTotal(item) {
  return number(item.dtcmAdtDcAplSaleAmt)
    + number(item.adtQchrgAmt)
    + number(item.adtFuelExchgAmt)
    + number(item.adtTaxAmt)
    + number(item.dtcmAdtIsueFeeAmt);
}

function cookieHeader(response) {
  const cookies = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie") ?? ""];

  return cookies
    .map((cookie) => cookie.split(";", 1)[0])
    .filter(Boolean)
    .join("; ");
}

function reservationUrl(item, outbound, passengerCount = 1) {
  const url = new URL("/trp/air/CHPC0AIR0222M201", SOURCE_URL);
  const cardPromotion = Array.isArray(item.cardPromLst) ? item.cardPromLst[0] : item.cardPromLst;
  url.searchParams.set("fareId", item.fareId ?? "");
  url.searchParams.set("depPlcNm", outbound.depAptNm ?? "인천 국제공항");
  url.searchParams.set("arrPlcNm", outbound.arrAptNm ?? outbound.arrCityCdNm ?? "");
  url.searchParams.set("itnrTypeCd", item.itnrTypeCd ?? "RT");
  url.searchParams.set("adtCnt", String(passengerCount));
  url.searchParams.set("chdCnt", "0");
  url.searchParams.set("infCnt", "0");
  url.searchParams.set("cabinType", outbound.fltLst?.[0]?.cabinType ?? "Y");
  url.searchParams.set("cardPromId", cardPromotion?.cardPromId ?? "");
  url.searchParams.set("eventCd", cardPromotion?.eventCd ?? "");
  return url.href;
}

function parseDeal(item, departureCode) {
  const itinerary = Array.isArray(item.itnrLst) ? item.itnrLst : [];
  const outbound = itinerary[0];
  if (!outbound || outbound.depAptCode !== departureCode || outbound.arrCntryCd !== "JP") return null;

  const price = adultTotal(item);
  if (price <= 0) return null;

  const returnLeg = itinerary[itinerary.length - 1];
  const departureDate = formatDate(outbound.depDate);
  const arrivalDate = formatDate(returnLeg?.depDate || outbound.arrDate);

  return {
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    departure: outbound.depAptNm || "인천 국제공항",
    departureCode,
    arrival: outbound.arrCityCdNm || outbound.arrAptNm || "",
    arrivalCode: outbound.arrAptCode || "",
    airline: item.tktAlName || item.tktAlCode || "",
    airlineCode: item.tktAlCode || item.tktAl || "",
    nonstop: Array.isArray(outbound.fltLst) && outbound.fltLst.length <= 1,
    fromDate: departureDate,
    toDate: arrivalDate,
    tripType: item.itnrTypeCd === "OW" ? "편도" : "왕복",
    price,
    minimumPassengers: 1,
    masterId: item.fareId || "",
    gubun: "HANATOUR",
    reservationUrl: reservationUrl(item, outbound),
    sourceUrl: SOURCE_URL,
  };
}

async function fetchPageCookies() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "accept-language": "ko-KR,ko;q=0.9,en;q=0.8",
      "user-agent": USER_AGENT,
    },
  });
  if (!response.ok) throw new Error(`하나투어 페이지 요청 오류: HTTP ${response.status}`);
  return cookieHeader(response);
}

async function fetchFareList() {
  const cookies = await fetchPageCookies();
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "ko-KR,ko;q=0.9,en;q=0.8",
      "content-type": "application/json",
      cookie: cookies,
      origin: "https://www.hanatour.com",
      prgmId: "CHPC0AIR0233M200",
      referer: SOURCE_URL,
      "user-agent": USER_AGENT,
    },
    body: JSON.stringify({
      bizCom: { langCode: "ko-KR" },
      lstChncEventYn: "Y",
    }),
  });
  if (!response.ok) throw new Error(`하나투어 항공권 API 오류: HTTP ${response.status}`);

  const payload = await response.json();
  if (payload.result !== "200" && payload.bizCom?.resultCode !== "0000") {
    throw new Error(`하나투어 항공권 API 응답 오류: ${payload.resultMessage || payload.bizCom?.resultMsg || "알 수 없는 오류"}`);
  }
  return Array.isArray(payload.farLst) ? payload.farLst : [];
}

export async function crawlHanatour({ departureCode = DEFAULT_DEPARTURE_CODE, maxPrice = DEFAULT_MAX_PRICE } = {}) {
  const items = await fetchFareList();
  const deals = new Map();

  for (const item of items) {
    const deal = parseDeal(item, departureCode);
    if (!deal || deal.price >= maxPrice) continue;
    const key = `${deal.masterId}|${deal.fromDate}|${deal.toDate}`;
    deals.set(key, deal);
  }

  return [...deals.values()].sort((left, right) => left.price - right.price);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const deals = await crawlHanatour();
  console.log(JSON.stringify({ fetchedAt: new Date().toISOString(), count: deals.length, deals }, null, 2));
}
