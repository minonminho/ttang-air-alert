#!/usr/bin/env node
// Diagnose the existing ChatGPT Sites URL without changing its hosting settings.
import { readFile, appendFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const BASE = process.env.SITES_URL || "https://ttang-air-alert.vividfox6.chatgpt.site/";
const checksum = (value) => createHash("sha256").update(value).digest("hex");
const result = {
  site: BASE,
  siteAccessible: false,
  originFilterOnSite: null,
  sourceFilterOnSite: null,
  liveJsSameAsGitHub: null,
  liveJsStatus: null,
  latestSourceHasOriginFilters: null,
  latestSourceHasSupplierStatus: null,
};

async function readUrl(url) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
    headers: { accept: "text/html,application/javascript,*/*" },
  });
  const body = await response.text();
  return { status: response.status, body, url: response.url };
}

try {
  const [sourceHtml, sourceJs] = await Promise.all([
    readFile("dist/index.html", "utf8"), readFile("dist/app.js", "utf8"),
  ]);
  result.latestSourceHasOriginFilters =
    sourceHtml.includes('id="liveDepartureFilter"') &&
    sourceHtml.includes('id="dealDepartureFilter"');
  result.latestSourceHasSupplierStatus = sourceHtml.includes('id="dealCollectionStatus"');
  result.latestJsSha256 = checksum(sourceJs).slice(0, 12);

  const live = await readUrl(BASE);
  result.siteHttp = live.status;
  result.siteAccessible = live.status === 200;
  if (live.status === 200) {
    result.originFilterOnSite =
      live.body.includes('id="liveDepartureFilter"') &&
      live.body.includes('id="dealDepartureFilter"');
    result.sourceFilterOnSite = live.body.includes('id="dealCollectionStatus"');
    const src = live.body.match(/<script\b[^>]*\bsrc=["']([^"']*app\.js(?:\?[^"']*)?)["']/i)?.[1];
    if (src) {
      const liveJsUrl = new URL(src, live.url);
      const liveJs = await readUrl(liveJsUrl);
      result.liveJsStatus = liveJs.status;
      if (liveJs.status === 200) {
        result.liveJsSameAsGitHub = liveJs.body === sourceJs;
        result.liveJsSha256 = checksum(liveJs.body).slice(0, 12);
      }
    }
  }
} catch (err) {
  result.error = String(err.message || err);
}

console.log("[sites-deployment-check] " + JSON.stringify(result, null, 2));
const status = !result.siteAccessible ? "접근 확인 불가"
  : result.originFilterOnSite && result.liveJsSameAsGitHub
    ? "사이트에 최신 김포 필터 코드 게시됨"
    : "운영 사이트가 현재 저장소 버전과 다름";
const summary = [
  "## ChatGPT Sites 운영 배포 점검",
  "",
  "사이트: " + BASE,
  "",
  "| 점검 | 결과 |",
  "| --- | --- |",
  "| 운영 사이트 응답 | " + (result.siteHttp || result.error || "확인 불가") + " |",
  "| 김포·인천 출발 필터 표시 코드 | " + String(result.originFilterOnSite) + " |",
  "| 판매처 수집 상태 표시 코드 | " + String(result.sourceFilterOnSite) + " |",
  "| 사이트 JS = 저장소 dist/app.js | " + String(result.liveJsSameAsGitHub) + " |",
  "| 운영 상태 | **" + status + "** |",
  "",
  "Sites 배포는 GitHub 커밋/Actions 게시와 별개입니다. 진단 결과가 불일치면 기존 Sites 프로젝트에서 GitHub main 업데이트 후 Deploy가 필요합니다.",
  "",
].join("\n");
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary, "utf8");
}
if (result.siteAccessible && (!result.originFilterOnSite || result.liveJsSameAsGitHub === false)) {
  console.log("::warning title=Sites 배포 버전 불일치::기존 ChatGPT Sites 프로젝트의 게시 버전을 최신 GitHub main으로 업데이트하세요.");
}
