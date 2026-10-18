import { chromium } from "playwright";

const NAVER_BASE_URL = "https://flight.naver.com";
const DEPARTURE_CODE = "ICN";
const TRIP_DAYS = [3, 4, 5, 6];
const TOP_RESULTS = 3;
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
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    if (cursor.getDay() === 0 || cursor.getDay() === 6) return true;
  }
  return false;
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
      const returnDate = addDays(departure, tripDays);
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

function parsePrices(text) {
  return [...String(text).matchAll(/([0-9]{1,3}(?:,[0-9]{3})+)\s*원/g)]
    .map((match) => Number(match[1].replaceAll(",", "")))
    .filter((price) => price > 0 && price < 10000000);
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
    const key = `${price}|${option.text.slice(0, 140)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    parsed.push({ price, label: option.text.slice(0, 180), url: option.link || searchUrl });
  }

  if (!parsed.length) {
    const fallbackPrices = [...new Set(parsePrices(text))].sort((a, b) => a - b).slice(0, TOP_RESULTS);
    if (!fallbackPrices.length) throw new Error("네이버 항공권 가격 정보를 읽지 못했습니다.");
    return fallbackPrices.map((price) => ({ price, label: "네이버 항공권 검색 결과", url: searchUrl }));
  }
  return parsed.sort((left, right) => left.price - right.price).slice(0, TOP_RESULTS);
}

export async function searchNaver({
  destinationCode,
  startDate = new Date(),
  months = 3,
  onProgress = () => {},
  headless = true,
  searchDelayMs = DEFAULT_SEARCH_DELAY_MS,
} = {}) {
  if (!DESTINATIONS.has(destinationCode)) throw new Error(`지원하지 않는 도시 코드입니다: ${destinationCode}`);

  const trips = makeCandidateTrips({ startDate, months });
  const results = [];
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ locale: "ko-KR", timezoneId: "Asia/Seoul" });
  const page = await context.newPage();

  try {
    for (let index = 0; index < trips.length; index += 1) {
      const trip = trips[index];
      const departure = parseDate(trip.departureDate);
      const returnDate = parseDate(trip.returnDate);
      const searchUrl = makeSearchUrl(destinationCode, departure, returnDate);
      onProgress({ current: index + 1, total: trips.length, trip, searchUrl });
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
      await waitForFlightPrices(page);
      const options = await readFlightOptions(page, searchUrl);
      results.push(...options.map((option) => ({
        ...option,
        destinationCode,
        destination: DESTINATIONS.get(destinationCode),
        departureDate: trip.departureDate,
        returnDate: trip.returnDate,
        tripDays: trip.tripDays,
        source: "네이버 항공권",
      })));
      if (index < trips.length - 1 && searchDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, searchDelayMs));
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const bestByDuration = new Map();
  for (const tripDays of TRIP_DAYS) {
    bestByDuration.set(tripDays, results.filter((result) => result.tripDays === tripDays).sort((a, b) => a.price - b.price).slice(0, TOP_RESULTS));
  }

  return {
    destinationCode,
    destination: DESTINATIONS.get(destinationCode),
    criteria: { tripDays: TRIP_DAYS, weekendRequired: true, months, topResults: TOP_RESULTS },
    searchedTrips: trips.length,
    results: [...bestByDuration.entries()].flatMap(([tripDays, items]) => items.map((item) => ({ ...item, tripDays }))),
  };
}
