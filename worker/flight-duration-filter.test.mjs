import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const appSource = fs.readFileSync(new URL("../dist/app.js", import.meta.url), "utf8");
const htmlSource = fs.readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");

// Test the actual browser functions, without loading the map or remote flight APIs.
function extract(startName, nextName) {
  const start = appSource.indexOf("function " + startName + "(");
  const end = appSource.indexOf("\nfunction " + nextName + "(", start);
  assert.ok(start >= 0 && end > start, "Cannot locate " + startName + " in dist/app.js");
  return appSource.slice(start, end);
}

function loadBrowserFunctions() {
  const script = [
    'let liveFlightDuration = "all";',
    'let liveFlightDeparture = "all";',
    'let liveFlightCity = "all";',
    'let liveFlightAirline = "all";',
    'let activeDealDeparture = "all";',
    'let activeDealDuration = "all";',
    'let liveFlightResults = [];',
    'let liveFlightUpdatedAt = null;',
    'function normalizeFlightOperation(value) { return String(value || ""); }',
    'function inferAirline() { return "기타"; }',
    'function getGroupAirlines(group) { return [group.airline]; }',
    'function formatDealDate(value) { return String(value); }',
    'function formatPrice(value) { return "KRW " + value; }',
    'function escapeHtml(value) { return String(value); }',
    'function formatLiveRefreshTime() { return "latest"; }',
    extract("isNonstopLiveFlight", "groupFlightResults"),
    extract("groupFlightResults", "parseFlightLeg"),
    extract("filterFlightSchedulesByDuration", "getFilteredLiveFlightGroups"),
    extract("getFilteredLiveFlightGroups", "updateLiveFlightFilters"),
    extract("parseDealDate", "formatDealDate"),
    extract("getDealTripDays", "getVisibleDeals"),
    extract("renderCityLiveFare", "renderCityAttractions"),
    '({ groupFlightResults, filterFlightSchedulesByDuration, getFilteredLiveFlightGroups, getDealTripDays, getDurationFilteredDeals, renderCityLiveFare, setFlightDuration(value) { liveFlightDuration = value; }, setLiveDeparture(value) { liveFlightDeparture = value; }, setDealDeparture(value) { activeDealDeparture = value; }, setDealDuration(value) { activeDealDuration = value; }, setFlightResults(value) { liveFlightResults = value; } })',
  ].join("\n");
  return vm.runInNewContext(script);
}

const makeFlight = (tripDays, overrides = {}) => ({
  destination: "도쿄",
  destinationCode: "NRT",
  price: 220000,
  departureCode: "ICN",
  arrivalAirportCode: "NRT",
  operationKey: "same-flight",
  departureDate: "2026-11-01",
  returnDate: "2026-11-" + String(tripDays).padStart(2, "0"),
  tripDays,
  airline: "Sample Air",
  outbound: { description: "Nonstop flight with Sample Air. Leaves Incheon at 3:15 PM." },
  inbound: { description: "Nonstop flight with Sample Air. Leaves Narita at 5:15 PM." },
  url: "https://example.com/flight/" + tripDays,
  ...overrides,
});

test("live flight filtering supports all, 3, 4, 5 and 6-day itineraries within a grouped fare", () => {
  const helper = loadBrowserFunctions();
  const grouped = helper.groupFlightResults([3, 4, 5, 6].map((days) => makeFlight(days)));
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].schedules.length, 4);
  assert.equal(helper.filterFlightSchedulesByDuration(grouped, "all")[0].schedules.length, 4);
  for (const days of [3, 4, 5, 6]) {
    const filtered = helper.filterFlightSchedulesByDuration(grouped, String(days));
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].schedules.length, 1);
    assert.equal(filtered[0].schedules[0].tripDays, days);
  }
  assert.equal(grouped[0].schedules.length, 4, "filtering must not mutate source data");
});

test("duration filter removes cards without matching schedules", () => {
  const helper = loadBrowserFunctions();
  const grouped = helper.groupFlightResults([
    makeFlight(3),
    makeFlight(6, { destination: "오사카", destinationCode: "KIX" }),
  ]);
  const filtered = helper.filterFlightSchedulesByDuration(grouped, "3");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].destinationCode, "NRT");
});

test("city fare shows the cheapest itinerary within the selected duration, not the overall cheapest", () => {
  const helper = loadBrowserFunctions();
  helper.setFlightResults([
    makeFlight(6, { price: 150000, operationKey: "six" }),
    makeFlight(3, { price: 240000, operationKey: "three" }),
  ]);
  helper.setFlightDuration("3");
  const threeDays = helper.renderCityLiveFare({ code: "NRT" });
  assert.match(threeDays, /KRW 240000/);
  assert.match(threeDays, /3일 일정/);
  assert.doesNotMatch(threeDays, /KRW 150000/);
  helper.setFlightDuration("6");
  assert.match(helper.renderCityLiveFare({ code: "NRT" }), /KRW 150000/);
  helper.setFlightDuration("4");
  assert.match(helper.renderCityLiveFare({ code: "NRT" }), /선택한 기간에 맞는/);
});

test("deal duration uses inclusive calendar days across month and year boundaries and excludes one-way fares", () => {
  const helper = loadBrowserFunctions();
  const deals = [
    { fromDate: "2026-12-30", toDate: "2027-01-02", tripType: "왕복" },
    { fromDate: "2026-11-01", toDate: "2026-11-03", tripType: "왕복" },
    { fromDate: "2026-11-01", toDate: "2026-11-05", tripType: "왕복" },
    { fromDate: "2026-11-01", toDate: "2026-11-06", tripType: "왕복" },
    { fromDate: "2026-11-01", toDate: "2026-11-06", tripType: "편도" },
  ];
  deals.forEach((deal) => { deal.nonstop = true; });
  assert.equal(helper.getDealTripDays(deals[0]), 4);
  assert.equal(helper.getDealTripDays(deals[4]), null);
  for (const days of [3, 4, 5, 6]) {
    helper.setDealDuration(String(days));
    const filtered = helper.getDurationFilteredDeals(deals);
    assert.equal(filtered.length, 1);
    assert.equal(helper.getDealTripDays(filtered[0]), days);
  }
  helper.setDealDuration("all");
  assert.equal(helper.getDurationFilteredDeals(deals).length, 5);
});

test("unverified and connecting flights are excluded from live groups and deals", () => {
  const helper = loadBrowserFunctions();
  const direct = makeFlight(3);
  const connecting = makeFlight(3, { price: 120000, outbound: { description: "1 stop flight with Sample Air." } });
  const unknown = makeFlight(3, { price: 130000, inbound: null });
  assert.equal(helper.groupFlightResults([direct, connecting, unknown]).length, 1);
  assert.equal(helper.groupFlightResults([direct, connecting, unknown])[0].price, 220000);
  const fares = [
    { nonstop: true, fromDate: "2026-11-01", toDate: "2026-11-03" },
    { nonstop: false, fromDate: "2026-11-01", toDate: "2026-11-03" },
    { fromDate: "2026-11-01", toDate: "2026-11-03" },
  ];
  assert.equal(helper.getDurationFilteredDeals(fares).length, 1);
});

test("published page exposes both duration filters and versioned assets", () => {
  assert.match(htmlSource, /id="liveDurationFilter"/);
  assert.match(htmlSource, /id="dealDurationFilter"/);
  for (const days of ["3", "4", "5", "6"]) {
    assert.equal((htmlSource.match(new RegExp('<option value="' + days + '">', 'g')) || []).length, 2);
  }
  assert.match(htmlSource, /app\.js\?v=gimpo-origin-20261031/);
  assert.match(htmlSource, /styles\.css\?v=flight-duration-20261026/);
});

test('origin selection separates ICN and GMP flights and preserves Tokyo city mapping', () => {
  const helper = loadBrowserFunctions();
  const flights = [
    makeFlight(3, { departureCode:'ICN',arrivalAirportCode:'NRT',price:240000 }),
    makeFlight(3, { departureCode:'GMP',arrivalAirportCode:'HND',price:190000 }),
  ];
  const groups = helper.groupFlightResults(flights);
  assert.equal(groups.length, 2);
  helper.setLiveDeparture('GMP');
  assert.equal(helper.getFilteredLiveFlightGroups(groups).length,1);
  assert.equal(helper.getFilteredLiveFlightGroups(groups)[0].arrivalAirportCode,'HND');
  helper.setFlightResults(flights);
  assert.match(helper.renderCityLiveFare({code:'NRT'}),/KRW 190000/);
  helper.setLiveDeparture('ICN');
  assert.match(helper.renderCityLiveFare({code:'NRT'}),/KRW 240000/);
  const offers = [{nonstop:true,departureCode:'ICN'}, {nonstop:true,departureCode:'GMP'}];
  helper.setDealDeparture('GMP');
  assert.equal(helper.getDurationFilteredDeals(offers).length,1);
  assert.equal(helper.getDurationFilteredDeals(offers)[0].departureCode,'GMP');
  assert.match(htmlSource,/id="liveDepartureFilter"/);
  assert.match(htmlSource,/id="dealDepartureFilter"/);
});
