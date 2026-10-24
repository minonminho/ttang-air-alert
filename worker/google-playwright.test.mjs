import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { makeSearchUrl, makeCandidateTrips, readGoogleFlightRows } from './google-playwright.mjs';

test('public URL keeps exact airports, round-trip dates and KRW', () => {
  const url = new URL(makeSearchUrl('HKD', new Date(2026, 10, 6), new Date(2026, 10, 8)));
  assert.equal(url.origin, 'https://www.google.com');
  assert.equal(url.searchParams.get('curr'), 'KRW');
  assert.match(url.searchParams.get('q'), /ICN to HKD departing 2026-11-06 returning 2026-11-08/);
  assert.match(url.searchParams.get('q'), /Round trip/);
});

test('candidate durations include departure day and both weekend days', () => {
  for (const trip of makeCandidateTrips({ startDate: new Date(2026, 10, 6) })) {
    const start = new Date(`${trip.departureDate}T00:00:00Z`);
    const end = new Date(`${trip.returnDate}T00:00:00Z`);
    assert.equal((end - start) / 86400000 + 1, trip.tripDays);
    const days = Array.from({length:trip.tripDays}, (_, i) => new Date(+start + i * 86400000).getUTCDay());
    assert.ok(days.includes(0) && days.includes(6));
  }
});

test('only priced flight rows count; identity ignores dates and preserves flight times', async () => {
  const browser = await chromium.launch({ headless:true });
  try {
    const page = await browser.newPage();
    const row = (date, time) => `<li><div role="link" aria-label="From 200000 South Korean won round trip total. Nonstop flight with Jin Air. Leaves Incheon at ${time} on Friday, November ${date} and arrives at Narita at 5:40 PM on Friday, November ${date}. Total duration 2 hr 25 min. Select flight"></div><div data-travelimpactmodelwebsiteurl="https://www.travelimpactmodel.org/lookup/flight?itinerary=ICN-NRT-LJ-263-202611${date}">₩200,000</div></li>`;
    await page.setContent(`<p>Special offer ₩5,000</p><ul><li>₩100,000 advertisement</li>${row('06', '3:15 PM')}${row('13', '3:15 PM')}${row('13', '4:15 PM')}</ul>`);
    const rows = await readGoogleFlightRows(page);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].price, 200000);
    assert.equal(rows[0].airline, 'Jin Air');
    assert.doesNotMatch(rows[0].operation, /20261106|November/);
    assert.notEqual(rows[0].operation, rows[1].operation);
  } finally { await browser.close(); }
});
