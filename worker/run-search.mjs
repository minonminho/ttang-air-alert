import { searchNaver } from "./naver-playwright.mjs";

const cityIndex = process.argv.indexOf("--city");
const destinationCode = cityIndex >= 0 ? process.argv[cityIndex + 1] : "HKD";
const headless = !process.argv.includes("--headed");

try {
  const result = await searchNaver({
    destinationCode,
    headless,
    onProgress: ({ current, total, trip }) => console.log(`[${current}/${total}] ${trip.departureDate} ~ ${trip.returnDate} (${trip.tripDays}일)`),
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
