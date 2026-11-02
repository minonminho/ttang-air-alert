import test from 'node:test';
import assert from 'node:assert/strict';
import { createSearchPlan, getSearchDate } from './search-plan.mjs';
import { mergeSearchResults } from './merge-search-results.mjs';
import { DESTINATIONS } from './google-playwright.mjs';
import { SEARCH_ROUTES } from './routes.mjs';

test('all 28 routes (26 ICN + 2 GMP) are assigned exactly once across six balanced shards', () => {
  const plan = createSearchPlan('all');
  const groups = plan.include.map((item) => item.cities.split(','));
  assert.equal(groups.length, 6);
  assert.deepEqual(groups.flat().sort(), [...SEARCH_ROUTES.keys()].sort());
  assert.equal(DESTINATIONS.size, 26);
  assert.equal(SEARCH_ROUTES.get('GMP-HND').destinationCode, 'NRT');
  assert.equal(SEARCH_ROUTES.get('GMP-KIX').arrivalAirportCode, 'KIX');
  assert.ok(groups.every((group) => group.length <= 5));
});

test('test scope restricts the search to Tokyo and Hakodate', () => {
  assert.deepEqual(createSearchPlan('test').include, [{shard:'1',cities:'NRT'},{shard:'2',cities:'HKD'},{shard:'3',cities:'GMP-HND'},{shard:'4',cities:'GMP-KIX'}]);
});

test('all scope includes today for the 1am KST schedule and skips already-departed dates later in the day', () => {
  assert.equal(getSearchDate('all', new Date('2026-10-24T16:00:00Z')), '2026-10-25'); // 01:00 KST
  assert.equal(getSearchDate('all', new Date('2026-10-24T12:45:00Z')), '2026-10-25'); // 21:45 KST
  assert.equal(getSearchDate('all', new Date('2026-10-23T16:00:00Z')), '2026-10-24'); // scheduled day
});

test('merge sorts prices and marks missing or unfinished cities as partial', () => {
  const row = (code,price) => {
    const airport = code === 'NRT' ? 'Narita Airport' : 'Hakodate Airport';
    const leg = (from,to,weekday,day) => ({
      description:`Nonstop flight with Jin Air. Leaves ${from} at 8:00 AM on ${weekday}, November ${day} and arrives at ${to} at 10:00 AM on ${weekday}, November ${day}. Total duration 2 hr.`,
    });
    return {destinationCode:code,departureCode:'ICN',price,departureDate:'2026-11-28',returnDate:'2026-11-30',operationKey:'route',
      outbound:leg('Incheon International Airport',airport,'Saturday',28),inbound:leg(airport,'Incheon International Airport','Monday',30)};
  };
  const result = mergeSearchResults([
    {runId:'run',citySummaries:[{destinationCode:'NRT',status:'succeeded'}],results:[row('NRT',300000),row('NRT',300000)]},
    {runId:'run',citySummaries:[],results:[row('HKD',200000)]},
  ], ['NRT','HKD'], 'run');
  assert.equal(result.status,'partial');
  assert.equal(result.errors[0].destinationCode,'HKD');
  assert.deepEqual(result.results.map((row) => row.price), [200000,300000]);
});

test('merge rejects stale runs and reports empty failures without publishing', () => {
  assert.throws(() => mergeSearchResults([{runId:'old'}], ['NRT'], 'new'), /ID/);
  assert.equal(mergeSearchResults([], ['NRT'], 'new').status,'failed');
  assert.equal(mergeSearchResults([{runId:'new',citySummaries:[{destinationCode:'NRT',status:'succeeded'}],results:[]}], ['NRT'], 'new').status, 'succeeded');
});

test('merger retains different departure airports even for identical fare and dates', () => {
  const makeRow = (origin, routeId, arrivalAirportCode) => ({
    routeId, destinationCode:'NRT', departureCode:origin, arrivalAirportCode,
    price:210000,departureDate:'2026-11-07',returnDate:'2026-11-09',operationKey:'same-id',
    outbound:{description:`Nonstop flight with ANA. Leaves ${origin === 'GMP' ? 'Gimpo International Airport' : 'Incheon International Airport'} at 8:00 AM on Saturday, November 7 and arrives at ${arrivalAirportCode === 'HND' ? 'Haneda Airport' : 'Narita Airport'} at 10:00 AM on Saturday, November 7. Total duration 2 hr.`},
    inbound:{description:`Nonstop flight with ANA. Leaves ${arrivalAirportCode === 'HND' ? 'Haneda Airport' : 'Narita Airport'} at 8:00 AM on Monday, November 9 and arrives at ${origin === 'GMP' ? 'Gimpo International Airport' : 'Incheon International Airport'} at 10:00 AM on Monday, November 9. Total duration 2 hr.`},
  });
  const result = mergeSearchResults([
    {runId:'test',citySummaries:[{routeId:'NRT'},{routeId:'GMP-HND'}],results:[
      makeRow('ICN','NRT','NRT'),makeRow('GMP','GMP-HND','HND'),
    ]},
  ],['NRT','GMP-HND'],'test');
  assert.equal(result.results.length,2);
  assert.deepEqual(result.results.map(x=>x.departureCode).sort(),['GMP','ICN']);
  assert.equal(result.status,'succeeded');
});
