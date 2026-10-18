#!/usr/bin/env node

import { pathToFileURL } from "node:url";

export const SOURCE_ID = "naver";
export const SOURCE_NAME = "네이버 항공권";
export const SOURCE_URL = "https://flight.naver.com/flights/everywhere/monthly/SEL";

const API_URL = "https://flight-api.naver.com/graphql";
const DEPARTURE_CODE = "SEL";
const TRIP_DAYS = [3, 4, 5, 6];
const TOP_DEALS_PER_CITY_AND_DURATION = 5;
const USER_AGENT = "Mozilla/5.0 (compatible; TtangDealRadar/0.1; +https://ttang-air-alert.vividfox6.chatgpt.site)";

const DESTINATIONS = [
  { name: "도쿄", code: "NRT" },
  { name: "오사카", code: "KIX" },
  { name: "나고야", code: "NGO" },
  { name: "후쿠오카", code: "FUK" },
  { name: "삿포로", code: "CTS" },
  { name: "하코다테", code: "HKD" },
  { name: "오비히로", code: "OBO" },
  { name: "아오모리", code: "AOJ" },
  { name: "센다이", code: "SDJ" },
  { name: "니가타", code: "KIJ" },
  { name: "이바라키", code: "IBR" },
  { name: "시즈오카", code: "FSZ" },
  { name: "고마쓰", code: "KMQ" },
  { name: "오카야마", code: "OKJ" },
  { name: "요나고", code: "YGJ" },
  { name: "히로시마", code: "HIJ" },
  { name: "다카마쓰", code: "TAK" },
  { name: "마쓰야마", code: "MYJ" },
  { name: "사가", code: "HSG" },
  { name: "나가사키", code: "NGS" },
  { name: "오이타", code: "OIT" },
  { name: "구마모토", code: "KMJ" },
  { name: "미야자키", code: "KMI" },
  { name: "가고시마", code: "KOJ" },
  { name: "오키나와(나하)", code: "OKA" },
  { name: "이시가키", code: "ISG" },
];

const QUERY = `query flight_recommend_by_theme_everywhere(
  $departureLocationCode: String
  $arrivalLocationCode: String
  $continentIds: [Int!]
  $countryCodes: [String!]
  $departureDate: String
  $returnDate: String
  $departureMonths: [String!]
  $duration: [Int!]
  $isDomestic: Boolean
  $isMappable: Boolean
  $isNonstop: Boolean
  $price: [Int!]
  $timeCategories: [DepartureTimeCategory!]
  $tripDays: [Int!]
  $tripType: String
) {
  minPricesByDate(
    departureLocationCode: $departureLocationCode
    arrivalLocationCode: $arrivalLocationCode
    continentIds: $continentIds
    countryCodes: $countryCodes
    departureDate: $departureDate
    returnDate: $returnDate
    departureMonths: $departureMonths
    duration: $duration
    isDomestic: $isDomestic
    isMappable: $isMappable
    isNonstop: $isNonstop
    price: $price
    timeCategories: $timeCategories
    tripDays: $tripDays
    tripType: $tripType
  ) {
    minPrice
  }
}`;

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDate(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function displayDate(date) {
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function monthRange() {
  const start = new Date();
  start.setDate(1);
  const months = [];
  for (let index = 0; index < 12; index += 1) {
    const month = new Date(start.getFullYear(), start.getMonth() + index, 1);
    months.push(`${month.getFullYear()}${pad(month.getMonth() + 1)}`);
  }
  return { start, months };
}

function reservationUrl(destinationCode, departureDate, returnDate) {
  const route = `SEL:city-${destinationCode}:airport-${departureDate}/${destinationCode}:airport-SEL:city-${returnDate}`;
  const url = new URL(`/flights/international/${route}`, SOURCE_URL);
  url.searchParams.set("adult", "1");
  url.searchParams.set("isDirect", "false");
  url.searchParams.set("fareType", "Y");
  return url.href;
}

async function fetchGraph(destinationCode, tripDays, departureMonths) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      origin: "https://flight.naver.com",
      referer: SOURCE_URL,
      "user-agent": USER_AGENT,
    },
    body: JSON.stringify({
      operationName: "flight_recommend_by_theme_everywhere",
      query: QUERY,
      variables: {
        departureLocationCode: DEPARTURE_CODE,
        arrivalLocationCode: destinationCode,
        countryCodes: ["JP"],
        departureMonths,
        isDomestic: false,
        isMappable: true,
        tripDays: [tripDays],
        tripType: "RT",
      },
    }),
  });
  if (!response.ok) throw new Error(`네이버 항공권 API 오류: HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(`네이버 항공권 API 응답 오류: ${payload.errors[0].message}`);
  return Array.isArray(payload.data?.minPricesByDate) ? payload.data.minPricesByDate : [];
}

function parseGraph(deals, destination, tripDays, graph, startDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  graph.forEach((entry, index) => {
    const price = Number(entry?.minPrice);
    if (!Number.isFinite(price) || price <= 0) return;
    const departureDate = new Date(startDate);
    departureDate.setDate(departureDate.getDate() + index);
    if (departureDate < today) return;
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + tripDays);
    deals.push({
      sourceId: SOURCE_ID,
      sourceName: SOURCE_NAME,
      departure: "서울(인천·김포)",
      departureCode: "ICN",
      arrival: destination.name,
      arrivalCode: destination.code,
      airline: "네이버 항공권 최저가",
      airlineCode: "NAVER",
      nonstop: false,
      fromDate: displayDate(departureDate),
      toDate: displayDate(returnDate),
      tripType: `${tripDays}일 일정`,
      durationDays: tripDays,
      price,
      minimumPassengers: 1,
      masterId: `${destination.code}|${tripDays}|${formatDate(departureDate)}`,
      gubun: "NAVER",
      reservationUrl: reservationUrl(destination.code, formatDate(departureDate), formatDate(returnDate)),
      sourceUrl: SOURCE_URL,
    });
  });
}

export async function crawlNaver() {
  const { start, months } = monthRange();
  const deals = [];

  for (const destination of DESTINATIONS) {
    for (const tripDays of TRIP_DAYS) {
      const graph = await fetchGraph(destination.code, tripDays, months);
      const candidates = [];
      parseGraph(candidates, destination, tripDays, graph, start);
      deals.push(...candidates.sort((left, right) => left.price - right.price).slice(0, TOP_DEALS_PER_CITY_AND_DURATION));
    }
  }

  return deals.sort((left, right) => left.price - right.price);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const deals = await crawlNaver();
  console.log(JSON.stringify({ fetchedAt: new Date().toISOString(), count: deals.length, deals }, null, 2));
}
