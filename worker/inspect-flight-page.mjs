import { chromium } from "playwright";
import { makeCandidateTrips, makeSearchUrl } from "./naver-playwright.mjs";

const trip = makeCandidateTrips().find((trip) => trip.departureDate > new Date().toISOString().slice(0, 10));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ locale: "ko-KR", timezoneId: "Asia/Seoul" });
  const failures = [];
  page.on("requestfailed", (request) => failures.push({ url: request.url().split("?")[0], error: request.failure()?.errorText }));
  const response = await page.goto(makeSearchUrl("NRT", new Date(`${trip.departureDate}T00:00:00`), new Date(`${trip.returnDate}T00:00:00`)), { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(15000);
  console.log(JSON.stringify({ status: response?.status(), url: page.url(), title: await page.title(), text: (await page.locator("body").innerText()).slice(0, 5000), failures }, null, 2));
} finally {
  await browser.close();
}
