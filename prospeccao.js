/* ================= prospecção (IPTU de São Paulo) ================= */
// =============================================================================
// KMD3 Market — prospecting page (prospeccao.js)   ☰ → Prospecção
// -----------------------------------------------------------------------------
// Finds residential condominiums in São Paulo and how many apartments each has,
// using the city's open IPTU (property tax) register from GeoSampa.
//
// How it works:
//  1. Someone downloads the IPTU CSV from GeoSampa (one row per property in the city)
//     and clicks "Importar arquivo do IPTU".
//  2. The browser reads the file ON THIS COMPUTER, row by row, and groups the
//     apartments by condominium (same block + same condominium number).
//  3. Only the summary is saved — one row per condominium: address, neighborhood,
//     CEP, number of apartments, floors, year built. Owner names and CPF/CNPJ
//     are never read into the summary or saved.
//  4. The summary goes to the Supabase table "prospeccao_sp" (whole team sees it).
//     If that table doesn't exist yet, it's kept in this browser (IndexedDB).
//  5. Search by street, neighborhood or CEP. Results appear in a list AND on a map:
//     the IPTU file has no coordinates, so each building is looked up once by its
//     address (OpenStreetMap) and the position is saved with it.
//  6. "+ Funil" turns a building into a card in "Futura Prospecção", with the address
//     and the number of apartments already filled in.
//
// Depends on mapa.js (window.__geo: address lookup and Leaflet) and on app.js (normalizarNome, escapar, avisar, leads, gravarLead, desenhar,
// abrirPainel, NUVEM, sb, gerarId, agora, meuNome, perm, negar, tabelaNaoExiste),
// so it's loaded after both.
// =============================================================================
(function(){
  "use strict";
  const $p = s => document.querySelector(s);
  const TABELA = "prospeccao_sp";
  const LIMITE = 100;                 // max rows shown (and placed on the map) at once, biggest first
  const MIN_APTOS = 2;                // a "condominium" needs at least 2 apartments
  const CHAVE_ADICIONADOS = "quitandinha:prospAdicionados";

  // ---------- state ----------
  let SEM_TABELA = false;             // true -> summary kept in this browser
  let locais = null;                  // summary kept in this browser (array of rows)
  let meta = null;                    // {ano, total, importadoEm}
  let resultados = [], totalFiltrado = 0;
  let adicionados = {};               // prospecting id -> condo id, for rows added to the funnel here
  try{ adicionados = JSON.parse(localStorage.getItem(CHAVE_ADICIONADOS) || "{}") || {}; }catch(e){ adicionados = {}; }

  /* ---------- reading the CSV ---------- */

  // Which CSV columns we need, found by their header text (accents and case ignored).
  // Each entry: list of tests, tried in order; the first matching header wins.
  // Columns with owner data (names, CPF/CNPJ) are never looked up.
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
  const NOMES_COLUNAS = {contribuinte:"NUMERO DO CONTRIBUINTE", condominio:"NUMERO DO CONDOMINIO",
    logradouro:"NOME DE LOGRADOURO DO IMOVEL", numero:"NUMERO DO IMOVEL", uso:"TIPO DE USO DO IMOVEL"};

  // Finds the position of each needed column in the header line.
  // Returns {cols, faltando}: 'faltando' lists required columns that weren't found.
  function mapearColunas(cabecalho){
    const hs = cabecalho.map(h => normalizarNome(String(h).replace(/^﻿/, "")));
    const cols = {};
    Object.keys(COLUNAS).forEach(k => {
      for(const teste of COLUNAS[k]){
        const i = hs.findIndex(teste);
        if(i >= 0){ cols[k] = i; break; }
      }
    });
    return {cols, faltando: OBRIGATORIAS.filter(k => cols[k] === undefined)};
  }
  // Splits one CSV line into fields. Handles quotes ("a;b" and "" inside quotes).
  function separarCampos(linha, sep){
    if(linha.indexOf('"') < 0) return linha.split(sep);      // fast path: most lines
    const out = []; let cur = "", aspas = false;
    for(let i = 0; i < linha.length; i++){
      const ch = linha[i];
      if(aspas){
        if(ch === '"'){ if(linha[i+1] === '"'){ cur += '"'; i++; } else aspas = false; }
        else cur += ch;
      }
      else if(ch === '"') aspas = true;
      else if(ch === sep){ out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  }
  // ";" or "," — whichever appears more in the header.
  function detectarSeparador(linha){
    return (linha.split(";").length >= linha.split(",").length) ? ";" : ",";
  }
  // Groups the units of the same condominium.
  // The taxpayer number (SQL) is setor(3) + quadra(3) + lote(4) + check digit. Apartments of
  // one building share setor + quadra + condominium number (each unit has its own "lote").
  // Units without a condominium number are grouped by their own lot (usually 1 unit).
  function chaveCondominio(contribuinte, condominio){
    const d = String(contribuinte||"").replace(/\D/g, "");
    if(d.length < 10) return null;
    const c = String(condominio||"").replace(/\D/g, "");
    if(c && /[1-9]/.test(c)) return d.slice(0,6) + "-" + c;
    return d.slice(0,10);
  }
  const ehApartamento = uso => /apartamento/.test(normalizarNome(uso));
  const ehGaragem = uso => /garage/.test(normalizarNome(uso));
  const inteiro = v => { const n = parseInt(String(v||"").replace(/\D/g, ""), 10); return isNaN(n) ? null : n; };
  // "R DOUTOR NETO DE ARAUJO" -> "R Doutor Neto de Araujo" (small words stay lowercase)
  function titulo(txt){
    const minusculas = new Set(["de","da","do","das","dos","e"]);
    return String(txt||"").toLowerCase().replace(/\s+/g, " ").trim().split(" ")
      .map((w, i) => (i > 0 && minusculas.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
  const formatarCep = c => { const d = String(c||"").replace(/\D/g, ""); return d.length === 8 ? d.slice(0,5) + "-" + d.slice(5) : d; };

  // Adds one CSV row to its group (grupos = Map key -> totals). Returns true if the row was used.
  function somarLinha(grupos, campos, cols){
    const chave = chaveCondominio(campos[cols.contribuinte], campos[cols.condominio]);
    if(!chave) return false;
    const ano = cols.ano !== undefined ? (inteiro(campos[cols.ano]) || 0) : 0;
    const k = ano + "|" + chave;                                // years are kept apart; only the latest is used
    let g = grupos.get(k);
    if(!g){ g = {id:chave, ano, apartamentos:0, unidades:0, garagens:0, logradouro:"", numero:"", bairro:"", cep:"",
                 pavimentos:null, anoConstrucao:null, padrao:""}; grupos.set(k, g); }
    const uso = campos[cols.uso];
    if(ehGaragem(uso)) g.garagens++;
    else g.unidades++;
    if(!ehApartamento(uso)) return true;
    g.apartamentos++;
    if(!g.logradouro){                                          // address of the building: from its first apartment
      g.logradouro = String(campos[cols.logradouro]||"").trim();
      g.numero = String(campos[cols.numero]||"").trim().replace(/^0+(?=\d)/, "");
      if(cols.bairro !== undefined) g.bairro = String(campos[cols.bairro]||"").trim();
      if(cols.cep !== undefined) g.cep = formatarCep(campos[cols.cep]);
      if(cols.padrao !== undefined) g.padrao = String(campos[cols.padrao]||"").trim();
    }
    if(cols.pavimentos !== undefined){ const p = inteiro(campos[cols.pavimentos]); if(p && (!g.pavimentos || p > g.pavimentos)) g.pavimentos = p; }
    if(cols.anoConstrucao !== undefined){ const a = inteiro(campos[cols.anoConstrucao]); if(a && a > 1800 && (!g.anoConstrucao || a < g.anoConstrucao)) g.anoConstrucao = a; }
    return true;
  }
  // Turns the groups into the summary rows: latest year only, condominiums with 2+ apartments.
  function resumir(grupos){
    let ano = 0;
    grupos.forEach(g => { if(g.ano > ano) ano = g.ano; });
    const linhas = [];
    grupos.forEach(g => {
      if(g.ano !== ano || g.apartamentos < MIN_APTOS) return;
      const logradouro = titulo(g.logradouro), bairro = titulo(g.bairro);
      linhas.push({
        id:g.id, logradouro, numero:g.numero, bairro, cep:g.cep,
        apartamentos:g.apartamentos, unidades:g.unidades, pavimentos:g.pavimentos, ano_construcao:g.anoConstrucao,
        padrao:g.padrao, ano_iptu:ano || null,
        busca:normalizarNome([logradouro, g.numero, bairro, g.cep, g.cep.replace(/\D/g,"")].join(" "))
      });
    });
    linhas.sort((a,b) => b.apartamentos - a.apartamentos);
    return {linhas, ano};
  }
  // Reads the whole file in pieces (it can have millions of rows), reporting progress 0..1.
  // The text encoding is detected (UTF-8, or the older Windows/Latin-1 used by many government files).
  async function processarArquivo(arquivo, aoProgresso){
    const leitor = arquivo.stream().getReader();
    const grupos = new Map();
    let decodificador = null, resto = "", lidos = 0, cols = null, sep = ";", linhasLidas = 0, ultimaPausa = 0;
    const processarLinhas = (texto, fim) => {
      const partes = (resto + texto).split("\n");
      resto = fim ? "" : partes.pop();
      for(let linha of partes){
        if(linha.endsWith("\r")) linha = linha.slice(0, -1);
        if(!linha.trim()) continue;
        if(!cols){
          sep = detectarSeparador(linha);
          const m = mapearColunas(separarCampos(linha, sep));
          if(m.faltando.length){
            const err = new Error("colunas"); err.faltando = m.faltando.map(k => NOMES_COLUNAS[k] || k); throw err;
          }
          cols = m.cols;
          continue;
        }
        linhasLidas++;
        somarLinha(grupos, separarCampos(linha, sep), cols);
      }
    };
    while(true){
      const {done, value} = await leitor.read();
      if(done) break;
      if(!decodificador){
        try{ new TextDecoder("utf-8", {fatal:true}).decode(value, {stream:true}); decodificador = new TextDecoder("utf-8"); }
        catch(e){ decodificador = new TextDecoder("windows-1252"); }
      }
      processarLinhas(decodificador.decode(value, {stream:true}), false);
      lidos += value.length;
      if(lidos - ultimaPausa > 2*1024*1024){                     // let the screen update every ~2 MB
        ultimaPausa = lidos;
        aoProgresso(arquivo.size ? lidos / arquivo.size : 0);
        await new Promise(r => setTimeout(r, 0));
      }
    }
    if(decodificador) processarLinhas(decodificador.decode(), true);
    else if(resto) processarLinhas("", true);
    if(!cols){ const err = new Error("vazio"); err.vazio = true; throw err; }
    return Object.assign(resumir(grupos), {linhasLidas});
  }

  /* ---------- where the summary is kept ---------- */

  // Small key/value storage in this browser (IndexedDB holds much more than localStorage).
  function abrirIDB(){
    return new Promise((ok, erro) => {
      const r = indexedDB.open("kmd3market", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("kv");
      r.onsuccess = () => ok(r.result);
      r.onerror = () => erro(r.error);
    });
  }
  async function idbGet(chave){
    const db = await abrirIDB();
    return new Promise((ok, erro) => { const t = db.transaction("kv").objectStore("kv").get(chave); t.onsuccess = () => ok(t.result); t.onerror = () => erro(t.error); });
  }
  async function idbSet(chave, valor){
    const db = await abrirIDB();
    return new Promise((ok, erro) => { const t = db.transaction("kv", "readwrite").objectStore("kv").put(valor, chave); t.onsuccess = () => ok(); t.onerror = () => erro(t.error); });
  }
  const usarNuvem = () => NUVEM && !SEM_TABELA;
  // Saves the browser copy (after a new import or new map positions).
  async function guardarLocais(){
    try{ await idbSet("prospeccao_sp", {linhas: locais, meta}); }
    catch(e){ avisar("Não consegui guardar os dados neste navegador; eles ficam só até fechar a página.", true); }
  }
  let tGuardar = null;
  const guardarLocaisDepois = () => { clearTimeout(tGuardar); tGuardar = setTimeout(guardarLocais, 1500); };

  async function carregarLocais(){
    if(locais) return;
    try{ const v = await idbGet("prospeccao_sp"); locais = (v && v.linhas) || []; meta = (v && v.meta) || null; }
    catch(e){ locais = []; }
  }
  // Loads the "IPTU year X · N condominiums · imported on" line.
  async function carregarMeta(){
    if(usarNuvem()){
      const r = await sb.from(TABELA).select("ano_iptu,importado_em", {count:"exact"}).order("importado_em", {ascending:false}).limit(1);
      if(!r.error){ meta = r.count ? {ano:(r.data[0]||{}).ano_iptu, total:r.count, importadoEm:(r.data[0]||{}).importado_em} : null; return; }
      if(tabelaNaoExiste(r.error, TABELA)) SEM_TABELA = true; else throw r.error;
    }
    await carregarLocais();
    if(meta) meta.total = locais.length;
  }
  // Saves a new import. Map positions already found are KEPT (same id = same building):
  // in the database, rows are upserted without the position columns, then rows that
  // were not in the new file are removed. aoProgresso(text) shows the step.
  async function salvarResumo(linhas, ano, aoProgresso){
    const agoraIso = new Date().toISOString();
    if(usarNuvem()){
      const lote = 1000;
      for(let i = 0; i < linhas.length; i += lote){
        aoProgresso("Enviando para o banco… " + Math.min(i + lote, linhas.length).toLocaleString("pt-BR") + " de " + linhas.length.toLocaleString("pt-BR"));
        const {error} = await sb.from(TABELA).upsert(linhas.slice(i, i + lote).map(l => Object.assign({}, l, {importado_em:agoraIso})), {onConflict:"id"});
        if(error){ if(tabelaNaoExiste(error, TABELA)){ SEM_TABELA = true; break; } throw error; }
      }
      if(usarNuvem()){
        const del = await sb.from(TABELA).delete().lt("importado_em", agoraIso);   // buildings no longer in the register
        if(del.error) throw del.error;
        meta = {ano, total:linhas.length, importadoEm:agoraIso};
        return;
      }
      avisar("A prospecção fica só neste navegador até criar a tabela no Supabase (veja database/schema.sql).", true);
    }
    await carregarLocais();
    const antigos = new Map((locais || []).map(l => [l.id, l]));
    linhas.forEach(l => {
      const a = antigos.get(l.id);
      if(a && a.geo_em){ l.lat = a.lat; l.lng = a.lng; l.geo_precisao = a.geo_precisao; l.geo_em = a.geo_em; }
    });
    locais = linhas;
    meta = {ano, total:linhas.length, importadoEm:agoraIso};
    await guardarLocais();
  }
  // Search: every word must appear (street, number, neighborhood or CEP); minimum apartments;
  // optionally only condos already placed inside an area of the map (area = {s, n, w, e}).
  async function buscar(texto, minimo, area){
    const palavras = normalizarNome(texto).split(" ").filter(Boolean);
    if(usarNuvem()){
      let q = sb.from(TABELA).select("*", {count:"exact"}).order("apartamentos", {ascending:false}).limit(LIMITE);
      palavras.forEach(w => { q = q.ilike("busca", "%" + w.replace(/[%_\\]/g, "") + "%"); });
      if(minimo) q = q.gte("apartamentos", minimo);
      if(area) q = q.gte("lat", area.s).lte("lat", area.n).gte("lng", area.w).lte("lng", area.e);
      const r = await q;
      if(!r.error){ resultados = r.data || []; totalFiltrado = r.count || resultados.length; return; }
      if(tabelaNaoExiste(r.error, TABELA)) SEM_TABELA = true; else throw r.error;
    }
    await carregarLocais();
    const todos = locais.filter(l => (!minimo || l.apartamentos >= minimo) && palavras.every(w => l.busca.includes(w)) &&
      (!area || (l.lat != null && l.lat >= area.s && l.lat <= area.n && l.lng >= area.w && l.lng <= area.e)));
    totalFiltrado = todos.length;
    resultados = todos.slice(0, LIMITE);
  }

  /* ---------- finding each building on the map ---------- */
  // The IPTU file has no coordinates, only the address. Each building is looked up ONCE
  // (OpenStreetMap's Nominatim, 1 per second, shared with the main map) and the position is
  // saved with the row — in the database the whole team benefits from it.
  // Street types in the register are abbreviated: "R", "AV", "AL"… Nominatim wants them written out.
  const TIPOS_LOGRADOURO = {r:"Rua", av:"Avenida", al:"Alameda", tv:"Travessa", pc:"Praça", pca:"Praça", est:"Estrada",
    lg:"Largo", vd:"Viaduto", rod:"Rodovia", pq:"Parque", vl:"Vila", pte:"Ponte", esc:"Escadaria", bc:"Beco", vel:"Viela"};
  const TITULOS = {dr:"Doutor", dra:"Doutora", prof:"Professor", profa:"Professora", eng:"Engenheiro", gal:"General", gen:"General",
    cel:"Coronel", cap:"Capitão", brig:"Brigadeiro", mal:"Marechal", des:"Desembargador", pres:"Presidente", sen:"Senador",
    dep:"Deputado", ver:"Vereador", min:"Ministro", cons:"Conselheiro", com:"Comendador", pe:"Padre", sta:"Santa", sto:"Santo",
    s:"São", maj:"Major", ten:"Tenente", alm:"Almirante", gov:"Governador", arq:"Arquiteto", mons:"Monsenhor", frei:"Frei"};
  function expandirLogradouro(logradouro){
    const ps = String(logradouro||"").trim().split(/\s+/).filter(Boolean);
    return ps.map((p, i) => {
      const k = normalizarNome(p).replace(/\.$/, "");
      if(i === 0 && TIPOS_LOGRADOURO[k]) return TIPOS_LOGRADOURO[k];
      if(i > 0 && i < ps.length - 1 && TITULOS[k]) return TITULOS[k];
      return p;
    }).join(" ");
  }
  // Search texts, from the most precise to the least: street + number, then the street alone.
  function consultasMapa(l){
    const rua = expandirLogradouro(l.logradouro);
    if(!rua) return [];
    const out = [];
    if(l.numero) out.push({q: rua + ", " + l.numero + ", São Paulo, SP, Brasil", precisao: "numero"});
    out.push({q: rua + (l.bairro ? ", " + l.bairro : "") + ", São Paulo, SP, Brasil", precisao: "rua"});
    return out;
  }
  // Needs a lookup if never tried, or not found and the last try was over 30 days ago.
  const precisaLocalizar = l => !l.geo_em || (l.lat == null && Date.now() - new Date(l.geo_em) > 30*86400000);
  let filaGeo = [], geoRodando = false, geoFeitos = 0, geoTotal = 0, geoFalhaRede = false;
  function localizar(lista){
    lista.forEach(l => { if(precisaLocalizar(l) && !filaGeo.includes(l)) filaGeo.push(l); });
    geoTotal = geoFeitos + filaGeo.length;
    rodarGeo();
  }
  async function salvarPosicao(l){
    if(usarNuvem()){
      const {error} = await sb.from(TABELA).update({lat:l.lat, lng:l.lng, geo_precisao:l.geo_precisao, geo_em:l.geo_em}).eq("id", l.id);
      if(error && !tabelaNaoExiste(error, TABELA)) console.warn("prospecção: posição não salva", error);
      return;
    }
    const orig = (locais || []).find(x => x.id === l.id);
    if(orig && orig !== l) Object.assign(orig, {lat:l.lat, lng:l.lng, geo_precisao:l.geo_precisao, geo_em:l.geo_em});
    guardarLocaisDepois();
  }
  async function rodarGeo(){
    if(geoRodando || !window.__geo) return;
    geoRodando = true; geoFalhaRede = false;
    try{
      while(filaGeo.length){
        if(!aberto()){ filaGeo = []; break; }               // page closed: stop looking up
        renderGeoStatus();
        const l = filaGeo[0];
        let achou = null, precisao = null;
        for(const c of consultasMapa(l)){
          achou = await window.__geo.buscar(c.q);
          if(achou){ precisao = c.precisao; break; }
        }
        filaGeo.shift(); geoFeitos++;
        Object.assign(l, achou ? {lat:achou.lat, lng:achou.lng, geo_precisao:precisao} : {lat:null, lng:null, geo_precisao:null},
          {geo_em: new Date().toISOString()});
        salvarPosicao(l);
        desenharMarcadores();
        atualizarItem(l);
      }
    }catch(e){ geoFalhaRede = true; filaGeo = []; }
    geoRodando = false; geoFeitos = 0; geoTotal = 0;
    if(!usarNuvem() && tGuardar){ clearTimeout(tGuardar); tGuardar = null; guardarLocais(); }   // save the new positions now
    renderGeoStatus();
    if(!movidoPeloUsuario) enquadrar();
  }
  function renderGeoStatus(){
    const el = $p("#prGeoStatus"); if(!el) return;
    if(geoRodando && geoTotal) el.textContent = "📍 Localizando no mapa… " + geoFeitos + " de " + geoTotal + " (1 por segundo; fica salvo para a próxima vez)";
    else if(geoFalhaRede) el.textContent = "⚠️ Não consegui localizar no mapa agora (sem internet?).";
    else {
      const sem = resultados.filter(l => l.geo_em && l.lat == null).length;
      el.textContent = sem ? sem + " endereço(s) não encontrado(s) no mapa — use o link do Google Maps." : "";
    }
  }

  /* ---------- the map ---------- */
  let L = null, mapa = null, camada = null, marcadores = new Map(), movidoPeloUsuario = false, programatico = false;
  async function iniciarMapa(){
    if(mapa) return true;
    if(!window.__geo) return false;
    try{ L = await window.__geo.leaflet(); }catch(e){ return false; }
    mapa = L.map("prMapa", {zoomControl:false, preferCanvas:true}).setView([-23.55, -46.63], 11);
    L.control.zoom({position:"bottomleft"}).addTo(mapa);
    window.__geo.fundo(mapa);
    camada = L.layerGroup().addTo(mapa);
    mapa.on("dragstart", () => { movidoPeloUsuario = true; });
    mapa.on("zoomstart", () => { if(!programatico) movidoPeloUsuario = true; });
    mapa.on("moveend", () => { if($p("#prArea").checked && !programatico) agendarBusca(); });
    mapa.on("popupopen", e => {
      const el = e.popup.getElement && e.popup.getElement(); if(!el) return;
      el.querySelectorAll("[data-pr-add]").forEach(b => b.onclick = () => { mapa.closePopup(); adicionarAoFunil(b.dataset.prAdd); });
      el.querySelectorAll("[data-pr-abrir]").forEach(b => b.onclick = () => { mapa.closePopup(); abrirPainel(b.dataset.prAbrir); });
      el.querySelectorAll("[data-pr-rota]").forEach(b => b.onclick = () => { mapa.closePopup(); alternarRota(b.dataset.prRota); });
    });
    return true;
  }
  // Bigger circle = more apartments. Gold = not in the funnel yet, green = already a card.
  const raio = n => Math.max(6, Math.min(16, 4 + Math.sqrt(n || 0) * 0.7));
  function popupHtml(l){
    const ja = leadDoFunil(l);
    const info = [l.bairro, l.pavimentos ? l.pavimentos + " andares" : "", l.ano_construcao ? "construído em " + l.ano_construcao : "", l.padrao]
      .filter(Boolean).map(escapar).join(" · ");
    return '<div class="pr-pop">'+
      '<b>'+escapar(nomeRua(l))+'</b>'+
      '<span class="pr-pop-aptos">'+num(l.apartamentos)+' apartamentos</span>'+
      (info ? '<span>'+info+'</span>' : '')+
      (l.geo_precisao === "rua" ? '<span class="pr-pop-aprox">Posição aproximada (só a rua foi encontrada)</span>' : '')+
      '<div class="pr-pop-acoes">'+
        (ja ? '<button type="button" class="pr-no-funil" data-pr-abrir="'+escapar(ja.id)+'">✓ No funil — abrir</button>'
            : '<button type="button" class="pr-add" data-pr-add="'+escapar(l.id)+'">+ Adicionar ao funil</button>')+
        botaoRota(l)+
        '<a href="'+escapar(linkGoogle(l))+'" target="_blank" rel="noopener">Google Maps</a>'+
      '</div></div>';
  }
  function desenharMarcadores(){
    if(!mapa) return;
    camada.clearLayers(); marcadores.clear();
    resultados.forEach(l => {
      if(l.lat == null || l.lng == null) return;
      const ja = !!leadDoFunil(l);
      const m = L.circleMarker([l.lat, l.lng], {radius: raio(l.apartamentos), color: ja ? "#1d6e40" : "#8a6424", weight: 2,
        fillColor: ja ? "#2FA45F" : "#D4A85C", fillOpacity: l.geo_precisao === "rua" ? .45 : .85, dashArray: l.geo_precisao === "rua" ? "3 3" : null})
        .bindPopup(popupHtml(l)).addTo(camada);
      marcadores.set(l.id, m);
    });
  }
  // Zooms the map to show every placed result.
  function enquadrar(){
    if(!mapa) return;
    const pts = resultados.filter(l => l.lat != null).map(l => [l.lat, l.lng]);
    if(!pts.length) return;
    programatico = true;
    if(pts.length === 1) mapa.setView(pts[0], 16); else mapa.fitBounds(L.latLngBounds(pts), {padding:[30, 30], maxZoom:16});
    setTimeout(() => { programatico = false; }, 900);
  }
  // "📍 Ver no mapa" on a list item: center on it and open its popup.
  function verNoMapa(id){
    const l = resultados.find(x => x.id === id); if(!l) return;
    if(l.lat == null){
      if(!l.geo_em){ localizar([l]); avisar("Localizando no mapa…"); }
      else window.open(linkGoogle(l), "_blank", "noopener");
      return;
    }
    mostrarAba("mapa");
    movidoPeloUsuario = true; programatico = true;
    mapa.setView([l.lat, l.lng], 17);
    setTimeout(() => { programatico = false; }, 900);
    const m = marcadores.get(id); if(m && m.openPopup) m.openPopup();
  }
  // Phones: the list and the map share the screen through two tabs.
  function mostrarAba(qual){
    $p("#prSplit").dataset.aba = qual;
    // The route changed somewhere else (e.g. a stop removed in ☰ → Mapa): refresh the "✓ Rota" marks.
  document.addEventListener("rota-mudou", () => { if(aberto()) renderResultados(); });
  document.querySelectorAll("[data-pr-aba]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.prAba === qual)));
    if(qual === "mapa" && mapa) setTimeout(() => mapa.invalidateSize(), 50);
  }

  /* ---------- visit route ---------- */
  // "+ Rota": the building becomes a stop in the visit route (☰ → Mapa → Rota) without
  // becoming a card. If it's already a card, the card itself goes in the route.
  const naRota = l => {
    if(!window.__rota) return 0;
    const ja = leadDoFunil(l);
    if(ja && window.__rota.tem(ja.id)) return window.__rota.posicao(ja.id);
    return window.__rota.posicaoEndereco(l.id);
  };
  function botaoRota(l){
    const n = naRota(l);
    return n ? '<button type="button" class="pr-rota na-rota" data-pr-rota="'+escapar(l.id)+'" title="Tirar da rota de visitas">✓ Rota ('+n+')</button>'
             : '<button type="button" class="pr-rota" data-pr-rota="'+escapar(l.id)+'" title="Adicionar à rota de visitas">+ Rota</button>';
  }
  function alternarRota(id){
    if(!window.__rota){ avisar("A rota não está disponível agora.", true); return; }
    const l = resultados.find(x => x.id === id); if(!l) return;
    const ja = leadDoFunil(l);
    let dentro;
    if(ja && !window.__rota.temEndereco(l.id)) dentro = window.__rota.alternar(ja.id);
    else {
      if(!window.__rota.temEndereco(l.id) && l.lat == null && !l.geo_em){
        localizar([l]);
        avisar("Ainda estou localizando este endereço no mapa. Tente de novo em alguns segundos.");
        return;
      }
      dentro = window.__rota.alternarEndereco({id:l.id, nome:nomeRua(l), endereco:enderecoCompleto(l), lat:l.lat, lng:l.lng,
        detalhe:"🔎 Prospecção · " + num(l.apartamentos) + " aptos" + (l.bairro ? " · " + l.bairro : "")});
    }
    renderResultados();
    avisar(dentro ? "Adicionado à rota (parada " + naRota(l) + "). Veja em ☰ → Mapa → Rota." : "Tirado da rota.");
  }

  /* ---------- funnel ---------- */

  // "Rua Doutor Neto de Araujo, 320" (written out, as shown on the page).
  const nomeRua = l => expandirLogradouro(l.logradouro) + (l.numero ? ", " + l.numero : "");
  // Full address used in the funnel.
  function enderecoCompleto(l){
    return [expandirLogradouro(l.logradouro) + (l.numero ? ", " + l.numero : ""), l.bairro, "São Paulo - SP", l.cep].filter(Boolean).join(" - ");
  }
  function linkGoogle(l){
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(enderecoCompleto(l));
  }
  // Is this building already a card on the board? (added from here, or same street + number)
  function leadDoFunil(l){
    if(adicionados[l.id]){
      const ja = leads.find(x => x.id === adicionados[l.id]);
      if(ja) return ja;
    }
    const ignorar = new Set(["rua","r","avenida","av","alameda","al","travessa","tv","praca","pc","estrada","est","doutor","dr","de","da","do","das","dos"]);
    const palavras = normalizarNome(l.logradouro).split(" ").filter(w => w.length > 2 && !ignorar.has(w)).slice(-2);
    if(!palavras.length || !l.numero) return null;
    return leads.find(x => {
      const e = " " + normalizarNome(x.endereco).replace(/[^a-z0-9 ]/g, " ") + " ";
      return palavras.every(w => e.includes(" " + w + " ")) && e.includes(" " + l.numero + " ");
    }) || null;
  }
  async function adicionarAoFunil(id){
    if(!perm.criar){ negar("criar"); return; }
    const l = resultados.find(x => x.id === id); if(!l) return;
    const ja = leadDoFunil(l);
    if(ja){ abrirPainel(ja.id); return; }
    const rua = expandirLogradouro(l.logradouro);
    const novo = {
      id: NUVEM ? crypto.randomUUID() : gerarId(),
      criadoEm: agora(), atualizadoEm: agora(), criadoPor: meuNome || "", ordem: leads.length,
      historico: [{quando:agora(), o_que:"Cadastrado pela Prospecção (IPTU " + (l.ano_iptu || "") + ")", por:meuNome || ""}],
      nome: "Condomínio " + rua + (l.numero ? ", " + l.numero : ""),
      endereco: enderecoCompleto(l), aptos: l.apartamentos, fase: "futura", status: "nenhum",
      zona: l.bairro || "", importante: "", contatos: [], concorrente: "", fimContrato: "", perfil: "", notas: "",
      responsavel: "", observacoes: [], lembretes: [], sults: false, visitar: false
    };
    leads.push(novo);
    adicionados[l.id] = novo.id;
    try{ localStorage.setItem(CHAVE_ADICIONADOS, JSON.stringify(adicionados)); }catch(e){}
    if(l.lat != null && window.__geo) window.__geo.guardar(novo.endereco, l.lat, l.lng);   // the main map won't look it up again
    const ok = await gravarLead(novo);
    if(window.__rota) window.__rota.trocarEndereco(l.id, novo.id);   // a route stop for this building now points to the card
    desenhar();
    renderResultados();
    if(ok !== false) avisar(novo.nome + " entrou no funil (Futura Prospecção)");
  }

  /* ---------- the page ---------- */

  const num = n => (n == null || n === "") ? "—" : Number(n).toLocaleString("pt-BR");
  function renderInfo(){
    const info = $p("#prInfo");
    if(!meta || !meta.total){ info.textContent = ""; return; }
    const quando = meta.importadoEm ? new Date(meta.importadoEm).toLocaleDateString("pt-BR") : "";
    info.textContent = "IPTU " + (meta.ano || "") + " · " + num(meta.total) + " condomínios em São Paulo" + (quando ? " · importado em " + quando : "") +
      (usarNuvem() ? "" : " · só neste navegador");
  }
  function itemHtml(l){
    const ja = leadDoFunil(l);
    const info = [l.bairro, l.cep, l.pavimentos ? l.pavimentos + " andares" : "", l.ano_construcao ? "de " + l.ano_construcao : "", l.padrao]
      .filter(Boolean).map(escapar).join(" · ");
    const loc = l.lat != null ? (l.geo_precisao === "rua" ? "📍 no mapa (aproximado)" : "📍 no mapa")
      : l.geo_em ? '<a href="'+escapar(linkGoogle(l))+'" target="_blank" rel="noopener" title="Não achei no mapa; abrir no Google Maps">Google Maps</a>'
      : '<span class="pr-loc-esperando">localizando…</span>';
    return '<li class="pr-item'+(ja ? " no-funil" : "")+'" data-pr-id="'+escapar(l.id)+'">'+
      '<div class="pr-item-topo"><button type="button" class="pr-end" data-pr-ver="'+escapar(l.id)+'" title="Ver no mapa">'+
        escapar(nomeRua(l))+'</button>'+
        '<span class="pr-aptos"><strong>'+num(l.apartamentos)+'</strong> aptos</span></div>'+
      (info ? '<div class="pr-item-info">'+info+'</div>' : '')+
      '<div class="pr-item-acoes"><span class="pr-loc">'+loc+'</span>'+botaoRota(l)+
        (ja ? '<button type="button" class="pr-no-funil" data-pr-abrir="'+escapar(ja.id)+'" title="Abrir o cartão">✓ No funil</button>'
            : '<button type="button" class="pr-add" data-pr-add="'+escapar(l.id)+'">+ Funil</button>')+
      '</div></li>';
  }
  // Redraws one list item (when its map position arrives).
  function atualizarItem(l){
    const el = document.querySelector('.pr-item[data-pr-id="'+(window.CSS && CSS.escape ? CSS.escape(l.id) : l.id)+'"]');
    if(el) el.outerHTML = itemHtml(l);
  }
  function renderResultados(){
    const vazio = !meta || !meta.total;
    $p("#prVazio").hidden = !vazio;
    $p("#prSplit").hidden = vazio;
    $p("#btnPrExportar").hidden = vazio;
    if(vazio) return;
    const area = $p("#prArea").checked;
    $p("#prResumo").textContent = totalFiltrado > resultados.length
      ? "Mostrando os " + num(resultados.length) + " maiores de " + num(totalFiltrado) + " condomínios" + (area ? " nesta área" : "") + ". Refine a busca para ver outros."
      : num(totalFiltrado) + " condomínio(s)" + (area ? " já localizados nesta área do mapa" : "");
    $p("#prLista").innerHTML = resultados.map(itemHtml).join("") ||
      '<li class="pr-nada">'+(area ? "Nenhum condomínio já localizado nesta área. Busque uma rua ou bairro (sem “Só nesta área”) para localizar novos."
                                    : "Nenhum condomínio encontrado. Tente outro bairro, rua ou CEP.")+'</li>';
    desenharMarcadores();
    renderGeoStatus();
  }
  // Area of the map currently on screen (for "Só nesta área do mapa").
  function areaDoMapa(){
    if(!mapa || !$p("#prArea").checked) return null;
    const b = mapa.getBounds();
    return {s: b.getSouth(), n: b.getNorth(), w: b.getWest(), e: b.getEast()};
  }
  let tBusca = null;
  const agendarBusca = () => { clearTimeout(tBusca); tBusca = setTimeout(atualizarBusca, 300); };
  async function atualizarBusca(){
    try{ await buscar($p("#prBusca").value, parseInt($p("#prMinimo").value, 10) || 0, areaDoMapa()); }
    catch(e){ avisar("Não consegui buscar agora. Verifique a internet e tente de novo.", true); }
    renderInfo(); renderResultados();
    if(!$p("#prArea").checked){ movidoPeloUsuario = false; enquadrar(); }
    localizar(resultados);
  }
  const aberto = () => $p("#telaProspeccao").classList.contains("aberta");
  async function abrir(){
    $p("#telaProspeccao").classList.add("aberta");
    $p("#prStatus").textContent = "Carregando…";
    try{ await carregarMeta(); }catch(e){ avisar("Não consegui carregar os dados de prospecção agora.", true); }
    $p("#prStatus").textContent = "";
    renderInfo(); renderResultados();
    if(meta && meta.total){
      if(!(await iniciarMapa())) avisar("Não foi possível carregar o mapa. A lista funciona normalmente.", true);
      else mapa.invalidateSize();
    }
    await atualizarBusca();
    $p("#prBusca").focus();
  }
  function fechar(){ $p("#telaProspeccao").classList.remove("aberta"); filaGeo = []; }

  // "Importar arquivo do IPTU": choose the CSV -> read -> group -> save.
  async function importar(arquivo){
    if(!arquivo) return;
    if(!perm.criar){ negar("criar"); return; }
    const status = $p("#prStatus"), btn = $p("#btnPrImportar");
    btn.disabled = true;
    try{
      status.textContent = "Lendo o arquivo… 0%";
      const r = await processarArquivo(arquivo, p => { status.textContent = "Lendo o arquivo… " + Math.floor(p*100) + "%"; });
      if(!r.linhas.length){ avisar("Não encontrei apartamentos nesse arquivo. Confira se é o CSV do IPTU do GeoSampa.", true); return; }
      status.textContent = "Salvando " + num(r.linhas.length) + " condomínios…";
      await salvarResumo(r.linhas, r.ano, t => { status.textContent = t; });
      renderInfo(); renderResultados();
      if(!(await iniciarMapa())) avisar("Não foi possível carregar o mapa. A lista funciona normalmente.", true);
      else mapa.invalidateSize();
      await atualizarBusca();
      avisar("Pronto: " + num(r.linhas.length) + " condomínios do IPTU " + (r.ano || "") + " importados.");
    }catch(e){
      if(e && e.faltando) avisar("Esse arquivo não parece ser o do IPTU: faltam as colunas " + e.faltando.join(", ") + ".", true);
      else if(e && e.vazio) avisar("O arquivo está vazio.", true);
      else if(e && (e.code === "42501" || /row-level security/i.test(e.message||""))) avisar("Você não tem permissão para importar.", true);
      else avisar("Não consegui importar o arquivo. Tente de novo.", true);
    }finally{
      status.textContent = "";
      btn.disabled = false;
      $p("#prArquivo").value = "";
    }
  }
  function exportar(){
    if(!resultados.length){ avisar("Não há condomínios para exportar"); return; }
    const cab = ["Endereço","Bairro","CEP","Apartamentos","Andares","Ano de construção","Padrão","Latitude","Longitude","No funil"];
    const linhas = resultados.map(l => [expandirLogradouro(l.logradouro) + (l.numero ? ", " + l.numero : ""), l.bairro, l.cep, l.apartamentos,
      l.pavimentos ?? "", l.ano_construcao ?? "", l.padrao, l.lat ?? "", l.lng ?? "", leadDoFunil(l) ? "Sim" : "Não"]);
    const csv = [cab, ...linhas].map(r => r.map(x => '"' + String(x ?? "").replace(/"/g, '""') + '"').join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], {type:"text/csv;charset=utf-8"}));
    a.download = "prospeccao-" + new Date().toISOString().slice(0,10) + ".csv";
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---------- events ---------- */
  $p("#btnProspeccao").addEventListener("click", abrir);
  $p("#btnFecharProspeccao").addEventListener("click", fechar);
  $p("#prBusca").addEventListener("input", agendarBusca);
  $p("#prMinimo").addEventListener("change", atualizarBusca);
  $p("#prArea").addEventListener("change", atualizarBusca);
  $p("#btnPrImportar").addEventListener("click", () => $p("#prArquivo").click());
  $p("#btnPrImportarVazio").addEventListener("click", () => $p("#prArquivo").click());
  $p("#prArquivo").addEventListener("change", e => importar(e.target.files[0]));
  $p("#btnPrExportar").addEventListener("click", exportar);
  $p("#prLista").addEventListener("click", e => {
    const add = e.target.closest("[data-pr-add]");
    if(add){ adicionarAoFunil(add.dataset.prAdd); return; }
    const ab = e.target.closest("[data-pr-abrir]");
    if(ab){ abrirPainel(ab.dataset.prAbrir); return; }
    const rt = e.target.closest("[data-pr-rota]");
    if(rt){ alternarRota(rt.dataset.prRota); return; }
    const ver = e.target.closest("[data-pr-ver]");
    if(ver) verNoMapa(ver.dataset.prVer);
  });
  document.querySelectorAll("[data-pr-aba]").forEach(b => b.addEventListener("click", () => mostrarAba(b.dataset.prAba)));

  // Used by app.js (Esc key, refresh after the board changes) and by the tests.
  window.Prospeccao = {
    aberto, fechar,
    atualizar(){ if(aberto()) renderResultados(); },
    // pure functions, exposed for the unit tests
    mapearColunas, separarCampos, detectarSeparador, chaveCondominio, somarLinha, resumir, titulo, formatarCep,
    expandirLogradouro, consultasMapa, enderecoCompleto
  };
})();
