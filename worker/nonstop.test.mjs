import test from 'node:test';
import assert from 'node:assert/strict';
import { isNonstopFlightDescription, isNonstopRoundTrip } from './nonstop.mjs';
import { readGoogleFlightRows, makeSearchUrl } from './google-playwright.mjs';
import { mergeSearchResults } from './merge-search-results.mjs';

const directLeg = { description:'From 179000 South Korean won round trip total. Nonstop flight with Jin Air. Leaves Incheon at 2:00 PM on Friday, November 6 and arrives at Okayama at 3:30 PM on Friday, November 6. Total duration 1 hr 30 min.' };
const viaLeg = { description:'From 130000 South Korean won round trip total. 1 stop flight with Asiana Airlines. Leaves Incheon at 1:00 PM on Friday, November 6 and arrives at Okayama at 6:00 PM on Friday, November 6. Total duration 5 hr.' };

test('both outbound and return legs must be verified nonstop', () => {
  assert.equal(isNonstopFlightDescription(directLeg.description), true);
  assert.equal(isNonstopFlightDescription('Non-stop flight with Jin Air.'), true);
  assert.equal(isNonstopFlightDescription(viaLeg.description), false);
  assert.equal(isNonstopFlightDescription('2 stops with ANA'), false);
  assert.equal(isNonstopFlightDescription('Information not available'), false);
  assert.equal(isNonstopRoundTrip({ outbound:directLeg, inbound:directLeg }), true);
  assert.equal(isNonstopRoundTrip({ outbound:directLeg, inbound:viaLeg }), false);
  assert.equal(isNonstopRoundTrip({ outbound:viaLeg, inbound:directLeg }), false);
  assert.equal(isNonstopRoundTrip({ outbound:directLeg }), false);
  assert.equal(isNonstopRoundTrip({ nonstop:true }), false);
});

test('Google flight rows select verified nonstop fares before cheapest-flight sampling', async () => {
  const fakeNode = (description) => ({
    getClientRects: () => [{}],
    innerText: description,
    querySelector: () => ({getAttribute: () => description}),
    querySelectorAll: () => [],
  });
  const page = { locator: () => ({
    evaluateAll: (callback) => callback([fakeNode(viaLeg.description),fakeNode(directLeg.description)]),
  })};
  const rows = await readGoogleFlightRows(page);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].price, 179000);
  assert.equal(rows[0].airline, 'Jin Air');
  assert.match(makeSearchUrl('OKJ',new Date(2026,10,7),new Date(2026,10,11)), /Nonstop/);
});

test('snapshot merger excludes any connection, even if a shard returned it', () => {
  const makeResult = (price, outbound, inbound) => ({
    destinationCode:'OKJ',destination:'오카야마',price,
    operationKey:'flight-' + price,
    departureDate:'2026-11-07',returnDate:'2026-11-11',
    outbound,inbound,
  });
  const results = [
    makeResult(120000,viaLeg,directLeg),
    makeResult(140000,directLeg,viaLeg),
    makeResult(170000,directLeg,directLeg),
    makeResult(180000,directLeg,undefined),
  ];
  const snapshot = mergeSearchResults([{
    runId:'test',status:'succeeded',
    citySummaries:[{ destinationCode:'OKJ',status:'succeeded' }],
    results,
  }],['OKJ'],'test');
  assert.equal(snapshot.status,'succeeded');
  assert.deepEqual(snapshot.results.map((item) => item.price),[170000]);
});
