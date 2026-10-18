import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crawlTtangAir, SOURCE_ID, SOURCE_NAME } from "./ttangair-crawler.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "dist", "deals.json");
const source = "https://www.ttang.com/ttangair/search/ttang/list.do?arr0=A7ALL";
const deals = await crawlTtangAir({ listUrl: source, departureCode: "ICN", maxPrice: 300000 });

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({
  fetchedAt: new Date().toISOString(),
  sources: [{ id: SOURCE_ID, label: SOURCE_NAME, url: source }],
  sourceId: SOURCE_ID,
  sourceName: SOURCE_NAME,
  source,
  criteria: { departureCode: "ICN", maxPriceExclusive: 300000 },
  deals,
}, null, 2)}\n`, "utf8");

console.log(`Updated ${deals.length} deals at ${outputPath}`);
