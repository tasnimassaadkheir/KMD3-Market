// =============================================================================
// KMD3 Market — builds the Prospecção list from São Paulo's IPTU register.
// -----------------------------------------------------------------------------
// Runs on GitHub (workflow "Atualizar prospecção"), never in the browser:
//   1. asks GeoSampa which IPTU files exist (IPTU_1995.zip … IPTU_2026.zip)
//   2. downloads the most recent one
//   3. reads the CSV inside, row by row, and groups the apartments by building
//      (setor + quadra + condominium number)
//   4. writes dados/prospeccao-sp.json: one row per building with address,
//      neighborhood, CEP, apartments, floors, year built and construction standard.
// Owner names and CPF/CNPJ are never read into the result.
//
// Usage:
//   node scripts/iptu.mjs ultimo                      -> prints the newest file name and its year
//   node scripts/iptu.mjs baixar IPTU_2026.zip a.zip  -> downloads that file
//   unzip -p a.zip | node scripts/iptu.mjs resumir > dados/prospeccao-sp.json
// =============================================================================
import fs from "node:fs";
import { pathToFileURL } from "node:url";

export const GEOSAMPA = "https://download.geosampa.prefeitura.sp.gov.br/PaginasPublicas/";
export const PASTA = "12_Cadastro\\IPTU_INTER\\XLS_CSV";
export const MIN_APTOS = 10;          // smaller buildings are left out (too small for a minimarket)

// ---------- text helpers ----------
export const normalizar = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
// "R DOUTOR NETO DE ARAUJO" -> "R Doutor Neto de Araujo"
export function titulo(txt){
  const minusculas = new Set(["de", "da", "do", "das", "dos", "e"]);
  return String(txt || "").toLowerCase().replace(/\s+/g, " ").trim().split(" ")
    .map((w, i) => (i > 0 && minusculas.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
export const formatarCep = c => { const d = String(c || "").replace(/\D/g, ""); return d.length === 8 ? d.slice(0, 5) + "-" + d.slice(5) : d; };
const inteiro = v => { const n = parseInt(String(v || "").replace(/\D/g, ""), 10); return isNaN(n) ? null : n; };

// ---------- CSV ----------
// Columns we need, found by their header text (accents/case ignored).
// Owner columns (names, CPF/CNPJ) are never looked up.
const COLUNAS = {
  contribuinte: [h => h === "numero do contribuinte", h => h === "sql", h => h.startsWith("numero do contribuinte")],
  ano:          [h => h === "ano do exercicio", h => h.startsWith("ano do exercicio")],
  condominio:   [h => h === "numero do condominio", h => h.includes("condominio")],
  logradouro:   [h => h === "nome de logradouro do imovel", h => h.includes("logradouro") && !h.includes("codlog") && !h.includes("contribuinte")],
  numero:       [h => h === "numero do imovel"],
  bairro:       [h => h === "bairro do imovel", h => h.includes("bairro") && !h.includes("contribuinte")],
  cep:          [h => h === "cep do imovel", h => h.includes("cep") && !h.includes("contribuinte")],
  uso:          [h => h === "tipo de uso do imovel", h => h.includes("tipo de uso")],
  pavimentos:   [h => h.includes("pavimentos")],
  anoConstrucao:[h => h.includes("ano da construcao")],
  padrao:       [h => h.includes("padrao da construcao")]
};
const OBRIGATORIAS = ["contribuinte", "condominio", "logradouro", "numero", "uso"];
// Finds the position of each needed column. 'faltando' = required columns not found.
export function mapearColunas(cabecalho){
  const hs = cabecalho.map(h => normalizar(String(h).replace(/^﻿/, "")));
  const cols = {};
  for(const k of Object.keys(COLUNAS)){
    for(const teste of COLUNAS[k]){ const i = hs.findIndex(teste); if(i >= 0){ cols[k] = i; break; } }
  }
  return {cols, faltando: OBRIGATORIAS.filter(k => cols[k] === undefined)};
}
// Splits one CSV line into fields. Handles quotes ("a;b" and "" inside quotes).
export function separarCampos(linha, sep){
  if(linha.indexOf('"') < 0) return linha.split(sep);
  const out = []; let cur = "", aspas = false;
  for(let i = 0; i < linha.length; i++){
    const ch = linha[i];
    if(aspas){ if(ch === '"'){ if(linha[i + 1] === '"'){ cur += '"'; i++; } else aspas = false; } else cur += ch; }
    else if(ch === '"') aspas = true;
    else if(ch === sep){ out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
// ";" or "," — whichever appears more in the header.
export const detectarSeparador = linha => (linha.split(";").length >= linha.split(",").length) ? ";" : ",";
// The taxpayer number (SQL) is setor(3) + quadra(3) + lote(4) + check digit. Apartments of one building
// share setor + quadra + condominium number (each unit has its own "lote").
// Units without a condominium number are grouped by their own lot.
export function chaveCondominio(contribuinte, condominio){
  const d = String(contribuinte || "").replace(/\D/g, "");
  if(d.length < 10) return null;
  const c = String(condominio || "").replace(/\D/g, "");
  if(c && /[1-9]/.test(c)) return d.slice(0, 6) + "-" + c;
  return d.slice(0, 10);
}
const ehApartamento = uso => /apartamento/.test(normalizar(uso));
const ehGaragem = uso => /garage/.test(normalizar(uso));

// Adds one CSV row to its building (grupos = Map key -> totals). Only apartments are counted.
export function somarLinha(grupos, campos, cols){
  const chave = chaveCondominio(campos[cols.contribuinte], campos[cols.condominio]);
  if(!chave) return false;
  const ano = cols.ano !== undefined ? (inteiro(campos[cols.ano]) || 0) : 0;
  const k = ano + "|" + chave;                         // years are kept apart; only the latest is used
  let g = grupos.get(k);
  if(!g){ g = {id:chave, ano, apartamentos:0, logradouro:"", numero:"", bairro:"", cep:"", pavimentos:null, anoConstrucao:null, padrao:""}; grupos.set(k, g); }
  const uso = campos[cols.uso];
  if(ehGaragem(uso) || !ehApartamento(uso)) return true;
  g.apartamentos++;
  if(!g.logradouro){                                   // address of the building: from its first apartment
    g.logradouro = String(campos[cols.logradouro] || "").trim();
    g.numero = String(campos[cols.numero] || "").trim().replace(/^0+(?=\d)/, "");
    if(cols.bairro !== undefined) g.bairro = String(campos[cols.bairro] || "").trim();
    if(cols.cep !== undefined) g.cep = formatarCep(campos[cols.cep]);
    if(cols.padrao !== undefined) g.padrao = String(campos[cols.padrao] || "").trim();
  }
  if(cols.pavimentos !== undefined){ const p = inteiro(campos[cols.pavimentos]); if(p && p < 200 && (!g.pavimentos || p > g.pavimentos)) g.pavimentos = p; }
  if(cols.anoConstrucao !== undefined){ const a = inteiro(campos[cols.anoConstrucao]); if(a && a > 1800 && a < 2100 && (!g.anoConstrucao || a < g.anoConstrucao)) g.anoConstrucao = a; }
  return true;
}
// Final list: latest year only, buildings with 'minimo'+ apartments, biggest first.
// Compact format for the browser: field names once, then one array per building;
// construction standards are listed once ('padroes') and referenced by position.
export function resumir(grupos, minimo = MIN_APTOS){
  let ano = 0;
  grupos.forEach(g => { if(g.ano > ano) ano = g.ano; });
  const padroes = [], idxPadrao = new Map(), linhas = [];
  grupos.forEach(g => {
    if(g.ano !== ano || g.apartamentos < minimo) return;
    let p = null;
    if(g.padrao){
      if(!idxPadrao.has(g.padrao)){ idxPadrao.set(g.padrao, padroes.length); padroes.push(g.padrao); }
      p = idxPadrao.get(g.padrao);
    }
    linhas.push([g.id, titulo(g.logradouro), g.numero, titulo(g.bairro), g.cep, g.apartamentos, g.pavimentos, g.anoConstrucao, p]);
  });
  linhas.sort((a, b) => b[5] - a[5] || String(a[0]).localeCompare(String(b[0])));
  return {
    fonte: "Cadastro do IPTU — Prefeitura de São Paulo (GeoSampa)", ano: ano || null, minimoAptos: minimo,
    geradoEm: new Date().toISOString(), total: linhas.length,
    campos: ["id", "logradouro", "numero", "bairro", "cep", "apartamentos", "pavimentos", "ano_construcao", "padrao"],
    padroes, linhas
  };
}
// Reads a CSV stream (UTF-8 or Latin-1, detected) and returns the summary.
export async function resumirStream(stream, minimo = MIN_APTOS){
  const grupos = new Map();
  let decod = null, resto = "", cols = null, sep = ";", lidas = 0;
  const processar = (texto, fim) => {
    const partes = (resto + texto).split("\n");
    resto = fim ? "" : partes.pop();
    for(let linha of partes){
      if(linha.endsWith("\r")) linha = linha.slice(0, -1);
      if(!linha.trim()) continue;
      if(!cols){
        sep = detectarSeparador(linha);
        const m = mapearColunas(separarCampos(linha, sep));
        if(m.faltando.length) throw new Error("Colunas não encontradas no CSV do IPTU: " + m.faltando.join(", "));
        cols = m.cols;
        continue;
      }
      lidas++;
      somarLinha(grupos, separarCampos(linha, sep), cols);
    }
  };
  for await (const pedaco of stream){
    const chunk = pedaco instanceof Uint8Array ? pedaco : Buffer.from(pedaco);
    if(!decod){
      // UTF-8 if the start of the file is valid UTF-8, otherwise Latin-1 (common in government files)
      try{ new TextDecoder("utf-8", {fatal:true}).decode(chunk.subarray(0, Math.min(chunk.length, 60000)), {stream:true}); decod = new TextDecoder("utf-8"); }
      catch(e){ decod = new TextDecoder("latin1"); }
    }
    processar(decod.decode(chunk, {stream:true}), false);
  }
  if(decod) processar(decod.decode(), true);
  if(!cols) throw new Error("CSV vazio");
  const r = resumir(grupos, minimo);
  r.linhasLidas = lidas;
  return r;
}

// ---------- GeoSampa ----------
// The download pages need the session cookie the site sets on its first page.
async function sessao(){
  const r = await fetch(GEOSAMPA + "_SBC.aspx", {signal: AbortSignal.timeout(60000)});
  return (r.headers.getSetCookie?.() || []).map(c => c.split(";")[0]).join("; ");
}
// Newest "IPTU_AAAA.zip" in GeoSampa's download folder (the same list the site shows).
export async function ultimoArquivo(){
  const cookie = await sessao();
  const r = await fetch(GEOSAMPA + "_SBC.aspx/pesquisaArquivos", {method:"POST", signal: AbortSignal.timeout(60000),
    headers:{"Content-Type":"application/json; charset=utf-8", cookie}, body: JSON.stringify({pNomePasta: PASTA})});
  const lista = String((await r.json()).d || "").split("|").filter(n => /^IPTU_\d{4}\.zip$/i.test(n)).sort();
  if(!lista.length) throw new Error("Nenhum arquivo IPTU_AAAA.zip encontrado no GeoSampa");
  const nome = lista[lista.length - 1];
  return {nome, ano: +nome.match(/\d{4}/)[0]};
}
// Same link the GeoSampa site builds when you click the file.
export const urlArquivo = nome => GEOSAMPA + "downloadArquivo.aspx?orig=DownloadCamadas&arq=" +
  escape(PASTA.replace(/\\/g, "\\\\") + "\\\\" + nome.replace(/\.zip$/i, "")) + "&arqTipo=XLS_CSV";

// ---------- command line ----------
if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href){
  const [cmd, a, b] = process.argv.slice(2);
  if(cmd === "ultimo"){
    const u = await ultimoArquivo();
    console.log(u.nome + " " + u.ano);
  } else if(cmd === "baixar"){
    const cookie = await sessao();
    const r = await fetch(urlArquivo(a), {headers:{cookie}});
    if(!r.ok) throw new Error("download falhou: HTTP " + r.status);
    // GeoSampa labels the zip as "text/html"; what tells it's the file is the "attachment" header.
    if(!/attachment/i.test(r.headers.get("content-disposition") || "")) throw new Error("o GeoSampa devolveu uma página em vez do arquivo");
    const { Readable } = await import("node:stream");
    const { pipeline } = await import("node:stream/promises");
    await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(b));
    const inicio = fs.readFileSync(b).subarray(0, 2).toString("latin1");
    if(inicio !== "PK") throw new Error("o arquivo baixado não é um .zip");
    console.error("baixado:", b, fs.statSync(b).size, "bytes");
  } else if(cmd === "resumir"){
    const r = await resumirStream(process.stdin, a ? +a : MIN_APTOS);
    if(!r.total) throw new Error("Nenhum prédio encontrado no arquivo");
    process.stdout.write(JSON.stringify(r));
    console.error("IPTU " + r.ano + ": " + r.linhasLidas + " linhas lidas, " + r.total + " prédios com " + r.minimoAptos + "+ apartamentos");
  } else {
    console.error("uso: node scripts/iptu.mjs ultimo | baixar <IPTU_AAAA.zip> <destino> | resumir [minimo]");
    process.exit(2);
  }
}
