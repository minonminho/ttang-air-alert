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
let japanMap = null;
let japanBounds = [];
let selectedCity = null;
const markerByCode = new Map();
const LIVE_FLIGHTS_PER_PAGE = 20;
let liveFlightResults = [];
let liveFlightPage = 1;
let liveFlightCity = "all";
let liveFlightAirline = "all";
let renderedLiveFlightResultCount = -1;

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
    <section class="automation-duration"><div class="automation-duration-title"><strong>${tripDays}일 일정</strong><span>최저가 ${results.length}개</span></div>${results.map((result) => `<a class="automation-result" href="${escapeHtml(result.url)}" target="_blank" rel="noopener"><strong>${formatPrice(result.price)}</strong><span>${formatDealDate(result.departureDate)} ~ ${formatDealDate(result.returnDate)}</span><small>네이버 검색 결과 ↗</small></a>`).join("")}</section>`).join("");
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
  status.textContent = "네이버 항공권에서 일정별 최저가를 확인하고 있어요.";
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

function renderLiveFlightCard(group) {
  return `<article class="live-flight-card">
    <div class="live-flight-main">
      <div class="live-flight-meta"><span class="live-flight-city">${escapeHtml(group.destination)} · ${escapeHtml(group.destinationCode)} · ${escapeHtml(group.airline)}</span><strong>${formatPrice(group.price)}</strong></div>
      <p class="live-flight-operation">${escapeHtml(group.label)}</p>
      <div class="live-flight-schedules">${group.schedules.map((schedule) => `<a class="live-flight-schedule" href="${escapeHtml(schedule.url)}" target="_blank" rel="noopener">${schedule.tripDays}일 · ${formatDealDate(schedule.departureDate)} ~ ${formatDealDate(schedule.returnDate)} ↗</a>`).join("")}</div>
    </div>
  </article>`;
}

function getFilteredLiveFlightGroups(groups = groupFlightResults(liveFlightResults)) {
  return groups.filter((group) => {
    const cityMatch = liveFlightCity === "all" || group.destinationCode === liveFlightCity;
    const airlineMatch = liveFlightAirline === "all" || group.airline === liveFlightAirline;
    return cityMatch && airlineMatch;
  });
}

function updateLiveFlightFilters(groups) {
  const cityFilter = document.querySelector("#liveCityFilter");
  const airlineFilter = document.querySelector("#liveAirlineFilter");
  if (!cityFilter || !airlineFilter) return;
  const citiesByCode = new Map(groups.map((group) => [group.destinationCode, group.destination]));
  const airlines = [...new Set(groups.map((group) => group.airline))].sort((left, right) => left.localeCompare(right, "ko"));
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
  if (count) count.textContent = `${groups.length}개 항공권 · ${liveFlightPage}/${totalPages}페이지`;
  list.innerHTML = visibleGroups.length ? `${visibleGroups.map(renderLiveFlightCard).join("")}${totalPages > 1 ? `<div class="live-flight-pagination"><button type="button" data-page="prev" ${liveFlightPage === 1 ? "disabled" : ""}>‹ 이전</button><span>${liveFlightPage} / ${totalPages}</span><button type="button" data-page="next" ${liveFlightPage === totalPages ? "disabled" : ""}>다음 ›</button></div>` : ""}` : '<div class="automation-empty">선택한 필터에 맞는 항공권이 없습니다.</div>';
  list.querySelector('[data-page="prev"]')?.addEventListener("click", () => { liveFlightPage -= 1; renderLiveFlightList(); });
  list.querySelector('[data-page="next"]')?.addEventListener("click", () => { liveFlightPage += 1; renderLiveFlightList(); });
}

function renderAllAutomationResults(job, container) {
  const groups = groupFlightResults(job.results || []);
  const visibleGroups = groups.slice(0, LIVE_FLIGHTS_PER_PAGE);
  container.innerHTML = visibleGroups.length ? visibleGroups.map((group) => `
    <article class="live-flight-card">
      <div class="live-flight-main">
        <div class="live-flight-meta"><span class="live-flight-city">${escapeHtml(group.destination)} · ${escapeHtml(group.destinationCode)} · ${escapeHtml(group.airline)}</span><strong>${formatPrice(group.price)}</strong></div>
        <p class="live-flight-operation">${escapeHtml(group.label)}</p>
        <div class="live-flight-schedules">${group.schedules.map((schedule) => `<a class="live-flight-schedule" href="${escapeHtml(schedule.url)}" target="_blank" rel="noopener">${schedule.tripDays}일 · ${formatDealDate(schedule.departureDate)} ~ ${formatDealDate(schedule.returnDate)} ↗</a>`).join("")}</div>
      </div>
    </article>`).join("") : '<div class="automation-empty">아직 검색 결과가 없습니다.</div>';
}

function setAllFlightStatus(message) {
  document.querySelectorAll("#allCityFlightStatus, #liveFlightsStatus").forEach((element) => {
    element.textContent = message;
  });
}

function renderAllFlightResults(job) {
  liveFlightResults = Array.isArray(job.results) ? job.results : [];
  renderedLiveFlightResultCount = liveFlightResults.length;
  renderLiveFlightList();
  document.querySelectorAll("#allCityFlightResults").forEach((container) => renderAllAutomationResults(job, container));
}

function openAllCitySearchPanel(mode = "quick") {
  selectedCity = null;
  document.querySelectorAll(".deal-card").forEach((card) => card.classList.remove("highlight"));
  document.querySelectorAll(".city-choice").forEach((button) => button.classList.remove("active"));
  markerByCode.forEach((marker) => marker.getElement()?.classList.remove("active"));
  const panel = document.querySelector("#cityDealsPanel");
  panel.innerHTML = `
    <div class="city-panel-header"><div><p class="city-panel-kicker">ALL CITIES</p><h3 class="city-panel-title">전체 도시 항공권</h3><p class="city-panel-code">네이버 · 26개 도시</p></div><button id="cityPanelClose" class="city-panel-close" type="button" aria-label="일본 전체 지도 보기">×</button></div>
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

function getVisibleDeals() {
  const deals = activeSource === "all" ? todayDeals : todayDeals.filter((deal) => getDealSourceId(deal) === activeSource);
  return activeSource === "all" ? groupDeals(deals) : deals;
}

function renderSourceFilters() {
  const container = document.querySelector("#sourceFilters");
  if (!container) return;
  const buttons = [
    { id: "all", label: "ALL", count: groupDeals(todayDeals).length },
    ...dealSources.map((source) => ({
      id: source.id,
      label: source.label,
      count: todayDeals.filter((deal) => getDealSourceId(deal) === source.id).length,
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

function showCityDeals(city) {
  selectedCity = city;
  const panel = document.querySelector("#cityDealsPanel");
  const matches = getVisibleDeals().filter((deal) => deal.arrivalCode === city.code);
  document.querySelectorAll(".deal-card").forEach((card) => card.classList.toggle("highlight", card.dataset.arrival === city.code));
  document.querySelectorAll(".city-choice").forEach((button) => button.classList.toggle("active", button.dataset.code === city.code));
  markerByCode.forEach((marker, code) => marker.getElement()?.classList.toggle("active", code === city.code));
  panel.innerHTML = `
    <div class="city-panel-header"><div><p class="city-panel-kicker">SELECTED CITY</p><h3 class="city-panel-title">${city.name}</h3><p class="city-panel-code">${city.code} · 인천 출발</p></div><button id="cityPanelClose" class="city-panel-close" type="button" aria-label="일본 전체 지도 보기">×</button></div>
    <div class="city-panel-list">${matches.length ? matches.map((deal) => `<div class="city-panel-deal"><div><div class="city-panel-route">인천 → ${deal.arrival}</div><p class="city-panel-sub">${renderDealSourceMeta(deal)} ${deal.airline} · ${formatPeriod(deal)}</p>${renderWeekdayStrip(deal)}</div><strong class="city-panel-price">${formatPrice(deal.price)}</strong><a class="city-panel-book" href="${deal.reservationUrl}" target="_blank" rel="noopener">${getPriceOptions(deal).length > 1 ? "최저가 예약" : "예약"} ↗</a></div>`).join("") : '<div class="city-panel-empty">오늘은 이 도시의 30만원 미만 특가가 아직 없어요.<br />다음 수집 때 다시 확인할게요.</div>'}</div>
    <div class="city-panel-footer"><span>특가 ${matches.length}개</span><a href="${city.osm}" target="_blank" rel="noopener">OSM에서 보기 ↗</a></div>`;
  panel.classList.add("visible");
  panel.querySelector("#cityPanelClose").addEventListener("click", resetMapView);
  const cityZoom = ["OKA", "ISG"].includes(city.code) ? 10 : 11;
  japanMap?.flyTo([city.lat, city.lon], cityZoom, { duration: 0.8, easeLinearity: 0.25 });
}

function resetMapView() {
  selectedCity = null;
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
renderCityPicker();
renderSourceFilters();
setupMap();
loadDeals();
resumeAllCityFlightSearch();
