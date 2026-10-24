import test from 'node:test';
import assert from 'node:assert/strict';
import { createSearchPlan } from './search-plan.mjs';
import { mergeSearchResults } from './merge-search-results.mjs';
import { DESTINATIONS } from './google-playwright.mjs';

test('all 26 cities are assigned exactly once across six balanced shards', () => {
  const plan = createSearchPlan('all');
  const groups = plan.include.map((item) => item.cities.split(','));
  assert.equal(groups.length, 6);
  assert.deepEqual(groups.flat().sort(), [...DESTINATIONS.keys()].sort());
  assert.ok(groups.every((group) => group.length <= 5));
});

test('test scope restricts the search to Tokyo and Hakodate', () => {
  assert.deepEqual(createSearchPlan('test').include, [{shard:'1',cities:'NRT'},{shard:'2',cities:'HKD'}]);
});

test('merge sorts prices and marks missing or unfinished cities as partial', () => {
  const row = (code,price) => ({destinationCode:code,price,departureDate:'2026-11-28',returnDate:'2026-11-30',operationKey:'route'});
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
