# 개인용 Playwright 항공권 워커

Google Flights 공개 웹 화면을 Playwright로 검색합니다. 인천(ICN)에서 일본 26개 도시 + 김포(GMP)에서 도쿄 하네다(HND)·오사카 간사이(KIX) 직항, 성인 1명, 일반석, 향후 3개월 중 토요일과 일요일을 모두 포함하는 3·4·5·6일 일정(출발일 포함)이 기준입니다. 가격은 원화 왕복 총액이며 10만원 이상만 저장합니다.

일정마다 화면에 표시된 가장 저렴한 가는 편 5개를 열어 오는 편 가격과 운항 정보를 확인하고, 확인된 왕복 조합 중 최저가 5개를 저장합니다. Google의 가격은 변동될 수 있고 모든 왕복 조합의 절대 최저가를 보장하지 않습니다. 링크는 선택한 가는 편과 귀국일이 적용된 Google Flights 화면으로 연결되며, 예약 전 오는 편을 선택해야 합니다.

매일 한국시간 01:00에 GitHub Actions가 28개 노선을 6개 작업(각 4~5개 노선)으로 나누어 동시에 실행합니다. 오전 6시 전에는 당일부터, 그 뒤에는 다음 날부터 검색해 이미 출발한 당일 항공편은 건너뜁니다. `quick`은 대표 일정과 저렴한 주간을, `full`은 모든 후보 일정을 검색합니다. 마지막 작업이 검색 결과를 합쳐 `dist/flight-results.json`에 저장하고 GitHub에 게시합니다. 이후 Supabase에는 결과 건수·갱신 시각 등 작은 메타데이터(`flights_latest_meta`)만 선택적으로 저장합니다. 검색 작업과 로컬 워커는 대용량 항공권 JSON을 Supabase에 기록하지 않습니다. Supabase Secret이 없거나 저장이 실패해도 공개 파일 게시는 정상적으로 진행됩니다.

수동 `Run workflow`의 기본 범위 `test`는 인천 도쿄·하코다테, 김포 도쿄 하네다·오사카 간사이 각각 3개 일정만 검색하며, `flight-test-summary` 아티팩트로 결과를 제공합니다. 테스트는 공개 사이트와 Supabase 데이터를 덮어쓰지 않습니다. 전체 검색은 범위를 `all`로 선택합니다. 예약 실행은 항상 `all`입니다.

각 일정의 전체 검색은 최대 3분, 각 검색 단계는 300분(짧은 테스트는 15분)으로 제한하고 작업에는 340분을 허용해 체크포인트와 진단 업로드 시간을 남깁니다. 결과는 약 1분마다 체크포인트로 저장하고 캐시는 10개 일정마다 저장합니다. 다음 실행에서는 신선한 24시간 이내 캐시만 재사용합니다. 작업별 결과가 누락되면 병합 결과에 오류로 표시합니다. 전체 실행이 6시간 안에 끝난다고 보장하는 설정은 아니며, 각 작업이 한 작업당 6시간 제한을 넘지 않도록 나눈 구조입니다.

가는 편 목록으로 돌아갈 때 브라우저 뒤로가기를 사용해 반복 페이지 로딩을 줄입니다. `quick`은 가장 저렴한 가는 편 2개에서 최대 10개 왕복 조합을 확인해 그중 최저가 5개를 남깁니다. `full`은 가는 편 5개를 확인합니다. 전체 도시 검색은 6개 작업을 모두 병렬 실행합니다. 로컬 소요 시간 비교는 `node worker/benchmark-search.mjs`로 실행합니다. 작은 범위의 실제 검색은 `node worker/run-all-search.mjs --cities NRT,HKD --max-trips 3 --start-date 2026-11-28 --fresh`로 시험할 수 있습니다.

## 실행

```powershell
npm install
npx playwright install chromium
npm run automation
```

그 다음 브라우저에서 `http://127.0.0.1:8787/`를 열면 사이트와 워커가 같은 주소에서 실행됩니다. 운영 사이트의 HTTPS 페이지에서 로컬 HTTP 워커를 호출하면 브라우저 보안 정책에 막힐 수 있으므로, 로컬 테스트는 이 주소를 사용합니다.

공개 사이트에는 수동 검색 버튼이 없습니다. 오늘의 땡처리 4개 사이트 수집은 `node crawler/update-snapshot.mjs`로 별도 실행합니다.

도시 선택 요청:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:8787/api/search -ContentType 'application/json' -Body '{"city":"HKD"}'
```

반환된 `jobId`로 진행 상황 확인:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/jobs/<jobId>
```

CLI에서 하코다테 검색은 `npm run automation:hkd`로 시작합니다. 한 일정만 시험하려면 `node worker/run-search.mjs --city HKD --smoke --start-date 2026-11-06`처럼 실행합니다. Google이 접근 확인 화면을 반환하면 해당 작업을 중단합니다. 실패 진단은 `worker/data/diagnostics/`와 Actions의 `flight-search-diagnostics` 아티팩트에 남습니다.

결과 로딩 시간 초과는 1회 재시도합니다. 재시도도 실패하면 해당 일정을 오류로 기록하고 다음 일정을 검색하며, 연속 3개 일정이 실패하면 그 도시 검색을 중단합니다. 일부 일정이 실패한 결과는 `partial`로 저장합니다. 결과가 전혀 없는 실패 실행은 기존 공개 JSON을 덮어쓰지 않습니다.

## 게시 및 Supabase 메타데이터

- **공개 데이터의 기준:** GitHub의 `dist/flight-results.json`. 운영 페이지는 이 JSON을 직접 읽습니다.
- **선택적 상태 기록:** 게시 성공 후 `ttang_snapshots` 테이블의 `flights_latest_meta` 키에 `resultCount`, `errorCount`, `destinationCount`, `updatedAt`, `runId`, `status`, `publishedPath` 등을 저장합니다. 개별 운임 `results` 배열은 Supabase에 전송하지 않습니다.
- **DB 장애 처리:** 메타데이터 저장은 별도 작업으로 실행하며 실패나 Secret 누락 시 경고만 출력합니다. 검색 결과 파일을 저장하거나 GitHub에 게시하는 단계는 영향을 받지 않습니다.
- **레거시 데이터:** 기존의 `flights_latest` JSONB 행은 자동으로 삭제하지 않습니다. 기존 데이터가 필요 없다는 것을 확인한 뒤 Supabase SQL Editor에서 `delete from public.ttang_snapshots where snapshot_key = 'flights_latest';`를 선택적으로 실행할 수 있습니다.
- **진단:** 게시 단계 로그에는 파일 바이트 수와 항공권/오류 건수가, 메타데이터 단계에는 저장 상태와 소요 시간이 표시됩니다.

📌 전체 28개 노선을 즉시 갱신하려면 `.github/automation-now.trigger` 파일을 수정하면서 커밋 메시지에 `[flight-scope:all]`을 포함해 `main`에 푸시합니다. `.github/automation-test.trigger` 파일 수정은 해당 표시 없이 작은 테스트 범위만 실행합니다. 06:00 KST 이후에 실행한 검색은 이미 출발한 항공편을 제외하기 위해 다음 날 출발분부터 조회합니다.
