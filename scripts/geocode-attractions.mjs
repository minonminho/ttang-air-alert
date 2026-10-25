import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const attractionsPath = path.join(root, "dist", "attractions.js");
const coordinatesPath = path.join(root, "dist", "attraction-coordinates.js");
const alternateQueries = {
  "OBO-5": ["六花亭 帯広本店", "六花亭 帯広"],
  "FSZ-3": ["日本平夢テラス 静岡市清水区", "日本平 夢テラス"],
  "KMQ-2": ["こまつ曳山交流館 みよっさ", "曳山交流館みよっさ 小松"],
  "TAK-2": ["高松城 玉藻公園", "玉藻公園 高松"],
  "TAK-4": ["四国村ミウゼアム 高松", "四国村 高松市"],
  "MYJ-4": ["坊っちゃん列車 松山市", "坊ちゃん列車 松山市"],
  "KMJ-5": ["桜の馬場 城彩苑 熊本", "城彩苑 熊本市"],
  "ISG-5": ["石垣やいま村", "やいま村 石垣市"],
};
const sourceContext = { window: {} };
runInNewContext(readFileSync(attractionsPath, "utf8"), sourceContext);
const attractionsByCode = sourceContext.window.JAPAN_ATTRACTIONS;

const coordinateContext = { window: {} };
if (existsSync(coordinatesPath)) runInNewContext(readFileSync(coordinatesPath, "utf8"), coordinateContext);
const coordinatesByCode = coordinateContext.window.JAPAN_ATTRACTION_COORDINATES || {};
let lastRequestStartedAt = 0;

function persist() {
  const temporaryPath = `${coordinatesPath}.tmp`;
  const content = `window.JAPAN_ATTRACTION_COORDINATES = ${JSON.stringify(coordinatesByCode, null, 2)};\n`;
  writeFileSync(temporaryPath, content, "utf8");
  renameSync(temporaryPath, coordinatesPath);
}

function isCoordinate(value) {
  return Number.isFinite(value?.lat) && Number.isFinite(value?.lon);
}

async function queryNominatim(query) {
  const delay = Math.max(0, 1100 - (Date.now() - lastRequestStartedAt));
  if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
  lastRequestStartedAt = Date.now();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", query);
  url.searchParams.set("countrycodes", "jp");
  url.searchParams.set("limit", "5");
  url.searchParams.set("accept-language", "ja");
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ttang-air-alert/1.0 (personal Japan map location cache)",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);
  const results = await response.json();
  return Array.isArray(results) ? results : [];
}

function chooseResult(results, nameJa) {
  const exact = results.find((item) => `${item.name || ""} ${item.display_name || ""}`.includes(nameJa));
  const result = exact || results[0];
  if (!result) return null;
  const lat = Number(result.lat);
  const lon = Number(result.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    lat,
    lon,
    osmType: result.osm_type || null,
    osmId: result.osm_id || null,
    matchedName: result.name || "",
  };
}

let processed = 0;
let found = 0;
let failures = 0;
for (const [iata, attractions] of Object.entries(attractionsByCode)) {
  coordinatesByCode[iata] ||= [];
  for (const [index, attraction] of attractions.entries()) {
    if (isCoordinate(coordinatesByCode[iata][index])) continue;
    let point = null;
    const queries = [...new Set([attraction.query, attraction.nameJa, ...(alternateQueries[attraction.id] || [])])];
    for (const query of queries) {
      try {
        point = chooseResult(await queryNominatim(query), attraction.nameJa);
      } catch (error) {
        failures += 1;
        process.stderr.write(`${iata} ${attraction.nameKo}: ${error.message}\n`);
      }
      if (point) break;
    }
    coordinatesByCode[iata][index] = point;
    if (point) found += 1;
    processed += 1;
    persist();
    if (processed % 10 === 0 || processed === 1) {
      process.stdout.write(`${processed} processed · ${found} located · ${failures} failed\n`);
    }
  }
}

process.stdout.write(`Done: ${found} located, ${failures} request failures. Saved ${path.relative(root, coordinatesPath)}.\n`);
