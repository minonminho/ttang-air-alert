import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { saveSnapshot } from './supabase-store.mjs';

const metadataKey = 'flights_latest_meta';
const publishedPath = 'dist/flight-results.json';

export function makeFlightMetadata(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.results)) {
    throw new Error('게시된 항공권 스냅샷에 results 배열이 없습니다.');
  }
  return {
    source: snapshot.source || 'Google Flights',
    runId: snapshot.runId || null,
    jobId: snapshot.jobId || null,
    mode: snapshot.mode || null,
    status: snapshot.status || null,
    updatedAt: snapshot.updatedAt || null,
    resultCount: snapshot.results.length,
    errorCount: Array.isArray(snapshot.errors) ? snapshot.errors.length : 0,
    destinationCount: Array.isArray(snapshot.destinations) ? snapshot.destinations.length : 0,
    publishedPath,
  };
}

// Publication is authoritative in Git; optional Supabase metadata must never block it.
export async function publishFlightMetadata({ snapshotPath = publishedPath, save = saveSnapshot, logger = console } = {}) {
  const started = Date.now();
  try {
    const snapshot = JSON.parse(await fs.readFile(snapshotPath, 'utf8'));
    const metadata = makeFlightMetadata(snapshot);
    if (!await save(metadataKey, metadata)) {
      logger.warn('[metadata] Supabase not configured; published flight file remains available.');
      return false;
    }
    logger.log(`[metadata] Supabase ${metadataKey}: ${metadata.resultCount} flights, ${metadata.errorCount} errors, ${Date.now() - started}ms`);
    return true;
  } catch (error) {
    logger.warn(`[metadata] Supabase metadata update failed (publication already completed): ${error.message}`);
    return false;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await publishFlightMetadata();
}
