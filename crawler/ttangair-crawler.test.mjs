import test from "node:test";
import assert from "node:assert/strict";
import {
  koreaToday, threeMonthEnd, datesInRange, getSearchForm, readXmlOffers, parseMobileOffers,
} from "./ttangair-crawler.mjs";

const baseDate = new Date("2026-10-31T00:00:00Z");
const endDate = threeMonthEnd(baseDate);
const sample = (values = {}) => ({
  depCityCode:"ICN",depCityDesc:"인천",arrCityCode:"FUK",arrCityDesc:"후쿠오카",
  natOpClass:"A7",tripType:"RT",viaCnt:0,totalPrice:189000,
  departureDate:"20261107",arrivalDate:"20261110",tktCar:"LJ",tktCarDesc:"진에어",
  masterId:"flight123",minimumCnt:1,tripDay:"3박4일",gubun:"VV", ...values,
});

test("exact Seoul day and calendar month clamping are deterministic",()=>{
  assert.equal(koreaToday(new Date("2026-10-30T15:30:00Z")).toISOString().slice(0,10),"2026-10-31");
  assert.equal(endDate.toISOString().slice(0,10),"2027-01-31");
  const dates = datesInRange(baseDate,endDate);
  assert.equal(dates.length,93);
  assert.equal(dates[0],"20261031");
  assert.equal(dates.at(-1),"20270131");
  assert.deepEqual(datesInRange(baseDate,endDate,2),["20261031","20261101"]);
  assert.equal(threeMonthEnd(new Date("2026-11-30T00:00:00Z")).toISOString().slice(0,10),"2027-02-28");
});

test("mobile searchForm extracts hidden parameters",()=>{
  const html = '<form id="searchForm"><input type="hidden" name="depdate0" value="20261107"><input name="trip" value="OW"><input name="gubun" value="T"></form>';
  const form = getSearchForm(html);
  assert.equal(form.get("depdate0"),"20261107");
  assert.equal(form.get("trip"),"RT");
  assert.equal(form.get("gubun"),"T");
});

test("XML CDATA JSON list is read; invalid payload errors are reported",()=>{
  const data = [sample()];
  const xml = '<RESPONSE><RESULT><RECORD><CONTENS><![CDATA['+JSON.stringify({code:"OK",desc:"SUCCESS",response:data})+']]></CONTENS></RECORD></RESULT></RESPONSE>';
  assert.deepEqual(readXmlOffers(xml),data);
  assert.throws(()=>readXmlOffers("<html>login</html>"),/상품 목록/);
  assert.throws(()=>readXmlOffers('<CONTENS><![CDATA[{"code":"ERROR"}]]></CONTENS>'),/상품 응답 오류/);
});

test("calendar retains verified nonstop Japan round trips from both Seoul airports",()=>{
  const data = [
    sample(), sample({depCityCode:"GMP",depCityDesc:"김포",arrCityCode:"HND",arrCityDesc:"하네다",masterId:"haneda"}),
    sample({arrCityCode:"DAD",natOpClass:"A2",masterId:"vietnam"}),
    sample({viaCnt:1,masterId:"connection"}),
    sample({tripType:"OW",masterId:"oneway"}),
    sample({totalPrice:300000,masterId:"tooexpensive"}),
    sample({departureDate:"20270201",arrivalDate:"20270204",masterId:"out-of-range"}),
  ];
  const result = parseMobileOffers(data,{kind:"calendar",startDate:baseDate,endDate});
  assert.equal(result.length,2);
  assert.deepEqual(result.map(x=>x.departureCode).sort(),["GMP","ICN"]);
  assert.ok(result.every(x=>x.nonstop && x.dateType==="itinerary"));
  assert.match(result[0].reservationUrl,/depdate0=20261107/);
});

test("today-open dates are a departure availability window, not an itinerary",()=>{
  const data = [
    sample({natOpClass:"",departureDate:"",arrivalDate:"",fromSupplyDate:"20261105",toSupplyDate:"20261130"}),
    sample({natOpClass:"",departureDate:"",arrivalDate:"",fromSupplyDate:"20270301",toSupplyDate:"20270331",masterId:"later"}),
    sample({natOpClass:"",arrCityCode:"CXR",fromSupplyDate:"20261105",toSupplyDate:"20261130",masterId:"notJapan"}),
  ];
  const result = parseMobileOffers(data,{kind:"today",startDate:baseDate,endDate});
  assert.equal(result.length,1);
  assert.equal(result[0].dateType,"departure-window");
  assert.equal(result[0].tripType,"왕복 · 출발 가능 기간");
  assert.equal(result[0].fromDate,"2026.11.05");
  assert.match(result[0].reservationUrl,/today\.do/);
});
