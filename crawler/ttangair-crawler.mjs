#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const DEFAULT_LIST_URL = "https://www.ttang.com/ttangair/search/ttang/list.do?arr0=A7ALL";
const DEFAULT_MAX_PRICE = 300000;

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
  return decodeHtml(value.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function attribute(fragment, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = fragment.match(new RegExp(`\\b${escaped}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function listRows(html) {
  return [...html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)]
    .map((match) => match[0])
    .filter((row) => /data-masterId\s*=/i.test(row));
}

function parseCheckInDate(html) {
  const input = html.match(/<input\b[^>]*id=["']airAvailCheckIn["'][^>]*>/i);
  return input ? attribute(input[0], "value") : "";
}

function reservationUrl(row, baseUrl, checkInDate) {
  const anchor = row.match(/<a\b[^>]*data-masterId\s*=\s*["'][^"']+["'][^>]*>[\s\S]*?<\/a>/i)?.[0] ?? "";
  const gubun = attribute(anchor, "data-gubun");
  const depCity = attribute(anchor, "data-depCity");
  const arrCity = attribute(anchor, "data-arrCity");
  const airlineCode = attribute(anchor, "data-airlineCode");
  const adtFare = attribute(anchor, "data-adtFare");
  const adtQcharge = attribute(anchor, "data-adtQcharge");
  const masterId = ["VV", "VH", "VM"].includes(gubun)
    ? attribute(anchor, "data-masterId")
    : `${depCity}-${arrCity}-${airlineCode}-${adtFare}-${adtQcharge}-${gubun}`;

  const url = new URL("/ttangair/popup/ttang_inwon.do", baseUrl);
  url.searchParams.set("masterId", masterId);
  url.searchParams.set("gubun", gubun);
  if (checkInDate) url.searchParams.set("exAirAvailStartDate", checkInDate);
  if (["VV", "VH", "VM"].includes(gubun)) url.searchParams.set("minimumCnt", attribute(anchor, "data-minimumCnt") || "1");
  return url.href;
}

function parseRow(row, baseUrl, checkInDate) {
  const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
  const anchor = row.match(/<a\b[^>]*data-masterId\s*=\s*["'][^"']+["'][^>]*>[\s\S]*?<\/a>/i)?.[0] ?? "";
  const price = Number(attribute(anchor, "data-adtFare"));
  const dates = textFromHtml(cells[4] ?? "").replace(/\s*\(.*?\)\s*/g, "").trim();
  const [fromDate = "", toDate = ""] = dates.split("~").map((value) => value.trim());
  const airlineCell = cells[2] ?? "";

  return {
    departure: textFromHtml(cells[0] ?? ""),
    departureCode: attribute(anchor, "data-depCity"),
    arrival: textFromHtml(cells[1] ?? ""),
    arrivalCode: attribute(anchor, "data-arrCity"),
    airline: textFromHtml(airlineCell),
    airlineCode: attribute(anchor, "data-airlineCode"),
    nonstop: textFromHtml(cells[3] ?? "") === "직항",
    fromDate,
    toDate,
    tripType: textFromHtml(cells[5] ?? ""),
    price,
    minimumPassengers: Number(attribute(anchor, "data-minimumCnt") || 1),
    masterId: attribute(anchor, "data-masterId"),
    gubun: attribute(anchor, "data-gubun"),
    reservationUrl: reservationUrl(row, baseUrl, checkInDate),
    sourceUrl: baseUrl,
  };
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "accept-language": "ko-KR,ko;q=0.9,en;q=0.8",
      "user-agent": "Mozilla/5.0 (compatible; TtangDealRadar/0.1; +https://ttang-air-alert.vividfox6.chatgpt.site)",
    },
  });
  if (!response.ok) throw new Error(`땡닷컴 응답 오류: HTTP ${response.status}`);
  return response.text();
}

export async function crawlTtangAir({ listUrl = DEFAULT_LIST_URL, departureCode = "ICN", maxPrice = DEFAULT_MAX_PRICE, maxPages = 20 } = {}) {
  const deals = new Map();

  for (let page = 1; page <= maxPages; page += 1) {
    const pageUrl = new URL(listUrl);
    pageUrl.searchParams.set("page", String(page));
    pageUrl.searchParams.set("scale", "20");
    const html = await fetchPage(pageUrl.href);
    const rows = listRows(html);
    if (!rows.length) break;
    const checkInDate = parseCheckInDate(html);

    for (const row of rows) {
      const deal = parseRow(row, pageUrl.href, checkInDate);
      if (deal.departureCode === departureCode && deal.price > 0 && deal.price < maxPrice) {
        const key = `${deal.masterId}|${deal.fromDate}|${deal.toDate}`;
        deals.set(key, deal);
      }
    }

    if (rows.length < 20) break;
  }

  return [...deals.values()].sort((left, right) => left.price - right.price);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const deals = await crawlTtangAir();
  console.log(JSON.stringify({ fetchedAt: new Date().toISOString(), count: deals.length, deals }, null, 2));
}
