import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { DESTINATIONS, searchGoogle } from "./google-playwright.mjs";

const modeIndex = process.argv.indexOf("--mode");
const mode = modeIndex >= 0 && process.argv[modeIndex + 1] === "full" ? "full" : "quick";
function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}
const selectedCodes = argument('--cities', [...DESTINATIONS.keys()].join(',')).split(',');
if (selectedCodes.some((code) => !DESTINATIONS.has(code))) throw new Error('Unknown city in --cities');
const destinations = selectedCodes.map((code) => [code, DESTINATIONS.get(code)]);
const maxTripsValue = Number(argument('--max-trips', '0'));
if (!Number.isInteger(maxTripsValue) || maxTripsValue < 0) throw new Error('--max-trips must be a nonnegative integer');
const startDateValue = argument('--start-date', null);
const startedAt = Date.now();
const citySummaries = [];
let lastCheckpointAt = 0;
const jobId = `github-${crypto.randomUUID()}`;
const latestResultsPath = path.resolve(process.cwd(), "worker", "data", "latest-flight-results.json");
const results = [];
const errors = [];
let progress = { cityIndex: 0, totalCities: destinations.length, searchedTrips: 0, resultCount: 0 };

async function saveProgress(status) {
  const snapshot = {
    jobId,
    runId: process.env.GITHUB_RUN_ID || null,
    source: "Google Flights",
    destinations: selectedCodes,
    citySummaries,
    elapsedSeconds: Math.round((Date.now() - startedAt) / 1000),
    mode,
    status,
    updatedAt: new Date().toISOString(),
    progress,
    results,
    errors,
  };
  await fs.mkdir(path.dirname(latestResultsPath), { recursive: true });
  await fs.writeFile(`${latestResultsPath}.tmp`, JSON.stringify(snapshot));
  await fs.rename(`${latestResultsPath}.tmp`, latestResultsPath);
  lastCheckpointAt = Date.now();
  // Shard checkpoints remain local; only the publisher updates the public snapshot.
}

for (const [index, [destinationCode, destination]] of destinations.entries()) {
  const cityStartedAt = Date.now();
  progress = { ...progress, cityIndex: index + 1, cityCode: destinationCode, city: destination, phase: "starting" };
  console.log(`[${index + 1}/${destinations.length}] ${destination} (${destinationCode}) 검색 시작`);

  try {
    const cityResult = await searchGoogle({
      destinationCode,
      includeAllResults: true,
      mode,
      headless: true,
      useCache: !process.argv.includes('--fresh'),
      maxTrips: maxTripsValue || Infinity,
      ...(startDateValue ? { startDate:new Date(`${startDateValue}T00:00:00`) } : {}),
      onProgress: (nextProgress) => {
        console.log(`  ${destinationCode} [${nextProgress.current}/${nextProgress.total}] ${nextProgress.trip.departureDate} ~ ${nextProgress.trip.returnDate} (${nextProgress.phase}${nextProgress.cached ? ", cache" : ""})`);
        progress = {
          cityIndex: index + 1,
          totalCities: destinations.length,
          cityCode: destinationCode,
          city: destination,
          ...nextProgress,
          resultCount: results.length,
        };
      },
      onResults: async (items) => {
        results.push(...items);
        progress = { ...progress, resultCount: results.length };
        if (Date.now() - lastCheckpointAt >= 60000) await saveProgress('running');
      },
      onTripError: (failure) => {
        errors.push({ destinationCode, destination, ...failure });
        console.warn(`  ${destinationCode} ${failure.departureDate} ~ ${failure.returnDate}: 재시도 실패, 다음 일정으로 진행`);
      },
    });
    if (!results.some((result) => result.destinationCode === destinationCode)) results.push(...cityResult.results);
    citySummaries.push({ destinationCode, status:cityResult.tripErrors.length ? 'partial' : 'succeeded', searchedTrips:cityResult.searchedTrips, elapsedSeconds:Math.round((Date.now() - cityStartedAt) / 1000) });
    console.log(`[${index + 1}/${destinations.length}] ${destination} 완료: ${cityResult.searchedTrips}개 일정, ${cityResult.results.length}개 결과, ${Math.round((Date.now() - cityStartedAt) / 1000)}초`);
  } catch (error) {
    errors.push({ destinationCode, destination, error: error.message });
    citySummaries.push({ destinationCode, status:'failed', elapsedSeconds:Math.round((Date.now() - cityStartedAt) / 1000) });
    console.error(`[${index + 1}/${destinations.length}] ${destination} 실패: ${error.message}`);
  }

  progress = { ...progress, resultCount: results.length, phase: "city-complete" };
  await saveProgress("running");
}

const status = errors.length === 0 ? "succeeded" : results.length ? "partial" : "failed";
await saveProgress(status);
console.log(`Google Flights 전체 검색 완료: ${results.length}개 결과, 오류 ${errors.length}건, ${Math.round((Date.now() - startedAt) / 1000)}초`);

if (status === "failed") process.exitCode = 1;
