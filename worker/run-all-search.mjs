import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { DESTINATIONS, searchGoogle } from "./google-playwright.mjs";
import { isSupabaseWriteConfigured, saveSnapshot } from "./supabase-store.mjs";

const modeIndex = process.argv.indexOf("--mode");
const mode = modeIndex >= 0 && process.argv[modeIndex + 1] === "full" ? "full" : "quick";
const jobId = `github-${crypto.randomUUID()}`;
const latestResultsPath = path.resolve(process.cwd(), "worker", "data", "latest-flight-results.json");
const results = [];
const errors = [];
let progress = { cityIndex: 0, totalCities: DESTINATIONS.size, searchedTrips: 0, resultCount: 0 };

if (!isSupabaseWriteConfigured()) {
  throw new Error("SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY GitHub Secret이 필요합니다.");
}

async function saveProgress(status) {
  const snapshot = {
    jobId,
    source: "Google Flights",
    mode,
    status,
    updatedAt: new Date().toISOString(),
    progress,
    results,
    errors,
  };
  await fs.mkdir(path.dirname(latestResultsPath), { recursive: true });
  await fs.writeFile(latestResultsPath, JSON.stringify(snapshot));
  await saveSnapshot("flights_latest", snapshot);
}

for (const [index, [destinationCode, destination]] of [...DESTINATIONS.entries()].entries()) {
  progress = { ...progress, cityIndex: index + 1, cityCode: destinationCode, city: destination, phase: "starting" };
  console.log(`[${index + 1}/${DESTINATIONS.size}] ${destination} (${destinationCode}) 검색 시작`);

  try {
    const cityResult = await searchGoogle({
      destinationCode,
      includeAllResults: true,
      mode,
      headless: true,
      onProgress: (nextProgress) => {
        progress = {
          cityIndex: index + 1,
          totalCities: DESTINATIONS.size,
          cityCode: destinationCode,
          city: destination,
          ...nextProgress,
          resultCount: results.length,
        };
      },
      onResults: (items) => {
        results.push(...items);
        progress = { ...progress, resultCount: results.length };
      },
    });
    if (!results.some((result) => result.destinationCode === destinationCode)) results.push(...cityResult.results);
    console.log(`[${index + 1}/${DESTINATIONS.size}] ${destination} 완료: ${cityResult.searchedTrips}개 일정, ${cityResult.results.length}개 결과`);
  } catch (error) {
    errors.push({ destinationCode, destination, error: error.message });
    console.error(`[${index + 1}/${DESTINATIONS.size}] ${destination} 실패: ${error.message}`);
  }

  progress = { ...progress, resultCount: results.length, phase: "city-complete" };
  await saveProgress("running");
}

const status = errors.length === 0 ? "succeeded" : results.length ? "partial" : "failed";
await saveProgress(status);
console.log(`Google Flights 전체 검색 완료: ${results.length}개 결과, ${errors.length}개 도시 실패`);

if (status === "failed") process.exitCode = 1;
