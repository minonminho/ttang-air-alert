#!/usr/bin/env node
// One-off repair of the already published Google Flights snapshot.
// Does not fabricate/refresh prices; removes unverifiable itineraries only.
import { readFile, writeFile } from "node:fs/promises";
import { isVerifiedFlightResult } from "./flight-validation.mjs";
const filename = new URL("../dist/flight-results.json",import.meta.url);
const snapshot = JSON.parse(await readFile(filename,"utf8"));
if (!Array.isArray(snapshot.results) || !snapshot.results.length) {
  throw new Error("Existing flight snapshot has no flight results; refusing to overwrite it.");
}
const originalCount = snapshot.results.length;
const validResults = snapshot.results.filter(isVerifiedFlightResult);
if (!validResults.length) throw new Error("All results failed validation; leave the last known snapshot untouched.");
snapshot.results = validResults;
snapshot.progress = {...snapshot.progress,resultCount:validResults.length};
snapshot.validation = {
  ...snapshot.validation, rule:"verified-airports-departure-and-return-dates-v1",
  rejectedInvalidFlights:(snapshot.validation?.rejectedInvalidFlights || 0) + originalCount - validResults.length,
  repairedAt:new Date().toISOString(),
};
await writeFile(filename, JSON.stringify(snapshot));
console.log("[repair] Removed " + (originalCount-validResults.length) + " invalid flights; kept " + validResults.length + " validated round trips.");
