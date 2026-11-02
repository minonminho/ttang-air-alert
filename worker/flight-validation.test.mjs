import test from "node:test";
import assert from "node:assert/strict";
import { isVerifiedFlightLeg, isVerifiedFlightResult } from "./flight-validation.mjs";
import { mergeSearchResults } from "./merge-search-results.mjs";

const leg = (origin,destination,weekday,month,day,identity) => ({
  description: 'From 261618 South Korean won round trip total. Nonstop flight with Korean Air. Leaves '+origin+
    ' at 8:20 AM on '+weekday+', '+month+' '+day+' and arrives at '+destination+
    ' at 10:25 AM on '+weekday+', '+month+' '+day+'. Total duration 2 hr 5 min. Select flight',
  operation: identity,
});
const valid = {
  routeId:"KIJ",destinationCode:"KIJ",departureCode:"ICN",arrivalAirportCode:"KIJ",
  departureDate:"2026-11-06",returnDate:"2026-11-09",tripDays:4,
  price:261618,operationKey:"ICN-KIJ-KE-2197|return:KIJ-ICN-KE-2198",
  outbound:leg("Incheon International Airport","Niigata Airport","Friday","November",6,"ICN-KIJ-KE-2197|08:20"),
  inbound:leg("Niigata Airport","Incheon International Airport","Monday","November",9,"KIJ-ICN-KE-2198|11:35"),
};

test("validate exact Korea-Japan airports and real travel dates",()=>{
  assert.equal(isVerifiedFlightResult(valid),true);
  assert.equal(isVerifiedFlightResult({
    ...valid,routeId:"GMP-KIX",departureCode:"GMP",arrivalAirportCode:"KIX",destinationCode:"KIX",
    outbound:leg("Gimpo International Airport","Kansai International Airport","Friday","November",6,"GMP-KIX-MM-738|13:10"),
    inbound:leg("Kansai International Airport","Gimpo International Airport","Monday","November",9,"KIX-GMP-MM-739|10:20"),
  }),true);
  assert.equal(isVerifiedFlightLeg(valid.outbound,"ICN","KIJ","2026-11-06"),true);
  assert.equal(isVerifiedFlightLeg(valid.outbound,"ICN","KIX","2026-11-06"),false);
  assert.equal(isVerifiedFlightLeg(valid.outbound,"ICN","KIJ","2026-11-07"),false);
});

test("reject the real Wenatchee/Portland Google Explore recommendation leaked into Niigata",()=>{
  const corrupt = {
    ...valid,
    outbound:{ description:"From 261618 South Korean won round trip total. Nonstop flight with 기타. Wenatchee Portland Jan 14 — Jan 20 Nonstop from ₩261,618", operation:"기타|Wenatchee Portland Jan 14 — Jan 20 Nonstop from" },
    inbound:{ description:"From 328289 South Korean won round trip total. Nonstop flight with 기타. Wenatchee Seattle Jan 2 — Jan 9 Nonstop from ₩328,289", operation:"기타|Wenatchee Seattle Jan 2 — Jan 9 Nonstop from" },
  };
  assert.equal(isVerifiedFlightResult(corrupt),false);
  const merged=mergeSearchResults([{runId:"test",status:"succeeded",results:[valid,corrupt],
    citySummaries:[{routeId:"KIJ",status:"succeeded"}]}],["KIJ"],"test");
  assert.equal(merged.results.length,1);
  assert.equal(merged.validation.rejectedInvalidFlights,1);
  assert.equal(merged.results[0].outbound.operation,valid.outbound.operation);
});

test("reject mismatched operation direction, incorrect weekday, dates, and unverified airports",()=>{
  assert.equal(isVerifiedFlightResult({...valid,returnDate:"2026-11-10"}),false);
  assert.equal(isVerifiedFlightResult({...valid,outbound:{...valid.outbound,operation:"GMP-KIX-MM-738|wrong"}}),false);
  assert.equal(isVerifiedFlightResult({...valid,outbound:{...valid.outbound,description:valid.outbound.description.replace("Friday","Saturday")}}),false);
  assert.equal(isVerifiedFlightResult({...valid,inbound:{...valid.inbound,description:valid.inbound.description.replace("Niigata Airport","Seattle Airport")}}),false);
  assert.equal(isVerifiedFlightResult({...valid,arrivalAirportCode:"XYZ"}),false);
  assert.equal(isVerifiedFlightResult({...valid,inbound:null}),false);
});
