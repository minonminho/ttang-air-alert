import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readGoogleFlightRows } from "./google-playwright.mjs";

// Playwright serializes evaluateAll callbacks into a separate Chromium JS world.
// Reconstruct that isolation here without browser installation or network access.
// This catches ReferenceErrors from imported Node helpers accidentally used inside
// locator.evaluateAll even when all other unit tests pass.
function mockPage(rows) {
  return {
    locator() {
      return {
        async evaluateAll(callback) {
          const browserCallback = vm.runInNewContext("(" + callback.toString() + ")");
          return browserCallback(rows);
        },
      };
    },
  };
}
function fare(label, price = 200000) {
  return {
    getClientRects: () => [1],
    querySelector: () => ({ getAttribute: (key) => key === "aria-label" ? label : null }),
    querySelectorAll: () => [],
    innerText: "₩" + price.toLocaleString("en-US"),
  };
}

test("readGoogleFlightRows evaluates in a browser-only sandbox, without Node imports", async () => {
  const real = "From 200000 South Korean won round trip total. Nonstop flight with Jin Air. "
    + "Leaves Incheon at 3:15 PM on Friday, November 6 and arrives at Narita "
    + "at 5:40 PM on Friday, November 6. Total duration 2 hr 25 min. Select flight";
  const rows = await readGoogleFlightRows(mockPage([fare(real)]));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].price, 200000);
  assert.equal(rows[0].airline, "Jin Air");
  assert.match(rows[0].aria, /Leaves Incheon/);
});

test("recommendation cards and connecting fares stay excluded after isolation fix", async () => {
  const route = "Leaves Incheon at 3:15 PM on Friday, November 6 and arrives "
    + "at Narita at 5:40 PM on Friday, November 6. Total duration 2 hr 25 min.";
  const valid = "From 200000 South Korean won round trip total. Nonstop flight with Jin Air. " + route;
  const connecting = "From 200000 South Korean won round trip total. 1 stop flight with Jin Air. " + route;
  const recommendation = "From 261618 South Korean won round trip total. Nonstop flight with 기타. Wenatchee Portland Jan 14 — Jan 20 Nonstop from ₩261,618";
  const rows = await readGoogleFlightRows(mockPage([
    fare(recommendation,261618), fare(connecting), fare(valid),
  ]));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].aria, valid);
});

test("ad-like rows without a selectable aria itinerary are ignored", async () => {
  const page = mockPage([{
    getClientRects: () => [1],
    querySelector: () => null,
    querySelectorAll: () => [],
    innerText: "Nonstop flight ₩200,000",
  }]);
  assert.deepEqual(await readGoogleFlightRows(page), []);
});
