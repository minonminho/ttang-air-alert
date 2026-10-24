import { searchGoogle } from "./google-playwright.mjs";

const cityIndex = process.argv.indexOf("--city");
const destinationCode = cityIndex >= 0 ? process.argv[cityIndex + 1] : "HKD";
const headless = !process.argv.includes("--headed");
const startIndex = process.argv.indexOf("--start-date");

try {
  const result = await searchGoogle({
    destinationCode,
    headless,
    ...(startIndex >= 0 ? { startDate: new Date(`${process.argv[startIndex + 1]}T00:00:00`) } : {}),
    maxTrips: process.argv.includes("--smoke") ? 1 : Infinity,
    onProgress: ({ current, total, trip }) => console.log(`[${current}/${total}] ${trip.departureDate} ~ ${trip.returnDate} (${trip.tripDays}일)`),
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
