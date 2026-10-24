import { pathToFileURL } from 'node:url';
import { DESTINATIONS } from './google-playwright.mjs';

export function createSearchPlan(scope = 'all') {
  const codes = scope === 'test' ? ['NRT', 'HKD'] : [...DESTINATIONS.keys()];
  const count = scope === 'test' ? 2 : 6;
  const groups = Array.from({length:count}, () => []);
  codes.forEach((code, index) => groups[index % count].push(code));
  return { include:groups.map((group, index) => ({ shard:String(index + 1), cities:group.join(',') })) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const scope = process.env.SEARCH_SCOPE === 'test' ? 'test' : 'all';
  const searchDate = new Date();
  if (scope === 'test') searchDate.setTime(searchDate.getTime() + 7 * 86400000);
  console.log(`matrix=${JSON.stringify(createSearchPlan(scope))}`);
  console.log(`search_date=${new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit' }).format(searchDate)}`);
  console.log(`max_trips=${scope === 'test' ? '3' : '0'}`);
}
