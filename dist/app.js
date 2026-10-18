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
  { name: "오키나와(나하)", code: "OKA", lat: 26.2122345, lon: 127.6791452, major: true, osm: "https://www.openstreetmap.org/search?query=Naha%2C%20Okinawa%2C%20Japan" },
  { name: "이시가키", code: "ISG", lat: 24.3444441, lon: 124.1851857, major: true, osm: "https://www.openstreetmap.org/search?query=Ishigaki%2C%20Okinawa%2C%20Japan" },
];

// 새 크롤링 사이트를 추가할 때 이 목록에 소스만 하나씩 등록하면 필터에 자동으로 표시됩니다.
const dealSources = [
  { id: "ttang", label: "땡처리닷컴", url: "https://www.ttang.com/ttangair/search/ttang/list.do?arr0=A7ALL" },
  { id: "modetour", label: "모두투어", url: "https://www.modetour.com/flights/discount-flight" },
  { id: "hanatour", label: "하나투어", url: "https://www.hanatour.com/trp/air/CHPC0AIR0233M200" },
  { id: "ybtour", label: "노랑풍선", url: "https://fly.ybtour.co.kr/booking/findDiscountAir.lts?efcTpCode=INV&efcCode=INV" },
  { id: "naver", label: "네이버 항공권", url: "https://flight.naver.com/flights/everywhere/monthly/SEL" },
];

let toastTimer;
let todayDeals = [];
let activeSource = "all";
let japanMap = null;
let japanBounds = [];
let selectedCity = null;
const markerByCode = new Map();

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
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

function getVisibleDeals() {
  return activeSource === "all" ? todayDeals : todayDeals.filter((deal) => getDealSourceId(deal) === activeSource);
}

function renderSourceFilters() {
  const container = document.querySelector("#sourceFilters");
  if (!container) return;
  const buttons = [
    { id: "all", label: "ALL", count: todayDeals.length },
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
      <div class="deal-main"><div class="deal-route"><strong>인천 → ${deal.arrival}</strong><span class="deal-code">ICN · ${deal.arrivalCode}</span></div><p class="deal-sub"><span class="deal-source-tag">${getDealSourceLabel(deal)}</span> ${deal.airline} · ${deal.tripType} · ${formatPeriod(deal)}${deal.minimumPassengers > 1 ? ` · ${deal.minimumPassengers}명부터` : ""}</p>${renderWeekdayStrip(deal)}</div>
      <strong class="deal-price">${formatPrice(deal.price)}<small>부터</small></strong>
      <a class="deal-book" href="${deal.reservationUrl}" target="_blank" rel="noopener">예약 ↗</a>
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
    <div class="city-panel-list">${matches.length ? matches.map((deal) => `<div class="city-panel-deal"><div><div class="city-panel-route">인천 → ${deal.arrival}</div><p class="city-panel-sub">${deal.airline} · ${formatPeriod(deal)}</p>${renderWeekdayStrip(deal)}</div><strong class="city-panel-price">${formatPrice(deal.price)}</strong><a class="city-panel-book" href="${deal.reservationUrl}" target="_blank" rel="noopener">예약 ↗</a></div>`).join("") : '<div class="city-panel-empty">오늘은 이 도시의 30만원 미만 특가가 아직 없어요.<br />다음 수집 때 다시 확인할게요.</div>'}</div>
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
    const response = await fetch(`./deals.json?ts=${Date.now()}`, { cache: "no-store" });
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

document.querySelector("#resetMap").addEventListener("click", resetMapView);
renderCityPicker();
renderSourceFilters();
setupMap();
loadDeals();
