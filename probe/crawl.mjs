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
const sub = await pm("pesquisaSubPastas", "12_Cadastro\\IPTU_INTER");
log("SUB IPTU_INTER =>", String(sub).slice(0, 2000));
const formatos = String(sub).split("|").map(x => x.split(":")[0]).filter(Boolean);
for(const f of formatos){
  const arqs = await pm("pesquisaArquivos", "12_Cadastro\\IPTU_INTER\\" + f);
  log("ARQ", f, "=>", String(arqs).slice(0, 3000));
  const nomes = String(arqs).split("|").filter(Boolean);
  const ultimo = nomes.sort().pop();
  if(!ultimo) continue;
  const base = ultimo.replace(/\.[^.]+$/, "");
  for(const arq of ["12_Cadastro\\\\IPTU_INTER\\\\" + f + "\\\\" + base, "12_Cadastro\\IPTU_INTER\\" + f + "\\" + base]){
    const url = BASE + "downloadIfr.aspx?orig=DownloadCamadas&arq=" + escape(arq) + "&arqTipo=" + f;
    try{
      const r = await fetch(url, {headers:{cookie}, signal: AbortSignal.timeout(60000)});
      const ct = r.headers.get("content-type"), cl = r.headers.get("content-length"), cd = r.headers.get("content-disposition");
      const reader = r.body.getReader(); const {value} = await reader.read(); reader.cancel();
      log("GET", url, "=>", r.status, ct, cl, cd, "first bytes:", value ? Buffer.from(value.slice(0, 120)).toString("latin1").replace(/[^\x20-\x7e]/g, ".") : "");
    }catch(e){ log("GET", url, "FAIL", e.message); }
  }
}
