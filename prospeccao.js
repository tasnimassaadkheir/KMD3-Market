/* ================= prospecção (IPTU de São Paulo) ================= */
// =============================================================================
// KMD3 Market — prospecting page (prospeccao.js)   ☰ → Prospecção
// -----------------------------------------------------------------------------
// Finds residential condominiums in São Paulo and how many apartments each has,
// using the city's open IPTU (property tax) register from GeoSampa.
//
// How it works:
//  1. Nobody downloads anything: every month a GitHub robot (workflow
//     "Atualizar prospecção", script scripts/iptu.mjs) takes the newest IPTU file
//     from GeoSampa, groups the apartments by building and saves the list in
//     dados/prospeccao-sp.json, which is published with the site.
//  2. This page loads that list (about tens of thousands of buildings with 10+
//     apartments) and searches it in the browser: street, neighborhood or CEP.
//  3. Results appear in a list AND on a map. The register has no coordinates, so
//     each building is looked up once by its address (OpenStreetMap) and the
//     position is saved for the whole team (Supabase table "prospeccao_geo";
//     without it, only in this browser).
//  4. "+ Funil" turns a building into a card in "Futura Prospecção";
//     "+ Rota" puts it in the visit route without creating a card.
// Owner names and CPF/CNPJ are never in the list.
//
// Depends on mapa.js (window.__geo: address lookup and Leaflet; window.__rota) and on
// app.js (normalizarNome, escapar, avisar, leads, gravarLead, desenhar, abrirPainel,
// NUVEM, sb, gerarId, agora, meuNome, perm, negar, tabelaNaoExiste), so it's loaded after both.
// =============================================================================
(function(){
  "use strict";
  const $p = s => document.querySelector(s);
  const ARQUIVO = "dados/prospeccao-sp.json";
  const TABELA_GEO = "prospeccao_geo";
  const LIMITE = 100;                 // max rows shown (and placed on the map) at once, biggest first
  const CHAVE_ADICIONADOS = "quitandinha:prospAdicionados";
  const CHAVE_GEO = "quitandinha:prospGeo";   // positions, when the Supabase table doesn't exist

  // ---------- state ----------
  let todos = null;                   // every building from the list (objects), biggest first
  let meta = null;                    // {ano, total, geradoEm}
  let erroDados = false;              // the list couldn't be loaded
  let SEM_TABELA = false;             // true -> positions kept only in this browser
  let resultados = [], totalFiltrado = 0;
  let adicionados = {};               // building id -> condo id, for rows added to the funnel here
  try{ adicionados = JSON.parse(localStorage.getItem(CHAVE_ADICIONADOS) || "{}") || {}; }catch(e){ adicionados = {}; }
  let geoLocal = {};
  try{ geoLocal = JSON.parse(localStorage.getItem(CHAVE_GEO) || "{}") || {}; }catch(e){ geoLocal = {}; }

  /* ---------- the list ---------- */

  // Region of the city by CEP (the Correios division of São Paulo), with one adjustment:
  // 057xx–058xx (Campo Limpo, Capão Redondo, Vila Andrade) count as Zona Sul, as people say.
  const REGIOES = [
    {id:"centro", nome:"Centro", em:"no Centro", de:"do Centro"},
    {id:"norte", nome:"Zona Norte", em:"na Zona Norte", de:"da Zona Norte"},
    {id:"sul", nome:"Zona Sul", em:"na Zona Sul", de:"da Zona Sul"},
    {id:"leste", nome:"Zona Leste", em:"na Zona Leste", de:"da Zona Leste"},
    {id:"oeste", nome:"Zona Oeste", em:"na Zona Oeste", de:"da Zona Oeste"}
  ];
  function regiaoPorCep(cep){
    const d = String(cep || "").replace(/\D/g, "");
    if(d.length < 5) return "";
    const n = +d.slice(0, 5);
    if(n >= 1000 && n <= 1999) return "centro";
    if(n >= 2000 && n <= 2999) return "norte";
    if(n >= 3000 && n <= 3999) return "leste";
    if(n >= 4000 && n <= 4999) return "sul";
    if(n >= 5700 && n <= 5899) return "sul";
    if(n >= 5000 && n <= 5999) return "oeste";
    if(n >= 8000 && n <= 8499) return "leste";
    return "";
  }

  // Turns the compact file ({campos, padroes, linhas:[[...], ...]}) into objects.
  function lerLista(j){
    const c = j.campos || [], pos = nome => c.indexOf(nome);
    const i = {id:pos("id"), logradouro:pos("logradouro"), numero:pos("numero"), bairro:pos("bairro"), cep:pos("cep"),
      apartamentos:pos("apartamentos"), pavimentos:pos("pavimentos"), ano:pos("ano_construcao"), padrao:pos("padrao")};
    return (j.linhas || []).map(r => {
      const l = {
        id: String(r[i.id]), logradouro: r[i.logradouro] || "", numero: r[i.numero] || "", bairro: r[i.bairro] || "", cep: r[i.cep] || "",
        apartamentos: r[i.apartamentos] || 0, pavimentos: r[i.pavimentos] ?? null, ano_construcao: r[i.ano] ?? null,
        padrao: r[i.padrao] != null && j.padroes ? (j.padroes[r[i.padrao]] || "") : "", ano_iptu: j.ano || null
      };
      l.regiao = regiaoPorCep(l.cep);
      l.busca = normalizarNome([l.logradouro, expandirLogradouro(l.logradouro), l.numero, l.bairro, l.cep, l.cep.replace(/\D/g, "")].join(" "));
      return l;
    });
  }
  async function carregarDados(){
    if(todos) return;
    const r = await fetch(ARQUIVO, {cache: "no-cache"});
    if(!r.ok) throw new Error("http " + r.status);
    const j = await r.json();
    todos = lerLista(j);
    meta = {ano: j.ano, total: todos.length, geradoEm: j.geradoEm, minimo: j.minimoAptos};
    preencherRegioes();
    await carregarPosicoes();
  }

  // Region dropdown with how many buildings each region has, e.g. "Zona Sul (7.394)".
  function preencherRegioes(){
    const n = {}; todos.forEach(l => { n[l.regiao] = (n[l.regiao] || 0) + 1; });
    $p("#prRegiao").innerHTML = '<option value="">Toda a cidade</option>' +
      REGIOES.map(r => '<option value="'+r.id+'">'+r.nome+' ('+(n[r.id] || 0).toLocaleString("pt-BR")+')</option>').join("");
  }

  /* ---------- saved map positions ---------- */
  const usarNuvem = () => NUVEM && !SEM_TABELA;
  // Loads every saved position (from the database in pages of 1000, or from this browser)
  // and puts it on the matching building.
  async function carregarPosicoes(){
    let lista = [];
    if(usarNuvem()){
      for(let de = 0; ; de += 1000){
        const r = await sb.from(TABELA_GEO).select("id,lat,lng,geo_precisao,geo_em").range(de, de + 999);
        if(r.error){ if(tabelaNaoExiste(r.error, TABELA_GEO)) SEM_TABELA = true; else console.warn("prospecção: posições", r.error); break; }
        lista = lista.concat(r.data || []);
        if(!r.data || r.data.length < 1000) break;
      }
    }
    if(!usarNuvem()) lista = Object.entries(geoLocal).map(([id, g]) => Object.assign({id}, g));
    const porId = new Map(lista.map(g => [String(g.id), g]));
    todos.forEach(l => {
      const g = porId.get(l.id);
      if(g) Object.assign(l, {lat: g.lat ?? null, lng: g.lng ?? null, geo_precisao: g.geo_precisao || null, geo_em: g.geo_em || null});
    });
  }
  async function salvarPosicao(l){
    const g = {lat: l.lat, lng: l.lng, geo_precisao: l.geo_precisao, geo_em: l.geo_em};
    if(usarNuvem()){
      const {error} = await sb.from(TABELA_GEO).upsert(Object.assign({id: l.id}, g), {onConflict: "id"});
      if(!error) return;
      if(tabelaNaoExiste(error, TABELA_GEO)) SEM_TABELA = true;
      else { console.warn("prospecção: posição não salva", error); return; }
    }
    geoLocal[l.id] = g;
    try{ localStorage.setItem(CHAVE_GEO, JSON.stringify(geoLocal)); }catch(e){}
  }

  // Search: every word must appear (street, number, neighborhood or CEP); minimum apartments; region;
  // optionally only buildings already placed inside an area of the map (area = {s, n, w, e}).
  function buscar(texto, minimo, area, regiao){
    const palavras = normalizarNome(texto).split(" ").filter(Boolean);
    const achados = (todos || []).filter(l => (!minimo || l.apartamentos >= minimo) && (!regiao || l.regiao === regiao) &&
      palavras.every(w => l.busca.includes(w)) &&
      (!area || (l.lat != null && l.lat >= area.s && l.lat <= area.n && l.lng >= area.w && l.lng <= area.e)));
    totalFiltrado = achados.length;
    resultados = achados.slice(0, LIMITE);
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
    renderGeoStatus();
    if(geoFalhaRede) renderResultados();   // "localizando…" -> "sem mapa agora"
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
    const quando = meta.geradoEm ? new Date(meta.geradoEm).toLocaleDateString("pt-BR") : "";
    info.textContent = "IPTU " + (meta.ano || "") + " · " + num(meta.total) + " condomínios em São Paulo com " + (meta.minimo || 10) + "+ apartamentos" +
      (quando ? " · lista atualizada em " + quando : "") + (usarNuvem() ? "" : " · posições no mapa salvas só neste navegador");
  }
  function itemHtml(l){
    const ja = leadDoFunil(l);
    const info = [l.bairro, l.cep, l.pavimentos ? l.pavimentos + " andares" : "", l.ano_construcao ? "de " + l.ano_construcao : "", l.padrao]
      .filter(Boolean).map(escapar).join(" · ");
    const loc = l.lat != null ? (l.geo_precisao === "rua" ? "📍 no mapa (aproximado)" : "📍 no mapa")
      : l.geo_em ? '<a href="'+escapar(linkGoogle(l))+'" target="_blank" rel="noopener" title="Não achei no mapa; abrir no Google Maps">Google Maps</a>'
      : geoFalhaRede ? '<span class="pr-loc-esperando">sem mapa agora</span>'
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
    $p("#prErro").hidden = !vazio || !erroDados;
    $p("#prSplit").hidden = vazio;
    $p("#btnPrExportar").hidden = vazio;
    if(vazio) return;
    const area = $p("#prArea").checked;
    const reg = REGIOES.find(r => r.id === $p("#prRegiao").value);
    $p("#prResumo").textContent = totalFiltrado > resultados.length
      ? "Mostrando os " + num(resultados.length) + " maiores de " + num(totalFiltrado) + " condomínios" + (reg ? " " + reg.de : "") + (area ? " nesta área" : "") + ". Refine a busca para ver outros."
      : num(totalFiltrado) + " condomínio(s)" + (reg ? " " + reg.em : "") + (area ? " já localizados nesta área do mapa" : "");
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
    buscar($p("#prBusca").value, parseInt($p("#prMinimo").value, 10) || 0, areaDoMapa(), $p("#prRegiao").value);
    renderInfo(); renderResultados();
    if(!$p("#prArea").checked){ movidoPeloUsuario = false; enquadrar(); }
    localizar(resultados);
  }
  const aberto = () => $p("#telaProspeccao").classList.contains("aberta");
  async function abrir(){
    $p("#telaProspeccao").classList.add("aberta");
    if(!todos){
      $p("#prStatus").textContent = "Carregando a lista de condomínios…";
      try{ await carregarDados(); erroDados = false; }
      catch(e){ erroDados = true; }
      $p("#prStatus").textContent = "";
    }
    renderInfo(); renderResultados();
    if(!meta || !meta.total) return;
    if(!(await iniciarMapa())) avisar("Não foi possível carregar o mapa. A lista funciona normalmente.", true);
    else mapa.invalidateSize();
    await atualizarBusca();
    $p("#prBusca").focus();
  }
  function fechar(){ $p("#telaProspeccao").classList.remove("aberta"); filaGeo = []; }

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
  $p("#prRegiao").addEventListener("change", atualizarBusca);
  $p("#prArea").addEventListener("change", atualizarBusca);
  $p("#btnPrTentar").addEventListener("click", () => { fechar(); abrir(); });
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
    lerLista, expandirLogradouro, consultasMapa, enderecoCompleto, regiaoPorCep
  };
})();
