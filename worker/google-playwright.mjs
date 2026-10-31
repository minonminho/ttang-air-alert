import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { getFreshFlightCacheEntry, loadFlightCache, makeFlightCacheKey, saveFlightCache } from "./flight-cache.mjs";
import { isTransientSearchError, retrySearchOnce, withSearchDeadline } from "./search-recovery.mjs";
import { isNonstopFlightDescription, isNonstopRoundTrip } from "./nonstop.mjs";

const GOOGLE_BASE_URL = "https://www.google.com/travel/flights";
const DEPARTURE_CODE = "ICN";
const TRIP_DAYS = [3, 4, 5, 6];
const TOP_RESULTS = 5;
const MIN_PRICE = 100000;
const QUICK_REFINE_WEEKS = 3;
const DEFAULT_SEARCH_DELAY_MS = 1500;
// Google Flights sometimes renders fare cards without the old accessible price link.
const FLIGHT_ROW_SELECTOR = 'li, [role="listitem"], [role="button"], [role="option"]';

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
  const url = new URL(GOOGLE_BASE_URL);
  // Use the public search page; no private API or encoded internal request.
  url.searchParams.set("q", `Nonstop round trip flights from ${DEPARTURE_CODE} to ${destinationCode} departing ${dateKey(departureDate)} returning ${dateKey(returnDate)} for 1 adult economy`);
  url.searchParams.set("hl", "en");
  url.searchParams.set("curr", "KRW");
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

export function isNoNonstopFlightsPage(text) {
  return /No nonstop flights found|No results returned\.|No matching flights|No departing flights|No returning flights|항공편을 찾을 수 없/i.test(String(text));
}

function failureFromPage(text) {
  const normalized = String(text).replace(/\s+/g, " ");
  if (/unusual traffic|not a robot|captcha|접근이 제한|비정상적인 트래픽/i.test(normalized)) {
    return "Google Flights 접근 확인 화면이 표시되어 검색을 중단했습니다.";
  }
  return null;
}

async function waitForFlightPrices(page, timeoutMs, networkEvents, stage = 'departure-results') {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const text = await page.locator("body").innerText();
    const failure = failureFromPage(text);
    if (failure) throw new Error(failure);
    if (isNoNonstopFlightsPage(text)) return false;
    if ((await readGoogleFlightRows(page)).length) return true;
    await page.waitForTimeout(1000);
  }
  const failed = networkEvents.filter((event) => event.kind === "requestfailed" || event.status >= 400).slice(-3);
  const details = failed.length ? ` 실패 요청: ${failed.map((event) => `${event.url} (${event.error || event.status})`).join(", ")}` : "";
  const error = new Error(`Google Flights 결과가 ${Math.round(timeoutMs / 1000)}초 안에 표시되지 않았습니다. 단계: ${stage}.${details}`);
  error.code = 'FLIGHT_RESULTS_TIMEOUT';
  error.stage = stage;
  throw error;
}

async function saveSearchDiagnostics(page, destinationCode, trip, error, networkEvents) {
  const directory = path.resolve("worker/data/diagnostics", `${destinationCode}-${trip.departureDate}-${trip.returnDate}`);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, "diagnostic.json"), JSON.stringify({
    destinationCode, trip, error: error.message, stage: error.stage, url: page.url(),
    title: await page.title().catch(() => ""), networkEvents,
  }, null, 2));
  await fs.writeFile(path.join(directory, "page.txt"), await page.locator("body").innerText({timeout:2000}).catch(() => ""));
  await page.screenshot({ path: path.join(directory, "page.png"), fullPage: true, timeout:3000 }).catch(() => {});
  console.error(`검색 실패 진단 파일: ${directory}`);
}

export async function readGoogleFlightRows(page) {
  const rows = await page.locator(FLIGHT_ROW_SELECTOR).evaluateAll((nodes) => nodes.flatMap((node, nodeIndex) => {
    if (!node.getClientRects().length) return [];
    const link = node.querySelector('[role="link"][aria-label*="South Korean won"]');
    const accessibleLabel = link?.getAttribute('aria-label') || node.getAttribute?.('aria-label') || '';
    const text = node.innerText || '';
    const labelPrice = accessibleLabel.match(/(?:From\\s+)?([\\d,]+) South Korean won/i)?.[1];
    const visiblePrice = text.match(/(?:₩|KRW\\s*)([\\d,]+)/i)?.[1];
    const price = Number((labelPrice || visiblePrice || '').replaceAll(',', ''));
    const accessibleNonstop = /\\bnon[\\s-]?stop\\s+flight\\b/i.test(accessibleLabel);
    // Trust only a flight card that explicitly says nonstop; never infer directness from price alone.
    const visibleNonstop = /\\bnon[\\s-]?stop\\b/i.test(text)
      && !/\\b(?:\\d+\\s+stops?|connecting\\s+flight|one\\s+stop)\\b/i.test(text);
    if (!Number.isFinite(price) || price <= 0 || price >= 10000000 || (!accessibleNonstop && !visibleNonstop)) return [];
    const airline = accessibleLabel.match(/flight with (.*?)\\./i)?.[1]?.trim()
      || text.match(/[AP]M\\s*[^\\n]*\\n\\s*([^\\n]+)/i)?.[1]?.trim()
      || '기타';
    const description = accessibleNonstop ? accessibleLabel
      : `From ${price} South Korean won round trip total. Nonstop flight with ${airline}. ${text.replace(/\\s+/g, ' ').trim()}`;
    const legs = [...node.querySelectorAll('[data-travelimpactmodelwebsiteurl]')]
      .map((element) => element.getAttribute('data-travelimpactmodelwebsiteurl'))
      .filter(Boolean);
    return [{ price, aria: description, ariaLabel: link ? accessibleLabel : null, text, airline, legs: [...new Set(legs)], nodeIndex }];
  }));
  const unique = new Map();
  for (const row of rows) {
    if (!isNonstopFlightDescription(row.aria)) continue;
    // Stable identity comes from the flight number/route/time rather than price or emissions.
    const description = row.aria.replace(/^(?:From\\s+)?[\\d,]+ South Korean won round trip total\\.\\s*/i, '');
    const schedule = description.match(/Leaves (.*?)\\. Total duration/)?.[1]
      || row.text.replace(/(?:₩|KRW\\s*)[\\d,]+/gi, '').replace(/\\d+ kg CO2e/gi, '');
    const legKeys = row.legs.map((leg) => {
      try { return new URL(leg).searchParams.get('itinerary')?.replace(/-\\d{8}(?=[,;]|$)/g, '') || ''; }
      catch { return ''; }
    }).filter(Boolean);
    row.operation = `${legKeys.join('|') || row.airline}|${schedule}`
      .replace(/ on [A-Za-z]+, [A-Za-z]+ \\d+/g, '').replace(/\\s+/g, ' ').trim();
    unique.set(`${row.price}|${row.operation}`, row);
  }
  return [...unique.values()].sort((a, b) => a.price - b.price);
}

export function getDepartureSampleSize(mode) {
  return mode === 'quick' ? 2 : TOP_RESULTS;
}

async function readFlightOptions(page, searchUrl, timeoutMs, networkEvents, departureNavigation, mode) {
  const outboundRows = await readGoogleFlightRows(page);
  const candidates = [];
  // Quick mode checks the two cheapest outgoing choices; full mode checks five.
  const departureSampleSize = getDepartureSampleSize(mode);
  for (const [outboundIndex, outbound] of outboundRows.slice(0, departureSampleSize).entries()) {
    if (outboundIndex > 0) {
      if (departureNavigation === 'history') {
        await page.goBack({ waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.getByText(/^(Top|Other) departing flights$/).first().waitFor({ timeout: timeoutMs });
      } else {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      }
      if (!await waitForFlightPrices(page, timeoutMs, networkEvents)) break;
    }
    const currentOutbound = (await readGoogleFlightRows(page)).find((row) => row.operation === outbound.operation);
    if (!currentOutbound) throw new Error('Google Flights 결과가 변경되어 가는 편을 다시 확인해야 합니다.');
    if (currentOutbound.ariaLabel) {
      await page.locator('li').filter({ has: page.getByRole('link', { name: currentOutbound.ariaLabel, exact: true }) }).first().click();
    } else {
      await page.locator(FLIGHT_ROW_SELECTOR).nth(currentOutbound.nodeIndex).click();
    }
    await page.getByText(/Choose return to/).first().waitFor({ timeout: timeoutMs });
    if (!await waitForFlightPrices(page, timeoutMs, networkEvents, 'return-results')) continue;
    const returnRows = await readGoogleFlightRows(page);
    for (const inbound of returnRows.slice(0, TOP_RESULTS)) {
      if (inbound.price < MIN_PRICE) continue;
      candidates.push({
        price: inbound.price,
        label: `가는 편: ${outbound.aria.replace(/^(?:From\s+)?[\d,]+ South Korean won round trip total\.\s*/i, '')} / 오는 편: ${inbound.aria.replace(/^(?:From\s+)?[\d,]+ South Korean won round trip total\.\s*/i, '')}`,
        airline: [...new Set([outbound.airline, inbound.airline])].join(' / '),
        operationKey: `${outbound.operation}|return:${inbound.operation}`,
        // Public link preserves the selected outbound flight and requested return date.
        url: page.url(),
        outbound: { description: outbound.aria, operation: outbound.operation },
        inbound: { description: inbound.aria, operation: inbound.operation },
        priceType: 'round-trip',
        nonstop: true,
        selectionScope: `${departureSampleSize}-cheapest-departures`,
      });
    }
  }
  const unique = new Map();
  for (const option of candidates) unique.set(`${option.price}|${option.operationKey}`, option);
  return [...unique.values()].sort((a, b) => a.price - b.price).slice(0, TOP_RESULTS);
}

export async function searchGoogle({
  destinationCode,
  startDate = new Date(),
  months = 3,
  onProgress = () => {},
  onResults = () => {},
  onTripError = () => {},
  includeAllResults = false,
  mode = "full",
  headless = true,
  searchDelayMs = DEFAULT_SEARCH_DELAY_MS,
  cacheTtlHours = Number(process.env.TTANG_FLIGHT_CACHE_HOURS || 24),
  resultTimeoutMs = Number(process.env.TTANG_RESULT_TIMEOUT_MS || 20000),
  maxTrips = Infinity,
  useCache = true,
  departureNavigation = 'history',
  tripTimeoutMs = 60000,
} = {}) {
  if (!DESTINATIONS.has(destinationCode)) throw new Error(`지원하지 않는 도시 코드입니다: ${destinationCode}`);

  const allTrips = makeCandidateTrips({ startDate, months });
  const initialTrips = (mode === "quick" ? makeQuickCandidateTrips({ startDate, months }) : allTrips).slice(0, maxTrips);
  const cache = await loadFlightCache({ ttlMs: Math.max(1, cacheTtlHours) * 60 * 60 * 1000 });
  const results = [];
  const tripErrors = [];
  let consecutiveFailures = 0;
  let cacheDirty = false;
  let searchedTrips = 0;
  let browser = null;
  let context = null;
  let page = null;
  const networkEvents = [];
  function recordNetworkEvent(event) {
    networkEvents.push(event);
    if (networkEvents.length > 100) networkEvents.shift();
  }

  async function ensurePage() {
    if (page && !page.isClosed()) return page;
    if (!browser) {
      browser = await chromium.launch({ headless });
      context = await browser.newContext({ locale: "en-US", timezoneId: "Asia/Seoul" });
    }
    page = await context.newPage();
    page.on("requestfailed", (request) => {
      if (["document", "xhr", "fetch", "script"].includes(request.resourceType())) {
        recordNetworkEvent({ kind: "requestfailed", url: request.url().split("?")[0], error: request.failure()?.errorText });
      }
    });
    page.on("response", (response) => {
      if (response.status() >= 400) recordNetworkEvent({ kind: "response", url: response.url().split("?")[0], status: response.status() });
    });
    page.on("pageerror", (error) => recordNetworkEvent({ kind: "pageerror", error: error.message }));
    return page;
  }

  async function searchTrips(trips, phase) {
    for (let index = 0; index < trips.length; index += 1) {
      const trip = trips[index];
      const departure = parseDate(trip.departureDate);
      const returnDate = parseDate(trip.returnDate);
      const searchUrl = makeSearchUrl(destinationCode, departure, returnDate);
      const cacheKey = `google-v3-nonstop|${makeFlightCacheKey(destinationCode, trip.departureDate, trip.returnDate)}`;
      const cached = useCache ? getFreshFlightCacheEntry(cache, cacheKey) : null;
      let options = cached?.options ? cached.options.filter(isNonstopRoundTrip) : null;
      const cacheHit = Boolean(options);
      onProgress({ current: index + 1, total: trips.length, searchedTrips: searchedTrips + 1, phase, cached: cacheHit, trip, searchUrl });

      if (!options) {
        const activePage = await ensurePage();
        networkEvents.length = 0;
        try {
          options = await withSearchDeadline(() => retrySearchOnce(async () => {
            const response = await activePage.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
            if (response && response.status() >= 400) throw new Error(`Google Flights 페이지 응답 오류: HTTP ${response.status()}`);
            const timeoutMs = Math.max(1000, Number.isFinite(resultTimeoutMs) ? resultTimeoutMs : 20000);
            const hasResults = await waitForFlightPrices(activePage, timeoutMs, networkEvents);
            return hasResults ? await readFlightOptions(activePage, searchUrl, timeoutMs, networkEvents, departureNavigation, mode) : [];
          }, { onRetry: () => console.warn(`${destinationCode} ${trip.departureDate} ~ ${trip.returnDate}: 일시적인 로딩 실패, 1회 재시도`) }), tripTimeoutMs, async (error) => {
            await saveSearchDiagnostics(activePage, destinationCode, trip, error, networkEvents).catch(() => {});
            await activePage.close().catch(() => {});
            page = null;
          });
        } catch (error) {
          if (error.code !== 'FLIGHT_TRIP_DEADLINE') await saveSearchDiagnostics(activePage, destinationCode, trip, error, networkEvents).catch((diagnosticError) => console.error(`진단 파일 저장 실패: ${diagnosticError.message}`));
          if (!isTransientSearchError(error)) throw error;
          const failure = { ...trip, error: error.message };
          tripErrors.push(failure);
          onTripError(failure);
          consecutiveFailures += 1;
          if (consecutiveFailures >= 3) throw new Error(`연속 3개 일정에서 결과를 읽지 못해 ${destinationCode} 검색을 중단했습니다. ${error.message}`);
          continue;
        }
        // Never store a connecting itinerary, including a stale or mislabelled Google row.
        options = options.filter(isNonstopRoundTrip);
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
        source: "Google Flights",
      }));
      results.push(...tripResults);
      consecutiveFailures = 0;
      searchedTrips += 1;
      await onResults(tripResults, { ...trip, index: index + 1, total: trips.length, phase, cached: cacheHit });
      if (cacheDirty && searchedTrips % 10 === 0) {
        await saveFlightCache(cache);
        cacheDirty = false;
      }
      if (!cacheHit && index < trips.length - 1 && searchDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, searchDelayMs));
    }
  }

  try {
    await searchTrips(initialTrips, mode === "quick" ? "대표 일정" : "정밀 일정");
    let refinementTrips = [];
    if (mode === "quick" && !Number.isFinite(maxTrips)) {
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
      criteria: { tripDays: TRIP_DAYS, nonstopOnly: true, weekendRequired: true, months, minPrice: MIN_PRICE, topResults: TOP_RESULTS, allTrips: includeAllResults, mode, candidateTrips: searched.length, fullCandidateTrips: allTrips.length, refinementWeeks: mode === "quick" ? QUICK_REFINE_WEEKS : 0 },
      searchedTrips,
      tripErrors,
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
