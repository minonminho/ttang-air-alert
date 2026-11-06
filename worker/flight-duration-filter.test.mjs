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
    '({ groupFlightResults, filterFlightSchedulesByDuration, getFilteredLiveFlightGroups, getDealTripDays, getDurationFilteredDeals, getDealCityCode, renderCityLiveFare, setFlightDuration(value) { liveFlightDuration = value; }, setLiveDeparture(value) { liveFlightDeparture = value; }, setDealDeparture(value) { activeDealDeparture = value; }, setDealDuration(value) { activeDealDuration = value; }, setFlightResults(value) { liveFlightResults = value; } })',
  ].join("\n");
  return vm.runInNewContext(script);
}

const makeFlight = (tripDays, overrides = {}) => {
  const departureCode = overrides.departureCode || "ICN";
  const destinationCode = overrides.destinationCode || "NRT";
  const arrivalAirportCode = overrides.arrivalAirportCode || (destinationCode === "KIX" ? "KIX" : destinationCode === "KIJ" ? "KIJ" : "NRT");
  const airportName = { ICN:"Incheon International Airport", GMP:"Gimpo International Airport", NRT:"Narita International Airport", HND:"Haneda Airport", KIX:"Kansai International Airport", KIJ:"Niigata Airport" };
  const leg = (from,to,date) => {
    const d = new Date(date + "T00:00:00Z");
    const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getUTCDay()];
    const month = ["January","February","March","April","May","June","July","August","September","October","November","December"][d.getUTCMonth()];
    const dateText = weekday + ", " + month + " " + d.getUTCDate();
    return {description:"From 220000 South Korean won round trip total. Nonstop flight with Sample Air. Leaves " + airportName[from] + " at 3:15 PM on " + dateText + " and arrives at " + airportName[to] + " at 5:15 PM on " + dateText + ". Total duration 2 hr 0 min. Select flight", operation:from+"-"+to+"-SA-1234"};
  };
  const departureDate = "2026-11-01";
  const returnDate = "2026-11-" + String(tripDays).padStart(2,"0");
  return {
    destination: destinationCode === "KIJ" ? "니가타" : destinationCode === "KIX" ? "오사카" : "도쿄",
    destinationCode,
    price: 220000,
    departureCode,
    arrivalAirportCode,
    operationKey: "same-flight",
    departureDate,
    returnDate,
    tripDays,
    airline: "Sample Air",
    outbound: leg(departureCode,arrivalAirportCode,departureDate),
    inbound: leg(arrivalAirportCode,departureCode,returnDate),
    url: "https://example.com/flight/" + tripDays,
    ...overrides,
  };
};

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

test("reject irrelevant US recommendation cards, invalid Japanese legs and dates in browser", () => {
  const helper = loadBrowserFunctions();
  const valid = makeFlight(4, { destinationCode:"KIJ",arrivalAirportCode:"KIJ",price:261618 });
  const badRecommendation = makeFlight(4, {
    destinationCode:"KIJ",arrivalAirportCode:"KIJ",price:261618,
    outbound:{description:"From 261618 South Korean won round trip total. Nonstop flight with 기타. Wenatchee Portland Jan 14 — Jan 20 Nonstop from ₩261,618"},
    inbound:{description:"From 261618 South Korean won round trip total. Nonstop flight with 기타. Wenatchee Seattle Jan 2 — Jan 9 Nonstop from ₩261,618"},
  });
  const wrongAirport = makeFlight(4, {
    destinationCode:"KIJ",arrivalAirportCode:"KIJ",price:275000,
    inbound:{description:valid.inbound.description.replace("Niigata Airport","Seattle Airport")},
  });
  const wrongDate = makeFlight(4, { destinationCode:"KIJ",arrivalAirportCode:"KIJ",price:290000,returnDate:"2026-11-05" });
  assert.equal(helper.groupFlightResults([badRecommendation]).length,0);
  assert.equal(helper.groupFlightResults([valid, badRecommendation, wrongAirport, wrongDate]).length,1);
  assert.equal(helper.groupFlightResults([valid, badRecommendation, wrongAirport, wrongDate])[0].price,261618);
  assert.ok(!appSource.includes("escapeHtml(leg?.description"),"Never expose raw Google Explore labels in UI");
});

test("published page exposes both duration filters and versioned assets", () => {
  assert.match(htmlSource, /id="liveDurationFilter"/);
  assert.match(htmlSource, /id="dealDurationFilter"/);
  for (const days of ["3", "4", "5", "6"]) {
    assert.equal((htmlSource.match(new RegExp('<option value="' + days + '">', 'g')) || []).length, 3);
  }
  assert.match(htmlSource, /app\.js\?v=airport-filter-20261106/);
  assert.match(htmlSource, /id="dealCollectionStatus"/);
  assert.match(htmlSource, /styles\.css\?v=airport-filter-20261106/);
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


function createAirportFilterHarness() {
  const start = appSource.indexOf("function normalizeDepartureAirport(");
  const end = appSource.indexOf('\ndocument.querySelector("#resetMap")',start);
  assert.ok(start >= 0 && end > start, "Shared departure airport controller must exist");
  const controls = {
    "#liveDepartureFilter": {value:"all"},
    "#dealDepartureFilter": {value:"all"},
    "#departureAirportNote": {textContent:""},
  };
  const buttons = ["all","ICN","GMP"].map((airport) => ({
    dataset:{departureAirport:airport},
    attributes:{},
    active:false,
    setAttribute(key,value) {this.attributes[key] = value;},
    classList: {toggle(name,active) { if (name === "active") this.owner.active = active; }, owner:null},
  }));
  for (const button of buttons) button.classList.owner = button;
  const saves = [];
  const calls = {live:0,deals:0,sources:0,map:0,insights:0};
  const sandbox = {
    window:{TTANGFareInsights:{setDepartureAirport:()=>calls.insights++}},
    document:{
      querySelector: (selector) => controls[selector] || null,
      querySelectorAll: (selector) => selector === "[data-departure-airport]" ? buttons : [],
    },
    localStorage:{setItem:(key,value)=>saves.push([key,value])},
    renderLiveFlightList:()=>calls.live++,
    renderAllAutomationResults:()=>{},
    renderSourceFilters:()=>calls.sources++,
    renderDeals:()=>calls.deals++,
    getVisibleDeals:()=>[],
    showCityDeals:()=>calls.map++,
  };
  const controller = appSource.slice(start,end);
  const api = vm.runInNewContext([
    'let liveFlightDeparture = "all"; let activeDealDeparture = "all";',
    'let liveFlightPage = 5; let liveFlightResults = [];',
    'let selectedCity = {code:"NRT"};',
    controller,
    '({ setDepartureAirportFilter, normalizeDepartureAirport, getState: () => ({ liveFlightDeparture, activeDealDeparture, liveFlightPage }) })',
  ].join("\n"),sandbox);
  return {...api,buttons,controls,saves,calls};
}

test("prominent airport buttons select ICN/GMP/all and synchronize both lists and map", () => {
  const ctrl = createAirportFilterHarness();
  assert.match(htmlSource,/class="departure-airport-bar"/);
  for (const airport of ["all","ICN","GMP"]) {
    assert.match(htmlSource,new RegExp('data-departure-airport="' + airport + '"'));
  }
  assert.match(htmlSource,/id="departureAirportNote"/);
  ctrl.setDepartureAirportFilter("GMP");
  assert.equal(ctrl.getState().liveFlightDeparture,"GMP");
  assert.equal(ctrl.getState().activeDealDeparture,"GMP");
  assert.equal(ctrl.getState().liveFlightPage,1);
  assert.equal(ctrl.controls["#liveDepartureFilter"].value,"GMP");
  assert.equal(ctrl.controls["#dealDepartureFilter"].value,"GMP");
  assert.deepEqual(ctrl.buttons.map((button)=>button.active),[false,false,true]);
  assert.match(ctrl.controls["#departureAirportNote"].textContent,/김포/);
  assert.deepEqual(ctrl.saves[0],["ttangDepartureAirport","GMP"]);
  assert.equal(ctrl.calls.live,1);
  assert.equal(ctrl.calls.sources,1);
  assert.equal(ctrl.calls.deals,1);
  assert.equal(ctrl.calls.map,1);
  assert.equal(ctrl.calls.insights,1);

  ctrl.setDepartureAirportFilter("ICN");
  assert.deepEqual(ctrl.buttons.map((button)=>button.attributes["aria-pressed"]),["false","true","false"]);
  assert.equal(ctrl.controls["#dealDepartureFilter"].value,"ICN");
  ctrl.setDepartureAirportFilter("anything",{persist:false});
  assert.equal(ctrl.getState().liveFlightDeparture,"all");
  assert.equal(ctrl.getState().activeDealDeparture,"all");
  assert.equal(ctrl.saves.length,2,"initial restore must not rewrite saved choice");
  assert.match(appSource,/localStorage\.getItem\("ttangDepartureAirport"\)/);
  assert.match(appSource,/setDepartureAirportFilter\(event\.target\.value\)/);
});

test("Haneda airport offers appear under Tokyo city instead of vanishing from map", () => {
  const helper = loadBrowserFunctions();
  assert.equal(helper.getDealCityCode({arrivalCode:"HND"}),"NRT");
  assert.equal(helper.getDealCityCode({arrivalCode:"KIX"}),"KIX");
  assert.match(appSource,/getVisibleDeals\(\)\.filter\(\(deal\) => getDealCityCode\(deal\) === city\.code\)/);
});
