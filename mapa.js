/* ================= vista de mapa ================= */
// =============================================================================
// KMD3 Market — map view (mapa.js)
// -----------------------------------------------------------------------------
// Shows the condos as colored dots on a map, with a heatmap option and a
// "visit route" planner that opens in Google Maps.
//
// - Uses the Leaflet map library, downloaded only the first time the map is opened.
// - Converts addresses into coordinates with Nominatim (OpenStreetMap's free
//   geocoding service) and caches the results in this browser.
// - Depends on things defined in app.js (leads, filtrar, desenhar, abrirPainel,
//   escapar, avisar, normalizarNome, FASES, ROTULO_STATUS), so it must be
//   loaded AFTER app.js.
//
// (function(){ ... })(); is an "IIFE": a function that runs immediately.
// Everything declared inside stays private to this file, so names like
// "enfileirar" here don't clash with the ones in app.js.
// =============================================================================
(function(){
  // Strict mode: makes JavaScript report some silent mistakes as errors.
  "use strict";
  // ---------- SETTINGS ----------
  const CIDADE_PADRAO = "São Paulo, SP";          // usada quando o endereço não traz cidade
  // localStorage keys: geocache = saved address coordinates, rota = saved visit route.
  const CHAVE_GEO = "quitandinha:geocache", CHAVE_ROTA = "quitandinha:rota";
  // rotaExtras = manual addresses added to the route, rotaInicio = the route's start point.
  const CHAVE_ROTA_EXTRAS = "quitandinha:rotaExtras", CHAVE_ROTA_INICIO = "quitandinha:rotaInicio";
  // Where the Leaflet library and its heatmap plugin are downloaded from.
  const LEAFLET = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/";
  const HEAT = "https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js";
  // Dot colors by status, a palette for stages/competitors, and a grey for 'no category'.
  const COR_STATUS = {verde:"#2FA45F", amarelo:"#D4A85C", vermelho:"#D9534A", nenhum:"#9AA7AD"};
  const PALETA = ["#4FC3F7","#F06292","#BA68C8","#FFB74D","#81C784","#FF8A65","#4DB6AC","#E6EE9C","#7986CB","#F48FB1","#A1887F","#90CAF9"];
  const POR_ENDERECO = "#9AA7AD";
  /* Chave gratuita do mapa CARTO (opcional). Pegue em https://carto.com/basemaps/apikey e cole entre as aspas.
     Vazio = usa o mapa do OpenStreetMap, que não precisa de chave. */
  const CARTO_KEY = "cb1_45l0_1_7f0c710c1742276b1c3c0df2";
  // Same idea as $ in app.js: find an element on the page.
  const $m = s => document.querySelector(s);

  // ---------- STATE ----------
  // L = the Leaflet library, mapa = the map object, camadaPts / camadaRota = layers (groups)
  // holding the dots and the route line, calor = the heatmap layer.
  let L = null, mapa = null, camadaPts = null, camadaRota = null, calor = null;
  // ativo = map view is open, modoCor = what the colors mean (status/fase/conc),
  // calorOn = heatmap on, ocultos = legend categories the user has hidden.
  let ativo = false, modoCor = "status", calorOn = false, ocultos = new Set();
  // True while the code itself moves the map (so we can tell it apart from the user moving it).
  let programatico = false;
  // rota = ids of condos in the route (in order), pontos = condos currently drawn (id -> position).
  // ajustado / movidoPeloUsuario control the automatic 'fit all points' zoom.
  let rota = [], pontos = new Map(), ajustado = false, movidoPeloUsuario = false, assinaturaLegenda = "";
  // Geocoding queue: addresses waiting to be converted into coordinates, and progress counters.
  let fila = [], rodando = false, feitos = 0, totalFila = 0, falhaRede = false, naoAchados = [];
  // Load the coordinates cache and the saved route from localStorage.
  let geo = {}; try{ geo = JSON.parse(localStorage.getItem(CHAVE_GEO) || "{}"); }catch(e){ geo = {}; }
  try{ rota = JSON.parse(localStorage.getItem(CHAVE_ROTA) || "[]"); if(!Array.isArray(rota)) rota = []; }catch(e){ rota = []; }
  // extras = manual address stops (id -> {id, nome, endereco, lat, lng}); inicio = start point or null.
  let extras = {}, inicio = null;
  try{ extras = JSON.parse(localStorage.getItem(CHAVE_ROTA_EXTRAS) || "{}") || {}; }catch(e){ extras = {}; }
  try{ inicio = JSON.parse(localStorage.getItem(CHAVE_ROTA_INICIO) || "null"); }catch(e){ inicio = null; }
  // Small helpers to save the cache/route, and to wait a number of milliseconds.
  const salvarGeo = () => { try{ localStorage.setItem(CHAVE_GEO, JSON.stringify(geo)); }catch(e){} };
  // Saves the route, its manual addresses (only the ones still in the route) and the start point.
  const salvarRota = () => {
    Object.keys(extras).forEach(id => { if(!rota.includes(id)) delete extras[id]; });
    try{
      localStorage.setItem(CHAVE_ROTA, JSON.stringify(rota));
      localStorage.setItem(CHAVE_ROTA_EXTRAS, JSON.stringify(extras));
      localStorage.setItem(CHAVE_ROTA_INICIO, JSON.stringify(inicio));
    }catch(e){}
  };
  const esperar = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- carregar Leaflet só quando o mapa for aberto ---------- */
  // ---------- LOADING LEAFLET (only when needed) ----------
  // Adds a <script> tag to the page and returns a Promise that finishes when it has loaded.
  function carregarScript(src){
    return new Promise((ok, erro) => {
      const el = document.createElement("script");
      el.src = src; el.onload = ok; el.onerror = () => erro(new Error("falha ao carregar "+src));
      document.head.appendChild(el);
    });
  }
  // Makes sure Leaflet (CSS + JS) and the heatmap plugin are loaded.
  // If the heatmap plugin fails, the rest of the map still works.
  async function garantirLeaflet(){
    if(window.L && window.L.map){ L = window.L; if(!L.heatLayer) { try{ await carregarScript(HEAT); }catch(e){} } return; }
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = LEAFLET+"leaflet.min.css";
    document.head.appendChild(css);
    await carregarScript(LEAFLET+"leaflet.min.js");
    try{ await carregarScript(HEAT); }catch(e){ /* sem calor, o resto funciona */ }
    L = window.L;
  }

  /* ---------- geocodificação (Nominatim/OpenStreetMap), com cache neste navegador ---------- */
  // ---------- GEOCODING (address -> latitude/longitude) ----------
  // Builds the search text for an address. If it doesn't seem to include a city/CEP,
  // "São Paulo, SP" is added, and always ", Brasil".
  function consulta(l){
    let a = String(l.endereco||"").trim();
    if(!a) return null;
    const completo = /\b\d{5}-?\d{3}\b/.test(a) || /[-,]\s*[A-Za-z]{2}\s*(,|$)/.test(a) || /são paulo|sao paulo/i.test(a);
    return completo ? a+", Brasil" : a+", "+CIDADE_PADRAO+", Brasil";
  }
  // Cache key for a condo = its normalized search text.
  const chave = l => { const c = consulta(l); return c ? normalizarNome(c) : null; };
  // Asks Nominatim for the coordinates of an address. Returns {lat, lng} or null if not found.
  async function nominatim(q){
    const r = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&accept-language=pt-BR&q="+encodeURIComponent(q));
    if(!r.ok) throw new Error("http "+r.status);
    const j = await r.json();
    return j.length ? {lat:+j[0].lat, lng:+j[0].lon} : null;
  }
  // Needs a lookup if never searched, or if it wasn't found and the last try was over 14 days ago.
  const precisaBuscar = k => { const g = geo[k]; return !g || (g.lat == null && Date.now()-g.t > 14*86400000); };
  // Adds the condos that still need coordinates to the queue (without duplicates) and starts processing.
  // 'curto' = a shorter version of the address (just the street) used as a second attempt.
  function enfileirar(lista){
    lista.forEach(l => {
      const k = chave(l);
      if(!k || !precisaBuscar(k) || fila.some(x => x.k === k)) return;
      fila.push({k, q:consulta(l), curto:String(l.endereco).split(",")[0].trim()+", "+CIDADE_PADRAO+", Brasil"});
    });
    totalFila = feitos + fila.length;
    rodar();
  }
  // Processes the queue ONE address at a time, waiting 1.1 s between requests,
  // because Nominatim allows at most 1 request per second. Results are saved in the cache
  // and the map is redrawn as points arrive. A network error stops the queue.
  async function rodar(){
    if(rodando) return;
    rodando = true; falhaRede = false;
    try{
      while(fila.length){
        atualizarStatus();
        const it = fila[0];
        let r = await nominatim(it.q);
        if(!r && it.curto !== it.q){ await esperar(1100); r = await nominatim(it.curto); }
        fila.shift(); feitos++;
        geo[it.k] = r ? {lat:r.lat, lng:r.lng, t:Date.now()} : {lat:null, t:Date.now()};
        salvarGeo();
        agendarDesenho();
        await esperar(1100);            // limite do Nominatim: 1 consulta por segundo
      }
    }catch(e){ falhaRede = true; }
    rodando = false; feitos = 0; totalFila = 0;
    if(falhaRede) fila = [];
    atualizarStatus();
    agendarDesenho(true);
  }
  // Schedules a redraw 250 ms later. If called many times quickly, only the last one runs
  // (this is called "debouncing" and avoids redrawing dozens of times in a row).
  let _t = null;
  function agendarDesenho(ajustarTudo){
    clearTimeout(_t);
    _t = setTimeout(() => { desenharPontos(); if(ajustarTudo && !movidoPeloUsuario) enquadrar(); }, 250);
  }

  /* ---------- posições (exata pelo endereço; aproximada pela zona) ---------- */
  // ---------- POSITIONS ----------
  // Turns a text into a number that is always the same for the same text.
  // Used to place approximate points in a stable (not random every time) spot.
  function hash(s){ let h = 0; for(let i = 0; i < s.length; i++) h = (h*31 + s.charCodeAt(i))|0; return Math.abs(h); }
  // Decides where each visible condo goes on the map:
  // 1) exact position, if its address was found;
  // 2) otherwise an APPROXIMATE position near the center of its zone
  //    (the average of the other condos in the same zone that were found);
  // 3) otherwise it's listed as 'sem localização' (no location) with the reason.
  function calcularPosicoes(vis){
    const exatas = new Map();
    leads.forEach(l => { const k = chave(l); const g = k && geo[k]; if(g && g.lat != null) exatas.set(l.id, {lat:g.lat, lng:g.lng}); });
    const porZona = {};
    leads.forEach(l => {
      const z = normalizarNome(l.zona), p = exatas.get(l.id);
      if(!z || !p) return;
      (porZona[z] = porZona[z] || []).push(p);
    });
    const cent = {};
    Object.keys(porZona).forEach(z => {
      const a = porZona[z];
      cent[z] = {lat:a.reduce((s,p)=>s+p.lat,0)/a.length, lng:a.reduce((s,p)=>s+p.lng,0)/a.length};
    });
    const res = new Map(), semLocal = [], usados = {};
    vis.forEach(l => {
      let p = exatas.get(l.id), aprox = false;
      if(!p){
        const c = cent[normalizarNome(l.zona)];
        if(c){
          const h = hash(String(l.id)), ang = (h % 360) * Math.PI/180, raio = 0.0015 + (h % 25) * 0.00012;
          p = {lat:c.lat + Math.sin(ang)*raio, lng:c.lng + Math.cos(ang)*raio}; aprox = true;
        }
      }
      if(!p){
        const k = chave(l);
        let motivo = "Sem endereço cadastrado";
        let aguardando = false;
        if(k){ const g = geo[k]; aguardando = !g && !falhaRede; motivo = !g ? (falhaRede ? "Não foi possível consultar o endereço" : "Aguardando localização…") : "Endereço não encontrado"; }
        semLocal.push({l, motivo, aguardando}); return;
      }
      // If several condos land on the exact same spot, spread them out in a small spiral so all are clickable.
      const rk = p.lat.toFixed(5)+","+p.lng.toFixed(5);       // abre leque quando vários ficam no mesmo endereço
      const n = usados[rk] = (usados[rk]||0) + 1;
      if(n > 1){ const ang = (n-1)*1.1, raio = 0.00009*Math.ceil((n-1)/6)+0.00005;
        p = {lat:p.lat + Math.sin(ang)*raio, lng:p.lng + Math.cos(ang)*raio}; }
      res.set(l.id, {lat:p.lat, lng:p.lng, aprox});
    });
    return {res, semLocal};
  }

  /* ---------- categorias / cores ---------- */
  // ---------- CATEGORIES / COLORS ----------
  // Returns the category of a condo for the current color mode: {k: key, label: text, cor: color}.
  function categoria(l, rankConc){
    if(modoCor === "status"){ const k = l.status||"nenhum"; return {k, label:ROTULO_STATUS[k]||k, cor:COR_STATUS[k]||POR_ENDERECO}; }
    if(modoCor === "fase"){
      const k = l.fase||"cadastro", i = Math.max(0, FASES.findIndex(f => f.id === k));
      return {k, label:(FASES[i]||{}).nome||k, cor:PALETA[i % PALETA.length]};
    }
    const nome = String(l.concorrente||"").trim(), k = normalizarNome(nome);
    if(!k) return {k:"", label:"Sem concorrente", cor:POR_ENDERECO};
    return {k, label:nome, cor:PALETA[(rankConc[k] ?? 0) % PALETA.length]};
  }
  // Ranks competitors by how many condos they have, so the most common ones get the first palette colors.
  function rankearConcorrentes(vis){
    const n = {};
    vis.forEach(l => { const k = normalizarNome(l.concorrente); if(k) n[k] = (n[k]||0) + 1; });
    const r = {}; Object.keys(n).sort((a,b) => n[b]-n[a] || a.localeCompare(b)).forEach((k,i) => r[k] = i);
    return r;
  }

  /* ---------- desenho ---------- */
  // ---------- DRAWING ----------
  // HTML of the bubble that opens when you click a dot.
  function popup(l, p, cat){
    const fase = (FASES.find(f => f.id === (l.fase||"cadastro"))||{}).nome||"";
    const na = rota.includes(l.id);
    return '<div class="mp-pop"><h3>'+escapar(l.nome||"(sem nome)")+'</h3>'+
      '<p>'+escapar(fase)+' · '+escapar(ROTULO_STATUS[l.status||"nenhum"])+(l.aptos?' · '+escapar(l.aptos)+' aptos':'')+'</p>'+
      (l.endereco?'<p>'+escapar(l.endereco)+'</p>':'')+
      (l.zona?'<p>Zona: '+escapar(l.zona)+'</p>':'')+
      (l.concorrente?'<p>Concorrente: <b>'+escapar(l.concorrente)+'</b></p>':'')+
      (p.aprox?'<p class="aprox">Local aproximado (pela zona). Confira o endereço.</p>':'')+
      '<div class="bt"><button class="sec" data-mp-abrir="'+escapar(l.id)+'">Abrir cartão</button>'+
      '<button data-mp-rota="'+escapar(l.id)+'">'+(na?'Tirar da rota':'Adicionar à rota')+'</button></div></div>';
  }
  // Redraws all dots: filters the condos (same filters as the board), calculates positions,
  // counts categories for the legend, draws circle markers (dashed border = approximate position),
  // draws the heatmap if it's on, then updates the legend, the route and the status text.
  function desenharPontos(){
    if(!ativo || !mapa || !L) return;
    const vis = filtrar();
    const {res, semLocal} = calcularPosicoes(vis);
    pontos = new Map();
    const rank = modoCor === "conc" ? rankearConcorrentes(vis) : null;
    const cats = new Map();
    vis.forEach(l => {
      const p = res.get(l.id); if(!p) return;
      const c = categoria(l, rank);
      if(!cats.has(c.k)) cats.set(c.k, {...c, n:0});
      cats.get(c.k).n++;
    });
    camadaPts.clearLayers();
    const heat = [];
    vis.forEach(l => {
      const p = res.get(l.id); if(!p) return;
      const c = categoria(l, rank);
      if(ocultos.has(c.k)) return;
      pontos.set(l.id, {lat:p.lat, lng:p.lng, l});
      heat.push([p.lat, p.lng, 1]);
      const m = L.circleMarker([p.lat, p.lng], {
        radius:calorOn ? 5 : 8, weight:p.aprox ? 2 : 1.5, color:p.aprox ? c.cor : "#fff", dashArray:p.aprox ? "3 3" : null,
        fillColor:c.cor, fillOpacity:calorOn ? .55 : (p.aprox ? .55 : .95)
      });
      m.bindPopup(() => popup(l, p, c));
      m.addTo(camadaPts);
    });
    if(calor){ mapa.removeLayer(calor); calor = null; }
    if(calorOn && L.heatLayer && heat.length){
      calor = L.heatLayer(heat, {radius:30, blur:24, maxZoom:15, minOpacity:.35,
        gradient:{.25:"#2b83ba", .5:"#abdda4", .7:"#fdae61", 1:"#d7191c"}}).addTo(mapa);
    }
    desenharLegenda(cats);
    desenharRota();
    naoAchados = semLocal.filter(x => !x.aguardando);
    const bt = $m("#mpSemLoc");
    bt.hidden = !naoAchados.length;
    bt.textContent = "⚠ " + naoAchados.length + " sem localização";
    if(!$m("#mpLista").hidden) montarListaSemLocal();
    atualizarStatus();
    if(!ajustado && pontos.size){ ajustado = true; enquadrar(); }
  }
  // Builds the legend chips (sorted by count). It only rebuilds the HTML when something changed,
  // otherwise a double-click would be interrupted by the rebuild.
  function desenharLegenda(cats){
    const itens = [...cats.values()].sort((a,b) => b.n - a.n);
    const sig = modoCor+"|"+itens.map(c => c.k+":"+c.label+":"+c.cor+":"+c.n).join("|");
    if(sig !== assinaturaLegenda){            // só reconstrói se algo mudou, para o duplo clique funcionar
      assinaturaLegenda = sig;
      $m("#mpLegenda").innerHTML = itens.map(c =>
        '<button class="mp-chip" type="button" data-k="'+escapar(c.k)+'" title="Clique: mostrar/ocultar · Duplo clique: ver só este">'+
        '<i style="background:'+c.cor+'"></i>'+escapar(c.label)+' <b>'+c.n+'</b></button>').join("") +
        '<button class="mp-chip todos" type="button" id="mpTodos" hidden>Mostrar todos</button>';
    }
    $m("#mpLegenda").querySelectorAll(".mp-chip[data-k]").forEach(b => b.classList.toggle("off", ocultos.has(b.dataset.k)));
    $m("#mpTodos").hidden = !ocultos.size;
  }
  // Status text: 'Localizando 3 de 10…', a network error message, or 'N no mapa'.
  function atualizarStatus(){
    const el = $m("#mpStatus");
    if(rodando && fila.length){ el.textContent = "Localizando " + Math.min(feitos+1, totalFila) + " de " + totalFila + "…"; return; }
    if(falhaRede){ el.textContent = "Sem resposta do serviço de endereços"; return; }
    el.textContent = pontos.size + " no mapa";
  }
  // Zooms/moves the map so that all visible points fit on screen.
  function enquadrar(){
    if(!mapa || !pontos.size) return;
    const b = L.latLngBounds([...pontos.values()].map(p => [p.lat, p.lng]));
    programatico = true;
    mapa.once("moveend", () => { programatico = false; });
    setTimeout(() => { programatico = false; }, 900);
    mapa.fitBounds(b, {padding:[50,50], maxZoom:16});
  }

  /* ---------- rota ---------- */
  // ---------- VISIT ROUTE ----------
  // The route is a list of stops, in order. A stop is either:
  //   - a condo: its id, e.g. "c_lq3k9a8xyz" (position comes from its geocoded address)
  //   - a manual address typed by the user: an id starting with "x_", whose data
  //     ({nome, endereco, lat, lng}) is kept in the 'extras' object.
  // 'inicio' is the optional starting point (ponto de partida): an address or the user's GPS location.
  // It is not a numbered stop: the route starts there and goes through the stops in order.
  const ehExtra = id => typeof id === "string" && id.startsWith("x_");

  // Straight-line distance in km between two points (Haversine formula; 6371 = Earth radius in km).
  function km(a, b){
    const R = 6371, rad = x => x*Math.PI/180, dLat = rad(b.lat-a.lat), dLng = rad(b.lng-a.lng);
    const h = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
    return 2*R*Math.asin(Math.sqrt(h));
  }
  // Position of a route stop, or null if it has no known location.
  // For condos: the dot on the map if it's drawn, otherwise the exact position saved in the
  // geocoding cache (so a condo hidden by a filter still counts in the route).
  function pontoDaRota(id){
    if(ehExtra(id)){ const x = extras[id]; return x && x.lat != null ? {lat:x.lat, lng:x.lng} : null; }
    const p = pontos.get(id); if(p) return {lat:p.lat, lng:p.lng};
    const l = leads.find(x => x.id === id), k = l && chave(l), g = k && geo[k];
    return g && g.lat != null ? {lat:g.lat, lng:g.lng} : null;
  }
  const temInicio = () => !!(inicio && inicio.lat != null);
  // Name/address of a stop, for the list and the exports. 'l' = the condo (empty for manual addresses).
  function infoParada(id){
    if(ehExtra(id)){ const x = extras[id] || {}; return {nome:x.nome || x.endereco || "Endereço", endereco:x.endereco || "", extra:true, l:{}}; }
    const l = leads.find(x => x.id === id) || {};
    return {nome:l.nome || "(sem nome)", endereco:l.endereco || "", extra:false, l};
  }
  // The full path in order, only with points that have a location: [start?, stop, stop, ...].
  function percurso(){
    const pts = [];
    if(temInicio()) pts.push({id:"__inicio", lat:inicio.lat, lng:inicio.lng, inicio:true});
    rota.forEach(id => { const p = pontoDaRota(id); if(p) pts.push({id, lat:p.lat, lng:p.lng}); });
    return pts;
  }
  function distanciaTotal(pts){
    let total = 0;
    for(let i = 1; i < pts.length; i++) total += km(pts[i-1], pts[i]);
    return total;
  }
  const fmtKm = n => n.toFixed(1).replace(".", ",");

  // Draws the route panel (start point, numbered list with up/down/remove buttons, total distance)
  // and, when the map is open, the dashed gold line and the numbered markers. Then saves the route.
  // The panel part also works while the map is closed (e.g. when adding from the condo panel).
  function desenharRota(){
    rota = rota.filter(id => ehExtra(id) ? !!extras[id] : leads.some(l => l.id === id));   // drop deleted condos
    const pts = percurso(), nComPos = pts.filter(p => !p.inicio).length;

    // start point block: shows the current start, or the form to set one
    $m("#mpPartidaAtual").hidden = !temInicio();
    $m("#mpPartidaForm").hidden = temInicio();
    $m("#mpPartidaNome").textContent = temInicio() ? inicio.nome : "";

    $m("#mpRotaN").textContent = rota.length;
    $m("#mpRotaVazia").style.display = rota.length ? "none" : "";
    $m("#mpRotaLista").innerHTML = rota.map((id, i) => {
      const inf = infoParada(id), ok = !!pontoDaRota(id);
      const sub = !ok ? (inf.extra ? "endereço não encontrado" : "sem localização ainda · confira o endereço")
                      : (inf.extra ? "📌 Endereço adicionado" : inf.endereco);
      return '<li data-id="'+escapar(id)+'"><span class="num'+(inf.extra?' extra':'')+'">'+(i+1)+'</span><div class="txt"><b>'+escapar(inf.nome)+'</b><span>'+
        escapar(sub)+'</span></div>'+
        '<button data-acao="sobe" title="Subir" aria-label="Subir" '+(i===0?'disabled':'')+'>▲</button>'+
        '<button data-acao="desce" title="Descer" aria-label="Descer" '+(i===rota.length-1?'disabled':'')+'>▼</button>'+
        '<button data-acao="tira" title="Tirar da rota" aria-label="Tirar da rota">✕</button></li>';
    }).join("");

    $m("#mpRotaTotal").textContent = pts.length > 1
      ? "≈ " + fmtKm(distanciaTotal(pts)) + " km em linha reta" + (temInicio() ? ", saindo do ponto de partida" : "") + " (o trajeto real é maior)" : "";
    $m("#mpRotaGmaps").disabled = pts.length < 2;
    $m("#mpRotaOtimizar").disabled = nComPos < (temInicio() ? 2 : 3);
    $m("#mpRotaOtimizar").title = temInicio()
      ? "Sai do ponto de partida e vai sempre para a parada mais próxima"
      : "Mantém o primeiro ponto e ordena os demais pelo mais próximo";
    $m("#mpRotaExportar").disabled = !rota.length;
    if(!rota.length){ $m("#mpRotaExport").hidden = true; $m("#mpRotaExportar").setAttribute("aria-expanded", "false"); }
    salvarRota();
    document.dispatchEvent(new CustomEvent("rota-mudou"));   // lets app.js update the button in the condo panel

    if(!mapa || !camadaRota || !L) return;                    // map not open yet: panel only
    camadaRota.clearLayers();
    if(pts.length > 1) L.polyline(pts.map(p => [p.lat, p.lng]),
      {color:"#D4A85C", weight:3, opacity:.9, dashArray:"6 6", interactive:false}).addTo(camadaRota);
    pts.forEach(p => {
      const html = p.inicio
        ? '<div class="mp-num mp-inicio" title="Ponto de partida">▶</div>'
        : '<div class="mp-num'+(ehExtra(p.id)?' mp-extra':'')+'">'+(rota.indexOf(p.id)+1)+'</div>';
      L.marker([p.lat, p.lng], {interactive:false, zIndexOffset:1000,
        icon:L.divIcon({className:"", html, iconSize:[22,22], iconAnchor:[11,11]})}).addTo(camadaRota);
    });
  }
  // Adds a condo to the route, or removes it if it's already there.
  function alternarNaRota(id){
    const i = rota.indexOf(id);
    if(i >= 0) rota.splice(i, 1);
    else {
      rota.push(id); $m("#mpRota").classList.add("aberta");
      const l = leads.find(x => x.id === id);
      if(l) enfileirar([l]);              // make sure its address gets a position, even with the map closed
    }
    desenharRota();
  }
  // 'Ordenar por proximidade' ("nearest neighbor": simple and good enough, not always the perfect route).
  // With a start point: leave from it and always go to the closest remaining stop.
  // Without one: keep the first stop and order the rest the same way.
  // Stops without a location stay at the end, in their current order.
  function otimizar(){
    const comPos = rota.filter(id => pontoDaRota(id)), sem = rota.filter(id => !pontoDaRota(id));
    if(comPos.length < (temInicio() ? 2 : 3)) return;
    const ordem = temInicio() ? [] : [comPos.shift()];
    let atual = temInicio() ? inicio : pontoDaRota(ordem[0]);
    while(comPos.length){
      let melhor = 0, dMin = Infinity;
      comPos.forEach((id, i) => { const d = km(atual, pontoDaRota(id)); if(d < dMin){ dMin = d; melhor = i; } });
      const prox = comPos.splice(melhor, 1)[0];
      ordem.push(prox); atual = pontoDaRota(prox);
    }
    rota = ordem.concat(sem);
    desenharRota();
    avisar(temInicio() ? "Rota reordenada a partir do ponto de partida, sempre para a parada mais próxima."
                       : "Rota reordenada: primeiro ponto mantido, os demais pelo mais próximo.");
  }
  // Builds the Google Maps directions link (driving). The start point, if any, is the origin.
  // Google Maps accepts at most 11 points in a link (origin + 9 stops + destination), so longer routes are cut.
  function urlGmaps(){
    let pts = percurso();
    if(pts.length < 2) return null;
    const cortado = pts.length > 11;
    if(cortado) pts = pts.slice(0, 11);
    const c = p => p.lat.toFixed(6)+","+p.lng.toFixed(6);
    let url = "https://www.google.com/maps/dir/?api=1&travelmode=driving&origin="+c(pts[0])+"&destination="+c(pts[pts.length-1]);
    if(pts.length > 2) url += "&waypoints="+pts.slice(1, -1).map(c).join("%7C");
    return {url, cortado};
  }
  function abrirGmaps(){
    const r = urlGmaps(); if(!r) return;
    if(r.cortado) avisar("O Google Maps aceita até 11 pontos por rota. Abri os 11 primeiros.", true);
    window.open(r.url, "_blank", "noopener");
  }
  // Adds every point currently visible on screen to the route (up to 25 stops).
  function adicionarDaTela(){
    if(!mapa) return;
    const b = mapa.getBounds(); let novos = 0;
    pontos.forEach((p, id) => { if(!rota.includes(id) && b.contains([p.lat, p.lng]) && rota.length < 25){ rota.push(id); novos++; } });
    if(!novos) avisar("Nenhum ponto novo na área visível."); else { $m("#mpRota").classList.add("aberta"); desenharRota(); }
  }

  /* ---------- endereços digitados (parada avulsa e ponto de partida) ---------- */
  // ---------- TYPED ADDRESSES (manual stop and start point) ----------
  // Turns a typed address into coordinates, using the same cache and rules as the condos.
  // Returns {lat, lng}, or null if not found. Throws if the service can't be reached.
  async function geocodificarTexto(txt){
    const q = consulta({endereco:txt}); if(!q) return null;
    const k = normalizarNome(q), g = geo[k];
    if(g && g.lat != null) return {lat:g.lat, lng:g.lng};
    let r = await nominatim(q);
    const curto = txt.split(",")[0].trim()+", "+CIDADE_PADRAO+", Brasil";
    if(!r && curto !== q){ await esperar(1100); r = await nominatim(curto); }
    geo[k] = r ? {lat:r.lat, lng:r.lng, t:Date.now()} : {lat:null, t:Date.now()};
    salvarGeo();
    return r;
  }
  // Shared flow for the two address forms: validate, lock the button while searching, report errors.
  async function comEndereco(campo, botao, aoAchar){
    const txt = campo.value.trim();
    if(!txt){ avisar("Digite um endereço (rua, número e cidade)."); campo.focus(); return; }
    const rotulo = botao.textContent;
    botao.disabled = true; botao.textContent = "…";
    try{
      const p = await geocodificarTexto(txt);
      if(!p){ avisar("Endereço não encontrado. Confira rua, número e cidade e tente de novo.", true); campo.focus(); return; }
      campo.value = "";
      aoAchar(txt, p);
    }catch(e){
      avisar("Não consegui consultar o endereço agora. Verifique a internet e tente de novo.", true);
    }finally{
      botao.disabled = false; botao.textContent = rotulo;
    }
  }
  // Adds a typed address as a route stop (e.g. a supplier, a lunch stop, a prospect not registered yet).
  function adicionarEndereco(){
    comEndereco($m("#mpEndInput"), $m("#mpEndOk"), (txt, p) => {
      const id = "x_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      extras[id] = {id, nome:txt, endereco:txt, lat:p.lat, lng:p.lng};
      rota.push(id);
      desenharRota();
      avisar("Endereço adicionado à rota.");
    });
  }
  // Sets the start point from a typed address.
  function definirPartida(){
    comEndereco($m("#mpPartidaInput"), $m("#mpPartidaOk"), (txt, p) => {
      inicio = {nome:txt, endereco:txt, lat:p.lat, lng:p.lng};
      desenharRota();
      avisar("Ponto de partida definido.");
    });
  }
  // Sets the start point to where the user is now (asks the browser for permission; needs HTTPS).
  function usarMinhaLocalizacao(){
    if(!("geolocation" in navigator)){ avisar("Este navegador não informa a localização. Digite o endereço de partida.", true); return; }
    const b = $m("#mpPartidaGps"); b.disabled = true;
    navigator.geolocation.getCurrentPosition(pos => {
      b.disabled = false;
      inicio = {nome:"Minha localização", endereco:"", lat:pos.coords.latitude, lng:pos.coords.longitude, gps:true};
      desenharRota();
      avisar("Ponto de partida: sua localização atual.");
    }, err => {
      b.disabled = false;
      avisar(err && err.code === 1
        ? "A localização foi bloqueada no navegador. Libere a permissão ou digite o endereço de partida."
        : "Não foi possível obter sua localização. Digite o endereço de partida.", true);
    }, {enableHighAccuracy:true, timeout:10000, maximumAge:60000});
  }

  /* ---------- exportar a rota ---------- */
  // ---------- EXPORT THE ROUTE ----------
  // One row per point, in order (start point first), with the distance from the previous point.
  function linhasRota(){
    const linhas = []; let anterior = null;
    if(temInicio()){
      linhas.push({ordem:"Partida", tipo:"Ponto de partida", nome:inicio.nome, endereco:inicio.endereco || "",
        zona:"", fase:"", responsavel:"", contatos:"", lat:inicio.lat, lng:inicio.lng, dist:null});
      anterior = inicio;
    }
    rota.forEach((id, i) => {
      const inf = infoParada(id), l = inf.l, p = pontoDaRota(id);
      const dist = p && anterior ? km(anterior, p) : null;
      if(p) anterior = p;
      linhas.push({
        ordem:String(i+1), tipo:inf.extra ? "Endereço avulso" : "Condomínio", nome:inf.nome, endereco:inf.endereco,
        zona:l.zona || "", fase:inf.extra ? "" : ((FASES.find(f => f.id === (l.fase||"cadastro")) || {}).nome || ""),
        responsavel:l.responsavel || "",
        contatos:(l.contatos || []).map(c => [c.nome, c.telefone].filter(Boolean).join(" ")).filter(Boolean).join(" | "),
        lat:p ? p.lat : null, lng:p ? p.lng : null, dist
      });
    });
    return linhas;
  }
  const hojeBR = () => new Date().toLocaleDateString("pt-BR");
  const linkPonto = r => r.lat != null ? "https://www.google.com/maps/search/?api=1&query="+r.lat.toFixed(6)+","+r.lng.toFixed(6) : "";

  // Plain-text version, for WhatsApp and the clipboard.
  function textoRota(){
    const linhas = linhasRota(), g = urlGmaps(), pts = percurso();
    const out = ["🚗 Rota de visitas — KMD3 Market ("+hojeBR()+")", ""];
    linhas.forEach(r => {
      if(r.ordem === "Partida"){ out.push("🏁 Partida: "+r.nome); return; }
      out.push(r.ordem+". "+r.nome+(r.endereco && r.endereco !== r.nome ? " — "+r.endereco : ""));
      if(r.contatos) out.push("   Contato: "+r.contatos);
      if(r.lat == null) out.push("   (sem localização no mapa)");
    });
    out.push("");
    if(pts.length > 1) out.push("≈ "+fmtKm(distanciaTotal(pts))+" km em linha reta");
    if(g) out.push("🗺️ Google Maps: "+g.url+(g.cortado ? " (só os 11 primeiros pontos)" : ""));
    return out.join("\n");
  }
  // Spreadsheet (CSV) in the same Excel-friendly format as the main export: ";" separator + BOM for accents.
  function exportarCSVRota(){
    const cab = ["Ordem","Tipo","Nome","Endereço","Zona","Fase","Responsável","Contatos",
      "Distância do ponto anterior (km)","Latitude","Longitude","Abrir no Google Maps"];
    const linhas = linhasRota().map(r => [r.ordem, r.tipo, r.nome, r.endereco, r.zona, r.fase, r.responsavel, r.contatos,
      r.dist == null ? "" : fmtKm(r.dist), r.lat == null ? "" : r.lat.toFixed(6), r.lng == null ? "" : r.lng.toFixed(6), linkPonto(r)]);
    const g = urlGmaps(), pts = percurso();
    linhas.push([]);
    if(pts.length > 1) linhas.push(["Total", "", "≈ "+fmtKm(distanciaTotal(pts))+" km em linha reta"]);
    if(g) linhas.push(["Rota completa", "", g.url]);
    const csv = [cab, ...linhas].map(r => r.map(c => '"'+String(c ?? "").replace(/"/g,'""')+'"').join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿"+csv], {type:"text/csv;charset=utf-8"}));
    a.download = "rota-de-visitas-"+new Date().toISOString().slice(0,10)+".csv";
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    avisar("Planilha da rota gerada.");
  }
  // Opens WhatsApp with the route text ready to send (the user picks the contact).
  function enviarWhatsRota(){
    window.open("https://wa.me/?text="+encodeURIComponent(textoRota()), "_blank", "noopener");
  }
  // Copies the route text. Falls back to a hidden textarea on browsers without the Clipboard API.
  async function copiarRota(){
    const txt = textoRota();
    try{ await navigator.clipboard.writeText(txt); }
    catch(e){
      const t = document.createElement("textarea"); t.value = txt; t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try{ document.execCommand("copy"); }catch(_){}
      t.remove();
    }
    avisar("Rota copiada. Cole onde quiser.");
  }
  // Printable page (also "Save as PDF" from the print dialog), to take on the visits.
  function imprimirRota(){
    const w = window.open("", "_blank");
    if(!w){ avisar("O navegador bloqueou a janela de impressão. Permita pop-ups para este site.", true); return; }
    const g = urlGmaps(), pts = percurso();
    const linhas = linhasRota().map(r => '<tr><td class="n">'+escapar(r.ordem)+'</td><td><b>'+escapar(r.nome)+'</b>'+
      (r.endereco && r.endereco !== r.nome ? '<br><span>'+escapar(r.endereco)+'</span>' : '')+'</td><td>'+escapar(r.contatos)+'</td><td>'+
      escapar(r.responsavel)+'</td><td class="d">'+(r.dist == null ? "" : escapar(fmtKm(r.dist))+" km")+'</td><td class="ok"></td></tr>').join("");
    w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Rota de visitas</title><style>'+
      'body{font:13px/1.4 system-ui,sans-serif;color:#0E2A33;margin:24px}h1{font-size:18px;margin:0 0 2px}p{margin:0 0 14px;color:#4B6459}'+
      'table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #D6D9D0;padding:7px 6px;text-align:left;vertical-align:top}'+
      'th{font-size:11px;color:#4B6459}td span{color:#4B6459;font-size:12px}.n{width:52px;font-weight:700}.d{white-space:nowrap}'+
      '.ok{width:46px;border-left:1px solid #D6D9D0}.rod{margin-top:14px;font-size:12px;word-break:break-all}'+
      '</style></head><body><h1>Rota de visitas — KMD3 Market</h1><p>'+escapar(hojeBR())+
      (pts.length > 1 ? ' · ≈ '+escapar(fmtKm(distanciaTotal(pts)))+' km em linha reta' : '')+'</p>'+
      '<table><thead><tr><th>Ordem</th><th>Local</th><th>Contatos</th><th>Responsável</th><th>Distância</th><th>Visitado</th></tr></thead><tbody>'+
      linhas+'</tbody></table>'+(g ? '<p class="rod">Google Maps: '+escapar(g.url)+'</p>' : '')+
      '<script>window.onload=function(){window.print()}<\/script></body></html>');
    w.document.close();
  }
  const EXPORTAR = {csv:exportarCSVRota, whats:enviarWhatsRota, copiar:copiarRota, imprimir:imprimirRota};

  /* ---------- lista “sem localização” ---------- */
  // ---------- 'NO LOCATION' LIST ----------
  // Lists the condos that couldn't be placed on the map, with the reason, and a 'try again' button.
  function montarListaSemLocal(){
    $m("#mpLista").innerHTML = '<h4>Sem localização no mapa</h4>'+naoAchados.map(x =>
      '<button class="it" data-id="'+escapar(x.l.id)+'">'+escapar(x.l.nome||"(sem nome)")+'<span>'+escapar(x.motivo)+(x.l.endereco?' · '+escapar(x.l.endereco):'')+'</span></button>').join("")+
      '<button class="tentar" id="mpTentar">Tentar localizar de novo</button>';
  }

  /* ---------- abrir / fechar a vista ---------- */
  // ---------- OPEN / CLOSE THE MAP VIEW ----------
  // Creates the map the first time: centered on São Paulo, zoom buttons bottom-left,
  // CARTO map tiles (or OpenStreetMap if there's no CARTO key), and the two layers.
  async function iniciarMapa(){
    await garantirLeaflet();
    if(mapa) return;
    mapa = L.map("mapa", {zoomControl:false, preferCanvas:true}).setView([-23.55, -46.63], 11);
    L.control.zoom({position:"bottomleft"}).addTo(mapa);
    if(CARTO_KEY){
      L.tileLayer("https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key="+encodeURIComponent(CARTO_KEY),
        {maxZoom:19, attribution:"© OpenStreetMap contributors © CARTO"}).addTo(mapa);
    } else {
      $m("#mapa").classList.add("mp-osm");      // escurece o mapa do OpenStreetMap para combinar com o sistema
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {maxZoom:19, attribution:"© OpenStreetMap contributors"}).addTo(mapa);
    }
    camadaPts = L.layerGroup().addTo(mapa); camadaRota = L.layerGroup().addTo(mapa);
    // If the user drags or zooms, stop auto-fitting the map so we don't fight with them.
    mapa.on("dragstart", () => { movidoPeloUsuario = true; });
    mapa.on("zoomstart", () => { if(!programatico) movidoPeloUsuario = true; });
    // When a popup opens, connect its two buttons (open card / add to route).
    mapa.on("popupopen", e => {
      const el = e.popup.getElement(); if(!el) return;
      el.querySelectorAll("[data-mp-abrir]").forEach(b => b.onclick = () => { mapa.closePopup(); abrirPainel(b.dataset.mpAbrir); });
      el.querySelectorAll("[data-mp-rota]").forEach(b => b.onclick = () => { mapa.closePopup(); alternarNaRota(b.dataset.mpRota); });
    });
  }
  // Switches between the board and the map (the 'Mapa' / 'Quadro' button).
  async function alternarVista(){
    if(!ativo){
      try{ await iniciarMapa(); }catch(e){ avisar("Não foi possível carregar o mapa. Verifique a conexão com a internet.", true); return; }
      ativo = true; ajustado = false; movidoPeloUsuario = false;
      document.body.classList.add("vista-mapa"); $m("#vistaMapa").hidden = false;
      mostrarBotao(true);
      mapa.invalidateSize();
      enfileirar(filtrar());
      enfileirar(leads.filter(l => rota.includes(l.id)));   // route condos hidden by a filter still need a position
      desenharPontos();
    } else {
      ativo = false;
      document.body.classList.remove("vista-mapa"); $m("#vistaMapa").hidden = true;
      mostrarBotao(false);
      desenhar();
    }
  }
  // Updates the toggle button's text, tooltip and icon depending on the current view.
  function mostrarBotao(noMapa){
    const b = $m("#btnVista");
    b.setAttribute("aria-pressed", noMapa ? "true" : "false");
    b.title = noMapa ? "Voltar ao quadro" : "Ver no mapa";
    $m("#rotVista").textContent = noMapa ? "Quadro" : "Mapa";
    $m("#icoVista").innerHTML = noMapa
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 0114 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  }

  /* ---------- eventos ---------- */
  // ---------- EVENTS ----------
  $m("#btnVista").addEventListener("click", alternarVista);
  // Color mode changed: reset hidden categories and redraw.
  $m("#mpCor").addEventListener("change", e => { modoCor = e.target.value; ocultos.clear(); assinaturaLegenda = ""; desenharPontos(); });
  // Heatmap button on/off (aria-pressed tells screen readers if it's on).
  $m("#mpCalor").addEventListener("click", e => {
    calorOn = !calorOn; e.currentTarget.setAttribute("aria-pressed", calorOn ? "true" : "false");
    if(calorOn && !(L && L.heatLayer)){ avisar("O mapa de calor não carregou. Verifique a conexão.", true); calorOn = false; e.currentTarget.setAttribute("aria-pressed","false"); return; }
    desenharPontos();
  });
  // 'Enquadrar' button: fit all points again.
  $m("#mpAjustar").addEventListener("click", () => { movidoPeloUsuario = false; enquadrar(); });
  // Legend: click a chip = hide/show that category; 'Mostrar todos' = show all.
  $m("#mpLegenda").addEventListener("click", e => {
    if(e.target.closest("#mpTodos")){ ocultos.clear(); desenharPontos(); return; }
    const b = e.target.closest(".mp-chip[data-k]"); if(!b) return;
    const k = b.dataset.k; ocultos.has(k) ? ocultos.delete(k) : ocultos.add(k);
    desenharPontos();
  });
  // Double-click a chip = show ONLY that category.
  $m("#mpLegenda").addEventListener("dblclick", e => {
    const b = e.target.closest(".mp-chip[data-k]"); if(!b) return;
    ocultos.clear();
    $m("#mpLegenda").querySelectorAll(".mp-chip[data-k]").forEach(x => { if(x.dataset.k !== b.dataset.k) ocultos.add(x.dataset.k); });
    desenharPontos();
  });
  // Sideways scrolling with a normal mouse.
  // The legend (and the top bar) scroll horizontally. Phones swipe and touchpads scroll sideways,
  // but a regular mouse wheel only scrolls up/down, so on a computer with a mouse you couldn't
  // reach the chips on the right. This turns the up/down wheel movement into left/right scrolling.
  function rolarDeLado(el){
    el.addEventListener("wheel", e => {
      if(el.scrollWidth <= el.clientWidth) return;               // everything already fits: nothing to do
      if(Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;      // touchpad already scrolling sideways: leave it
      e.preventDefault();                                       // stop the page from scrolling up/down instead
      el.scrollLeft += e.deltaY;
    }, {passive:false});                                        // passive:false is required to allow preventDefault()
  }
  rolarDeLado($m("#mpLegenda"));
  rolarDeLado($m(".mp-barra"));
  // Route panel header: collapse/expand.
  $m("#mpRotaCab").addEventListener("click", () => $m("#mpRota").classList.toggle("aberta"));
  // Route list buttons: move a stop up/down (swap with neighbor) or remove it.
  $m("#mpRotaLista").addEventListener("click", e => {
    const b = e.target.closest("button[data-acao]"); if(!b) return;
    const id = b.closest("li").dataset.id, i = rota.indexOf(id);
    if(b.dataset.acao === "tira") rota.splice(i, 1);
    if(b.dataset.acao === "sobe" && i > 0) [rota[i-1], rota[i]] = [rota[i], rota[i-1]];
    if(b.dataset.acao === "desce" && i < rota.length-1) [rota[i+1], rota[i]] = [rota[i], rota[i+1]];
    desenharRota();
  });
  $m("#mpRotaOtimizar").addEventListener("click", otimizar);
  $m("#mpRotaArea").addEventListener("click", adicionarDaTela);
  // 'Limpar' removes all stops (asks first when there are several). The start point is kept.
  $m("#mpRotaLimpar").addEventListener("click", () => {
    if(rota.length > 2 && !confirm("Tirar as "+rota.length+" paradas da rota? O ponto de partida continua.")) return;
    rota = []; desenharRota();
  });
  $m("#mpRotaGmaps").addEventListener("click", abrirGmaps);
  // Start point: typed address, current GPS location, or remove it.
  $m("#mpPartidaOk").addEventListener("click", definirPartida);
  $m("#mpPartidaInput").addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); definirPartida(); } });
  $m("#mpPartidaGps").addEventListener("click", usarMinhaLocalizacao);
  $m("#mpPartidaLimpar").addEventListener("click", () => { inicio = null; desenharRota(); });
  // Manual address stop.
  $m("#mpEndOk").addEventListener("click", adicionarEndereco);
  $m("#mpEndInput").addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); adicionarEndereco(); } });
  // 'Exportar' opens a small menu; each option has data-exp = csv / whats / copiar / imprimir.
  $m("#mpRotaExportar").addEventListener("click", () => {
    const menu = $m("#mpRotaExport"); menu.hidden = !menu.hidden;
    $m("#mpRotaExportar").setAttribute("aria-expanded", menu.hidden ? "false" : "true");
  });
  $m("#mpRotaExport").addEventListener("click", e => {
    const b = e.target.closest("[data-exp]"); if(!b || !rota.length) return;
    EXPORTAR[b.dataset.exp]();
  });
  // '⚠ N sem localização' button: show/hide the list.
  $m("#mpSemLoc").addEventListener("click", () => {
    const box = $m("#mpLista"); box.hidden = !box.hidden;
    if(!box.hidden) montarListaSemLocal();
  });
  // In that list: 'try again' clears failed lookups and retries; clicking a condo opens its card.
  $m("#mpLista").addEventListener("click", e => {
    if(e.target.closest("#mpTentar")){
      Object.keys(geo).forEach(k => { if(geo[k].lat == null) delete geo[k]; });
      salvarGeo(); falhaRede = false; enfileirar(filtrar()); desenharPontos(); return;
    }
    const b = e.target.closest("button.it"); if(b){ $m("#mpLista").hidden = true; abrirPainel(b.dataset.id); }
  });

  // Function exposed to app.js: desenhar() calls it after every change,
  // so the map stays in sync with the board (only does work while the map is open).
  window.__atualizarMapa = function(){
    if(!ativo) return;
    enfileirar(filtrar());
    agendarDesenho();
  };
  // Small route API used by the condo panel in app.js ("Adicionar à rota" button).
  // It works even while the map is closed: the route is saved and appears when the map opens.
  window.__rota = {
    tem: id => rota.includes(id),
    posicao: id => rota.indexOf(id) + 1,
    total: () => rota.length,
    alternar(id){ alternarNaRota(id); return rota.includes(id); }
  };
})();
