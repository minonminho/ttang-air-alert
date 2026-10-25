import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { makeFlightMetadata, publishFlightMetadata } from './publish-search-metadata.mjs';

const sample = {
  source: 'Google Flights', runId: '123', jobId: 'github-123', mode: 'quick', status: 'partial',
  updatedAt: '2026-10-26T01:00:00.000Z', destinations: ['NRT', 'KIX'],
  results: [{ price: 300000, destinationCode: 'NRT' }, { price: 320000, destinationCode: 'KIX' }],
  errors: [{ destinationCode: 'NRT', error: 'timeout' }],
};

async function withSnapshot(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ttang-metadata-'));
  try {
    const file = path.join(dir, 'flights.json');
    await fs.writeFile(file, JSON.stringify(sample));
    return await fn(file);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test('Supabase metadata contains counts but never thousands of individual fares', () => {
  const many = { ...sample, results: Array.from({ length: 12000 }, (_, price) => ({ price, details: 'x'.repeat(100) })) };
  const metadata = makeFlightMetadata(many);
  assert.equal(metadata.resultCount, 12000);
  assert.equal(metadata.errorCount, 1);
  assert.equal(metadata.destinationCount, 2);
  assert.equal(metadata.publishedPath, 'dist/flight-results.json');
  assert.equal(Object.hasOwn(metadata, 'results'), false);
  assert.ok(Buffer.byteLength(JSON.stringify(metadata)) < 1024);
});

test('publishes only small metadata under a new key after the file is available', async () => {
  await withSnapshot(async (snapshotPath) => {
    let submitted;
    const result = await publishFlightMetadata({ snapshotPath, save: async (key, payload) => { submitted = { key, payload }; return true; }, logger: { log() {}, warn() {} } });
    assert.equal(result, true);
    assert.equal(submitted.key, 'flights_latest_meta');
    assert.equal(submitted.payload.resultCount, 2);
    assert.equal(Object.hasOwn(submitted.payload, 'results'), false);
  });
});

test('Supabase timeout or missing credentials do not fail publication', async () => {
  await withSnapshot(async (snapshotPath) => {
    const messages = [];
    const logger = { log() {}, warn: (message) => messages.push(message) };
    assert.equal(await publishFlightMetadata({ snapshotPath, save: async () => { throw new Error('57014 statement timeout'); }, logger }), false);
    assert.equal(await publishFlightMetadata({ snapshotPath, save: async () => false, logger }), false);
    assert.match(messages[0], /57014/);
    assert.match(messages[1], /not configured/);
  });
});
