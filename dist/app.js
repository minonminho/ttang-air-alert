const initialDeals = [
  { id: "tpe", type: "international", logo: "✈", logoClass: "", airline: "티웨이항공", route: "서울 → 타이베이", code: "ICN  ·  TPE", depart: "11/07 (금)", time: "09:15", arrive: "11:10", duration: "2시간 55분", discount: "−31%", price: 118900, seats: "잔여 4석" },
  { id: "fuk", type: "international", logo: "Pe", logoClass: "peach", airline: "피치항공", route: "서울 → 오사카", code: "ICN  ·  KIX", depart: "11/08 (토)", time: "07:40", arrive: "09:20", duration: "1시간 40분", discount: "−42%", price: 139000, seats: "잔여 6석" },
  { id: "bkk", type: "international", logo: "B", logoClass: "blue", airline: "에어부산", route: "부산 → 방콕", code: "PUS  ·  BKK", depart: "11/15 (토)", time: "19:30", arrive: "23:40", duration: "5시간 10분", discount: "−28%", price: 219000, seats: "잔여 2석" },
  { id: "jeju", type: "domestic", logo: "J", logoClass: "green", airline: "제주항공", route: "서울 → 제주", code: "GMP  ·  CJU", depart: "11/09 (일)", time: "06:50", arrive: "07:55", duration: "1시간 05분", discount: "−36%", price: 79000, seats: "잔여 8석" },
];
let liveDeals = initialDeals;

const dealList = document.querySelector("#dealList");
const toast = document.querySelector("#toast");
const toastMessage = document.querySelector("#toastMessage");
let currentFilter = "all";
let showingMore = false;
let toastTimer;

function formatPrice(price) {
  return `₩${price.toLocaleString("ko-KR")}`;
}

function renderDeals() {
  const filtered = liveDeals.filter((deal) => currentFilter === "all" || deal.type === currentFilter);
  const items = showingMore ? [...filtered, ...filtered.map((deal, index) => ({ ...deal, id: `${deal.id}-copy`, route: index % 2 ? "서울 → 하노이" : "부산 → 후쿠오카", code: index % 2 ? "ICN  ·  HAN" : "PUS  ·  FUK", price: deal.price + 22000, discount: "−24%" }))] : filtered;
  dealList.innerHTML = items.map((deal) => `
    <article class="deal-card" data-deal-id="${deal.id}">
      <div class="deal-airline"><span class="airline-logo ${deal.logoClass}">${deal.logo}</span><div class="deal-route"><strong>${deal.route}</strong><small>${deal.airline} · ${deal.code}</small></div></div>
      <div class="deal-times"><b>${deal.time}</b><span>→</span>${deal.arrive}<small> · ${deal.duration}</small></div>
      <div class="deal-meta"><span class="discount">${deal.discount}</span><strong class="deal-price">${formatPrice(deal.price)}<small>부터</small></strong>${deal.reservationUrl ? `<a class="deal-book" href="${deal.reservationUrl}" target="_blank" rel="noopener">예약 ↗</a>` : ""}</div>
      <button class="heart-button" aria-label="${deal.route} 찜하기" data-heart="${deal.id}">♡</button>
    </article>`).join("");
  document.querySelector("#loadMore").innerHTML = showingMore ? `특가 접기 <span>↥</span>` : `더 많은 특가 보기 <span>↗</span>`;
  document.querySelectorAll("[data-heart]").forEach((button) => {
    const saved = getSavedRoutes().includes(button.dataset.heart);
    button.classList.toggle("saved", saved);
    button.textContent = saved ? "♥" : "♡";
    button.addEventListener("click", () => toggleSaved(button.dataset.heart, button));
  });
}

function getSavedRoutes() {
  try { return JSON.parse(localStorage.getItem("ttang-saved-routes") || "[]"); } catch { return []; }
}

function toggleSaved(id, button) {
  const saved = getSavedRoutes();
  const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id];
  localStorage.setItem("ttang-saved-routes", JSON.stringify(next));
  button.classList.toggle("saved", next.includes(id));
  button.textContent = next.includes(id) ? "♥" : "♡";
  showToast(next.includes(id) ? "찜한 노선에 저장했어요." : "찜한 노선에서 삭제했어요.");
}

function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

// Replace this adapter with a live fare provider when the API credentials are ready.
async function searchDeals({ origin, destination, dates, passengers }) {
  await new Promise((resolve) => setTimeout(resolve, 650));
  const destinationMap = { NRT: "fuk", TPE: "tpe", BKK: "bkk", DAD: "bkk" };
  return liveDeals.filter((deal) => destination === "ANY" || deal.code.includes(destination) || deal.arrivalCode === destination || deal.id === destinationMap[destination]);
}

document.querySelectorAll(".filter-button").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".filter-button").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  currentFilter = button.dataset.filter;
  showingMore = false;
  renderDeals();
}));

document.querySelector("#loadMore").addEventListener("click", () => { showingMore = !showingMore; renderDeals(); });
document.querySelector("#sortDeals").addEventListener("click", () => {
  liveDeals.sort((a, b) => a.price - b.price);
  renderDeals();
  showToast("최저가순으로 정렬했어요.");
});

document.querySelector("#searchButton").addEventListener("click", async () => {
  const button = document.querySelector("#searchButton");
  const destination = document.querySelector("#destination").value;
  button.disabled = true;
  button.querySelector("span:last-child").textContent = "찾는 중…";
  const results = await searchDeals({ origin: document.querySelector("#origin").value, destination, dates: document.querySelector("#travelDates").value, passengers: document.querySelector("#passengers").value });
  if (destination !== "ANY") {
    dealList.innerHTML = results.length ? results.map((deal) => `<article class="deal-card"><div class="deal-airline"><span class="airline-logo ${deal.logoClass}">${deal.logo}</span><div class="deal-route"><strong>${deal.route}</strong><small>${deal.airline} · ${deal.code}</small></div></div><div class="deal-times"><b>${deal.time}</b><span>→</span>${deal.arrive}<small> · ${deal.duration}</small></div><div class="deal-meta"><span class="discount">${deal.discount}</span><strong class="deal-price">${formatPrice(deal.price)}<small>부터</small></strong></div><button class="heart-button" aria-label="찜하기">♡</button></article>`).join("") : `<div class="empty-state">선택한 조건의 특가를 찾는 중이에요. 다른 날짜도 확인해보세요.</div>`;
  } else { currentFilter = "all"; document.querySelectorAll(".filter-button").forEach((item) => item.classList.toggle("active", item.dataset.filter === "all")); renderDeals(); }
  button.disabled = false;
  button.querySelector("span:last-child").textContent = "특가 찾기";
  showToast(`${results.length || 0}개의 특가를 찾았어요.`);
  document.querySelector("#deals").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector("#swapRoute").addEventListener("click", () => {
  const origin = document.querySelector("#origin");
  const destination = document.querySelector("#destination");
  if (destination.value !== "ANY" && ["ICN", "PUS", "CJU"].includes(destination.value)) {
    const oldOrigin = origin.value;
    origin.value = destination.value;
    destination.value = oldOrigin === "ICN" ? "NRT" : "ANY";
    showToast("출발지와 도착지를 바꿨어요.");
  } else { showToast("‘어디든’ 검색은 출발지만 바꿔보세요."); }
});

document.querySelectorAll(".time-chip:not(.add-time)").forEach((chip) => chip.addEventListener("click", () => {
  chip.classList.toggle("selected");
  const selected = [...document.querySelectorAll(".time-chip.selected")].map((item) => item.dataset.time);
  document.querySelector("#alertStatusText").textContent = selected.length ? `매일 ${selected.length}회 알림 켜짐` : "알림 일시 정지됨";
}));
document.querySelector(".add-time").addEventListener("click", () => showToast("알림 시간은 최대 3개까지 설정할 수 있어요."));
document.querySelector("#alertToggle").addEventListener("change", (event) => {
  document.querySelector("#alertStatusText").textContent = event.target.checked ? "휴대폰 알림 켜짐" : "알림 일시 정지됨";
  showToast(event.target.checked ? "알림을 다시 켰어요." : "알림을 잠시 멈췄어요.");
});
document.querySelector("#saveAlert").addEventListener("click", () => {
  const settings = { enabled: document.querySelector("#alertToggle").checked, times: [...document.querySelectorAll(".time-chip.selected")].map((item) => item.dataset.time) };
  localStorage.setItem("ttang-alert-settings", JSON.stringify(settings));
  showToast("알림 설정을 저장했어요.");
});
document.querySelector("#testAlert").addEventListener("click", async () => {
  if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission();
  if ("Notification" in window && Notification.permission === "granted") new Notification("땡항공 특가 알림", { body: "서울 → 타이베이 왕복 ₩118,900 특가를 찾았어요." });
  showToast("테스트 알림을 보냈어요. 휴대폰에서는 알림 권한을 먼저 허용해 주세요.");
});
document.querySelector("#manageRoutes").addEventListener("click", () => showToast("찜한 노선 관리 화면을 준비 중이에요."));
document.querySelector(".mobile-menu").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("mobile-open"));
document.querySelectorAll(".map-city").forEach((city) => {
  const selectCity = () => {
    const destination = document.querySelector("#destination");
    const option = [...destination.options].find((item) => item.value === city.dataset.city);
    if (!option) return;
    destination.value = option.value;
    document.querySelectorAll(".map-city").forEach((item) => item.classList.remove("selected"));
    city.classList.add("selected");
    showToast(`${city.dataset.label} 특가를 선택했어요.`);
  };
  city.addEventListener("click", selectCity);
  city.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectCity(); } });
});

const japanMapCities = [
  ["도쿄", "NRT", 35.6762, 139.6503, true], ["오사카", "KIX", 34.6937, 135.5023, true], ["나고야", "NGO", 35.1815, 136.9066, true], ["후쿠오카", "FUK", 33.5904, 130.4017, true],
  ["삿포로", "CTS", 43.0618, 141.3545, true], ["하코다테", "HKD", 41.7687, 140.7291, false], ["오비히로", "OBO", 42.9236, 143.1961, false], ["아오모리", "AOJ", 40.8222, 140.7474, false],
  ["센다이", "SDJ", 38.2682, 140.8694, false], ["니가타", "KIJ", 37.9161, 139.0364, false], ["이바라키", "IBR", 36.3659, 140.4714, false], ["시즈오카", "FSZ", 34.9756, 138.3828, false],
  ["고마쓰", "KMQ", 36.4087, 136.4450, false], ["오카야마", "OKJ", 34.6551, 133.9195, false], ["요나고", "YGJ", 35.4281, 133.3306, false], ["히로시마", "HIJ", 34.3853, 132.4553, false],
  ["다카마쓰", "TAK", 34.3428, 134.0466, false], ["마쓰야마", "MYJ", 33.8392, 132.7657, false], ["사가", "HSG", 33.2494, 130.2988, true], ["나가사키", "NGS", 32.7503, 129.8777, false],
  ["오이타", "OIT", 33.2382, 131.6126, false], ["구마모토", "KMJ", 32.8031, 130.7079, false], ["미야자키", "KMI", 31.9077, 131.4202, false], ["가고시마", "KOJ", 31.5966, 130.5571, true],
  ["오키나와(나하)", "OKA", 26.2124, 127.6809, true], ["이시가키", "ISG", 24.4064, 124.1756, true],
];

function chooseMapDestination(code, label) {
  const destination = document.querySelector("#destination");
  const option = [...destination.options].find((item) => item.value === code);
  if (!option) return;
  destination.value = code;
  document.querySelectorAll(".map-city").forEach((item) => item.classList.toggle("selected", item.dataset.city === code));
  showToast(`${label} 특가를 선택했어요.`);
}

function initLeafletJapanMap() {
  const mapElement = document.querySelector("#japanMap");
  if (!mapElement) return;
  if (!window.L) {
    mapElement.closest(".map-stage")?.classList.add("map-fallback");
    return;
  }
  const japanMap = window.L.map(mapElement, { zoomControl: true, scrollWheelZoom: false, attributionControl: true });
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
  }).addTo(japanMap);
  const bounds = [];
  japanMapCities.forEach(([label, code, lat, lng, major]) => {
    bounds.push([lat, lng]);
    const icon = window.L.divIcon({
      className: `city-pin-wrap${major ? " major" : ""}`,
      html: `<span class="city-pin"></span><span class="city-pin-label">${label}</span>`,
      iconSize: [12, 12],
      iconAnchor: [0, 0],
      popupAnchor: [0, -6],
    });
    const marker = window.L.marker([lat, lng], { icon, keyboard: true }).addTo(japanMap);
    marker.bindPopup(`<strong>${label}</strong><br><span>${code} · 인천 출발 특가</span><br><small>검색 버튼으로 항공권을 확인하세요.</small>`);
    marker.on("click", () => chooseMapDestination(code, label));
  });
  japanMap.fitBounds(bounds, { padding: [18, 18] });
  window.setTimeout(() => japanMap.invalidateSize(), 200);
}

initLeafletJapanMap();

async function loadLiveDeals() {
  try {
    const response = await fetch(`./deals.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`deals.json HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.deals) || !payload.deals.length) return;
    liveDeals = payload.deals.map((deal) => ({
      ...deal,
      id: deal.masterId,
      type: "international",
      logo: deal.airlineCode,
      logoClass: deal.airlineCode === "TW" ? "peach" : deal.airlineCode === "RS" ? "blue" : deal.airlineCode === "7C" ? "green" : "",
      route: `인천 → ${deal.arrival}`,
      code: `ICN  ·  ${deal.arrivalCode}`,
      depart: `${deal.fromDate} — ${deal.toDate}`,
      time: deal.nonstop ? "직항" : "경유",
      arrive: deal.tripType,
      duration: `${deal.minimumPassengers}명부터`,
      discount: "땡처리",
    }));
    renderDeals();
    const updateLabel = document.querySelector(".eyebrow .mono");
    if (updateLabel && payload.fetchedAt) updateLabel.textContent = `· ${new Date(payload.fetchedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} 수집`;
  } catch (error) {
    console.warn("실시간 특가 스냅샷을 불러오지 못해 기본 목록을 표시합니다.", error);
  }
}

const savedSettings = (() => { try { return JSON.parse(localStorage.getItem("ttang-alert-settings") || "null"); } catch { return null; } })();
if (savedSettings) {
  document.querySelector("#alertToggle").checked = savedSettings.enabled;
  document.querySelectorAll(".time-chip:not(.add-time)").forEach((chip) => chip.classList.toggle("selected", savedSettings.times.includes(chip.dataset.time)));
}
renderDeals();
loadLiveDeals();
