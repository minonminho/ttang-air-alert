import { chromium } from "playwright";
import { getFreshFlightCacheEntry, loadFlightCache, makeFlightCacheKey, saveFlightCache } from "./flight-cache.mjs";

const NAVER_BASE_URL = "https://flight.naver.com";
const DEPARTURE_CODE = "ICN";
const TRIP_DAYS = [3, 4, 5, 6];
const TOP_RESULTS = 5;
const MIN_PRICE = 100000;
const QUICK_REFINE_WEEKS = 3;
const DEFAULT_SEARCH_DELAY_MS = 1500;

export const DESTINATIONS = new Map([
  ["NRT", "도쿄"], ["KIX", "오사카"], ["NGO", "나고야"], ["FUK", "후쿠오카"],
  ["CTS", "삿포로"], ["HKD", "하코다테"], ["OBO", "오비히로"], ["AOJ", "아오모리"],
  ["SDJ", "센다이"], ["KIJ", "니가타"], ["IBR", "이바라키"], ["FSZ", "시즈오카"],
  ["KMQ", "고마쓰"], ["OKJ", "오카야마"], ["YGJ", "요나고"], ["HIJ", "히로시마"],
  ["TAK", "다카마쓰"], ["MYJ", "마쓰야마"], ["HSG", "사가"], ["NGS", "나가사키"],
  ["OIT", "오이타"], ["KMJ", "구마모토"], ["KMI", "미야자키"], ["KOJ", "가고시마"],
  ["OKA", "오키나와(나하)"], ["ISG", "이시가키"],
]);

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function compactDate(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function parseDate(value) {
  const match = String(value).match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function includesWeekend(start, end) {
  let hasSaturday = false;
  let hasSunday = false;
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    if (cursor.getDay() === 6) hasSaturday = true;
    if (cursor.getDay() === 0) hasSunday = true;
  }
  return hasSaturday && hasSunday;
}

export function makeSearchUrl(destinationCode, departureDate, returnDate) {
  const route = `${DEPARTURE_CODE}:airport-${destinationCode}:airport-${compactDate(departureDate)}/${destinationCode}:airport-${DEPARTURE_CODE}:airport-${compactDate(returnDate)}`;
  const url = new URL(`/flights/international/${route}`, NAVER_BASE_URL);
  url.searchParams.set("adult", "1");
  url.searchParams.set("isDirect", "false");
  url.searchParams.set("fareType", "Y");
  return url.href;
}

export function makeCandidateTrips({ startDate = new Date(), months = 3 } = {}) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  const trips = [];

  for (let departure = new Date(start); departure <= end; departure = addDays(departure, 1)) {
    for (const tripDays of TRIP_DAYS) {
      const returnDate = addDays(departure, tripDays - 1);
      if (returnDate <= end && includesWeekend(departure, returnDate)) {
        trips.push({
          departureDate: dateKey(departure),
          returnDate: dateKey(returnDate),
          tripDays,
        });
      }
    }
  }
  return trips;
}

function tripKey(trip) {
  return `${trip.departureDate}|${trip.returnDate}`;
}

function weekKey(value) {
  const date = parseDate(value);
  if (!date) return String(value);
  const monday = new Date(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return dateKey(monday);
}

export function makeQuickCandidateTrips({ startDate = new Date(), months = 3 } = {}) {
  const fullTrips = makeCandidateTrips({ startDate, months });
  const grouped = new Map();
  for (const trip of fullTrips) {
    const key = `${weekKey(trip.departureDate)}|${trip.tripDays}`;
    const trips = grouped.get(key) || [];
    trips.push(trip);
    grouped.set(key, trips);
  }
  const sampled = [];
  for (const trips of grouped.values()) {
    sampled.push(trips[0]);
    if (tripKey(trips.at(-1)) !== tripKey(trips[0])) sampled.push(trips.at(-1));
  }
  return sampled.sort((left, right) => String(left.departureDate).localeCompare(String(right.departureDate)) || left.tripDays - right.tripDays);
}

function selectRefinementTrips({ allTrips, initialTrips, results, weeks = QUICK_REFINE_WEEKS }) {
  const initialKeys = new Set(initialTrips.map(tripKey));
  const weekPrices = new Map();
  for (const result of results) {
    const price = Number(result.price);
    if (!Number.isFinite(price)) continue;
    const key = weekKey(result.departureDate);
    weekPrices.set(key, Math.min(weekPrices.get(key) ?? Number.POSITIVE_INFINITY, price));
  }
  const selectedWeeks = new Set([...weekPrices.entries()].sort((left, right) => left[1] - right[1]).slice(0, weeks).map(([key]) => key));
  return allTrips.filter((trip) => selectedWeeks.has(weekKey(trip.departureDate)) && !initialKeys.has(tripKey(trip)));
}

function parsePrices(text) {
  return [...String(text).matchAll(/([0-9]{1,3}(?:,[0-9]{3})+)\s*원/g)]
    .map((match) => Number(match[1].replaceAll(",", "")))
    .filter((price) => price >= MIN_PRICE && price < 10000000);
}

function normalizeFlightOperation(value) {
  return String(value ?? "")
    .replace(/[0-9]{1,3}(?:,[0-9]{3})+\s*원/g, "")
    .replace(/\b\d{4}[./-]\d{1,2}[./-]\d{1,2}\b/g, "")
    .replace(/\b\d{1,2}[./-]\d{1,2}\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function extractAirline(value) {
  const knownAirlines = [
    "대한항공", "아시아나항공", "제주항공", "진에어", "티웨이항공", "에어부산", "에어서울", "이스타항공",
    "에어프레미아", "플라이강원", "ANA", "일본항공", "JAL", "피치항공", "스카이마크", "스타플라이어",
    "Jetstar", "젯스타", "Air Japan", "ZIPAIR", "Philippine Airlines",
  ];
  const text = String(value ?? "");
  return knownAirlines.find((airline) => text.toLowerCase().includes(airline.toLowerCase())) || "기타";
}

function failureFromPage(text) {
  const normalized = String(text).replace(/\s+/g, " ");
  if (/서비스가 불안정|일시적인 오류|잠시 후 다시 접속|접근이 제한|자동화|captcha|robot/i.test(normalized)) {
    return "네이버 항공권이 현재 결과를 제공하지 않아 검색을 중단했습니다.";
  }
  return null;
}

async function waitForFlightPrices(page, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const text = await page.locator("body").innerText();
    const failure = failureFromPage(text);
    if (failure) throw new Error(failure);
    if (parsePrices(text).length) return;
    await page.waitForTimeout(1000);
  }
  throw new Error("네이버 항공권 결과가 30초 안에 표시되지 않아 검색을 중단했습니다.");
}

async function readFlightOptions(page, searchUrl) {
  const text = await page.locator("body").innerText();
  const failure = failureFromPage(text);
  if (failure) throw new Error(failure);

  const options = await page.locator("li, article, [class*='item'], [class*='result']").evaluateAll((nodes) => nodes
    .map((node) => {
      const textContent = node.innerText || "";
      const link = node.querySelector("a[href]")?.href || "";
      return { text: textContent.replace(/\s+/g, " ").trim(), link };
    })
    .filter((item) => /\d[\d,]*\s*원/.test(item.text))
    .slice(0, 30));

  const parsed = [];
  const seen = new Set();
  for (const option of options) {
    const price = parsePrices(option.text)[0];
    if (!price) continue;
    const operationKey = normalizeFlightOperation(option.text);
    const key = `${price}|${operationKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    parsed.push({ price, label: option.text.slice(0, 180), airline: extractAirline(option.text), operationKey, url: option.link || searchUrl });
  }

  if (!parsed.length) {
    const fallbackPrices = [...new Set(parsePrices(text))].sort((a, b) => a - b).slice(0, TOP_RESULTS);
    if (!fallbackPrices.length) throw new Error("네이버 항공권 가격 정보를 읽지 못했습니다.");
    return fallbackPrices.map((price) => ({ price, label: "네이버 항공권 검색 결과", airline: "기타", operationKey: "네이버 항공권 검색 결과", url: searchUrl }));
  }
  return parsed.sort((left, right) => left.price - right.price).slice(0, TOP_RESULTS);
}

export async function searchNaver({
  destinationCode,
  startDate = new Date(),
  months = 3,
  onProgress = () => {},
  onResults = () => {},
  includeAllResults = false,
  mode = "full",
  headless = true,
  searchDelayMs = DEFAULT_SEARCH_DELAY_MS,
  cacheTtlHours = Number(process.env.TTANG_FLIGHT_CACHE_HOURS || 24),
} = {}) {
  if (!DESTINATIONS.has(destinationCode)) throw new Error(`지원하지 않는 도시 코드입니다: ${destinationCode}`);

  const allTrips = makeCandidateTrips({ startDate, months });
  const initialTrips = mode === "quick" ? makeQuickCandidateTrips({ startDate, months }) : allTrips;
  const cache = await loadFlightCache({ ttlMs: Math.max(1, cacheTtlHours) * 60 * 60 * 1000 });
  const results = [];
  let cacheDirty = false;
  let searchedTrips = 0;
  let browser = null;
  let context = null;
  let page = null;

  async function ensurePage() {
    if (page) return page;
    browser = await chromium.launch({ headless });
    context = await browser.newContext({ locale: "ko-KR", timezoneId: "Asia/Seoul" });
    page = await context.newPage();
    return page;
  }

  async function searchTrips(trips, phase) {
    for (let index = 0; index < trips.length; index += 1) {
      const trip = trips[index];
      const departure = parseDate(trip.departureDate);
      const returnDate = parseDate(trip.returnDate);
      const searchUrl = makeSearchUrl(destinationCode, departure, returnDate);
      const cacheKey = makeFlightCacheKey(destinationCode, trip.departureDate, trip.returnDate);
      const cached = getFreshFlightCacheEntry(cache, cacheKey);
      let options = cached?.options || null;
      const cacheHit = Boolean(options);
      onProgress({ current: index + 1, total: trips.length, searchedTrips: searchedTrips + 1, phase, cached: cacheHit, trip, searchUrl });

      if (!options) {
        const activePage = await ensurePage();
        await activePage.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
        await waitForFlightPrices(activePage);
        options = await readFlightOptions(activePage, searchUrl);
        cache.entries[cacheKey] = { checkedAt: Date.now(), options };
        cacheDirty = true;
      }

      const tripResults = options.map((option) => ({
        ...option,
        destinationCode,
        destination: DESTINATIONS.get(destinationCode),
        departureDate: trip.departureDate,
        returnDate: trip.returnDate,
        tripDays: trip.tripDays,
        source: "네이버 항공권",
      }));
      results.push(...tripResults);
      searchedTrips += 1;
      onResults(tripResults, { ...trip, index: index + 1, total: trips.length, phase, cached: cacheHit });
      if (!cacheHit && index < trips.length - 1 && searchDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, searchDelayMs));
    }
  }

  try {
    await searchTrips(initialTrips, mode === "quick" ? "대표 일정" : "정밀 일정");
    let refinementTrips = [];
    if (mode === "quick") {
      refinementTrips = selectRefinementTrips({ allTrips, initialTrips, results });
      await searchTrips(refinementTrips, "저렴한 주간 정밀 검색");
    }

    const searched = [...initialTrips, ...refinementTrips];
    const bestByDuration = new Map();
    for (const tripDays of TRIP_DAYS) {
      bestByDuration.set(tripDays, results.filter((result) => result.tripDays === tripDays).sort((a, b) => a.price - b.price).slice(0, TOP_RESULTS));
    }

    return {
      destinationCode,
      destination: DESTINATIONS.get(destinationCode),
      criteria: { tripDays: TRIP_DAYS, weekendRequired: true, months, minPrice: MIN_PRICE, topResults: TOP_RESULTS, allTrips: includeAllResults, mode, candidateTrips: searched.length, fullCandidateTrips: allTrips.length, refinementWeeks: mode === "quick" ? QUICK_REFINE_WEEKS : 0 },
      searchedTrips,
      results: includeAllResults ? results : [...bestByDuration.values()].flat(),
    };
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
    if (cacheDirty) {
      try {
        await saveFlightCache(cache);
      } catch (error) {
        console.error(`항공권 검색 캐시 저장 실패: ${error.message}`);
      }
    }
  }
}
