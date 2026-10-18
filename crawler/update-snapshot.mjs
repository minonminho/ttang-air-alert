import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crawlTtangAir, SOURCE_ID as TTANG_SOURCE_ID, SOURCE_NAME as TTANG_SOURCE_NAME } from "./ttangair-crawler.mjs";
import { crawlModetour, SOURCE_ID as MODETOUR_SOURCE_ID, SOURCE_NAME as MODETOUR_SOURCE_NAME, SOURCE_URL as MODETOUR_SOURCE_URL } from "./modetour-crawler.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "dist", "deals.json");
const ttangSource = "https://www.ttang.com/ttangair/search/ttang/list.do?arr0=A7ALL";
const sources = [
  { id: TTANG_SOURCE_ID, label: TTANG_SOURCE_NAME, url: ttangSource },
  { id: MODETOUR_SOURCE_ID, label: MODETOUR_SOURCE_NAME, url: MODETOUR_SOURCE_URL },
];
const crawls = await Promise.allSettled([
  crawlTtangAir({ listUrl: ttangSource, departureCode: "ICN", maxPrice: 300000 }),
  crawlModetour({ departureCode: "ICN", maxPrice: 300000 }),
]);
const deals = crawls.flatMap((result, index) => {
  if (result.status === "fulfilled") return result.value;
  console.warn(`Skipped ${sources[index].label}: ${result.reason?.message || result.reason}`);
  return [];
}).sort((left, right) => left.price - right.price);
if (!deals.length && crawls.every((result) => result.status === "rejected")) {
  throw new Error("모든 항공권 사이트 수집에 실패했습니다.");
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({
  fetchedAt: new Date().toISOString(),
  sources,
  criteria: { departureCode: "ICN", maxPriceExclusive: 300000 },
  deals,
}, null, 2)}\n`, "utf8");

console.log(`Updated ${deals.length} deals at ${outputPath}`);
