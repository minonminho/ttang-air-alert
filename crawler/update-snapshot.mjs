import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crawlTtangAir, SOURCE_ID as TTANG_SOURCE_ID, SOURCE_NAME as TTANG_SOURCE_NAME, TODAY_URL, PROMOTION_URL } from "./ttangair-crawler.mjs";
import { crawlModetour, SOURCE_ID as MODETOUR_SOURCE_ID, SOURCE_NAME as MODETOUR_SOURCE_NAME, SOURCE_URL as MODETOUR_SOURCE_URL } from "./modetour-crawler.mjs";
import { crawlHanatour, SOURCE_ID as HANATOUR_SOURCE_ID, SOURCE_NAME as HANATOUR_SOURCE_NAME, SOURCE_URL as HANATOUR_SOURCE_URL } from "./hanatour-crawler.mjs";
import { crawlYbtour, SOURCE_ID as YBTOUR_SOURCE_ID, SOURCE_NAME as YBTOUR_SOURCE_NAME, SOURCE_URL as YBTOUR_SOURCE_URL } from "./ybtour-crawler.mjs";
import { saveSnapshot } from "../worker/supabase-store.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "dist", "deals.json");
const ttangSource = TODAY_URL;
const sources = [
  { id: TTANG_SOURCE_ID, label: TTANG_SOURCE_NAME, url: ttangSource, additionalUrl: PROMOTION_URL },
  { id: MODETOUR_SOURCE_ID, label: MODETOUR_SOURCE_NAME, url: MODETOUR_SOURCE_URL },
  { id: HANATOUR_SOURCE_ID, label: HANATOUR_SOURCE_NAME, url: HANATOUR_SOURCE_URL },
  { id: YBTOUR_SOURCE_ID, label: YBTOUR_SOURCE_NAME, url: YBTOUR_SOURCE_URL },
];
const crawls = await Promise.allSettled([
  crawlTtangAir({ departureCodes: ["ICN", "GMP"], maxPrice: 300000 }),
  crawlModetour({ departureCode: "ICN", maxPrice: 300000 }),
  crawlHanatour({ departureCode: "ICN", maxPrice: 300000 }),
  crawlYbtour({ departureCode: "ICN", maxPrice: 300000 }),
]);
// On a supplier HTTP 403, do not hammer the site or treat the failure as zero inventory.
// Only keep previously verified fares for up to 12 hours, visibly marked as cached.
const prior = await readFile(outputPath, "utf8").then(JSON.parse).catch(() => null);
const now = Date.now();
const kstToday = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date()).replace(/\D/g, "");
const retainedTtang = crawls[0].status === "rejected"
  ? (prior?.deals || []).filter((deal) => {
    if (deal.sourceId !== "ttang" || deal.nonstop !== true) return false;
    const checkedAt = new Date(deal.lastVerifiedAt || prior.fetchedAt).getTime();
    if (!Number.isFinite(checkedAt) || now - checkedAt > 12 * 60 * 60 * 1000 || checkedAt > now) return false;
    const availableTo = String(deal.toDate || "").replace(/\D/g, "");
    const departure = String(deal.fromDate || "").replace(/\D/g, "");
    if (deal.collection === "today-open") {
      const checkedKst = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date(checkedAt)).replace(/\D/g, "");
      return checkedKst === kstToday && availableTo >= kstToday;
    }
    return departure >= kstToday;
  }).map((deal) => ({ ...deal, stale: true, lastVerifiedAt: deal.lastVerifiedAt || prior.fetchedAt }))
  : [];
// A fulfilled HTTP request is not proof that usable, verified nonstop fares were found.
const sourceStatuses = crawls.map((result, index) => {
  const id = sources[index].id;
  if (result.status === "rejected") {
    const detail = String(result.reason?.message || result.reason || "요청 실패");
    const blocked = /HTTP 403|HTTP 429|차단|거부/.test(detail);
    return { id, status: blocked ? "blocked" : "error", fetchedCount: 0,
      publishedCount: index === 0 ? retainedTtang.length : 0, cachedCount: index === 0 ? retainedTtang.length : 0,
      reason: blocked ? "판매처에서 자동 요청을 제한합니다." : detail };
  }
  const fetchedCount = result.value.length;
  const publishedCount = result.value.filter((deal) => deal.nonstop === true).length;
  return { id, status: publishedCount ? "ok" : fetchedCount ? "unverified" : "empty",
    fetchedCount, publishedCount,
    reason: fetchedCount && !publishedCount ? "판매처 목록에서 왕복 직항 여부를 확인할 수 없어 제외했습니다." : "" };
});
for (const state of sourceStatuses) {
  console.log(`[source-status] ${state.id}: ${state.status} (fetched=${state.fetchedCount}, nonstop=${state.publishedCount}) ${state.reason}`);
}
const deals = crawls.flatMap((result, index) => {
  if (result.status === "fulfilled") return result.value.filter((deal) => deal.nonstop === true);
  console.warn(`Skipped ${sources[index].label}: ${result.reason?.message || result.reason}`);
  return index === 0 ? retainedTtang : [];
}).sort((left, right) => left.price - right.price);
if (!deals.length && crawls.every((result) => result.status === "rejected")) {
  throw new Error("모든 항공권 사이트 수집에 실패했습니다.");
}

await mkdir(dirname(outputPath), { recursive: true });
const snapshot = {
  fetchedAt: new Date().toISOString(),
  sources,
  sourceStatuses,
  criteria: { departureCodes: ["ICN", "GMP"], maxPriceExclusive: 300000, nonstopOnly: true, ttangHorizonMonths: 3 },
  deals,
};

await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
if (await saveSnapshot("deals_latest", snapshot)) console.log("Saved deals_latest to Supabase.");

console.log(`Updated ${deals.length} deals at ${outputPath}`);
