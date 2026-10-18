#!/usr/bin/env node

import { pathToFileURL } from "node:url";

export const SOURCE_ID = "modetour";
export const SOURCE_NAME = "모두투어";
export const SOURCE_URL = "https://www.modetour.com/flights/discount-flight";

const API_BASE_URL = "https://b2c-api.modetour.com";
const DEFAULT_MAX_PRICE = 300000;
const DEFAULT_DEPARTURE_CODE = "ICN";
const JAPAN_CONTINENT_CODE = "JPN";

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultDateRange() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return { departureDate: formatDate(start), arrivalDate: formatDate(end) };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`모두투어 응답 오류: HTTP ${response.status}`);
  return response.json();
}

async function modeWebApiHeader() {
  const contextUrl = `${API_BASE_URL}/Init/GetWebSiteContext?domain=${encodeURIComponent("https://www.modetour.com/")}&deviceType=DVTPC`;
  const payload = await fetchJson(contextUrl, {
    headers: {
      accept: "application/json",
      "accept-language": "ko-KR,ko;q=0.9,en;q=0.8",
      referer: SOURCE_URL,
      "user-agent": "Mozilla/5.0 (compatible; TtangDealRadar/0.1; +https://ttang-air-alert.vividfox6.chatgpt.site)",
    },
  });
  const context = payload.result;
  if (!context?.webSiteNo || !context?.companyNo || !context?.deviceType || !context?.apiKey) {
    throw new Error("모두투어 API 사이트 컨텍스트를 확인하지 못했습니다.");
  }
  return Buffer.from(JSON.stringify({
    WebSiteNo: context.webSiteNo,
    CompanyNo: context.companyNo,
    DeviceType: context.deviceType,
    ApiKey: context.apiKey,
  }), "utf8").toString("base64");
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDeal(item) {
  const adult = item.adult ?? {};
  const stockPackageNo = String(item.stockPackageNo ?? "");
  const departureCode = item.departure?.code ?? "";
  const arrivalCode = item.arrival?.code ?? "";
  const price = number(adult.value) + number(adult.tax) + number(adult.tax2);
  const reservation = new URL("/flights/discount-flight/reservation-page", SOURCE_URL);
  reservation.searchParams.set("id", stockPackageNo);
  reservation.searchParams.set("adult", "1");
  reservation.searchParams.set("child", "0");
  reservation.searchParams.set("infant", "0");
  reservation.searchParams.set("step", "1");

  return {
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    departure: item.departure?.value ?? "",
    departureCode,
    arrival: item.arrival?.value ?? "",
    arrivalCode,
    airline: item.air?.value ?? "",
    airlineCode: item.air?.code ?? "",
    nonstop: item.start?.via === "N",
    fromDate: item.sDate?.value ?? "",
    toDate: item.eDate?.value ?? "",
    tripType: item.eDate?.value ? "왕복" : "편도",
    price,
    minimumPassengers: 1,
    masterId: stockPackageNo,
    gubun: "MODETOUR",
    reservationUrl: reservation.href,
    sourceUrl: SOURCE_URL,
  };
}

async function fetchPage({ header, departureCode, departureDate, arrivalDate, page, itemCount }) {
  const url = new URL("/DiscountFlight/GetList", API_BASE_URL);
  url.search = new URLSearchParams({
    departureCity: departureCode,
    continentCode: JAPAN_CONTINENT_CODE,
    arrivalCity: "",
    departureDate,
    arrivalDate,
    page: String(page),
    itemCount: String(itemCount),
  });
  const payload = await fetchJson(url, {
    headers: {
      accept: "application/json",
      "accept-language": "ko-KR,ko;q=0.9,en;q=0.8",
      origin: "https://www.modetour.com",
      referer: SOURCE_URL,
      "user-agent": "Mozilla/5.0 (compatible; TtangDealRadar/0.1; +https://ttang-air-alert.vividfox6.chatgpt.site)",
      ModeWebApiReqHeader: header,
    },
  });
  return Array.isArray(payload.result) ? payload.result : [];
}

export async function crawlModetour({ departureCode = DEFAULT_DEPARTURE_CODE, maxPrice = DEFAULT_MAX_PRICE, departureDate, arrivalDate, maxPages = 10, itemCount = 200 } = {}) {
  const dateRange = defaultDateRange();
  const header = await modeWebApiHeader();
  const deals = new Map();

  for (let page = 1; page <= maxPages; page += 1) {
    const items = await fetchPage({
      header,
      departureCode,
      departureDate: departureDate ?? dateRange.departureDate,
      arrivalDate: arrivalDate ?? dateRange.arrivalDate,
      page,
      itemCount,
    });
    if (!items.length) break;

    for (const item of items) {
      const deal = parseDeal(item);
      if (deal.departureCode === departureCode && deal.price > 0 && deal.price < maxPrice) {
        const key = `${deal.masterId}|${deal.fromDate}|${deal.toDate}`;
        deals.set(key, deal);
      }
    }

    if (items.length < itemCount) break;
  }

  return [...deals.values()].sort((left, right) => left.price - right.price);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const deals = await crawlModetour();
  console.log(JSON.stringify({ fetchedAt: new Date().toISOString(), count: deals.length, deals }, null, 2));
}
