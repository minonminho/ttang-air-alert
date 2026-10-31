# 항공권 다중 사이트 수집기

인천(ICN) 출발, 성인 기준 30만원 미만인 일본 땡처리 항공권을 사이트별로 추출합니다.

```powershell
node .\crawler\ttangair-crawler.mjs
```

모두투어의 일본 Tab 선택과 같은 `continentCode=JPN` 조건으로 수집하려면 다음 명령을 실행합니다.

```powershell
node .\crawler\modetour-crawler.mjs
```

하나투어는 공식 땡처리 항공권 페이지의 인천/김포 출발 목록에서 인천(ICN) 출발 항공권을 수집합니다.

```powershell
node .\crawler\hanatour-crawler.mjs
```

노랑풍선은 일본(J1) 도시별 할인항공권 목록을 순회해 인천(ICN) 출발 항공권을 수집합니다.

```powershell
node .\crawler\ybtour-crawler.mjs
```

네이버 항공권은 오늘의 땡처리 목록에서 제외하고, 지도 도시 패널의 개인용 Playwright 워커로 별도 검색합니다. 워커 실행 방법은 `worker/README.md`를 참고하세요.

대시보드에 표시되는 스냅샷을 최신 데이터로 갱신하려면 다음 명령을 실행합니다.

```powershell
node .\crawler\update-snapshot.mjs
```

운영 환경에서는 이 갱신 명령을 별도 Node 실행 환경에서 09:00·15:00·21:00(KST)에 실행하고, `dist/deals.json` 대신 D1이나 별도 API 저장소에 기록하는 방식으로 전환하면 됩니다.

`update-snapshot.mjs`는 현재 땡처리닷컴, 모두투어, 하나투어, 노랑풍선을 수집해 사이트별 `sourceId`와 `sourceName`을 포함한 하나의 스냅샷을 만듭니다. 네이버 항공권은 별도 Playwright 워커에서 검색합니다.

현재 수집기는 다음 값을 반환합니다.

- 출발지·도착지 및 공항 코드
- 항공사 및 항공사 코드
- 출발·도착 가능 기간
- 성인 운임
- 왕복/직항 여부
- 예약 진입 링크
- 원본 목록 URL

땡처리닷컴 예약 버튼의 실제 `href`는 `#none`이고 사이트 JS가 `ttang_inwon.do` 인원 선택 창을 만들기 때문에, `reservationUrl`은 그 동작을 재현한 예약 진입 링크입니다. 모두투어는 `stockPackageNo`를 사용하는 예약 페이지 링크를 생성하고, 하나투어는 `fareId`를 포함한 항공권 상세 링크를 생성하며, 노랑풍선은 해당 도시의 할인항공권 조회 링크를 생성하고, 네이버 항공권은 날짜·기간이 지정된 검색 링크를 생성합니다.

운영에 넣기 전에는 요청 주기·동시성·재시도 횟수를 낮게 유지하고, 사이트 이용약관과 robots 정책을 확인해야 합니다. 가격 데이터는 판매처에서 변경될 수 있으므로 알림 발송 전 재확인 단계가 필요합니다.

## 땡처리닷컴 공식 모바일 목록

기존 `www.ttang.com/ttangair/search/ttang/list.do`는 자동 요청에 HTTP 403을 반환하는 경우가 있어 다음 두 모바일 페이지를 사용합니다.

- **오늘 오픈:** `https://mm.ttang.com/ttangair/search/discount/today.do?trip=RT&gubun=T` → 공개 목록 요청 `/ttangair/search/discount/listAct.do`
- **날짜별 땡처리:** `https://mm.ttang.com/ttangair/search/promotion/ttangIndex.do` → 공개 날짜별 목록 요청 `/ttangair/search/promotion/allTtangListAct.do`

날짜별 API는 출발일 `depdate0`를 기준으로 오늘부터 **3개월 후 같은 날짜까지** 하루씩 검색합니다(월말은 마지막 날짜로 보정). 왕복(`RT`), 경유 0회(`viaCnt=0`), 일본행, 인천(ICN)/김포(GMP), 30만 원 미만만 수집하며 가격은 API의 `totalPrice`를 사용합니다. 오늘 오픈 특가의 `fromSupplyDate/toSupplyDate`는 여행일정이 아니라 **출발 가능한 기간**이며, 예약 전 판매처에서 날짜·가격을 재확인해야 합니다.

사이트가 403/429로 응답하면 재시도하거나 차단을 우회하지 않고 종료합니다. 이전에 검증한 특가가 12시간 이내이고 아직 유효한 경우에만 '이전 수집 가격' 표시와 함께 임시 보존합니다. 이 경우 데이터가 실시간 가격이라는 뜻은 아닙니다. 응답 환경에 따라 GitHub Actions에서 접근이 제한될 수 있습니다.

크롤러 단독 실행: `node crawler/ttangair-crawler.mjs` (약 3개월치 날짜별 검색).
2일 스모크 테스트: `TTANG_MAX_DAYS=2 node crawler/ttangair-crawler.mjs`.
