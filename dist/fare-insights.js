(function fareInsightsRuntime() {
  "use strict";
  const KST_ZONE = "Asia/Seoul";
  const DAYS = ["일","월","화","수","목","금","토"];
  const state = {
    origin:"all", city:"all", duration:"all", groups:[], updatedAt:null,
    history:null, historyError:null, historyLoading:true,
    today:null, end:null, month:null, chosenDate:null, trendDays:30,
  };
  const $ = (id) => document.getElementById(id);
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g,(c)=>({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;",
  }[c]));
  const won = (amount) => "₩"+Math.round(amount).toLocaleString("ko-KR");
  function dayInSeoul(now = new Date()) {
    return new Intl.DateTimeFormat("en-CA",{
      timeZone:KST_ZONE,year:"numeric",month:"2-digit",day:"2-digit",
    }).format(now);
  }
  function parseDay(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
    const d = new Date(value+"T00:00:00Z");
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value ? d : null;
  }
  function dayKey(date) {return date.toISOString().slice(0,10);}
  function monthKey(date) {return dayKey(date).slice(0,7);}
  function monthStart(value) {
    const d = parseDay(value);
    return d ? new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)) : null;
  }
  function addDays(date, days) { return new Date(date.getTime()+days*86400000); }
  function threeMonthEnd(value) {
    const start = parseDay(value);
    if (!start) return null;
    const first = new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+3,1));
    const lastOfMonth = new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
    return dayKey(new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),Math.min(start.getUTCDate(),lastOfMonth))));
  }
  function formatDay(value) {
    const date = parseDay(value);
    return date ? `${date.getUTCMonth()+1}/${date.getUTCDate()}(${DAYS[date.getUTCDay()]})` : value;
  }
  function shortWon(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? (amount / 10000).toFixed(1).replace(/\.0$/,"")+"만" : "—";
  }
  function fareCalendarRows(groups, {origin="all",city="all",duration="all",today,end} = {}) {
    const best = new Map();
    for (const group of groups || []) {
      if ((origin !== "all" && group.departureCode !== origin)
        || (city !== "all" && group.destinationCode !== city)) continue;
      const price = Number(group.price);
      if (!Number.isFinite(price) || price < 100000 || price >= 10000000) continue;
      for (const schedule of group.schedules || []) {
        if (!parseDay(schedule.departureDate) || !parseDay(schedule.returnDate)
          || schedule.departureDate < today || schedule.departureDate > end
          || schedule.returnDate < schedule.departureDate
          || ![3,4,5,6].includes(Number(schedule.tripDays))
          || (duration !== "all" && Number(schedule.tripDays) !== Number(duration))) continue;
        const depart = parseDay(schedule.departureDate), arrive = parseDay(schedule.returnDate);
        if ((arrive.getTime()-depart.getTime())/86400000+1 !== Number(schedule.tripDays)) continue;
        const current = best.get(schedule.departureDate);
        if (!current || price < current.price) best.set(schedule.departureDate, {
          date:schedule.departureDate, returnDate:schedule.returnDate,
          tripDays:Number(schedule.tripDays),
          price, url:schedule.url, city:group.destination, cityCode:group.destinationCode,
          departureCode:group.departureCode, arrivalAirportCode:group.arrivalAirportCode,
          airline:group.airline,
        });
      }
    }
    return best;
  }
  function historicalSeries(history, {city,origin="all",duration="all",today,days=30} = {}) {
    if (!history || !Array.isArray(history.observations) || history.schemaVersion !== 1 || city === "all") return [];
    const start = addDays(parseDay(today),-(days-1));
    const minDay = dayKey(start);
    const byDay = new Map();
    for (const row of history.observations) {
      if (row.cityCode !== city || (origin !== "all" && row.departureCode !== origin)
        || (duration !== "all" && Number(row.tripDays) !== Number(duration))
        || !parseDay(row.day) || row.day < minDay || row.day > today) continue;
      const amount = Number(row.minPrice);
      if (!Number.isFinite(amount) || amount < 100000 || amount >= 10000000) continue;
      if (!byDay.has(row.day) || amount < byDay.get(row.day).price) {
        byDay.set(row.day,{day:row.day,price:amount});
      }
    }
    return [...byDay.values()].sort((a,b)=>a.day.localeCompare(b.day));
  }
  function median(values) {
    if (!values.length) return null;
    const sorted = [...values].sort((a,b)=>a-b);
    const middle = Math.floor(sorted.length/2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle-1]+sorted[middle])/2;
  }
  function calculateDealScore(series, currentPrice, today) {
    const past = series.filter((row)=>row.day < today && Number.isFinite(row.price)).map((row)=>row.price);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0 || past.length < 3) return null;
    const reference = median(past);
    if (!reference) return null;
    const difference = (reference-currentPrice)/reference*100;
    const score = Math.max(0,Math.min(100,Math.round(50+difference*2.2)));
    return {score,difference,reference,samples:past.length};
  }
  function calendarData() {
    return fareCalendarRows(state.groups,{
      origin:state.origin,city:state.city,duration:state.duration,
      today:state.today,end:state.end,
    });
  }
  function renderCityOptions() {
    const select = $("insightsCityFilter");
    if (!select) return;
    const cities = new Map(
      state.groups.filter((group)=>state.origin === "all" || group.departureCode === state.origin)
        .map((group)=>[group.destinationCode,group.destination])
    );
    if (state.city !== "all" && !cities.has(state.city)) state.city = "all";
    select.innerHTML = '<option value="all">전체 도시</option>'
      +[...cities.entries()].sort((a,b)=>String(a[1]).localeCompare(String(b[1]),"ko"))
        .map(([code,name])=>`<option value="${escape(code)}">${escape(name)} (${escape(code)})</option>`).join("");
    select.value = state.city;
    $("insightsDurationFilter").value = state.duration;
    const last = $("fareInsightsUpdated");
    if (last) {
      const d = new Date(state.updatedAt);
      last.textContent = state.updatedAt && Number.isFinite(d.getTime())
        ? `최근 검색 ${new Intl.DateTimeFormat("ko-KR",{timeZone:KST_ZONE,month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(d)}`
        : "확인된 항공권 검색 결과가 없습니다";
    }
  }
  function directCalendarSearches(groups, { date, city = "all", origin = "all", duration = "all" } = {}) {
  if (city === "all" || !parseDay(date)) return [];
  const lengths = duration === "all" ? [3, 4, 5, 6] : [Number(duration)];
  const options = new Map();
  for (const group of groups || []) {
    if (group.destinationCode !== city || (origin !== "all" && group.departureCode !== origin)) continue;
    const from = group.departureCode;
    const to = group.arrivalAirportCode || group.destinationCode;
    if (!["ICN", "GMP"].includes(from) || !/^[A-Z]{3}$/.test(String(to))) continue;
    // The existing crawler searches only these two direct Gimpo routes.
    if (from === "GMP" && !["HND", "KIX"].includes(to)) continue;
    for (const days of lengths) {
      if (![3,4,5,6].includes(days)) continue;
      const returning = dayKey(addDays(parseDay(date), days - 1));
      const query = `Nonstop round trip flights from ${from} to ${to} departing ${date} returning ${returning} for 1 adult economy`;
      const url = `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}&hl=en&curr=KRW`;
      options.set(`${from}|${to}|${days}`, { from, to, days, returning, url });
    }
  }
  return [...options.values()];
}
  function renderCalendar() {
  const container = $("fareCalendar");
  if (!container || !state.today) return;
  const d = state.month;
  const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  const rows = calendarData();
  const observations = [...rows.values()].filter((row) => row.date.startsWith(monthKey(d))).map((row) => row.price);
  const monthLow = observations.length ? Math.min(...observations) : null;
  $("fareCalendarMonth").textContent = `${d.getUTCFullYear()}년 ${d.getUTCMonth()+1}월`;
  const minMonth = monthKey(monthStart(state.today));
  const maxMonth = monthKey(monthStart(state.end));
  $("fareCalendarPrev").disabled = monthKey(d) <= minMonth;
  $("fareCalendarNext").disabled = monthKey(d) >= maxMonth;
  const cells = DAYS.map((day) => `<span class="fare-calendar-weekday">${day}</span>`);
  for (let pad = 0; pad < first.getUTCDay(); pad++) cells.push('<span class="fare-calendar-blank" aria-hidden="true"></span>');
  for (let n = 1; n <= daysInMonth; n++) {
    const value = dayKey(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), n)));
    const fare = rows.get(value);
    const selected = state.chosenDate === value;
    if (value < state.today || value > state.end) {
      cells.push(`<span class="fare-calendar-day is-outside"><span>${n}</span></span>`);
    } else if (!fare) {
      // An unobserved date is not sold out: enable manual verification instead.
      cells.push(`<button type="button" class="fare-calendar-day is-empty is-searchable${selected?" selected":""}" data-fare-date="${value}" aria-pressed="${selected}" aria-label="${value} 수집된 가격 없음, 출발일 선택 후 직접 검색"><span>${n}</span><small>검색</small></button>`);
    } else {
      const cheap = monthLow !== null && fare.price <= monthLow * 1.12;
      cells.push(`<button type="button" class="fare-calendar-day has-fare${cheap?" is-low":""}${selected?" selected":""}" data-fare-date="${value}" aria-pressed="${selected}" aria-label="${value} ${won(fare.price)}부터 왕복, ${fare.tripDays}일 일정"><span>${n}</span><strong>${shortWon(fare.price)}</strong></button>`);
    }
  }
  container.innerHTML = cells.join("");
  $("fareCalendarCoverage").textContent = `향후 3개월 중 ${rows.size}일의 왕복 직항 가격 확인 · 나머지 날짜는 직접 검색 가능 (가격 미조회 ≠ 매진). 주말 포함 3~6일 대표 일정 위주로 수집합니다.`;
  const current = rows.get(state.chosenDate);
  const detail = $("fareCalendarSelection");
  if (current) {
    const validLink = typeof current.url === "string" && /^https:\/\//.test(current.url);
    detail.innerHTML = `<div class="fare-selection-copy"><span>가격이 확인된 출발일</span><strong>${escape(formatDay(current.date))} → ${escape(formatDay(current.returnDate))} · ${current.tripDays}일</strong><small>${escape(current.departureCode==="GMP"?"김포":"인천")} → ${escape(current.city)} · ${escape(current.arrivalAirportCode)} · 확인된 검색 최저가 ${won(current.price)}</small></div>`
      + (validLink ? `<a class="fare-selection-action" href="${escape(current.url)}" target="_blank" rel="noopener noreferrer">항공권 확인 ↗</a>` : "");
  } else if (state.chosenDate && state.chosenDate >= state.today && state.chosenDate <= state.end) {
    const searches = directCalendarSearches(state.groups, {
      date:state.chosenDate, city:state.city, origin:state.origin, duration:state.duration,
    });
    const linkList = searches.map((item) => `<a class="fare-calendar-search-link" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">${item.from==="GMP"?"김포":"인천"} → ${escape(item.to)} · ${item.days}일 ↗</a>`).join("");
    const message = state.city === "all"
      ? "위의 목적지를 먼저 선택하면 이 날짜를 Google Flights에서 직접 조회할 수 있습니다."
      : searches.length
        ? "자동 수집에서 확인하지 않은 날짜입니다. 아래 링크로 실제 운임과 직항 여부를 확인하세요."
        : "선택한 조건에서 검색 경로를 확인할 수 없습니다. 목적지나 출발 공항을 변경해 주세요.";
    detail.innerHTML = `<div class="fare-selection-copy"><span>가격 미조회 · 직접 검색</span><strong>${escape(formatDay(state.chosenDate))} 출발</strong><small>${escape(message)}</small></div>${linkList?`<div class="fare-calendar-search-links">${linkList}</div>`:""}`;
  } else {
    detail.innerHTML = '<p>가격이 있는 날짜는 최저가를, 가격이 없는 날짜는 직접 검색 링크를 확인할 수 있습니다. 목적지를 선택하면 더 정확합니다.</p>';
  }
}
    function trendChart(rows) {
    if (!rows.length) return '<p class="fare-insights-empty">아직 저장된 날짜별 가격 기록이 없습니다.</p>';
    const width=610,height=205,left=65,right=20,top=20,bottom=37;
    const maxX=width-right,maxY=height-bottom;
    const values=rows.map((x)=>x.price);
    let low=Math.min(...values),high=Math.max(...values);
    const span=Math.max(30000,high-low);
    low=Math.max(0,low-span*.22);high+=span*.22;
    const days=Math.max(1,state.trendDays-1);
    const origin=addDays(parseDay(state.today),-days).getTime();
    const xFor=(date)=>left+(parseDay(date).getTime()-origin)/(86400000*days)*(maxX-left);
    const yFor=(price)=>maxY-(price-low)/(high-low)*(maxY-top);
    const points=rows.map((row)=>({x:xFor(row.day),y:yFor(row.price),day:row.day,price:row.price}));
    const coords=points.map((p)=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const labels=[0,.5,1].map((fraction)=>{
      const y=top+fraction*(maxY-top);
      const value=high-fraction*(high-low);
      return `<line x1="${left}" x2="${maxX}" y1="${y}" y2="${y}" class="fare-chart-grid"/><text x="${left-9}" y="${y+4}" class="fare-chart-label" text-anchor="end">${Math.round(value/10000)}만</text>`;
    }).join("");
    const dates=[dayKey(addDays(parseDay(state.today),-(state.trendDays-1))),state.today].map((day,index)=>
      `<text x="${index?maxX:left}" y="${height-12}" class="fare-chart-label" text-anchor="${index?"end":"start"}">${escape(day.slice(5))}</text>`).join("");
    return `<svg class="fare-history-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="지난 ${state.trendDays}일 중 ${rows.length}일 관측된 동일 조건 최저가 추이">${labels}${points.length>1?`<polyline points="${coords}" fill="none" class="fare-chart-line"/>`:""}${points.map((p)=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" class="fare-chart-point"><title>${escape(p.day)} ${won(p.price)}</title></circle>`).join("")}${dates}</svg>`;
  }
  function renderHistory() {
    const summary=$("fareTrendSummary"),chart=$("farePriceTrend"),note=$("fareTrendNote");
    if (!summary || !chart || !note) return;
    document.querySelectorAll("[data-trend-days]").forEach((button)=>{
      const selected=Number(button.dataset.trendDays)===state.trendDays;
      button.classList.toggle("active",selected);
      button.setAttribute("aria-pressed",String(selected));
    });
    if (state.city === "all") {
      summary.innerHTML = '<p class="fare-insights-empty">도시를 선택하면 해당 노선의 가격 추이와 특가 점수를 확인할 수 있습니다.</p>';
      chart.innerHTML = "";note.textContent="특가 점수는 동일 목적지·출발 공항·여행 기간의 과거 관측 최저가와 비교합니다.";
      return;
    }
    if (state.historyLoading) {
      summary.innerHTML = '<p class="fare-insights-empty">가격 기록을 불러오는 중입니다.</p>';
      chart.innerHTML = "";note.textContent="과거 날짜의 가격은 임의로 채우지 않습니다.";
      return;
    }
    if (state.historyError) {
      summary.innerHTML = '<p class="fare-insights-empty">가격 기록을 불러오지 못했습니다.</p>';
      chart.innerHTML = "";note.textContent="최신 왕복 항공권과 캘린더는 계속 사용할 수 있습니다.";
      return;
    }
    const rows = historicalSeries(state.history,{city:state.city,origin:state.origin,
      duration:state.duration,today:state.today,days:state.trendDays});
    const current = [...calendarData().values()].filter((row)=>row.cityCode===state.city)
      .sort((a,b)=>a.price-b.price)[0];
    const price = current?.price;
    const scored = calculateDealScore(rows,price,state.today);
    const oldCount = rows.filter((row)=>row.day<state.today).length;
    if (scored) {
      const cheaper = scored.difference>=0;
      const grade = scored.score>=80?"상당히 저렴":scored.score>=65?"저렴":scored.score>=45?"보통":"높은 편";
      summary.innerHTML = `<div class="fare-score"><span>특가 점수</span><strong>${scored.score}<small>/100</small></strong><span class="fare-score-grade">${grade}</span></div><div class="fare-score-copy"><span>현재 조회 최저가</span><strong>${won(price)}</strong><p>최근 ${state.trendDays}일간 이전 ${scored.samples}회 관측 중앙값 ${won(scored.reference)} 대비 <b>${Math.abs(scored.difference).toFixed(1)}% ${cheaper?"저렴":"높음"}</b></p></div>`;
    } else {
      summary.innerHTML = `<div class="fare-score fare-score-pending"><span>특가 점수</span><strong>–</strong><small>이전 관측 ${oldCount}/3일</small></div><div class="fare-score-copy"><span>현재 조회 최저가</span><strong>${price?won(price):"자료 없음"}</strong><p>이전 날짜의 가격 관측이 3일 이상 쌓이면 할인율과 점수를 표시합니다.</p></div>`;
    }
    chart.innerHTML=trendChart(rows);
    note.textContent=`관측일 ${rows.length}일 / ${state.trendDays}일 · 각 날짜의 가장 저렴한 왕복 직항 검색 결과${state.duration==="all"?" (3~6일 일정 포함)":" 중 "+state.duration+"일 일정"}. 동일 항공편 가격의 변동이 아닙니다.`;
  }
  function render() {if (!state.today) return;renderCityOptions();renderCalendar();renderHistory();}
  function init() {
    state.today=dayInSeoul();
    state.end=threeMonthEnd(state.today);
    state.month=monthStart(state.today);
    $("fareCalendarPrev")?.addEventListener("click",()=>{
      const d=state.month;state.month=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()-1,1));renderCalendar();
    });
    $("fareCalendarNext")?.addEventListener("click",()=>{
      const d=state.month;state.month=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1));renderCalendar();
    });
    $("insightsCityFilter")?.addEventListener("change",(event)=>{
      state.city=event.target.value;state.chosenDate=null;render();
    });
    $("insightsDurationFilter")?.addEventListener("change",(event)=>{
      state.duration=event.target.value;state.chosenDate=null;render();
    });
    $("fareCalendar")?.addEventListener("click",(event)=>{
      const button=event.target.closest("[data-fare-date]");
      if (!button) return;
      state.chosenDate=button.dataset.fareDate;renderCalendar();
    });
    document.querySelectorAll("[data-trend-days]").forEach((button)=>
      button.addEventListener("click",()=>{state.trendDays=Number(button.dataset.trendDays);renderHistory();}));
    render();
  }
  async function loadHistory(url) {
    state.historyLoading=true;state.historyError=null;
    try {
      const response=await fetch(url,{cache:"no-store"});
      if (response.status===404) state.history={schemaVersion:1,observations:[]};
      else if (!response.ok) throw new Error("HTTP "+response.status);
      else {
        const data=await response.json();
        if (data?.schemaVersion!==1 || !Array.isArray(data.observations)) throw new Error("가격 기록 형식 불일치");
        state.history=data;
      }
    } catch (error) {
      console.warn("[fare-insights] Price history unavailable:",error.message);
      state.historyError=error.message;
    } finally {state.historyLoading=false;renderHistory();}
  }
  window.TTANGFareInsights = {
    init,loadHistory,
    setFlights(groups,updatedAt) {
      state.groups=Array.isArray(groups)?groups:[];
      state.updatedAt=updatedAt;
      render();
    },
    setDepartureAirport(airport) {
      state.origin=["ICN","GMP"].includes(airport)?airport:"all";
      state.chosenDate=null;
      render();
    },
    testUtils:{dayInSeoul,threeMonthEnd,fareCalendarRows,historicalSeries,calculateDealScore,directCalendarSearches},
  };
})();
