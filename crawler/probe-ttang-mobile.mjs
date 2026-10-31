import fs from "node:fs/promises";
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
    if (response.ok) {
      await fs.mkdir("crawler/probe-output", {recursive:true});
      await fs.writeFile(`crawler/probe-output/${url.includes("today.do") ? "today" : "index"}.html`, html);
    }
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";
    const visible = html.replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g," ").replace(/\s+/g," ").slice(0, 350);
    const indicators = {
      tableRows: (html.match(/<tr\b/gi)||[]).length,
      listItems: (html.match(/<li\b/gi)||[]).length,
      dataMasterId: (html.match(/data-masterId/gi)||[]).length,
      nonstop: (html.match(/직항|nonstop/gi)||[]).length,
      KRW: (html.match(/원|₩/g)||[]).length,
      noFares: /총\s*0개\s*운임|0개\s*항공사/.test(visible),
    };
    console.log(JSON.stringify({url,status:response.status,redirected:response.redirected,finalUrl:response.url,length:html.length,title,indicators,preview:visible}));
    if (response.ok) {
      const kind = url.includes("today.do") ? "today" : "index";
      const match = html.match(/<form\b[^>]*id=["']searchForm["'][\s\S]*?<\/form>/i);
      if (!match) throw new Error("No search form present");
      const form = new URLSearchParams();
      for (const field of match[0].match(/<input\b[^>]*>/gi) || []) {
        const name = field.match(/\bname=["']([^"']+)["']/i)?.[1];
        const value = field.match(/\bvalue=["']([^"']*)["']/i)?.[1] || "";
        if (name) form.set(name,value.replaceAll("&amp;","&"));
      }
      form.set("trip","RT");
      const endpoint = kind === "today" ? "/ttangair/search/discount/listAct.do" : "/ttangair/search/promotion/allTtangListAct.do";
      const tests = kind === "today" ? ["default"] : ["default","future"];
      for (const date of tests) {
        const postForm = new URLSearchParams(form);
        if (date === "future") {
          const d = new Date(); d.setUTCMonth(d.getUTCMonth()+2);
          postForm.set("depdate0",`${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,"0")}${String(d.getUTCDate()).padStart(2,"0")}`);
        }
        try {
          const apiResponse = await fetch(new URL(endpoint,url), {
            method:"POST",signal:AbortSignal.timeout(12000),
            headers:{
              "content-type":"application/x-www-form-urlencoded; charset=UTF-8",
              "accept":"application/xml,text/xml,*/*",
              "x-requested-with":"XMLHttpRequest",
              "referer":url,
              "user-agent":"TtangDealRadar/0.1 (+https://github.com/minonminho/ttang-air-alert)",
            },
            body: postForm,
          });
          const xml=await apiResponse.text();
          if (apiResponse.ok) await fs.writeFile(`crawler/probe-output/api-${kind}-${date}.xml`,xml);
          console.log(JSON.stringify({endpoint,date,depdate0:postForm.get("depdate0"),status:apiResponse.status,len:xml.length,preview:xml.slice(0,1200)}));
        } catch(error) {console.log(JSON.stringify({endpoint,date,error:String(error.message)}));}
      }
    }
  } catch (err) {
    console.log(JSON.stringify({url,error:String(err.message)}));
  }
}
