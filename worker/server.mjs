import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { searchNaver, DESTINATIONS } from "./naver-playwright.mjs";

const port = Number(process.env.TTANG_AUTOMATION_PORT || 8787);
const host = process.env.TTANG_AUTOMATION_HOST || "127.0.0.1";
const jobs = new Map();
let runningJobId = null;
const staticRoot = path.resolve(process.cwd(), "dist");
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

async function runJob(job) {
  runningJobId = job.id;
  job.status = "running";
  try {
    const result = await searchNaver({
      destinationCode: job.destinationCode,
      headless: process.env.TTANG_HEADLESS !== "false",
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

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return sendJson(response, 204, {});
  if (request.method === "GET" && request.url === "/health") return sendJson(response, 200, { ok: true, runningJobId });
  if (request.method === "POST" && request.url === "/api/search") {
    try {
      const body = await readBody(request);
      const destinationCode = String(body.city || "HKD").toUpperCase();
      if (!DESTINATIONS.has(destinationCode)) return sendJson(response, 400, { error: "지원하지 않는 도시입니다." });
      if (runningJobId) return sendJson(response, 409, { error: "이미 다른 항공권 검색이 진행 중입니다.", jobId: runningJobId });
      const job = createJob(destinationCode);
      void runJob(job);
      return sendJson(response, 202, { jobId: job.id, status: job.status, destination: job.destination });
    } catch (error) {
      return sendJson(response, 400, { error: error.message });
    }
  }
  const match = request.method === "GET" ? request.url.match(/^\/api\/jobs\/([^/?]+)$/) : null;
  if (match) {
    const job = jobs.get(match[1]);
    return job ? sendJson(response, 200, job) : sendJson(response, 404, { error: "검색 작업을 찾을 수 없습니다." });
  }
  if (request.method === "GET" && await serveStatic(request, response)) return;
  return sendJson(response, 404, { error: "Not found" });
});

server.listen(port, host, () => console.log(`항공권 자동화 워커 실행: http://${host}:${port}`));
