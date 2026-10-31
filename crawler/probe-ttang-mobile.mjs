// Read-only diagnostics for the official, publicly linked Ttang mobile pages.
// Requests are intentionally sequential, bounded and never retry 403 responses.
const urls = [
  "https://mm.ttang.com/ttangair/search/discount/today.do?trip=RT&gubun=T",
  "https://mm.ttang.com/ttangair/search/promotion/ttangIndex.do",
];
for (const url of urls) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: {
        accept: "text/html,application/xhtml+xml",
        "accept-language": "ko-KR,ko;q=0.9",
        "user-agent": "TtangDealRadar/0.1 (+https://github.com/minonminho/ttang-air-alert)",
      },
    });
    const html = await response.text();
    const title = html.match(/<title[^>]*>([^<]+)<\\/title>/i)?.[1] ?? "";
    const visible = html.replace(/<script\\b[\\s\\S]*?<\\/script>/gi, "")
      .replace(/<style\\b[\\s\\S]*?<\\/style>/gi, "")
      .replace(/<[^>]+>/g," ").replace(/\\s+/g," ").slice(0, 350);
    const indicators = {
      tableRows: (html.match(/<tr\\b/gi)||[]).length,
      listItems: (html.match(/<li\\b/gi)||[]).length,
      dataMasterId: (html.match(/data-masterId/gi)||[]).length,
      nonstop: (html.match(/직항|nonstop/gi)||[]).length,
      KRW: (html.match(/원|₩/g)||[]).length,
      noFares: /총\\s*0개\\s*운임|0개\\s*항공사/.test(visible),
    };
    console.log(JSON.stringify({url,status:response.status,redirected:response.redirected,finalUrl:response.url,length:html.length,title,indicators,preview:visible}));
  } catch (err) {
    console.log(JSON.stringify({url,error:String(err.message)}));
  }
}
