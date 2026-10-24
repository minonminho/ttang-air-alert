import fs from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { searchGoogle } from './google-playwright.mjs';

const measurements = [];
for (const departureNavigation of ['reload', 'history']) {
  const start = performance.now();
  try {
    const result = await searchGoogle({ destinationCode:'NRT', startDate:new Date(2026,10,28),
      maxTrips:1, useCache:false, departureNavigation, includeAllResults:true });
    measurements.push({ departureNavigation, seconds:Number(((performance.now()-start)/1000).toFixed(2)), results:result.results.length, errors:result.tripErrors.length });
  } catch (error) {
    measurements.push({ departureNavigation, seconds:Number(((performance.now()-start)/1000).toFixed(2)), error:error.message });
  }
  console.log(JSON.stringify(measurements.at(-1)));
}
await fs.mkdir('worker/data', {recursive:true});
await fs.writeFile('worker/data/benchmark.json', JSON.stringify(measurements, null, 2));
