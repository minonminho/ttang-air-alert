#!/usr/bin/env node

import { pathToFileURL } from "node:url";

export const SOURCE_ID = "ybtour";
export const SOURCE_NAME = "노랑풍선";
export const SOURCE_URL = "https://fly.ybtour.co.kr/booking/findDiscountAir.lts?efcTpCode=INV&efcCode=INV";

const DEFAULT_DEPARTURE_CODE = "ICN";
const DEFAULT_MAX_PRICE = 300000;
const JAPAN_BANNER_CODE = "J1";
const USER_AGENT = "Mozilla/5.0 (compatible; TtangDealRadar/0.1; +https://ttang-air-alert.vividfox6.chatgpt.site)";
const FALLBACK_CITY_CODES = ["FUK", "SHI", "KIX", "CTS", "OKA", "KMJ", "FSZ", "MYJ", "NGO", "NRT", "TAK", "HKD", "UKB", "OIT"];

function decodeHtml(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function textFromHtml(value = "") {
  return decodeHtml(value
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function attribute(fragment, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = fragment.match(new RegExp(`\\b${escaped}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function hiddenValue(row, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const input = [...row.matchAll(/<input\b[^>]*>/gi)]
    .map((match) => match[0])
    .find((fragment) => attribute(fragment, "name") === name || new RegExp(`\\bid\\s*=\\s*["'][^"']*${escaped}[^"']*["']`, "i").test(fragment));
  return input ? attribute(input, "value") : "";
}

function cellText(row, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = row.match(new RegExp(`<td\\b[^>]*class=["'][^"']*\\b${escaped}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`, "i"));
  return match ? textFromHtml(match[1]) : "";
}

function normalizeDate(value) {
  const match = String(value).trim().match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  return match ? `20${match[1]}.${match[2]}.${match[3]}` : String(value).trim();
}

function parsePeriod(value) {
  const [fromDate = "", toDate = ""] = value.split("~").map(normalizeDate);
  return { fromDate, toDate };
}

function cityUrl(cityCode, fareGroup = "") {
  const url = new URL(SOURCE_URL);
  url.searchParams.set("efcBannerCode", JAPAN_BANNER_CODE);
  url.searchParams.set("efcCityCode", cityCode);
  if (fareGroup) url.hash = `faregroup_${fareGroup}`;
  return url.href;
}

function discoverCityCodes(html) {
  const decoded = decodeHtml(html);
  const codes = [...decoded.matchAll(/getFare\(\s*['"]FARE['"]\s*,\s*["']([^"']+)["']/gi)]
    .map((match) => match[1]);
  return [...new Set(codes)].length ? [...new Set(codes)] : FALLBACK_CITY_CODES;
}

function parseRows(html, cityCode, maxPrice, departureCode) {
  const rows = [...html.matchAll(/<tr\b[^>]*id=["']fareListSeq_\d+["'][^>]*>[\s\S]*?<\/tr>/gi)].map((match) => match[0]);
  const deals = [];

  for (const row of rows) {
    const priceText = cellText(row, "tft_won");
    const priceMatch = priceText.match(/[\d,]+/);
    const price = Number(priceMatch?.[0]?.replace(/,/g, "") || 0);
    const rowDepartureCode = hiddenValue(row, "depCity");
    const rowArrivalCode = hiddenValue(row, "arrCity") || cityCode;
    if (rowDepartureCode !== departureCode || !rowArrivalCode || !price || price >= maxPrice) continue;

    const period = parsePeriod(cellText(row, "tft_dat"));
    const fareGroup = hiddenValue(row, "efmAffFareGroupId");
    deals.push({
      sourceId: SOURCE_ID,
      sourceName: SOURCE_NAME,
      departure: cellText(row, "tft_str"),
      departureCode: rowDepartureCode,
      arrival: cellText(row, "tft_get"),
      arrivalCode: rowArrivalCode,
      airline: cellText(row, "tft_air"),
      airlineCode: hiddenValue(row, "carCode"),
      nonstop: false,
      fromDate: period.fromDate,
      toDate: period.toDate,
      tripType: cellText(row, "tft_pan") || (hiddenValue(row, "tripType") === "OW" ? "편도" : "왕복"),
      price,
      minimumPassengers: Number(hiddenValue(row, "ics_min_tcp_rt") || 1),
      masterId: fareGroup || hiddenValue(row, "efmAffId"),
      gubun: "YBTOUR",
      reservationUrl: cityUrl(rowArrivalCode, fareGroup),
      sourceUrl: SOURCE_URL,
    });
  }

  return deals;
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "accept-language": "ko-KR,ko;q=0.9,en;q=0.8",
      referer: SOURCE_URL,
      "user-agent": USER_AGENT,
    },
  });
  if (!response.ok) throw new Error(`노랑풍선 페이지 요청 오류: HTTP ${response.status}`);
  return response.text();
}

export async function crawlYbtour({ departureCode = DEFAULT_DEPARTURE_CODE, maxPrice = DEFAULT_MAX_PRICE } = {}) {
  const initialHtml = await fetchPage(SOURCE_URL);
  const cityCodes = discoverCityCodes(initialHtml);
  const deals = new Map();

  for (const cityCode of cityCodes) {
    // The initial page defaults to one city (often FUK); never reuse it as the CTS listing.
    const html = await fetchPage(cityUrl(cityCode));
    for (const deal of parseRows(html, cityCode, maxPrice, departureCode)) {
      const key = `${deal.masterId}|${deal.fromDate}|${deal.toDate}`;
      deals.set(key, deal);
    }
  }

  return [...deals.values()].sort((left, right) => left.price - right.price);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const deals = await crawlYbtour();
  console.log(JSON.stringify({ fetchedAt: new Date().toISOString(), count: deals.length, deals }, null, 2));
}
