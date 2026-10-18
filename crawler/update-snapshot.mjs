import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crawlTtangAir, SOURCE_ID as TTANG_SOURCE_ID, SOURCE_NAME as TTANG_SOURCE_NAME } from "./ttangair-crawler.mjs";
import { crawlModetour, SOURCE_ID as MODETOUR_SOURCE_ID, SOURCE_NAME as MODETOUR_SOURCE_NAME, SOURCE_URL as MODETOUR_SOURCE_URL } from "./modetour-crawler.mjs";
import { crawlHanatour, SOURCE_ID as HANATOUR_SOURCE_ID, SOURCE_NAME as HANATOUR_SOURCE_NAME, SOURCE_URL as HANATOUR_SOURCE_URL } from "./hanatour-crawler.mjs";
import { crawlYbtour, SOURCE_ID as YBTOUR_SOURCE_ID, SOURCE_NAME as YBTOUR_SOURCE_NAME, SOURCE_URL as YBTOUR_SOURCE_URL } from "./ybtour-crawler.mjs";
import { crawlNaver, SOURCE_ID as NAVER_SOURCE_ID, SOURCE_NAME as NAVER_SOURCE_NAME, SOURCE_URL as NAVER_SOURCE_URL } from "./naver-crawler.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "dist", "deals.json");
const ttangSource = "https://www.ttang.com/ttangair/search/ttang/list.do?arr0=A7ALL";
const sources = [
  { id: TTANG_SOURCE_ID, label: TTANG_SOURCE_NAME, url: ttangSource },
  { id: MODETOUR_SOURCE_ID, label: MODETOUR_SOURCE_NAME, url: MODETOUR_SOURCE_URL },
  { id: HANATOUR_SOURCE_ID, label: HANATOUR_SOURCE_NAME, url: HANATOUR_SOURCE_URL },
  { id: YBTOUR_SOURCE_ID, label: YBTOUR_SOURCE_NAME, url: YBTOUR_SOURCE_URL },
  { id: NAVER_SOURCE_ID, label: NAVER_SOURCE_NAME, url: NAVER_SOURCE_URL },
];
const crawls = await Promise.allSettled([
  crawlTtangAir({ listUrl: ttangSource, departureCode: "ICN", maxPrice: 300000 }),
  crawlModetour({ departureCode: "ICN", maxPrice: 300000 }),
  crawlHanatour({ departureCode: "ICN", maxPrice: 300000 }),
  crawlYbtour({ departureCode: "ICN", maxPrice: 300000 }),
  crawlNaver(),
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
  criteria: { departureCode: "ICN", maxPriceExclusive: 300000, naver: "일본 도시별 3·4·5·6일 일정 최저가 5개" },
  deals,
}, null, 2)}\n`, "utf8");

console.log(`Updated ${deals.length} deals at ${outputPath}`);
