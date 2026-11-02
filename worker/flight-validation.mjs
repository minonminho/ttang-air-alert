import { isNonstopFlightDescription } from "./nonstop.mjs";

// Fail closed: a Google Flights recommendations card can be nonstop, but have
// nothing to do with the requested Korea -> Japan route or travel dates.
const AIRPORT_NAMES = {
  ICN: ["incheon"],
  GMP: ["gimpo", "kimpo"],
  NRT: ["narita"],
  HND: ["haneda"],
  KIX: ["kansai"],
  NGO: ["chubu", "centrair", "nagoya"],
  FUK: ["fukuoka"],
  CTS: ["new chitose", "chitose", "sapporo"],
  HKD: ["hakodate"],
  OBO: ["obihiro"],
  AOJ: ["aomori"],
  SDJ: ["sendai"],
  KIJ: ["niigata"],
  IBR: ["ibaraki"],
  FSZ: ["shizuoka"],
  KMQ: ["komatsu"],
  OKJ: ["okayama"],
  YGJ: ["yonago"],
  HIJ: ["hiroshima"],
  TAK: ["takamatsu"],
  MYJ: ["matsuyama"],
  HSG: ["saga"],
  NGS: ["nagasaki"],
  OIT: ["oita"],
  KMJ: ["kumamoto"],
  KMI: ["miyazaki"],
  KOJ: ["kagoshima"],
  OKA: ["naha", "okinawa"],
  ISG: ["ishigaki"],
};

const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
const WEEKDAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const ACTUAL_FLIGHT = /\bLeaves\s+(.+?)\s+at\s+\d{1,2}:\d{2}\s*(?:AM|PM)\s+on\s+(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+and arrives at\s+(.+?)\s+at\s+\d{1,2}:\d{2}\s*(?:AM|PM)\s+on\s+/i;

function matchesAirport(name, code) {
  const aliases = AIRPORT_NAMES[code];
  if (!aliases || typeof name !== "string") return false;
  const normalized = name.toLowerCase().replace(/[^a-z ]/g," ").replace(/\s+/g," ").trim();
  return aliases.some((alias) => normalized.split(/\s+/).join(" ").includes(alias));
}

function matchesDepartureDate(weekday, month, day, dateText) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateText || ""))) return false;
  const expected = new Date(dateText + "T00:00:00Z");
  return !Number.isNaN(expected.getTime())
    && expected.toISOString().slice(0, 10) === dateText
    && WEEKDAYS[expected.getUTCDay()] === weekday.toLowerCase()
    && MONTHS[expected.getUTCMonth()] === month.toLowerCase()
    && expected.getUTCDate() === Number(day);
}

export function isVerifiedFlightLeg(leg, originCode, destinationCode, dateText) {
  const description = String(leg?.description || "");
  if (!isNonstopFlightDescription(description)) return false;
  const match = description.match(ACTUAL_FLIGHT);
  // The text must describe an actual selectable flight, not a price overview card.
  if (!match || !matchesDepartureDate(match[2],match[3],match[4],dateText)) return false;
  if (!matchesAirport(match[1],originCode) || !matchesAirport(match[5],destinationCode)) return false;
  // TravelImpactModel's flight code, where present, independently confirms direction.
  const flightIdentity = String(leg?.operation || "").match(/^([A-Z]{3})-([A-Z]{3})-[A-Z0-9]+-/);
  if (flightIdentity && (flightIdentity[1] !== originCode || flightIdentity[2] !== destinationCode)) return false;
  return true;
}

export function isVerifiedFlightResult(result) {
  const origin = result?.departureCode || "ICN";
  const destination = result?.arrivalAirportCode || result?.destinationCode;
  const price = Number(result?.price);
  if (!["ICN","GMP"].includes(origin) || !AIRPORT_NAMES[destination] ||
      !Number.isFinite(price) || price < 100000 || price >= 10000000) return false;
  return isVerifiedFlightLeg(result?.outbound,origin,destination,result?.departureDate)
    && isVerifiedFlightLeg(result?.inbound,destination,origin,result?.returnDate);
}
