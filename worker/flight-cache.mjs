import fs from "node:fs/promises";
import path from "node:path";

const CACHE_VERSION = 1;
const CACHE_PATH = path.resolve(process.cwd(), "worker", "data", "flight-cache.json");

export function makeFlightCacheKey(destinationCode, departureDate, returnDate) {
  return `${destinationCode}|${departureDate}|${returnDate}`;
}

export async function loadFlightCache({ ttlMs = 24 * 60 * 60 * 1000 } = {}) {
  try {
    const payload = JSON.parse(await fs.readFile(CACHE_PATH, "utf8"));
    if (payload.version !== CACHE_VERSION || !payload.entries || typeof payload.entries !== "object") {
      return { version: CACHE_VERSION, entries: {}, ttlMs };
    }
    return { version: CACHE_VERSION, entries: payload.entries, ttlMs };
  } catch {
    return { version: CACHE_VERSION, entries: {}, ttlMs };
  }
}

export async function saveFlightCache(cache) {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, JSON.stringify({
    version: CACHE_VERSION,
    updatedAt: new Date().toISOString(),
    entries: cache.entries,
  }));
}

export function getFreshFlightCacheEntry(cache, key) {
  const entry = cache.entries[key];
  if (!entry || !Array.isArray(entry.options)) return null;
  if (Date.now() - Number(entry.checkedAt || 0) > cache.ttlMs) return null;
  return entry;
}
