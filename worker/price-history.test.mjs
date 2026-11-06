import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {
  kstDay, dailyMinimumObservations, mergePriceHistory, PRICE_HISTORY_SCHEMA,
} from "./price-history.mjs";

const monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
const weekdays=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const airportName={ICN:"Incheon International Airport",GMP:"Gimpo International Airport",NRT:"Narita Airport",HND:"Haneda Airport",KIX:"Kansai International Airport"};
function leg(from,to,date) {
  const d=new Date(date+"T00:00:00Z");
  const human=weekdays[d.getUTCDay()]+", "+monthNames[d.getUTCMonth()]+" "+d.getUTCDate();
  return {description:"From 200000 South Korean won round trip total. Nonstop flight with Korean Air. Leaves "+airportName[from]+" at 9:00 AM on "+human+" and arrives at "+airportName[to]+" at 11:00 AM on "+human+". Total duration 2 hr 0 min. Select flight",
    operation:from+"-"+to+"-KE-1000"};
}
function flight(overrides={}) {
  const origin=overrides.departureCode||"ICN";
  const destination=overrides.arrivalAirportCode||"NRT";
  const departureDate=overrides.departureDate||"2026-12-04";
  const returnDate=overrides.returnDate||"2026-12-06";
  return {
    departureCode:origin, arrivalAirportCode:destination,destinationCode:overrides.destinationCode||"NRT",
    departureDate,returnDate,tripDays:3,price:240000,
    outbound:leg(origin,destination,departureDate),inbound:leg(destination,origin,returnDate),
    ...overrides,
  };
}
function snapshot(results, updatedAt="2026-11-06T02:00:00.000Z") {
  return {status:"succeeded",updatedAt,results};
}
const now=new Date("2026-11-06T10:00:00Z");

test("Seoul date and three-calendar-month ending clamp to valid days",()=>{
  assert.equal(kstDay("2026-11-05T15:01:00Z"),"2026-11-06");
  const window={};
  vm.runInNewContext(fs.readFileSync(new URL("../dist/fare-insights.js",import.meta.url),"utf8"),{window,Intl,Date});
  const u=window.TTANGFareInsights.testUtils;
  assert.equal(u.threeMonthEnd("2026-11-30"),"2027-02-28");
  assert.equal(u.threeMonthEnd("2026-12-31"),"2027-03-31");
  assert.equal(u.threeMonthEnd("2026-11-06"),"2027-02-06");
});

test("only verified Japan nonstop records enter history, grouped by airport and trip length",()=>{
  const bad=flight({price:130000,inbound:{description:"Nonstop Seattle Explore card"}});
  const observations=dailyMinimumObservations(snapshot([
    flight(),flight({price:185000}),bad,
    flight({departureCode:"GMP",arrivalAirportCode:"HND",price:195000}),
    flight({tripDays:8,price:165000}),flight({price:120000,arrivalAirportCode:"SEA"}),
  ]));
  assert.equal(observations.length,2);
  assert.equal(observations.find(x=>x.departureCode==="ICN").minPrice,185000);
  assert.equal(observations.find(x=>x.departureCode==="ICN").sampleCount,2);
  assert.equal(observations.find(x=>x.departureCode==="GMP").cityCode,"NRT");
  assert.equal(observations.find(x=>x.departureCode==="GMP").arrivalAirportCode,"HND");
  assert.equal(observations[0].day,"2026-11-06");
});

test("history persists earlier real days, updates idempotently, and rejects stale/empty feeds",()=>{
  const todaySnapshot=snapshot([flight({price:180000})]);
  const first=mergePriceHistory(null,todaySnapshot,{now});
  assert.equal(first.schemaVersion,PRICE_HISTORY_SCHEMA);
  assert.equal(first.observations.length,1);
  const second=mergePriceHistory(first,todaySnapshot,{now});
  assert.equal(second.observations.length,1,"repeated same-day run must not duplicate");
  const yesterday={...first.observations[0],day:"2026-11-05",checkedAt:"2026-11-05T02:00:00.000Z",minPrice:220000};
  const prior={...first,observations:[yesterday]};
  const updated=mergePriceHistory(prior,todaySnapshot,{now});
  assert.equal(updated.observations.length,2);
  assert.equal(updated.observations[1].minPrice,180000);
  assert.throws(()=>mergePriceHistory(prior,{status:"failed",updatedAt:todaySnapshot.updatedAt,results:[]},{now}),/검증된/);
  assert.throws(()=>mergePriceHistory(prior,snapshot([],todaySnapshot.updatedAt),{now}),/직항/);
  assert.throws(()=>mergePriceHistory(prior,todaySnapshot,{now:new Date("2026-11-09T10:00:00Z")}),/최신 검색/);
  assert.throws(()=>mergePriceHistory({schemaVersion:99,observations:[]},todaySnapshot,{now}),/지원하지 않는/);
});

test("calendar uses actual departure-day minimum and obeys ICN/GMP, city and duration filters",()=>{
  const window={};
  vm.runInNewContext(fs.readFileSync(new URL("../dist/fare-insights.js",import.meta.url),"utf8"),{window,Intl,Date});
  const u=window.TTANGFareInsights.testUtils;
  const group=(origin,code,price,days=3)=>({
    departureCode:origin,destinationCode:code==="HND"?"NRT":code,
    arrivalAirportCode:code,destination:code==="KIX"?"오사카":"도쿄",price,
    schedules:[{departureDate:"2026-11-07",returnDate:days===3?"2026-11-09":"2026-11-10",tripDays:days,url:"https://www.google.com/travel/flights"}],
  });
  const groups=[group("ICN","NRT",280000),group("GMP","HND",180000),group("GMP","KIX",160000,4)];
  const all=u.fareCalendarRows(groups,{today:"2026-11-06",end:"2027-02-06"});
  assert.equal(all.get("2026-11-07").price,160000);
  assert.equal(u.fareCalendarRows(groups,{today:"2026-11-06",end:"2027-02-06",city:"NRT",origin:"GMP"}).get("2026-11-07").price,180000);
  assert.equal(u.fareCalendarRows(groups,{today:"2026-11-06",end:"2027-02-06",origin:"ICN",duration:"3"}).get("2026-11-07").price,280000);
  assert.equal(u.fareCalendarRows(groups,{today:"2026-11-08",end:"2027-02-06"}).size,0);
  assert.equal(u.fareCalendarRows(groups,{today:"2026-11-06",end:"2027-02-06",duration:"6"}).size,0);
});

test("trend uses distinct observed days, median baseline, no invented discount history",()=>{
  const window={};
  vm.runInNewContext(fs.readFileSync(new URL("../dist/fare-insights.js",import.meta.url),"utf8"),{window,Intl,Date});
  const u=window.TTANGFareInsights.testUtils;
  const history={schemaVersion:1,observations:[
    {day:"2026-11-01",cityCode:"NRT",departureCode:"ICN",tripDays:3,minPrice:230000},
    {day:"2026-11-02",cityCode:"NRT",departureCode:"ICN",tripDays:3,minPrice:210000},
    {day:"2026-11-03",cityCode:"NRT",departureCode:"ICN",tripDays:3,minPrice:200000},
    {day:"2026-11-03",cityCode:"NRT",departureCode:"GMP",tripDays:3,minPrice:190000},
    {day:"2026-11-06",cityCode:"NRT",departureCode:"ICN",tripDays:3,minPrice:180000},
    {day:"2026-11-06",cityCode:"KIX",departureCode:"ICN",tripDays:3,minPrice:130000},
    {day:"2026-10-01",cityCode:"NRT",departureCode:"ICN",tripDays:3,minPrice:100000},
  ]};
  const opts={city:"NRT",origin:"ICN",duration:"3",today:"2026-11-06",days:7};
  const rows=u.historicalSeries(history,opts);
  assert.equal(rows.length,4);
  assert.equal(rows.find(x=>x.day==="2026-11-03").price,200000);
  const scored=u.calculateDealScore(rows,170000,"2026-11-06");
  assert.equal(scored.samples,3);
  assert.equal(scored.reference,210000);
  assert.ok(scored.score>=90 && scored.score<=100);
  assert.equal(u.calculateDealScore(rows.slice(0,2),170000,"2026-11-06"),null);
  assert.equal(u.historicalSeries(history,{...opts,city:"all"}).length,0);
  assert.equal(u.historicalSeries(history,{...opts,origin:"GMP"}).length,1);
});

test("site loads both features and keeps shared departure airport",()=>{
  const html=fs.readFileSync(new URL("../dist/index.html",import.meta.url),"utf8");
  const app=fs.readFileSync(new URL("../dist/app.js",import.meta.url),"utf8");
  assert.match(html,/id="fareCalendar"/);
  assert.match(html,/id="farePriceTrend"/);
  assert.match(html,/id="insightsCityFilter"/);
  assert.match(html,/data-trend-days="7"/);
  assert.match(html,/data-trend-days="30"/);
  assert.match(html,/fare-insights\.js\?v=/);
  assert.match(html,/fare-insights\.css\?v=/);
  assert.match(app,/TTANGFareInsights\?\.setFlights/);
  assert.match(app,/TTANGFareInsights\?\.setDepartureAirport/);
  assert.match(app,/loadHistory\(getPublishedDataUrl\("price-history\.json"\)\)/);
});
