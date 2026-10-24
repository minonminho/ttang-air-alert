# 개인용 Playwright 항공권 워커

Google Flights 공개 웹 화면을 Playwright로 검색합니다. 인천(ICN) 출발, 성인 1명, 일반석, 향후 3개월 중 토요일과 일요일을 모두 포함하는 3·4·5·6일 일정(출발일 포함)이 기준입니다. 가격은 원화 왕복 총액이며 10만원 이상만 저장합니다.

일정마다 화면에 표시된 가장 저렴한 가는 편 5개를 열어 오는 편 가격과 운항 정보를 확인하고, 확인된 왕복 조합 중 최저가 5개를 저장합니다. Google의 가격은 변동될 수 있고 모든 왕복 조합의 절대 최저가를 보장하지 않습니다. 링크는 선택한 가는 편과 귀국일이 적용된 Google Flights 화면으로 연결되며, 예약 전 오는 편을 선택해야 합니다.

매일 한국시간 01:00에 GitHub Actions가 26개 도시를 순서대로 검색합니다. `quick`은 대표 일정과 저렴한 주간을, `full`은 모든 후보 일정을 검색합니다. Supabase에는 최신 스냅샷을 덮어쓰며, 공개 사이트는 GitHub의 최신 결과 파일을 읽습니다. API 키는 GitHub Repository Secrets로 관리합니다.

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

결과 로딩 시간 초과는 1회 재시도합니다. 재시도도 실패하면 해당 일정을 오류로 기록하고 다음 일정을 검색하며, 연속 3개 일정이 실패하면 그 도시 검색을 중단합니다. 일부 일정이 실패한 결과는 `partial`로 저장합니다. 결과가 전혀 없는 실패 실행은 Supabase의 기존 결과를 덮어쓰지 않습니다.
