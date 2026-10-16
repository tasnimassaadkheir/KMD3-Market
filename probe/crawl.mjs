// Lists GeoSampa download folders under 12_Cadastro, looking for IPTU.
import fs from "node:fs";
const BASE = "https://download.geosampa.prefeitura.sp.gov.br/PaginasPublicas/";
const out = [];
const log = (...a) => { out.push(a.join(" ")); fs.writeFileSync("probe/crawl.txt", out.join("\n")); };
const pg = await fetch(BASE + "_SBC.aspx", {signal: AbortSignal.timeout(30000)});
const cookie = (pg.headers.getSetCookie?.() || []).map(c => c.split(";")[0]).join("; ");
async function pm(metodo, valor){
  const corpo = metodo === "pesquisaPastas" ? {nomePastaRaiz: valor} : {pNomePasta: valor};
  try{
    const r = await fetch(BASE + "_SBC.aspx/" + metodo, {method:"POST", signal: AbortSignal.timeout(30000),
      headers:{"Content-Type":"application/json; charset=utf-8", cookie}, body: JSON.stringify(corpo)});
    const t = await r.text();
    try{ return JSON.parse(t).d; }catch(e){ return "ERR " + r.status + " " + t.slice(0, 300); }
  }catch(e){ return "FAIL " + e.message; }
}
for(const [m, v] of [["pesquisaPastas", "12_Cadastro\\"], ["pesquisaPastas", "12_Cadastro"], ["pesquisaSubPastas", "12_Cadastro"],
                     ["pesquisaArquivosTemas", "12_Cadastro"], ["pesquisaPastas", "TEMAS\\12_Cadastro\\"]]){
  log(m, JSON.stringify(v), "=>", String(await pm(m, v)).slice(0, 2000));
}
