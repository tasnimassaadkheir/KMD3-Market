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
  // Small helpers to save the cache/route, and to wait a number of milliseconds.
  const salvarGeo = () => { try{ localStorage.setItem(CHAVE_GEO, JSON.stringify(geo)); }catch(e){} };
  const salvarRota = () => { try{ localStorage.setItem(CHAVE_ROTA, JSON.stringify(rota)); }catch(e){} };
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
  // Straight-line distance in km between two points (Haversine formula; 6371 = Earth radius in km).
  function km(a, b){
    const R = 6371, rad = x => x*Math.PI/180, dLat = rad(b.lat-a.lat), dLng = rad(b.lng-a.lng);
    const h = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
    return 2*R*Math.asin(Math.sqrt(h));
  }
  // Position of a route stop, or null if it's not on the map right now (filtered out or no location).
  function pontoDaRota(id){ return pontos.get(id) || null; }
  // Draws the route panel (numbered list with up/down/remove buttons), the total distance,
  // a dashed gold line connecting the stops on the map and a numbered marker on each stop. Then saves the route.
  function desenharRota(){
    rota = rota.filter(id => leads.some(l => l.id === id));
    const validos = rota.filter(id => pontoDaRota(id));
    $m("#mpRotaN").textContent = rota.length;
    $m("#mpRotaVazia").style.display = rota.length ? "none" : "";
    $m("#mpRotaLista").innerHTML = rota.map((id, i) => {
      const l = leads.find(x => x.id === id), ok = !!pontoDaRota(id);
      return '<li data-id="'+escapar(id)+'"><span class="num">'+(i+1)+'</span><div class="txt"><b>'+escapar(l.nome||"(sem nome)")+'</b><span>'+
        escapar(ok ? (l.endereco||"") : "fora do mapa (filtro ou sem localização)")+'</span></div>'+
        '<button data-acao="sobe" title="Subir" '+(i===0?'disabled':'')+'>▲</button>'+
        '<button data-acao="desce" title="Descer" '+(i===rota.length-1?'disabled':'')+'>▼</button>'+
        '<button data-acao="tira" title="Tirar da rota">✕</button></li>';
    }).join("");
    let total = 0;
    for(let i = 1; i < validos.length; i++) total += km(pontoDaRota(validos[i-1]), pontoDaRota(validos[i]));
    $m("#mpRotaTotal").textContent = validos.length > 1 ? "≈ " + total.toFixed(1).replace(".",",") + " km em linha reta (o trajeto real é maior)" : "";
    $m("#mpRotaGmaps").disabled = validos.length < 2;
    $m("#mpRotaOtimizar").disabled = validos.length < 3;
    camadaRota.clearLayers();
    if(validos.length > 1) L.polyline(validos.map(id => [pontoDaRota(id).lat, pontoDaRota(id).lng]),
      {color:"#D4A85C", weight:3, opacity:.9, dashArray:"6 6", interactive:false}).addTo(camadaRota);
    validos.forEach(id => {
      const p = pontoDaRota(id);
      L.marker([p.lat, p.lng], {interactive:false, zIndexOffset:1000,
        icon:L.divIcon({className:"", html:'<div class="mp-num">'+(rota.indexOf(id)+1)+'</div>', iconSize:[22,22], iconAnchor:[11,11]})}).addTo(camadaRota);
    });
    salvarRota();
  }
  // Adds a condo to the route, or removes it if it's already there.
  function alternarNaRota(id){
    const i = rota.indexOf(id);
    if(i >= 0) rota.splice(i, 1); else { rota.push(id); $m("#mpRota").classList.add("aberta"); }
    desenharRota();
  }
  // 'Ordenar por proximidade': keeps the first stop and then always goes to the closest
  // remaining one ("nearest neighbor" — simple and good enough, not always the perfect route).
  function otimizar(){
    const ids = rota.filter(id => pontoDaRota(id)), fora = rota.filter(id => !pontoDaRota(id));
    if(ids.length < 3) return;
    const ordem = [ids.shift()];
    while(ids.length){
      const ult = pontoDaRota(ordem[ordem.length-1]);
      let melhor = 0, dMin = Infinity;
      ids.forEach((id, i) => { const d = km(ult, pontoDaRota(id)); if(d < dMin){ dMin = d; melhor = i; } });
      ordem.push(ids.splice(melhor, 1)[0]);
    }
    rota = ordem.concat(fora);
    desenharRota();
    avisar("Rota reordenada: primeiro ponto mantido, os demais pelo mais próximo.");
  }
  // Opens the route in Google Maps (driving directions).
  // Google Maps accepts at most 11 stops in a link, so longer routes are cut.
  function abrirGmaps(){
    let ids = rota.filter(id => pontoDaRota(id));
    if(ids.length < 2) return;
    if(ids.length > 11){ avisar("O Google Maps aceita até 11 paradas por rota. Abri as 11 primeiras.", true); ids = ids.slice(0, 11); }
    const c = id => pontoDaRota(id).lat.toFixed(6)+","+pontoDaRota(id).lng.toFixed(6);
    let url = "https://www.google.com/maps/dir/?api=1&travelmode=driving&origin="+c(ids[0])+"&destination="+c(ids[ids.length-1]);
    if(ids.length > 2) url += "&waypoints="+ids.slice(1, -1).map(c).join("%7C");
    window.open(url, "_blank", "noopener");
  }
  // Adds every point currently visible on screen to the route (up to 25 stops).
  function adicionarDaTela(){
    const b = mapa.getBounds(); let novos = 0;
    pontos.forEach((p, id) => { if(!rota.includes(id) && b.contains([p.lat, p.lng]) && rota.length < 25){ rota.push(id); novos++; } });
    if(!novos) avisar("Nenhum ponto novo na área visível."); else { $m("#mpRota").classList.add("aberta"); desenharRota(); }
  }

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
  $m("#mpRotaLimpar").addEventListener("click", () => { rota = []; desenharRota(); });
  $m("#mpRotaGmaps").addEventListener("click", abrirGmaps);
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

  // The ONE function this file exposes to app.js: desenhar() calls it after every change,
  // so the map stays in sync with the board (only does work while the map is open).
  window.__atualizarMapa = function(){
    if(!ativo) return;
    enfileirar(filtrar());
    agendarDesenho();
  };
})();
