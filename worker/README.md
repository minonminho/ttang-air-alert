# 개인용 Playwright 항공권 워커

현재는 네이버 항공권의 하코다테 테스트를 기준으로 동작합니다. 한 번에 한 도시만 순차 검색하며, 오늘부터 3개월 이내에 토요일과 일요일이 모두 포함되는 3·4·5·6일 일정(출발일 포함)을 찾고 각 기간별 최저가 3개를 반환합니다.

## 실행

```powershell
npm install
npx playwright install chromium
npm run automation
```

그 다음 브라우저에서 `http://127.0.0.1:8787/`를 열면 사이트와 워커가 같은 주소에서 실행됩니다. 운영 사이트의 HTTPS 페이지에서 로컬 HTTP 워커를 호출하면 브라우저 보안 정책에 막힐 수 있으므로, 로컬 테스트는 이 주소를 사용합니다.

도시 선택 요청:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:8787/api/search -ContentType 'application/json' -Body '{"city":"HKD"}'
```

반환된 `jobId`로 진행 상황 확인:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/jobs/<jobId>
```

CLI에서 바로 하코다테 검색을 시작하려면 `npm run automation:hkd`를 사용합니다. 네이버가 오류 화면이나 CAPTCHA를 반환하면 워커는 우회하지 않고 해당 작업을 실패 처리합니다.
