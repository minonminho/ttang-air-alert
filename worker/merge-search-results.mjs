import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SEARCH_ROUTES } from './routes.mjs';
import { isNonstopRoundTrip } from './nonstop.mjs';

export function mergeSearchResults(snapshots, expectedCodes, runId) {
  const errors = snapshots.flatMap((snapshot) => snapshot.errors || []);
  const summaries = snapshots.flatMap((snapshot) => snapshot.citySummaries || []);
  const records = new Map();
  for (const snapshot of snapshots) {
    if (runId && snapshot.runId !== runId) throw new Error('검색 결과의 실행 ID가 일치하지 않습니다.');
    for (const result of snapshot.results || []) {
      if (!expectedCodes.includes(result.routeId || result.destinationCode)) throw new Error('예상하지 않은 노선 결과입니다.');
      if (!isNonstopRoundTrip(result)) continue;
      records.set([result.routeId || result.destinationCode, result.departureCode || 'ICN', result.departureDate, result.returnDate, result.operationKey, result.price].join('|'), result);
    }
  }
  for (const code of expectedCodes) {
    if (!summaries.some((summary) => (summary.routeId || summary.destinationCode) === code)) {
      errors.push({ routeId:code, error:'작업이 완료되지 않았거나 결과 파일이 누락됐습니다.' });
    }
  }
  const results = [...records.values()].sort((a,b) => a.price - b.price);
  const status = errors.length ? (results.length ? 'partial' : 'failed') : 'succeeded';
  return { source:'Google Flights', runId, jobId:`github-${runId || 'local'}`, mode:snapshots[0]?.mode || 'quick', status,
    updatedAt:new Date().toISOString(), destinations:expectedCodes, results, errors, citySummaries:summaries,
    progress:{ totalCities:expectedCodes.length, cityIndex:summaries.length, resultCount:results.length } };
}

async function readSnapshots(directory) {
  const result = [];
  for (const entry of await fs.readdir(directory, { withFileTypes:true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await readSnapshots(filename));
    else if (entry.name === 'latest-flight-results.json') result.push(JSON.parse(await fs.readFile(filename, 'utf8')));
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const isTest = process.argv.includes('--test');
  const snapshots = await readSnapshots('worker/data/shards').catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const snapshot = mergeSearchResults(snapshots, isTest ? ['NRT','HKD','GMP-HND','GMP-KIX'] : [...SEARCH_ROUTES.keys()], process.env.GITHUB_RUN_ID);
  const output = isTest ? 'worker/data/test-flight-results.json' : 'dist/flight-results.json';
  if (snapshot.status === 'failed') throw new Error('사용 가능한 결과가 없습니다. 기존 공개 결과를 보존합니다.');
  const serialized = JSON.stringify(snapshot);
  await fs.mkdir(path.dirname(output), { recursive:true });
  await fs.writeFile(output, serialized);
  console.log(`[publish] ${output}: ${Buffer.byteLength(serialized)} bytes, ${snapshot.results.length} flights, ${snapshot.errors.length} search errors, status=${snapshot.status}`);
}
