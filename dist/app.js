const airportsByCode = {
  NRT: { name: "成田国際空港", lat: 35.764722, lon: 140.386389 },
  KIX: { name: "関西国際空港", lat: 34.434722, lon: 135.244167 },
  NGO: { name: "中部国際空港", lat: 34.858414, lon: 136.805408 },
  FUK: { name: "福岡空港", lat: 33.585942, lon: 130.450686 },
  CTS: { name: "新千歳空港", lat: 42.775201, lon: 141.692283 },
  HKD: { name: "函館空港", lat: 41.770000, lon: 140.821944 },
  OBO: { name: "とかち帯広空港", lat: 42.733333, lon: 143.217222 },
  AOJ: { name: "青森空港", lat: 40.734722, lon: 140.690833 },
  SDJ: { name: "仙台空港", lat: 38.139722, lon: 140.916944 },
  KIJ: { name: "新潟空港", lat: 37.955833, lon: 139.113333 },
  IBR: { name: "茨城空港", lat: 36.181083, lon: 140.415167 },
  FSZ: { name: "富士山静岡空港", lat: 34.796111, lon: 138.187500 },
  KMQ: { name: "小松空港", lat: 36.394611, lon: 136.406544 },
  OKJ: { name: "岡山桃太郎空港", lat: 34.756944, lon: 133.855278 },
  YGJ: { name: "米子鬼太郎空港", lat: 35.492222, lon: 133.236389 },
  HIJ: { name: "広島空港", lat: 34.436111, lon: 132.919444 },
  TAK: { name: "高松空港", lat: 34.214167, lon: 134.015556 },
  MYJ: { name: "松山空港", lat: 33.827222, lon: 132.699722 },
  HSG: { name: "九州佐賀国際空港", lat: 33.149722, lon: 130.302222 },
  NGS: { name: "長崎空港", lat: 32.916944, lon: 129.913611 },
  OIT: { name: "大分空港", lat: 33.479444, lon: 131.737222 },
  KMJ: { name: "阿蘇くまもと空港", lat: 32.837222, lon: 130.855000 },
  KMI: { name: "宮崎空港", lat: 31.877222, lon: 131.448611 },
  KOJ: { name: "鹿児島空港", lat: 31.803333, lon: 130.719444 },
  OKA: { name: "那覇空港", lat: 26.195833, lon: 127.645833 },
  ISG: { name: "新石垣空港", lat: 24.396389, lon: 124.245000 },
};

const cities = [
  { name: "도쿄", code: "NRT", lat: 35.6768601, lon: 139.7638947, major: true, osm: "https://www.openstreetmap.org/search?query=Tokyo%2C%20Japan" },
  { name: "오사카", code: "KIX", lat: 34.6937569, lon: 135.5014539, major: true, osm: "https://www.openstreetmap.org/search?query=Osaka%2C%20Japan" },
  { name: "나고야", code: "NGO", lat: 35.1851045, lon: 136.8998438, major: true, osm: "https://www.openstreetmap.org/search?query=Nagoya%2C%20Japan" },
  { name: "후쿠오카", code: "FUK", lat: 33.590355, lon: 130.401715, major: true, osm: "https://www.openstreetmap.org/search?query=Fukuoka%2C%20Japan" },
  { name: "삿포로", code: "CTS", lat: 43.061936, lon: 141.3542924, major: true, osm: "https://www.openstreetmap.org/search?query=Sapporo%2C%20Japan" },
  { name: "하코다테", code: "HKD", lat: 41.768793, lon: 140.729008, osm: "https://www.openstreetmap.org/search?query=Hakodate%2C%20Japan" },
  { name: "오비히로", code: "OBO", lat: 42.923809, lon: 143.1966324, osm: "https://www.openstreetmap.org/search?query=Obihiro%2C%20Japan" },
  { name: "아오모리", code: "AOJ", lat: 40.822072, lon: 140.747365, osm: "https://www.openstreetmap.org/search?query=Aomori%2C%20Japan" },
  { name: "센다이", code: "SDJ", lat: 38.2677554, lon: 140.8691498, osm: "https://www.openstreetmap.org/search?query=Sendai%2C%20Japan" },
  { name: "니가타", code: "KIJ", lat: 37.916192, lon: 139.036409, osm: "https://www.openstreetmap.org/search?query=Niigata%2C%20Japan" },
  { name: "이바라키", code: "IBR", lat: 36.2869536, lon: 140.4703384, osm: "https://www.openstreetmap.org/search?query=Ibaraki%2C%20Japan" },
  { name: "시즈오카", code: "FSZ", lat: 34.9751974, lon: 138.3831697, osm: "https://www.openstreetmap.org/search?query=Shizuoka%2C%20Japan" },
  { name: "고마쓰", code: "KMQ", lat: 36.4032931, lon: 136.4495465, osm: "https://www.openstreetmap.org/search?query=Komatsu%2C%20Japan" },
  { name: "오카야마", code: "OKJ", lat: 34.655146, lon: 133.919502, osm: "https://www.openstreetmap.org/search?query=Okayama%2C%20Japan" },
  { name: "요나고", code: "YGJ", lat: 35.4276408, lon: 133.331459, osm: "https://www.openstreetmap.org/search?query=Yonago%2C%20Japan" },
  { name: "히로시마", code: "HIJ", lat: 34.3917241, lon: 132.4517589, osm: "https://www.openstreetmap.org/search?query=Hiroshima%2C%20Japan" },
  { name: "다카마쓰", code: "TAK", lat: 34.3425592, lon: 134.0465338, osm: "https://www.openstreetmap.org/search?query=Takamatsu%2C%20Japan" },
  { name: "마쓰야마", code: "MYJ", lat: 33.8395188, lon: 132.7653521, osm: "https://www.openstreetmap.org/search?query=Matsuyama%2C%20Japan" },
  { name: "사가", code: "HSG", lat: 33.263482, lon: 130.300858, osm: "https://www.openstreetmap.org/search?query=Saga%2C%20Japan" },
  { name: "나가사키", code: "NGS", lat: 32.750286, lon: 129.877667, osm: "https://www.openstreetmap.org/search?query=Nagasaki%2C%20Japan" },
  { name: "오이타", code: "OIT", lat: 33.2393864, lon: 131.6096524, osm: "https://www.openstreetmap.org/search?query=Oita%2C%20Japan" },
  { name: "구마모토", code: "KMJ", lat: 32.8031, lon: 130.7079, osm: "https://www.openstreetmap.org/search?query=Kumamoto%2C%20Japan" },
  { name: "미야자키", code: "KMI", lat: 31.9077, lon: 131.4202, osm: "https://www.openstreetmap.org/search?query=Miyazaki%2C%20Japan" },
  { name: "가고시마", code: "KOJ", lat: 31.5966, lon: 130.5571, major: true, osm: "https://www.openstreetmap.org/search?query=Kagoshima%2C%20Japan" },
  { name: "오키나와(나하)", code: "OKA", lat: 26.2122345, lon: 127.6791452, osm: "https://www.openstreetmap.org/search?query=Naha%2C%20Okinawa%2C%20Japan" },
  { name: "이시가키", code: "ISG", lat: 24.3444441, lon: 124.1851857, osm: "https://www.openstreetmap.org/search?query=Ishigaki%2C%20Okinawa%2C%20Japan" },
];

// 새 크롤링 사이트를 추가할 때 이 목록에 소스만 하나씩 등록하면 필터에 자동으로 표시됩니다.
const dealSources = [
  { id: "ttang", label: "땡처리닷컴", url: "https://www.ttang.com/ttangair/search/ttang/list.do?arr0=A7ALL" },
  { id: "modetour", label: "모두투어", url: "https://www.modetour.com/flights/discount-flight" },
  { id: "hanatour", label: "하나투어", url: "https://www.hanatour.com/trp/air/CHPC0AIR0233M200" },
  { id: "ybtour", label: "노랑풍선", url: "https://fly.ybtour.co.kr/booking/findDiscountAir.lts?efcTpCode=INV&efcCode=INV" },
];

let toastTimer;
let todayDeals = [];
let activeSource = "all";
let activeDealDuration = "all";
let japanMap = null;
let japanBounds = [];
let selectedCity = null;
const markerByCode = new Map();
let selectedAirportMarker = null;
const selectedAttractionMarkers = new Map();
const attractionDetailsCache = new Map();
let attractionDetailSequence = 0;
let attractionLoadSequence = 0;
const LIVE_FLIGHTS_PER_PAGE = 20;
let liveFlightResults = [];
let liveFlightPage = 1;
let liveFlightCity = "all";
let liveFlightAirline = "all";
let liveFlightDuration = "all";
let renderedLiveFlightResultCount = -1;
let liveFlightUpdatedAt = null;

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

function getAutomationUrl() {
  const queryUrl = new URLSearchParams(window.location.search).get("worker");
  const savedUrl = localStorage.getItem("ttangAutomationUrl");
  const localPage = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return String(queryUrl || window.TTANG_AUTOMATION_URL || savedUrl || (localPage ? window.location.origin : "http://127.0.0.1:8787")).replace(/\/$/, "");
}

const PUBLISHED_DATA_ROOT = "https://raw.githubusercontent.com/minonminho/ttang-air-alert/main/dist";

function isLocalPage() {
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function getPublishedDataUrl(fileName) {
  return isLocalPage() ? `./${fileName}?ts=${Date.now()}` : `${PUBLISHED_DATA_ROOT}/${fileName}?ts=${Date.now()}`;
}

function renderAutomationResults(job, container) {
  const groups = new Map();
  for (const result of job.results || []) {
    const items = groups.get(result.tripDays) || [];
    items.push(result);
    groups.set(result.tripDays, items);
  }
  const sections = [...groups.entries()].sort(([left], [right]) => left - right).map(([tripDays, results]) => `
    <section class="automation-duration"><div class="automation-duration-title"><strong>${tripDays}일 일정</strong><span>최저가 ${results.length}개</span></div>${results.map((result) => `<a class="automation-result" href="${escapeHtml(result.url)}" target="_blank" rel="noopener"><strong>${formatPrice(result.price)}</strong><span>${formatDealDate(result.departureDate)} ~ ${formatDealDate(result.returnDate)}</span><small>Google Flights 검색 결과 ↗</small></a>`).join("")}</section>`).join("");
  container.innerHTML = sections || '<div class="automation-empty">조건에 맞는 항공권을 찾지 못했어요.</div>';
}

async function runCityFlightSearch(city) {
  const panel = document.querySelector("#cityDealsPanel");
  const button = panel?.querySelector("#cityFlightSearch");
  const status = panel?.querySelector("#cityFlightStatus");
  const resultBox = panel?.querySelector("#cityFlightResults");
  if (!button || !status || !resultBox) return;

  button.disabled = true;
  button.textContent = "검색 중…";
  status.textContent = "Google Flights에서 일정별 최저가를 확인하고 있어요.";
  resultBox.innerHTML = '<div class="automation-loading">검색 작업을 준비하고 있어요…</div>';
  let workerConnected = false;

  try {
    const baseUrl = getAutomationUrl();
    const createResponse = await fetch(`${baseUrl}/api/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ city: city.code }),
    });
    const created = await createResponse.json();
    if (!createResponse.ok) throw new Error(created.error || "검색 작업을 시작하지 못했습니다.");
    workerConnected = true;

    let job = created;
    while (job.status === "queued" || job.status === "running") {
      if (job.progress) status.textContent = `${job.progress.current}/${job.progress.total}개 일정 검색 중…`;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const jobResponse = await fetch(`${baseUrl}/api/jobs/${created.jobId}`);
      job = await jobResponse.json();
      if (!jobResponse.ok) throw new Error(job.error || "검색 상태를 확인하지 못했습니다.");
    }

    if (job.status !== "succeeded") throw new Error(job.error || "항공권 검색이 중단되었습니다.");
    status.textContent = `${job.searchedTrips}개 일정 검색 완료 · 기간별 최저가 5개를 표시합니다.`;
    renderAutomationResults(job, resultBox);
  } catch (error) {
    status.textContent = workerConnected ? "워커는 연결됐지만 검색 결과를 받지 못했습니다." : "자동화 워커에 연결하지 못했습니다.";
    resultBox.innerHTML = `<div class="automation-error">${escapeHtml(error.message)}<br /><small>${workerConnected ? "잠시 후 다시 시도해 주세요." : "Playwright 워커가 실행 중인지 확인해 주세요."}</small></div>`;
    showToast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "다시 가져오기";
  }
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

function inferAirline(value) {
  const knownAirlines = [
    "대한항공", "아시아나항공", "제주항공", "진에어", "티웨이항공", "에어부산", "에어서울", "이스타항공",
    "에어프레미아", "플라이강원", "ANA", "일본항공", "JAL", "피치항공", "스카이마크", "스타플라이어",
    "Jetstar", "젯스타", "Air Japan", "ZIPAIR", "Philippine Airlines",
  ];
  const text = String(value ?? "");
  return knownAirlines.find((airline) => text.toLowerCase().includes(airline.toLowerCase())) || "기타";
}

function groupFlightResults(results = []) {
  const groups = new Map();
  for (const result of results) {
    if (Number(result.price) < 100000) continue;
    const operationKey = result.operationKey || normalizeFlightOperation(result.label);
    const key = `${result.destinationCode}|${result.price}|${operationKey}`;
    const group = groups.get(key) || {
      destination: result.destination,
      destinationCode: result.destinationCode,
      price: result.price,
      label: result.label || "항공권 운항 정보",
      airline: result.airline || inferAirline(result.label),
      outbound: result.outbound || null,
      inbound: result.inbound || null,
      schedules: [],
    };
    const scheduleKey = `${result.departureDate}|${result.returnDate}`;
    if (!group.schedules.some((schedule) => schedule.key === scheduleKey)) {
      group.schedules.push({
        key: scheduleKey,
        departureDate: result.departureDate,
        returnDate: result.returnDate,
        tripDays: result.tripDays,
        url: result.url,
      });
    }
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({ ...group, schedules: group.schedules.sort((left, right) => String(left.departureDate).localeCompare(String(right.departureDate))) }))
    .sort((left, right) => left.price - right.price || String(left.destination).localeCompare(String(right.destination), "ko"));
}

function parseFlightLeg(leg) {
  const description = String(leg?.description || "");
  const match = description.match(/Leaves\s+(.+?)\s+at\s+(.+?)\s+on\s+(.+?)\s+and arrives at\s+(.+?)\s+at\s+(.+?)\s+on\s+(.+?)\.\s+Total duration\s+(.+?)\./i);
  if (!match) return null;
  const airportLabel = (value) => {
    const name = value.replace(/\s+Airport$/i, "").replace(/\s+International$/i, "");
    const known = { "Incheon": "인천", "Narita": "도쿄 나리타", "Haneda": "도쿄 하네다", "New Chitose": "삿포로 신치토세", "Hakodate": "하코다테" };
    return known[name] || name;
  };
  const departureDate = new Date(`${match[3]} 2020`);
  const arrivalDate = new Date(`${match[6]} 2020`);
  const arrivalNextDay = !Number.isNaN(departureDate.getTime()) && !Number.isNaN(arrivalDate.getTime())
    && (arrivalDate.getMonth() !== departureDate.getMonth() || arrivalDate.getDate() !== departureDate.getDate());
  const carrier = description.match(/flight with (.*?)\./i)?.[1] || "항공사 정보 없음";
  const stopText = description.match(/(?:^|\.\s*)(Nonstop|\d+ stops?) flight\b/i)?.[1] || "운항 정보";
  return {
    origin: airportLabel(match[1]),
    destination: airportLabel(match[4]),
    departureTime: match[2].replace(/\s+/g, " ").replace(/\s*([AP]M)$/i, "$1"),
    arrivalTime: match[5].replace(/\s+/g, " ").replace(/\s*([AP]M)$/i, "$1"),
    duration: match[7],
    arrivalNextDay,
    carrier,
    stops: stopText,
  };
}

function renderFlightLeg(leg, direction) {
  const detail = parseFlightLeg(leg);
  if (!detail) return `<div class="live-flight-leg"><span class="live-flight-leg-label">${direction}</span><strong class="live-flight-leg-route">${escapeHtml(leg?.description || "운항 정보를 확인할 수 없습니다.")}</strong></div>`;
  return `<div class="live-flight-leg">
    <span class="live-flight-leg-label">${direction}</span>
    <div class="live-flight-leg-route"><strong>${escapeHtml(detail.origin)}</strong><span class="live-flight-leg-arrow" aria-hidden="true">→</span><strong>${escapeHtml(detail.destination)}</strong></div>
    <div class="live-flight-leg-times"><strong>${escapeHtml(detail.departureTime)}</strong><span>–</span><strong>${escapeHtml(detail.arrivalTime)}${detail.arrivalNextDay ? '<small>+1</small>' : ''}</strong></div>
    <div class="live-flight-leg-meta"><span>${escapeHtml(detail.carrier)}</span><span>${escapeHtml(detail.stops)}</span><span>${escapeHtml(detail.duration)}</span></div>
  </div>`;
}

function formatLiveRefreshTime(value) {
  if (!value) return "수집 시각 정보 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "수집 시각 정보 없음";
  return `마지막 수집 ${new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date)}`;
}

function renderLiveFlightCard(group) {
  const schedules = group.schedules.map((schedule) => `<a class="live-flight-schedule" href="${escapeHtml(schedule.url)}" target="_blank" rel="noopener"><strong>${schedule.tripDays}일 일정</strong><span>${formatDealDate(schedule.departureDate)} → ${formatDealDate(schedule.returnDate)}</span><span class="live-flight-schedule-arrow" aria-hidden="true">↗</span></a>`).join("");
  return `<article class="live-flight-card">
    <header class="live-flight-card-header"><div class="live-flight-city-block"><strong>${escapeHtml(group.destination)}</strong><span>${escapeHtml(group.destinationCode)}</span></div><div class="live-flight-price"><small>왕복 최저가</small><strong>${formatPrice(group.price)}</strong></div></header>
    <div class="live-flight-legs">${renderFlightLeg(group.outbound, "가는 편")}<span class="live-flight-leg-divider" aria-hidden="true"></span>${renderFlightLeg(group.inbound, "오는 편")}</div>
    <footer class="live-flight-card-footer"><div class="live-flight-schedules-heading"><strong>가능한 일정</strong><span>${group.schedules.length}개</span></div><div class="live-flight-schedules">${schedules}</div></footer>
  </article>`;
}

function getGroupAirlines(group) {
  const legAirlines = [group.outbound, group.inbound]
    .map((leg) => leg?.airline || String(leg?.description || "").match(/flight with\s+(.+?)\./i)?.[1])
    .map((airline) => String(airline || "").trim())
    .filter(Boolean);
  const names = legAirlines.length ? legAirlines : String(group.airline || "").split(/\s*\/\s*/);
  return [...new Set(names.map((airline) => airline.trim()).filter(Boolean))];
}

function filterFlightSchedulesByDuration(groups, duration = liveFlightDuration) {
  if (duration === "all") return groups;
  const days = Number(duration);
  return groups.map((group) => ({
    ...group,
    schedules: group.schedules.filter((schedule) => Number(schedule.tripDays) === days),
  })).filter((group) => group.schedules.length > 0);
}

function getFilteredLiveFlightGroups(groups = groupFlightResults(liveFlightResults)) {
  return filterFlightSchedulesByDuration(groups).filter((group) => {
    const cityMatch = liveFlightCity === "all" || group.destinationCode === liveFlightCity;
    const airlineMatch = liveFlightAirline === "all" || getGroupAirlines(group).includes(liveFlightAirline);
    return cityMatch && airlineMatch;
  });
}

function updateLiveFlightFilters(groups) {
  const cityFilter = document.querySelector("#liveCityFilter");
  const airlineFilter = document.querySelector("#liveAirlineFilter");
  if (!cityFilter || !airlineFilter) return;
  const airlineLabel = airlineFilter.closest("label");
  if (airlineLabel?.firstChild?.nodeType === Node.TEXT_NODE) airlineLabel.firstChild.textContent = "항공사 (가는 편·오는 편) ";
  airlineFilter.setAttribute("aria-label", "항공사 필터: 가는 편 또는 오는 편 운항사");
  const citiesByCode = new Map(groups.map((group) => [group.destinationCode, group.destination]));
  const airlines = [...new Set(groups.flatMap(getGroupAirlines))].sort((left, right) => left.localeCompare(right, "ko"));
  cityFilter.innerHTML = `<option value="all">전체 도시</option>${[...citiesByCode.entries()].map(([code, name]) => `<option value="${escapeHtml(code)}">${escapeHtml(name)} (${escapeHtml(code)})</option>`).join("")}`;
  airlineFilter.innerHTML = `<option value="all">전체 항공사</option>${airlines.map((airline) => `<option value="${escapeHtml(airline)}">${escapeHtml(airline)}</option>`).join("")}`;
  if (!citiesByCode.has(liveFlightCity)) liveFlightCity = "all";
  if (!airlines.includes(liveFlightAirline)) liveFlightAirline = "all";
  cityFilter.value = liveFlightCity;
  airlineFilter.value = liveFlightAirline;
}

function renderLiveFlightList() {
  const list = document.querySelector("#liveFlightList");
  const count = document.querySelector("#liveFlightCount");
  if (!list) return;
  const allGroups = groupFlightResults(liveFlightResults);
  updateLiveFlightFilters(allGroups);
  const groups = getFilteredLiveFlightGroups(allGroups);
  const totalPages = Math.max(1, Math.ceil(groups.length / LIVE_FLIGHTS_PER_PAGE));
  if (liveFlightPage > totalPages) liveFlightPage = totalPages;
  const start = (liveFlightPage - 1) * LIVE_FLIGHTS_PER_PAGE;
  const visibleGroups = groups.slice(start, start + LIVE_FLIGHTS_PER_PAGE);
  if (count) count.innerHTML = `<strong>${groups.length.toLocaleString("ko-KR")}</strong>개 조합 <span>· ${liveFlightPage} / ${totalPages}페이지</span> <small>${escapeHtml(formatLiveRefreshTime(liveFlightUpdatedAt))}</small>`;
  list.innerHTML = visibleGroups.length ? `${visibleGroups.map(renderLiveFlightCard).join("")}${totalPages > 1 ? `<div class="live-flight-pagination"><button type="button" data-page="prev" ${liveFlightPage === 1 ? "disabled" : ""}>‹ 이전</button><span>${liveFlightPage} / ${totalPages}</span><button type="button" data-page="next" ${liveFlightPage === totalPages ? "disabled" : ""}>다음 ›</button></div>` : ""}` : '<div class="automation-empty">선택한 필터에 맞는 항공권이 없습니다.</div>';
  list.querySelector('[data-page="prev"]')?.addEventListener("click", () => { liveFlightPage -= 1; renderLiveFlightList(); });
  list.querySelector('[data-page="next"]')?.addEventListener("click", () => { liveFlightPage += 1; renderLiveFlightList(); });
}

function renderAllAutomationResults(job, container) {
  const groups = filterFlightSchedulesByDuration(groupFlightResults(job.results || []));
  const visibleGroups = groups.slice(0, LIVE_FLIGHTS_PER_PAGE);
  container.innerHTML = visibleGroups.length ? visibleGroups.map(renderLiveFlightCard).join("") : '<div class="automation-empty">아직 검색 결과가 없습니다.</div>';
}

function setAllFlightStatus(message) {
  document.querySelectorAll("#allCityFlightStatus, #liveFlightsStatus").forEach((element) => {
    element.textContent = message;
  });
}

function refreshSelectedCityLiveFare() {
  if (!selectedCity) return;
  const fareCard = document.querySelector("#cityDealsPanel .city-panel-live-fare");
  if (fareCard) fareCard.outerHTML = renderCityLiveFare(selectedCity);
}

function renderAllFlightResults(job) {
  liveFlightResults = Array.isArray(job.results) ? job.results : [];
  liveFlightUpdatedAt = job.updatedAt || liveFlightUpdatedAt;
  renderedLiveFlightResultCount = liveFlightResults.length;
  renderLiveFlightList();
  document.querySelectorAll("#allCityFlightResults").forEach((container) => renderAllAutomationResults(job, container));
  refreshSelectedCityLiveFare();
}

function openAllCitySearchPanel(mode = "quick") {
  selectedCity = null;
  clearSelectedAttractionMarkers();
  const attractionsPanel = document.querySelector("#cityAttractionsPanel");
  attractionsPanel?.classList.remove("visible");
  if (attractionsPanel) attractionsPanel.innerHTML = "";
  if (selectedAirportMarker) japanMap?.removeLayer(selectedAirportMarker);
  selectedAirportMarker = null;
  document.querySelectorAll(".deal-card").forEach((card) => card.classList.remove("highlight"));
  document.querySelectorAll(".city-choice").forEach((button) => button.classList.remove("active"));
  markerByCode.forEach((marker) => marker.getElement()?.classList.remove("active"));
  const panel = document.querySelector("#cityDealsPanel");
  panel.innerHTML = `
    <div class="city-panel-header"><div><p class="city-panel-kicker">ALL CITIES</p><h3 class="city-panel-title">전체 도시 항공권</h3><p class="city-panel-code">Google Flights · 26개 도시</p></div><button id="cityPanelClose" class="city-panel-close" type="button" aria-label="일본 전체 지도 보기">×</button></div>
    <div class="city-search-action"><button id="allCityFlightSearch" type="button">빠른 전체 검색</button><button id="allCityFullSearch" type="button" class="full-flight-search">정밀 검색</button><span id="allCityFlightStatus">대표 일정 + 저렴한 주간 정밀 검색</span></div>
    <div id="allCityFlightResults" class="city-flight-results"></div>`;
  panel.classList.add("visible");
  panel.querySelector("#cityPanelClose").addEventListener("click", resetMapView);
  panel.querySelector("#allCityFlightSearch").addEventListener("click", () => runAllCityFlightSearch("quick"));
  panel.querySelector("#allCityFullSearch").addEventListener("click", () => runAllCityFlightSearch("full"));
  if (japanMap && japanBounds.length) japanMap.fitBounds(japanBounds, { padding: [20, 20], duration: 0.8 });
  runAllCityFlightSearch(mode);
}

async function runAllCityFlightSearch(mode = "quick", existingJob = null) {
  if (existingJob?.mode) mode = existingJob.mode;
  const buttons = [...new Set([...document.querySelectorAll("#allFlightSearch, #fullFlightSearch, #allCityFlightSearch, #allCityFullSearch, #liveFlightsSearch, #liveFlightsFullSearch")])];
  const resultBoxes = [...new Set([...document.querySelectorAll("#allCityFlightResults, #liveFlightList")])];
  if (!buttons.length || !resultBoxes.length) return;

  buttons.forEach((button) => {
    button.disabled = true;
    button.textContent = mode === "full" ? "정밀 검색 중…" : "빠른 검색 중…";
  });
  setAllFlightStatus(mode === "full" ? "26개 도시의 176개 일정을 모두 검색하고 있어요. 오래 걸릴 수 있어요." : "대표 일정을 먼저 검색하고, 저렴한 주간을 정밀 검색하고 있어요.");
  resultBoxes.forEach((resultBox) => {
    resultBox.innerHTML = '<div class="automation-loading">전체 도시 검색을 준비하고 있어요…</div>';
  });
  if (!existingJob) renderedLiveFlightResultCount = -1;
  let workerConnected = Boolean(existingJob);

  try {
    const baseUrl = getAutomationUrl();
    let job = existingJob;
    let jobId = existingJob?.id;
    if (!job) {
      const createResponse = await fetch(`${baseUrl}/api/search-all`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode }) });
      const created = await createResponse.json();
      if (!createResponse.ok) throw new Error(created.error || "전체 도시 검색을 시작하지 못했습니다.");
      workerConnected = true;
      job = created;
      jobId = created.jobId;
    } else if (job.results?.length) {
      renderAllFlightResults(job);
    }

    while (job.status === "queued" || job.status === "running") {
      if (job.progress) setAllFlightStatus(`${job.progress.cityIndex}/${job.progress.totalCities} 도시 · ${job.progress.city} · ${job.progress.phase || "검색"} · ${job.progress.current}/${job.progress.total}개 일정`);
      if (job.results?.length && job.results.length !== renderedLiveFlightResultCount) renderAllFlightResults(job);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const jobResponse = await fetch(`${baseUrl}/api/jobs/${jobId}`);
      job = await jobResponse.json();
      if (!jobResponse.ok) throw new Error(job.error || "전체 도시 검색 상태를 확인하지 못했습니다.");
    }
    if (job.status !== "succeeded") throw new Error(job.error || "전체 도시 검색이 중단되었습니다.");
    setAllFlightStatus(`${groupFlightResults(job.results).length}개 항공권을 최저가순으로 정리했습니다. ${mode === "full" ? "전체 일정" : "빠른 검색"} · 중복 운항 정보는 묶었습니다.`);
    renderAllFlightResults(job);
  } catch (error) {
    setAllFlightStatus(workerConnected ? "워커는 연결됐지만 전체 검색 결과를 받지 못했습니다." : "자동화 워커에 연결하지 못했습니다.");
    resultBoxes.forEach((resultBox) => {
      resultBox.innerHTML = `<div class="automation-error">${escapeHtml(error.message)}<br /><small>${workerConnected ? "잠시 후 다시 시도해 주세요." : "Playwright 워커가 실행 중인지 확인해 주세요."}</small></div>`;
    });
    showToast(error.message);
  } finally {
    buttons.forEach((button) => {
      button.disabled = false;
      if (["fullFlightSearch", "allCityFullSearch", "liveFlightsFullSearch"].includes(button.id)) button.textContent = button.id === "allCityFullSearch" ? "정밀 검색" : button.id === "liveFlightsFullSearch" ? "정밀 전체 검색" : "정밀 검색";
      else button.textContent = button.id === "allCityFlightSearch" ? "빠른 전체 검색" : "빠른 전체 검색";
    });
  }
}

async function loadLatestAllCityResults(baseUrl) {
  const response = await fetch(isLocalPage() ? `${baseUrl}/api/flights/latest` : getPublishedDataUrl("flight-results.json"), { cache: "no-store" });
  if (!response.ok) return null;
  const snapshot = await response.json();
  liveFlightUpdatedAt = snapshot.updatedAt || liveFlightUpdatedAt;
  if (Array.isArray(snapshot.results) && snapshot.results.length) renderAllFlightResults(snapshot);
  if (snapshot.status === "succeeded" && Array.isArray(snapshot.results)) {
    setAllFlightStatus(`${groupFlightResults(snapshot.results).length}개 항공권을 최저가순으로 정리했습니다. ${snapshot.mode === "full" ? "전체 일정" : "빠른 검색"} · 중복 운항 정보는 묶었습니다.`);
  } else if (snapshot.status === "running" && snapshot.progress) {
    setAllFlightStatus("저장된 최신 결과를 불러오는 중이며, 진행 중인 검색을 확인하고 있어요.");
  }
  return snapshot;
}

async function resumeAllCityFlightSearch() {
  try {
    const baseUrl = getAutomationUrl();
    await loadLatestAllCityResults(baseUrl);
    if (!isLocalPage()) return;
    const response = await fetch(`${baseUrl}/api/jobs/active`);
    if (!response.ok) return;
    const payload = await response.json();
    const job = payload.job;
    if (!job || job.type !== "all-cities") return;
    if (payload.active && (job.status === "queued" || job.status === "running")) {
      await runAllCityFlightSearch(job.mode || "quick", job);
      return;
    }
    if (job.status === "succeeded") {
      setAllFlightStatus(`${groupFlightResults(job.results).length}개 항공권을 최저가순으로 정리했습니다. ${job.mode === "full" ? "전체 일정" : "빠른 검색"} · 중복 운항 정보는 묶었습니다.`);
      renderAllFlightResults(job);
    }
  } catch (error) {
    console.info("진행 중인 전체 도시 검색을 복원하지 못했습니다.", error.message);
  }
}

function formatPrice(price) {
  return `₩${Number(price).toLocaleString("ko-KR")}`;
}

const weekdayLabels = ["월", "화", "수", "목", "금", "토", "일"];

function parseDealDate(value) {
  const match = String(value ?? "").trim().match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDealDate(value) {
  const date = parseDealDate(value);
  if (!date) return value;
  const weekday = weekdayLabels[(date.getDay() + 6) % 7];
  return `${date.getMonth() + 1}/${date.getDate()}[${weekday}]`;
}

function formatPeriod(deal) {
  return `${formatDealDate(deal.fromDate)} ~ ${formatDealDate(deal.toDate)}`;
}

function renderWeekdayStrip(deal) {
  const from = parseDealDate(deal.fromDate);
  const to = parseDealDate(deal.toDate);
  if (!from || !to) return "";

  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  const activeDays = new Set();
  const cursor = new Date(start);
  while (cursor <= end) {
    activeDays.add((cursor.getDay() + 6) % 7);
    cursor.setDate(cursor.getDate() + 1);
  }

  return `<div class="weekday-strip" aria-label="${formatPeriod(deal)} 일정 요일"><span class="weekday-label">요일</span>${weekdayLabels.map((label, index) => `<span class="weekday-box${activeDays.has(index) ? " active" : ""}">${label}</span>`).join("")}</div>`;
}

function getDealSourceId(deal) {
  if (deal.sourceId) return deal.sourceId;
  if (deal.sourceUrl?.includes("ttang.com")) return "ttang";
  return "unknown";
}

function getDealSourceLabel(deal) {
  return dealSources.find((source) => source.id === getDealSourceId(deal))?.label || deal.sourceName || "기타 사이트";
}

function normalizeDealDate(value) {
  const date = parseDealDate(value);
  if (!date) return String(value ?? "").trim();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDealGroupKey(deal) {
  return [
    deal.arrivalCode,
    normalizeDealDate(deal.fromDate),
    normalizeDealDate(deal.toDate),
    deal.tripType || "왕복",
  ].join("|");
}

function groupDeals(deals) {
  const groups = new Map();
  deals.forEach((deal) => {
    const key = getDealGroupKey(deal);
    const group = groups.get(key);
    if (group) {
      group.priceOptions.push(deal);
      if (Number(deal.price) < Number(group.price)) Object.assign(group, deal);
    } else {
      groups.set(key, { ...deal, priceOptions: [deal] });
    }
  });
  return [...groups.values()].map((group) => ({
    ...group,
    priceOptions: [...group.priceOptions].sort((a, b) => Number(a.price) - Number(b.price)),
  }));
}

function getPriceOptions(deal) {
  return Array.isArray(deal.priceOptions) ? deal.priceOptions : [deal];
}

function renderDealSourceMeta(deal) {
  const options = getPriceOptions(deal);
  if (options.length === 1) return `<span class="deal-source-tag">${getDealSourceLabel(deal)}</span>`;
  const sources = [...new Set(options.map((option) => getDealSourceLabel(option)))];
  return `<span class="deal-source-tag grouped">${options.length}개 가격</span> ${sources.join(" · ")}`;
}

function getDealTripDays(deal) {
  if (/편도/.test(String(deal.tripType || ""))) return null;
  const from = parseDealDate(deal.fromDate);
  const to = parseDealDate(deal.toDate);
  if (!from || !to || to < from) return null;
  const utcDay = (date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
  return utcDay(to) - utcDay(from) + 1;
}

function getDurationFilteredDeals(deals) {
  return activeDealDuration === "all" ? deals : deals.filter((deal) => getDealTripDays(deal) === Number(activeDealDuration));
}

function getVisibleDeals() {
  const deals = getDurationFilteredDeals(activeSource === "all" ? todayDeals : todayDeals.filter((deal) => getDealSourceId(deal) === activeSource));
  return activeSource === "all" ? groupDeals(deals) : deals;
}

function renderSourceFilters() {
  const container = document.querySelector("#sourceFilters");
  if (!container) return;
  const durationDeals = getDurationFilteredDeals(todayDeals);
  const buttons = [
    { id: "all", label: "ALL", count: groupDeals(durationDeals).length },
    ...dealSources.map((source) => ({
      id: source.id,
      label: source.label,
      count: durationDeals.filter((deal) => getDealSourceId(deal) === source.id).length,
    })),
  ];
  container.innerHTML = buttons.map((source) => `
    <button class="source-filter${activeSource === source.id ? " active" : ""}" type="button" data-source="${source.id}">
      <span>${source.label}</span><small>${source.count}개</small>
    </button>`).join("");
  container.querySelectorAll(".source-filter").forEach((button) => {
    button.addEventListener("click", () => {
      activeSource = button.dataset.source;
      renderSourceFilters();
      renderDeals(getVisibleDeals());
      if (selectedCity) showCityDeals(selectedCity);
    });
  });
}

function renderDeals(deals) {
  const list = document.querySelector("#dealList");
  document.querySelector("#mapDealCount").textContent = `오늘의 특가 ${deals.length}개`;
  if (!deals.length) {
    list.innerHTML = '<div class="empty-state">오늘은 조건에 맞는 특가가 아직 없어요.</div>';
    return;
  }
  list.innerHTML = deals.map((deal) => `
    <article class="deal-card" data-arrival="${deal.arrivalCode}">
      <div class="deal-main"><div class="deal-route"><strong>인천 → ${deal.arrival}</strong><span class="deal-code">ICN · ${deal.arrivalCode}</span></div><p class="deal-sub">${renderDealSourceMeta(deal)} ${deal.airline} · ${deal.tripType} · ${formatPeriod(deal)}${deal.minimumPassengers > 1 ? ` · ${deal.minimumPassengers}명부터` : ""}</p>${renderWeekdayStrip(deal)}</div>
      <strong class="deal-price">${formatPrice(deal.price)}<small>부터</small></strong>
      <a class="deal-book" href="${deal.reservationUrl}" target="_blank" rel="noopener">${getPriceOptions(deal).length > 1 ? "최저가 예약" : "예약"} ↗</a>
    </article>`).join("");
}

function renderCityLiveFare(city) {
  const lowest = filterFlightSchedulesByDuration(groupFlightResults(liveFlightResults))
    .filter((group) => group.destinationCode === city.code)
    .sort((left, right) => left.price - right.price)[0];
  if (!lowest) return `<section class="city-panel-live-fare" aria-label="실시간 항공권 최저가"><div class="city-panel-live-heading"><span>LIVE FLIGHTS</span><strong>실시간 검색 최저가</strong></div><p class="city-panel-live-empty">선택한 기간에 맞는 이 도시의 항공권 결과가 없습니다.</p></section>`;
  const schedule = lowest.schedules[0];
  const scheduleText = schedule
    ? `${schedule.tripDays}일 일정 · ${formatDealDate(schedule.departureDate)} → ${formatDealDate(schedule.returnDate)}`
    : "검색 결과 보기";
  const href = schedule?.url || "#liveFlights";
  return `<section class="city-panel-live-fare" aria-label="실시간 항공권 최저가"><div class="city-panel-live-heading"><span>LIVE FLIGHTS</span><strong>실시간 검색 최저가</strong></div><div class="city-panel-live-main"><strong>${formatPrice(lowest.price)}</strong><span>왕복 · ${escapeHtml(lowest.airline)}</span></div><a class="city-panel-live-link" href="${escapeHtml(href)}" target="_blank" rel="noopener"><span>${escapeHtml(scheduleText)}</span><strong>항공권 보기 ↗</strong></a><small class="city-panel-live-updated">${escapeHtml(formatLiveRefreshTime(liveFlightUpdatedAt))}</small></section>`;
}

function renderCityAttractions(city) {
  const attractions = window.JAPAN_ATTRACTIONS?.[city.code] || [];
  if (!attractions.length) return "";
  return `<section class="city-panel-attractions" aria-label="유명 관광지"><div class="city-panel-attractions-heading"><strong>유명 관광지</strong><span class="city-attraction-status">관광지 좌표 불러오는 중</span></div><div class="city-attraction-detail" hidden></div><div class="city-attraction-list">${attractions.map((attraction, index) => `<div class="city-attraction-row"><button class="city-attraction-focus" type="button" data-attraction-index="${index}" disabled><span class="city-attraction-number">${index + 1}</span><span class="city-attraction-name"><strong>${escapeHtml(attraction.nameKo)}</strong><small>${escapeHtml(attraction.nameJa)}</small></span></button><a class="city-attraction-osm" href="${escapeHtml(attraction.osmUrl)}" target="_blank" rel="noopener" aria-label="${escapeHtml(attraction.nameKo)} OSM 검색">OSM ↗</a></div>`).join("")}</div></section>`;
}

function getWikimediaImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)wikimedia\.org$/i.test(url.hostname) ? url.href : "";
  } catch {
    return "";
  }
}

function getWikipediaPageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)wikipedia\.org$/i.test(url.hostname) ? url.href : "";
  } catch {
    return "";
  }
}

function getCommonsPageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "commons.wikimedia.org" ? url.href : "";
  } catch {
    return "";
  }
}

function getCommonsFilePageUrl(imageUrl) {
  try {
    const url = new URL(imageUrl);
    const parts = url.pathname.split("/");
    const thumbIndex = parts.indexOf("thumb");
    const filename = thumbIndex >= 0 ? parts[thumbIndex + 3] : parts.at(-1);
    if (!filename) return "";
    const decodedFilename = decodeURIComponent(filename).replaceAll(" ", "_");
    return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(decodedFilename)}`;
  } catch {
    return "";
  }
}

async function fetchWikipediaSummary(language, title) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(`https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const summary = await response.json();
    return {
      title: summary.title || title,
      extract: String(summary.extract || summary.description || "").trim(),
      imageUrl: getWikimediaImageUrl(summary.thumbnail?.source || summary.originalimage?.source),
      pageUrl: getWikipediaPageUrl(summary.content_urls?.desktop?.page),
      language,
    };
  } catch (error) {
    if (error.name !== "AbortError") console.warn(`${language} 위키백과 요약을 불러오지 못했습니다.`, error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchCommonsAttractionImage(attraction) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${attraction.nameJa} ${attraction.areaJa}`,
    gsrnamespace: "6",
    gsrlimit: "1",
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "960",
    format: "json",
    formatversion: "2",
    origin: "*",
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    const pages = Array.isArray(data.query?.pages) ? data.query.pages : Object.values(data.query?.pages || {});
    const image = pages[0]?.imageinfo?.[0];
    const imageUrl = getWikimediaImageUrl(image?.thumburl || image?.url);
    return imageUrl ? { imageUrl, pageUrl: getCommonsPageUrl(image?.descriptionurl) || "https://commons.wikimedia.org/" } : null;
  } catch (error) {
    if (error.name !== "AbortError") console.warn("Wikimedia Commons 사진 검색에 실패했습니다.", error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function loadAttractionDetails(attraction) {
  if (attractionDetailsCache.has(attraction.id)) return attractionDetailsCache.get(attraction.id);
  const request = (async () => {
    const [korean, japanese] = await Promise.all([
      fetchWikipediaSummary("ko", attraction.nameKo),
      fetchWikipediaSummary("ja", attraction.nameJa),
    ]);
    const descriptionSource = [korean, japanese].find((summary) => summary?.extract);
    let imageSource = [korean, japanese].find((summary) => summary?.imageUrl);
    let commonsImage = null;
    if (!imageSource) commonsImage = await fetchCommonsAttractionImage(attraction);
    const imageUrl = imageSource?.imageUrl || commonsImage?.imageUrl || "";
    return {
      description: descriptionSource?.extract || "소개 문서를 찾지 못했어요. 아래 링크에서 장소 정보를 확인해 주세요.",
      descriptionLanguage: descriptionSource?.language === "ja" ? "일본어 원문" : "한국어",
      descriptionUrl: descriptionSource?.pageUrl || korean?.pageUrl || japanese?.pageUrl || "",
      imageUrl,
      imagePageUrl: commonsImage?.pageUrl || getCommonsFilePageUrl(imageUrl),
    };
  })();
  attractionDetailsCache.set(attraction.id, request);
  request.then((details) => {
    if (!details.descriptionUrl && !details.imageUrl) attractionDetailsCache.delete(attraction.id);
  }).catch(() => attractionDetailsCache.delete(attraction.id));
  return request;
}

function renderAttractionDetail(attraction, details) {
  const description = details.description.length > 240 ? `${details.description.slice(0, 237).trim()}…` : details.description;
  const image = details.imageUrl
    ? `<img class="city-attraction-detail-image" src="${escapeHtml(details.imageUrl)}" alt="${escapeHtml(attraction.nameKo)} 사진" />`
    : `<div class="city-attraction-detail-no-image"><span aria-hidden="true">景</span><span>등록된 사진을 찾지 못했어요</span></div>`;
  const photoSource = details.imagePageUrl
    ? `<a href="${escapeHtml(details.imagePageUrl)}" target="_blank" rel="noopener">사진 원본·라이선스 ↗</a>`
    : "";
  const descriptionSource = details.descriptionUrl
    ? `<a href="${escapeHtml(details.descriptionUrl)}" target="_blank" rel="noopener">${details.descriptionLanguage} 출처 ↗</a>`
    : "";
  return `<div class="city-attraction-detail-media">${image}</div><div class="city-attraction-detail-copy"><div class="city-attraction-detail-title"><strong>${escapeHtml(attraction.nameKo)}</strong><small>${escapeHtml(attraction.nameJa)} · ${escapeHtml(attraction.areaJa)}</small></div><p>${escapeHtml(description)}</p><div class="city-attraction-detail-sources">${photoSource}${descriptionSource}</div></div>`;
}

async function showAttractionDetail(city, attraction, index) {
  const detail = document.querySelector("#cityAttractionsPanel .city-attraction-detail");
  if (!detail) return;
  document.querySelectorAll(".city-attraction-focus").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.attractionIndex) === index);
  });
  const sequence = ++attractionDetailSequence;
  detail.hidden = false;
  detail.innerHTML = `<div class="city-attraction-detail-loading"><span class="city-attraction-detail-spinner" aria-hidden="true"></span><span>${escapeHtml(attraction.nameKo)} 사진과 설명을 불러오는 중</span></div>`;
  try {
    const details = await loadAttractionDetails(attraction);
    if (sequence !== attractionDetailSequence || selectedCity?.code !== city.code || !detail.isConnected) return;
    detail.innerHTML = renderAttractionDetail(attraction, details);
    const image = detail.querySelector(".city-attraction-detail-image");
    image?.addEventListener("error", () => {
      const placeholder = document.createElement("div");
      placeholder.className = "city-attraction-detail-no-image";
      placeholder.innerHTML = `<span aria-hidden="true">景</span><span>사진을 불러오지 못했어요</span>`;
      image.replaceWith(placeholder);
    }, { once: true });
    detail.scrollIntoView({ block: "nearest", behavior: "smooth" });
  } catch (error) {
    console.error(`관광지 상세 정보를 불러오지 못했습니다: ${attraction.nameKo}`, error);
    if (sequence === attractionDetailSequence && detail.isConnected) {
      detail.innerHTML = `<div class="city-attraction-detail-unavailable">사진과 설명을 불러오지 못했어요. <a href="${escapeHtml(attraction.osmUrl)}" target="_blank" rel="noopener">OSM에서 위치 확인 ↗</a></div>`;
    }
  }
}

function clearSelectedAttractionMarkers() {
  attractionLoadSequence += 1;
  attractionDetailSequence += 1;
  selectedAttractionMarkers.forEach((marker) => {
    try {
      if (japanMap?.hasLayer(marker)) japanMap.removeLayer(marker);
    } catch (error) {
      console.warn("기존 관광지 핀 정리 실패", error);
    }
  });
  selectedAttractionMarkers.clear();
}

function addAttractionMarker(city, attraction, index, point, sequence) {
  const icon = window.L.divIcon({
    className: "attraction-marker-shell",
    html: `<span class="attraction-marker">${index + 1}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
  const marker = window.L.marker([point.lat, point.lon], { icon, zIndexOffset: 600 }).addTo(japanMap);
  marker.bindTooltip(attraction.nameKo, { className: "attraction-marker-tooltip", direction: "top", offset: [0, -10] });
  marker.bindPopup(`<strong>${escapeHtml(attraction.nameKo)}</strong><br /><span>${escapeHtml(attraction.nameJa)} · ${escapeHtml(attraction.areaJa)}</span><br /><a href="${escapeHtml(attraction.osmUrl)}" target="_blank" rel="noopener">OpenStreetMap에서 보기 ↗</a>`);
  selectedAttractionMarkers.set(index, marker);
  marker.on("click", () => showAttractionDetail(city, attraction, index));
  const button = document.querySelector(`#cityAttractionsPanel [data-attraction-index="${index}"]`);
  if (button) {
    button.disabled = false;
    button.addEventListener("click", () => {
      if (sequence !== attractionLoadSequence) return;
      showAttractionDetail(city, attraction, index);
      try {
        japanMap?.flyTo(marker.getLatLng(), Math.max(japanMap.getZoom(), 14), { duration: 0.6 });
        marker.openPopup();
      } catch (error) {
        console.warn(`관광지 위치로 이동하지 못했습니다: ${attraction.nameKo}`, error);
      }
    });
  }
}

function fitSelectedCityAttractions(city) {
  if (!japanMap || selectedCity?.code !== city.code) return;
  try {
    const points = [[city.lat, city.lon]];
    const airport = airportsByCode[city.code];
    if (airport) points.push([airport.lat, airport.lon]);
    selectedAttractionMarkers.forEach((marker) => points.push([marker.getLatLng().lat, marker.getLatLng().lng]));
    const isCompact = window.matchMedia?.("(max-width: 1000px)").matches ?? window.innerWidth <= 1000;
    japanMap.flyToBounds(points, {
      paddingTopLeft: isCompact ? [28, 28] : [330, 28],
      paddingBottomRight: isCompact ? [28, 28] : [365, 28],
      maxZoom: ["OKA", "ISG"].includes(city.code) ? 10 : 11,
      duration: 0.8,
    });
    return true;
  } catch (error) {
    console.warn("관광지 범위 확대 실패, 도시 위치로 이동합니다.", error);
    try {
      japanMap.setView([city.lat, city.lon], ["OKA", "ISG"].includes(city.code) ? 10 : 11, { animate: false });
    } catch (fallbackError) {
      console.warn("도시 지도 이동도 실패했습니다.", fallbackError);
    }
    return false;
  }
}

function loadCityAttractions(city, { focusMap = true } = {}) {
  let status = null;
  let found = 0;
  let failed = 0;
  let phase = "상태 표시 준비";
  try {
    status = document.querySelector("#cityAttractionsPanel .city-attraction-status");
    if (status) status.textContent = "관광지 위치 표시 중";
    phase = "기존 핀 정리";
    clearSelectedAttractionMarkers();
    phase = "관광지 자료 읽기";
    const attractions = window.JAPAN_ATTRACTIONS?.[city.code] || [];
    const coordinates = window.JAPAN_ATTRACTION_COORDINATES?.[city.code] || [];
    if (!attractions.length) {
      if (status) status.textContent = "등록된 관광지가 없습니다";
      return;
    }
    if (!status) {
      console.warn("관광지 상태 표시 요소를 찾을 수 없습니다.");
      return;
    }
    if (!japanMap) {
      status.textContent = "지도가 아직 준비되지 않았습니다";
      return;
    }
    const sequence = attractionLoadSequence;
    status.textContent = `관광지 위치 표시 중 · 0/${attractions.length}`;
    phase = "관광지 핀 생성";
    attractions.forEach((attraction, index) => {
      const point = coordinates[index];
      if (Number.isFinite(point?.lat) && Number.isFinite(point?.lon)) {
        try {
          addAttractionMarker(city, attraction, index, point, sequence);
          found += 1;
        } catch (error) {
          failed += 1;
          console.error(`관광지 지도 표시 실패: ${attraction.nameKo}`, error);
        }
      } else {
        failed += 1;
      }
      status.textContent = `관광지 위치 표시 중 · ${index + 1}/${attractions.length} · ${found}곳 표시`;
    });

    status.textContent = found
      ? `지도에 ${found}곳 표시${failed ? ` · ${failed}곳은 OSM 링크로 확인` : ""}`
      : "저장된 좌표 없음 · OSM 링크에서 확인";
    phase = "지도 자동 확대";
    if (found && focusMap && !fitSelectedCityAttractions(city)) {
      status.textContent = `지도에 ${found}곳 표시 · 도시 중심으로 이동했습니다`;
    }
  } catch (error) {
    console.error(`관광지 목록 표시 실패 (${phase}): ${city.name}`, error);
    if (status) {
      status.textContent = found
        ? `지도에 ${found}곳 표시 · ${phase} 단계에서 일부 오류`
        : `관광지 표시 실패 · ${phase} 단계`;
    }
  }
}

function showAirportMarker(city) {
  if (selectedAirportMarker) {
    japanMap?.removeLayer(selectedAirportMarker);
    selectedAirportMarker = null;
  }
  const airport = airportsByCode[city.code];
  if (!airport || !japanMap) return null;

  const osmUrl = `https://www.openstreetmap.org/?mlat=${airport.lat}&mlon=${airport.lon}#map=14/${airport.lat}/${airport.lon}`;
  const icon = window.L.divIcon({
    className: "airport-marker-shell",
    html: `<span class="airport-marker"><span aria-hidden="true">✈</span><strong>${city.code}</strong></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
  selectedAirportMarker = window.L.marker([airport.lat, airport.lon], { icon, zIndexOffset: 800 }).addTo(japanMap);
  selectedAirportMarker.bindTooltip(`${airport.name} · ${city.code}`, { className: "airport-marker-tooltip", direction: "top", offset: [0, -10] });
  selectedAirportMarker.bindPopup(`<strong>${airport.name} (${city.code})</strong><br /><a href="${osmUrl}" target="_blank" rel="noopener">OpenStreetMap에서 보기 ↗</a>`);
  return airport;
}

function showCityDeals(city, { focusMap = true } = {}) {
  selectedCity = city;
  const panel = document.querySelector("#cityDealsPanel");
  const attractionsPanel = document.querySelector("#cityAttractionsPanel");
  const matches = getVisibleDeals().filter((deal) => deal.arrivalCode === city.code);
  document.querySelectorAll(".deal-card").forEach((card) => card.classList.toggle("highlight", card.dataset.arrival === city.code));
  document.querySelectorAll(".city-choice").forEach((button) => button.classList.toggle("active", button.dataset.code === city.code));
  markerByCode.forEach((marker, code) => marker.getElement()?.classList.toggle("active", code === city.code));
  panel.innerHTML = `
    <div class="city-panel-header"><div><p class="city-panel-kicker">SELECTED CITY</p><h3 class="city-panel-title">${city.name}</h3><p class="city-panel-code">${city.code} · 인천 출발</p></div><button id="cityPanelClose" class="city-panel-close" type="button" aria-label="일본 전체 지도 보기">×</button></div>
    <div class="city-panel-list">${matches.length ? matches.map((deal) => `<div class="city-panel-deal"><div><div class="city-panel-route">인천 → ${deal.arrival}</div><p class="city-panel-sub">${renderDealSourceMeta(deal)} ${deal.airline} · ${formatPeriod(deal)}</p>${renderWeekdayStrip(deal)}</div><strong class="city-panel-price">${formatPrice(deal.price)}</strong><a class="city-panel-book" href="${deal.reservationUrl}" target="_blank" rel="noopener">${getPriceOptions(deal).length > 1 ? "최저가 예약" : "예약"} ↗</a></div>`).join("") : '<div class="city-panel-empty">오늘은 이 도시의 30만원 미만 특가가 아직 없어요.<br />다음 수집 때 다시 확인할게요.</div>'}</div>
    <div class="city-panel-footer"><span>특가 ${matches.length}개</span><a href="${city.osm}" target="_blank" rel="noopener">OSM에서 보기 ↗</a></div>`;
  panel.querySelector(".city-panel-list")?.insertAdjacentHTML("beforebegin", renderCityLiveFare(city));
  attractionsPanel.innerHTML = renderCityAttractions(city);
  attractionsPanel.classList.toggle("visible", Boolean(attractionsPanel.innerHTML));
  panel.classList.add("visible");
  panel.querySelector("#cityPanelClose").addEventListener("click", resetMapView);
  const airport = showAirportMarker(city);
  loadCityAttractions(city, { focusMap });
  if (focusMap && !selectedAttractionMarkers.size && japanMap) {
    const bounds = [[city.lat, city.lon]];
    if (airport) bounds.push([airport.lat, airport.lon]);
    try {
      japanMap.flyToBounds(bounds, {
        paddingTopLeft: window.matchMedia("(max-width: 1000px)").matches ? [28, 28] : [330, 28],
        paddingBottomRight: window.matchMedia("(max-width: 1000px)").matches ? [28, 28] : [365, 28],
        maxZoom: ["OKA", "ISG"].includes(city.code) ? 10 : 11,
        duration: 0.8,
      });
    } catch (error) {
      console.warn("도시 범위 확대 실패, 도시 중심으로 이동합니다.", error);
      japanMap.flyTo([city.lat, city.lon], ["OKA", "ISG"].includes(city.code) ? 10 : 11, { duration: 0.8 });
    }
  }
}

function resetMapView() {
  selectedCity = null;
  clearSelectedAttractionMarkers();
  const attractionsPanel = document.querySelector("#cityAttractionsPanel");
  attractionsPanel?.classList.remove("visible");
  if (attractionsPanel) attractionsPanel.innerHTML = "";
  if (selectedAirportMarker) japanMap?.removeLayer(selectedAirportMarker);
  selectedAirportMarker = null;
  document.querySelector("#cityDealsPanel").classList.remove("visible");
  document.querySelectorAll(".deal-card").forEach((card) => card.classList.remove("highlight"));
  document.querySelectorAll(".city-choice").forEach((button) => button.classList.remove("active"));
  markerByCode.forEach((marker) => marker.getElement()?.classList.remove("active"));
  if (japanMap && japanBounds.length) japanMap.fitBounds(japanBounds, { padding: [20, 20], duration: 0.8 });
}

function renderCityPicker() {
  const picker = document.querySelector("#cityPicker");
  picker.innerHTML = cities.map((city) => `<button class="city-choice${city.major ? " major" : ""}" type="button" data-code="${city.code}"><span>${city.name}</span><small>${city.major ? "★ " : ""}${city.code}</small></button>`).join("");
  picker.querySelectorAll(".city-choice").forEach((button) => {
    const city = cities.find((item) => item.code === button.dataset.code);
    button.addEventListener("click", () => showCityDeals(city));
  });
}

function setupMap() {
  const element = document.querySelector("#japanMap");
  if (!element || !window.L) return;
  japanMap = window.L.map(element, { zoomControl: true, scrollWheelZoom: false, attributionControl: true });
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
  }).addTo(japanMap);

  cities.forEach((city) => {
    japanBounds.push([city.lat, city.lon]);
    const icon = window.L.divIcon({
      className: "city-marker-shell",
      html: `<span class="city-marker${city.major ? " major" : ""}"><span class="city-marker-dot"></span><span class="city-marker-label">${city.name}</span></span>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
      popupAnchor: [0, -8],
    });
    const marker = window.L.marker([city.lat, city.lon], { icon, keyboard: true }).addTo(japanMap);
    marker.getElement()?.querySelector(".city-marker-label")?.addEventListener("click", (event) => {
      event.stopPropagation();
      showCityDeals(city);
    });
    marker.on("click", () => {
      showCityDeals(city);
    });
    markerByCode.set(city.code, marker);
  });

  japanMap.fitBounds(japanBounds, { padding: [20, 20] });
  window.setTimeout(() => japanMap.invalidateSize(), 200);
}

async function loadDeals() {
  try {
    const response = await fetch(getPublishedDataUrl("deals.json"), { cache: "no-store" });
    if (!response.ok) throw new Error(`deals.json HTTP ${response.status}`);
    const payload = await response.json();
    todayDeals = Array.isArray(payload.deals) ? payload.deals : [];
    renderSourceFilters();
    renderDeals(getVisibleDeals());
    if (selectedCity) showCityDeals(selectedCity);
  } catch (error) {
    console.warn("오늘의 특가를 불러오지 못했습니다.", error);
    todayDeals = [];
    renderDeals(todayDeals);
  }
}

async function refreshTodayDeals() {
  const button = document.querySelector("#refreshDeals");
  if (!button) return;
  button.disabled = true;
  button.textContent = "업데이트 중…";
  try {
    const baseUrl = getAutomationUrl();
    const createResponse = await fetch(`${baseUrl}/api/deals/refresh`, { method: "POST" });
    const created = await createResponse.json();
    if (!createResponse.ok) throw new Error(created.error || "업데이트 작업을 시작하지 못했습니다.");
    let state = created;
    while (state.status === "queued" || state.status === "running") {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const statusResponse = await fetch(`${baseUrl}/api/deals/refresh/status`);
      state = await statusResponse.json();
      if (!statusResponse.ok) throw new Error(state.error || "업데이트 상태를 확인하지 못했습니다.");
    }
    if (state.status !== "succeeded") throw new Error(state.error || "오늘의 땡처리 업데이트에 실패했습니다.");
    await loadDeals();
    showToast("오늘의 땡처리를 업데이트했습니다.");
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "↻ 업데이트";
  }
}

document.querySelector("#resetMap").addEventListener("click", resetMapView);
document.querySelector("#liveCityFilter").addEventListener("change", (event) => { liveFlightCity = event.target.value; liveFlightPage = 1; renderLiveFlightList(); });
document.querySelector("#liveAirlineFilter").addEventListener("change", (event) => { liveFlightAirline = event.target.value; liveFlightPage = 1; renderLiveFlightList(); });
document.querySelector("#liveDurationFilter").addEventListener("change", (event) => { liveFlightDuration = event.target.value; liveFlightPage = 1; renderLiveFlightList(); document.querySelectorAll("#allCityFlightResults").forEach((container) => renderAllAutomationResults({ results: liveFlightResults }, container)); refreshSelectedCityLiveFare(); });
document.querySelector("#dealDurationFilter").addEventListener("change", (event) => { activeDealDuration = event.target.value; renderSourceFilters(); renderDeals(getVisibleDeals()); if (selectedCity) showCityDeals(selectedCity); });
renderCityPicker();
renderSourceFilters();
setupMap();
loadDeals();
resumeAllCityFlightSearch();
