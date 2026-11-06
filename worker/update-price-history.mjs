#!/usr/bin/env node
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { mergePriceHistory } from "./price-history.mjs";

const root = new URL("../dist/", import.meta.url);
const source = new URL("flight-results.json",root);
const target = new URL("price-history.json",root);
const snapshot = JSON.parse(await readFile(source,"utf8"));
let previous = null;
try {previous = JSON.parse(await readFile(target,"utf8"));}
catch (error) { if (error.code !== "ENOENT") throw error; }
const next = mergePriceHistory(previous,snapshot);
await writeFile(target,JSON.stringify(next,null,2)+"\n","utf8");
const days = new Set(next.observations.map((row)=>row.day));
console.log("[price-history] Recorded "+next.observations.length+" airport/route/duration observations over "+days.size+" distinct KST days; source snapshot="+snapshot.updatedAt);
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
    "\n### 항공권 가격 이력\n기준: 실제 검증된 왕복 직항 항공권 중 동일 노선·여행 기간별 일일 최저가. "
    + days.size + "일 관측, 총 "+next.observations.length+"개 노선별 관측값. "
    + "과거 데이터는 소급 생성하지 않으며 최소 3일의 이전 관측이 있을 때만 특가 점수를 계산합니다.\n","utf8");
}
