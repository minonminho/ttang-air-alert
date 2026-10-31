#!/usr/bin/env node
import { pathToFileURL } from "node:url";

export const SOURCE_ID = "ttang";
export const SOURCE_NAME = "땡처리닷컴";
export const TODAY_URL = "https://mm.ttang.com/ttangair/search/discount/today.do?trip=RT&gubun=T";
export const PROMOTION_URL = "https://mm.ttang.com/ttangair/search/promotion/ttangIndex.do";
const TODAY_ENDPOINT = "/ttangair/search/discount/listAct.do";
const PROMOTION_ENDPOINT = "/ttangair/search/promotion/allTtangListAct.do";
const USER_AGENT = "TtangDealRadar/0.1 (+https://github.com/minonminho/ttang-air-alert)";
const DEFAULT_MAX_PRICE = 300000;
const JAPAN_AIRPORTS = new Set([
  "NRT","HND","KIX","NGO","FUK","CTS","HKD","OBO","AOJ","SDJ","KIJ","IBR",
  "FSZ","KMQ","OKJ","YGJ","HIJ","TAK","MYJ","HSG","NGS","OIT","KMJ","KMI",
  "KOJ","OKA","ISG","UKB","ITM","TOY","GAJ","TTJ","IWK","UBJ","SHM","TKS","AKJ","ASJ","KUH","MMB","MMY",
]);

function pad(number) { return String(number).padStart(2, "0"); }
function dateKey(date) { return date.getUTCFullYear() + pad(date.getUTCMonth()+1) + pad(date.getUTCDate()); }
function displayDate(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return /^\d{8}$/.test(digits) ? digits.slice(0,4) + "." + digits.slice(4,6) + "." + digits.slice(6,8) : "";
}
function parseDate(value) {
  if (!/^\d{8}$/.test(String(value || ""))) return null;
  const text = String(value);
  const date = new Date(Date.UTC(Number(text.slice(0,4)), Number(text.slice(4,6))-1, Number(text.slice(6,8))));
  return dateKey(date) === text ? date : null;
}

export function koreaToday(now = new Date()) {
  const text = new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
  return new Date(text + "T00:00:00Z");
}
export function threeMonthEnd(date) {
  // JavaScript's setMonth can overflow: Oct 31 + 3 months must be Jan 31.
  const monthStart = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+3,1));
  const maxDay = new Date(Date.UTC(monthStart.getUTCFullYear(),monthStart.getUTCMonth()+1,0)).getUTCDate();
  return new Date(Date.UTC(monthStart.getUTCFullYear(),monthStart.getUTCMonth(),Math.min(date.getUTCDate(),maxDay)));
}
export function datesInRange(start, end, maxDays = Infinity) {
  const dates = [];
  for (let cursor = new Date(start); cursor <= end && dates.length < maxDays; cursor.setUTCDate(cursor.getUTCDate()+1)) {
    dates.push(dateKey(cursor));
  }
  return dates;
}

function decodeHtml(value) {
  return String(value || "").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'");
}
export function getSearchForm(html) {
  const formTag = String(html).match(/<form\b[^>]*id=["']searchForm["'][\s\S]*?<\/form>/i)?.[0];
  if (!formTag) throw new Error("땡처리 모바일 검색 폼을 찾지 못했습니다.");
  const params = new URLSearchParams();
  for (const input of formTag.match(/<input\b[^>]*>/gi) || []) {
    const name = input.match(/\bname=["']([^"']+)["']/i)?.[1];
    const value = input.match(/\bvalue=["']([^"']*)["']/i)?.[1] || "";
    if (name) params.set(name,decodeHtml(value));
  }
  params.set("trip","RT");
  params.set("page","1");
  return params;
}

export function readXmlOffers(xml) {
  const cdata = String(xml).match(/<CONTENS>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/CONTENS>/i)?.[1];
  if (!cdata) throw new Error("땡처리 응답에 상품 목록 데이터가 없습니다.");
  let payload;
  try { payload = JSON.parse(cdata); }
  catch { throw new Error("땡처리 응답의 상품 JSON을 해석하지 못했습니다."); }
  if (payload.code !== "OK" || !Array.isArray(payload.response)) {
    throw new Error("땡처리 상품 응답 오류: " + String(payload.desc || payload.code || "invalid payload"));
  }
  return payload.response;
}

function isJapaneseAirport(item) {
  // Promotion API supplies 'A7', the today-open API leaves the region empty.
  return item.natOpClass === "A7" || (!item.natOpClass && JAPAN_AIRPORTS.has(item.arrCityCode));
}
function parseDurationDays(value) {
  const text = String(value || "").trim();
  const nightDays = text.match(/\d+박\s*(\d+)일/);
  const days = Number(nightDays?.[1] || (/^\d+$/.test(text) ? text : 0));
  return Number.isInteger(days) && days > 0 && days <= 31 ? days : null;
}
function bookingUrl(kind, departureDate) {
  if (kind === "today") return TODAY_URL;
  const url = new URL(PROMOTION_URL);
  if (departureDate) url.searchParams.set("depdate0",departureDate);
  url.searchParams.set("trip","RT");
  return url.href;
}

export function parseMobileOffers(items, {
  kind, maxPrice = DEFAULT_MAX_PRICE, departureCodes = ["ICN","GMP"],
  startDate = koreaToday(), endDate = threeMonthEnd(startDate),
} = {}) {
  const accepted = new Set(departureCodes);
  const lowest = new Map();
  const minDate = dateKey(startDate), maxDate = dateKey(endDate);
  for (const item of items) {
    const price = Number(item.totalPrice);
    if (item.tripType !== "RT" || Number(item.viaCnt) !== 0
      || !accepted.has(item.depCityCode) || !isJapaneseAirport(item)
      || !Number.isFinite(price) || price <= 0 || price >= maxPrice) continue;
    const isWindow = kind === "today";
    const first = isWindow ? item.fromSupplyDate : item.departureDate;
    const last = isWindow ? item.toSupplyDate : item.arrivalDate;
    const departureDate = parseDate(first);
    const finalDate = parseDate(last);
    if (!departureDate || !finalDate || finalDate < departureDate) continue;
    if (isWindow ? (dateKey(finalDate) < minDate || dateKey(departureDate) > maxDate)
      : (dateKey(departureDate) < minDate || dateKey(departureDate) > maxDate)) continue;
    const fromDate = isWindow && dateKey(departureDate) < minDate ? displayDate(minDate) : displayDate(first);
    const toDate = isWindow && dateKey(finalDate) > maxDate ? displayDate(maxDate) : displayDate(last);
    const deal = {
      sourceId: SOURCE_ID, sourceName: SOURCE_NAME,
      collection: isWindow ? "today-open" : "promotion-calendar",
      dateType: isWindow ? "departure-window" : "itinerary",
      departure: item.depCityDesc || (item.depCityCode === "GMP" ? "김포" : "인천"),
      departureCode: item.depCityCode,
      arrival: item.arrCityDesc || item.arrCityCode, arrivalCode: item.arrCityCode,
      airline: item.tktCarDesc || item.tktCar || "", airlineCode: item.tktCar || "",
      nonstop: true, fromDate, toDate,
      durationDays: parseDurationDays(item.tripDay),
      tripType: isWindow ? "왕복 · 출발 가능 기간" : "왕복",
      price, minimumPassengers: Math.max(1,Number(item.minimumCnt) || 1),
      masterId: String(item.masterId || item.hanaFareId || ""),
      gubun: item.gubun || "", reservationUrl: bookingUrl(kind,item.departureDate),
      sourceUrl: isWindow ? TODAY_URL : PROMOTION_URL,
    };
    const key = [deal.collection,deal.departureCode,deal.arrivalCode,deal.masterId,fromDate,toDate,deal.durationDays].join("|");
    if (!lowest.has(key) || price < lowest.get(key).price) lowest.set(key,deal);
  }
  return [...lowest.values()].sort((a,b) => a.price-b.price);
}

async function fetchHtml(url) {
  const response = await fetch(url,{
    signal:AbortSignal.timeout(15000),
    headers:{accept:"text/html,application/xhtml+xml","accept-language":"ko-KR,ko;q=0.9","user-agent":USER_AGENT},
  });
  if (!response.ok) throw new Error("땡처리 모바일 페이지 HTTP " + response.status);
  return response.text();
}
async function fetchOffers(endpoint, referer, params) {
  const response = await fetch(new URL(endpoint,referer),{
    method:"POST",signal:AbortSignal.timeout(15000),body:params,
    headers:{
      "content-type":"application/x-www-form-urlencoded; charset=UTF-8",
      accept:"application/xml,text/xml,*/*",
      "x-requested-with":"XMLHttpRequest",referer,"user-agent":USER_AGENT,
    },
  });
  if (!response.ok) throw new Error("땡처리 모바일 목록 HTTP " + response.status);
  return readXmlOffers(await response.text());
}
function delay(ms) { return new Promise((resolve)=>setTimeout(resolve,ms)); }

// The site returns every matching fare inside XML/JSON, irrespective of its visible page-size=20.
export async function crawlTtangAir({
  departureCodes = ["ICN","GMP"], departureCode, maxPrice = DEFAULT_MAX_PRICE,
  startDate = koreaToday(), maxDays = Infinity, delayMs = 1000,
} = {}) {
  if (departureCode) departureCodes = [departureCode];
  const endDate = threeMonthEnd(startDate);
  const options = {startDate,endDate,departureCodes,maxPrice};
  const [todayHtml, calendarHtml] = await Promise.all([fetchHtml(TODAY_URL),fetchHtml(PROMOTION_URL)]);
  const todayForm = getSearchForm(todayHtml);
  todayForm.set("gubun","T");
  const calendarForm = getSearchForm(calendarHtml);
  const today = parseMobileOffers(await fetchOffers(TODAY_ENDPOINT,TODAY_URL,todayForm),{...options,kind:"today"});
  const results = new Map();
  for (const item of today) results.set([item.collection,item.departureCode,item.arrivalCode,item.masterId,item.fromDate,item.toDate,item.durationDays].join("|"),item);
  const days = datesInRange(startDate,endDate,maxDays);
  console.log("[ttang] today-open: " + today.length + " Japan direct fares; calendar: " + days.length + " departure days");
  for (const [index, date] of days.entries()) {
    if (index && delayMs > 0) await delay(delayMs);
    const form = new URLSearchParams(calendarForm);
    form.set("depdate0",date);
    const items = parseMobileOffers(await fetchOffers(PROMOTION_ENDPOINT,PROMOTION_URL,form),{...options,kind:"calendar"});
    for (const item of items) results.set([item.collection,item.departureCode,item.arrivalCode,item.masterId,item.fromDate,item.toDate,item.price].join("|"),item);
    if ((index+1)%10===0 || index===days.length-1) console.log("[ttang] calendar " + (index+1) + "/" + days.length + ", offers=" + results.size);
  }
  return [...results.values()].sort((a,b)=>a.price-b.price);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const offers = await crawlTtangAir({maxDays:Number(process.env.TTANG_MAX_DAYS || Infinity)});
  console.log(JSON.stringify({fetchedAt:new Date().toISOString(),count:offers.length,deals:offers},null,2));
}
