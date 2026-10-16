// Lists GeoSampa download folders (TEMAS) looking for IPTU, then tests a download.
import fs from "node:fs";
const BASE = "https://download.geosampa.prefeitura.sp.gov.br/PaginasPublicas/";
const out = [];
const log = (...a) => { out.push(a.join(" ")); };
let cookie = "";
const pg = await fetch(BASE + "_SBC.aspx");
cookie = (pg.headers.getSetCookie?.() || []).map(c => c.split(";")[0]).join("; ");
log("cookie", cookie ? "yes" : "no", pg.status);
async function pm(metodo, pNomePasta){
  const r = await fetch(BASE + "_SBC.aspx/" + metodo, {method:"POST", headers:{"Content-Type":"application/json; charset=utf-8", cookie},
    body: JSON.stringify({pNomePasta})});
  const t = await r.text();
  try{ return JSON.parse(t).d; }catch(e){ return "ERR " + r.status + " " + t.slice(0, 200); }
}
const temas = await pm("pesquisaSubPastas", "TEMAS");
log("TEMAS:", temas);
const nomes = String(temas).split("|").map(x => x.split(":")[0]).filter(Boolean);
for(const t of nomes){
  const pastas = await pm("pesquisaPastas", t + "\\");
  log("PASTAS", t, "=>", String(pastas).slice(0, 1500));
  if(!/cadastr|iptu/i.test(t + pastas)) continue;
  for(const p of String(pastas).split("|").map(x => x.split(":")[0]).filter(Boolean)){
    const sub = await pm("pesquisaSubPastas", t + "\\" + p);
    log("  SUB", t + "\\" + p, "=>", String(sub).slice(0, 800));
    for(const s of String(sub).split("|").slice(1).map(x => x.split(":")[0]).filter(Boolean)){
      const arqs = await pm("pesquisaArquivos", t + "\\" + p + "\\" + s);
      log("    ARQ", t + "\\" + p + "\\" + s, "=>", String(arqs).slice(0, 1500));
    }
    const arqT = await pm("pesquisaArquivosTemas", t + "\\" + p);
    log("  ARQTEMAS", t + "\\" + p, "=>", String(arqT).slice(0, 1500));
  }
}
fs.writeFileSync("probe/crawl.txt", out.join("\n"));
