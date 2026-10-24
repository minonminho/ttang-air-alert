import { pathToFileURL } from 'node:url';
import { DESTINATIONS } from './google-playwright.mjs';

export function createSearchPlan(scope = 'all') {
  const codes = scope === 'test' ? ['NRT', 'HKD'] : [...DESTINATIONS.keys()];
  const count = scope === 'test' ? 2 : 6;
  const groups = Array.from({length:count}, () => []);
  codes.forEach((code, index) => groups[index % count].push(code));
  return { include:groups.map((group, index) => ({ shard:String(index + 1), cities:group.join(',') })) };
}

export function getSearchDate(scope = 'all', now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', hourCycle:'h23',
  }).formatToParts(now);
  const fields = Object.fromEntries(parts.map(({type,value}) => [type,value]));
  const date = new Date(Date.UTC(Number(fields.year), Number(fields.month) - 1, Number(fields.day)));
  if (scope === 'test') date.setUTCDate(date.getUTCDate() + 7);
  else if (Number(fields.hour) >= 6) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0,10);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const scope = process.env.SEARCH_SCOPE === 'test' ? 'test' : 'all';
  console.log(`matrix=${JSON.stringify(createSearchPlan(scope))}`);
  console.log(`search_date=${getSearchDate(scope)}`);
  console.log(`max_trips=${scope === 'test' ? '3' : '0'}`);
}
