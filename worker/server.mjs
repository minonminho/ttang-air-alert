import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { searchGoogle, DESTINATIONS } from "./google-playwright.mjs";
import { readSnapshot, saveSnapshot } from "./supabase-store.mjs";

const port = Number(process.env.TTANG_AUTOMATION_PORT || 8787);
const host = process.env.TTANG_AUTOMATION_HOST || "127.0.0.1";
const jobs = new Map();
let runningJobId = null;
let refreshState = { status: "idle", error: null, output: "" };
const staticRoot = path.resolve(process.cwd(), "dist");
const latestResultsPath = path.resolve(process.cwd(), "worker", "data", "latest-flight-results.json");
const staticFiles = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/index.html": ["index.html", "text/html; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/styles.css": ["styles.css", "text/css; charset=utf-8"],
  "/deals.json": ["deals.json", "application/json; charset=utf-8"],
};

function sendJson(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": process.env.TTANG_ALLOWED_ORIGIN || "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error("JSON 요청 본문을 읽을 수 없습니다.")); }
    });
    request.on("error", reject);
  });
}

async function serveStatic(request, response) {
  const file = staticFiles[new URL(request.url, "http://localhost").pathname];
  if (!file) return false;
  try {
    const content = await fs.readFile(path.join(staticRoot, file[0]));
    response.writeHead(200, { "content-type": file[1] });
    response.end(content);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
  return true;
}

function createJob(destinationCode) {
  const id = crypto.randomUUID();
  const job = { id, destinationCode, destination: DESTINATIONS.get(destinationCode), status: "queued", progress: null, results: [], error: null, createdAt: new Date().toISOString() };
  jobs.set(id, job);
  return job;
}

function createAllCitiesJob(mode = "quick") {
  const id = crypto.randomUUID();
  const job = {
    id,
    type: "all-cities",
    mode,
    destinationCode: "ALL",
    destination: "전체 도시",
    status: "queued",
    progress: null,
    results: [],
    errors: [],
    createdAt: new Date().toISOString(),
  };
  jobs.set(id, job);
  return job;
}

function latestAllCitiesJob() {
  return [...jobs.values()]
    .filter((job) => job.type === "all-cities")
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))[0] || null;
}

async function saveLatestFlightResults(job, status = job.status) {
  const snapshot = {
    jobId: job.id,
    mode: job.mode || "full",
    status,
    updatedAt: new Date().toISOString(),
    progress: job.progress,
    results: job.results || [],
    errors: job.errors || [],
  };
  try {
    await fs.mkdir(path.dirname(latestResultsPath), { recursive: true });
    await fs.writeFile(latestResultsPath, JSON.stringify(snapshot));
  } catch (error) {
    console.error(`최신 항공권 결과 저장 실패: ${error.message}`);
  }
  try {
    if (await saveSnapshot("flights_latest", snapshot)) console.log("Saved flights_latest to Supabase.");
  } catch (error) {
    console.error(`Supabase flight snapshot save failed: ${error.message}`);
  }
}

async function readLatestFlightResults() {
  try {
    const remoteSnapshot = await readSnapshot("flights_latest");
    if (remoteSnapshot) return remoteSnapshot;
  } catch (error) {
    console.error(`Supabase flight snapshot read failed: ${error.message}`);
  }
  try {
    return JSON.parse(await fs.readFile(latestResultsPath, "utf8"));
  } catch {
    return { status: "empty", results: [] };
  }
}

async function runJob(job) {
  runningJobId = job.id;
  job.status = "running";
  try {
    const headless = process.env.TTANG_HEADLESS == null ? process.platform !== "win32" : process.env.TTANG_HEADLESS !== "false";
    const result = await searchGoogle({
      destinationCode: job.destinationCode,
      headless,
      onProgress: (progress) => { job.progress = progress; },
    });
    job.status = "succeeded";
    job.results = result.results;
    job.criteria = result.criteria;
    job.searchedTrips = result.searchedTrips;
  } catch (error) {
    job.status = "failed";
    job.error = error.message;
  } finally {
    job.finishedAt = new Date().toISOString();
    runningJobId = null;
  }
}

async function runAllCitiesJob(job) {
  runningJobId = job.id;
  job.status = "running";
  await saveLatestFlightResults(job);
  const destinations = [...DESTINATIONS.entries()];
  try {
    for (let index = 0; index < destinations.length; index += 1) {
      const [destinationCode, destination] = destinations[index];
      try {
        const headless = process.env.TTANG_HEADLESS == null ? process.platform !== "win32" : process.env.TTANG_HEADLESS !== "false";
        const result = await searchGoogle({
          destinationCode,
          includeAllResults: true,
          mode: job.mode,
          headless,
          onProgress: (progress) => {
            job.progress = { cityIndex: index + 1, totalCities: destinations.length, city: destination, cityCode: destinationCode, ...progress };
          },
          onResults: (items, trip) => {
            job.results.push(...items);
            job.searchedTrips = (job.searchedTrips || 0) + 1;
            job.resultCount = job.results.length;
            job.progress = { cityIndex: index + 1, totalCities: destinations.length, city: destination, cityCode: destinationCode, current: trip.index, total: trip.total, trip };
          },
        });
        if (!job.results.length && result.results.length) job.results.push(...result.results);
        job.searchedTrips = Math.max(job.searchedTrips || 0, result.searchedTrips);
        job.resultCount = job.results.length;
        await saveLatestFlightResults(job, "running");
      } catch (error) {
        job.errors.push({ destinationCode, destination, error: error.message });
        throw error;
      }
    }
    job.status = "succeeded";
    job.resultCount = job.results.length;
    await saveLatestFlightResults(job);
  } catch (error) {
    job.status = "failed";
    job.error = error.message;
    await saveLatestFlightResults(job, "failed");
  } finally {
    job.finishedAt = new Date().toISOString();
    runningJobId = null;
  }
}

function runDealsRefresh() {
  refreshState = { status: "running", error: null, output: "", startedAt: new Date().toISOString() };
  const child = spawn(process.execPath, ["crawler/update-snapshot.mjs"], { cwd: process.cwd(), env: process.env });
  child.stdout.on("data", (chunk) => { refreshState.output = `${refreshState.output}${chunk}`.slice(-4000); });
  child.stderr.on("data", (chunk) => { refreshState.output = `${refreshState.output}${chunk}`.slice(-4000); });
  child.on("error", (error) => {
    refreshState.status = "failed";
    refreshState.error = error.message;
    refreshState.finishedAt = new Date().toISOString();
  });
  child.on("close", (code) => {
    refreshState.status = code === 0 ? "succeeded" : "failed";
    if (code !== 0) refreshState.error = refreshState.output || `수집 프로세스가 종료 코드 ${code}로 끝났습니다.`;
    refreshState.finishedAt = new Date().toISOString();
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return sendJson(response, 204, {});
  if (request.method === "GET" && request.url === "/health") return sendJson(response, 200, { ok: true, runningJobId });
  if (request.method === "GET" && request.url === "/api/jobs/active") {
    const runningJob = runningJobId ? jobs.get(runningJobId) : null;
    const job = runningJob || latestAllCitiesJob();
    return sendJson(response, 200, { active: Boolean(runningJob), job });
  }
  if (request.method === "GET" && request.url === "/api/flights/latest") return sendJson(response, 200, await readLatestFlightResults());
  if (request.method === "POST" && request.url === "/api/search") {
    try {
      const body = await readBody(request);
      const destinationCode = String(body.city || "HKD").toUpperCase();
      if (!DESTINATIONS.has(destinationCode)) return sendJson(response, 400, { error: "지원하지 않는 도시입니다." });
      if (runningJobId || refreshState.status === "running") return sendJson(response, 409, { error: "이미 다른 업데이트 작업이 진행 중입니다.", jobId: runningJobId });
      const job = createJob(destinationCode);
      void runJob(job);
      return sendJson(response, 202, { jobId: job.id, status: job.status, destination: job.destination });
    } catch (error) {
      return sendJson(response, 400, { error: error.message });
    }
  }
  if (request.method === "POST" && request.url === "/api/search-all") {
    try {
      const body = await readBody(request);
      const mode = body.mode === "full" ? "full" : "quick";
      if (runningJobId || refreshState.status === "running") return sendJson(response, 409, { error: "이미 다른 업데이트 작업이 진행 중입니다." });
      const job = createAllCitiesJob(mode);
      void runAllCitiesJob(job);
      return sendJson(response, 202, { jobId: job.id, status: job.status, destination: job.destination, mode: job.mode, totalCities: DESTINATIONS.size });
    } catch (error) {
      return sendJson(response, 400, { error: error.message });
    }
  }
  const match = request.method === "GET" ? request.url.match(/^\/api\/jobs\/([^/?]+)$/) : null;
  if (match) {
    const job = jobs.get(match[1]);
    return job ? sendJson(response, 200, job) : sendJson(response, 404, { error: "검색 작업을 찾을 수 없습니다." });
  }
  if (request.method === "POST" && request.url === "/api/deals/refresh") {
    if (runningJobId || refreshState.status === "running") return sendJson(response, 409, { error: "이미 다른 업데이트 작업이 진행 중입니다." });
    runDealsRefresh();
    return sendJson(response, 202, refreshState);
  }
  if (request.method === "GET" && request.url === "/api/deals/refresh/status") return sendJson(response, 200, refreshState);
  if (request.method === "GET" && await serveStatic(request, response)) return;
  return sendJson(response, 404, { error: "Not found" });
});

server.listen(port, host, () => console.log(`항공권 자동화 워커 실행: http://${host}:${port}`));
