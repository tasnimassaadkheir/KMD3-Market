// =============================================================================
// E2E test helper: serves the site locally and opens it in a real browser
// (Chromium, through Playwright).
// -----------------------------------------------------------------------------
// - Starts a tiny static web server on a random free port (no extra packages).
// - Replaces config.js with EMPTY keys, so the app runs in LOCAL MODE and the
//   tests never read or change the real Supabase database.
// - Blocks every request to the internet (fonts, CDNs), so tests are fast and
//   give the same result with or without a connection.
// =============================================================================
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..", "..");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".json": "application/json" };

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
      const file = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); return res.end("not found");
      }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}/` }));
  });
}

/** Starts the server and the browser once per test file. */
async function setup() {
  const { server, url } = await startServer();
  const browser = await chromium.launch();
  return {
    url,
    browser,
    async close() { await browser.close(); server.close(); },
  };
}

/**
 * Opens the app in a fresh browser context (empty localStorage = clean state).
 * @param {object} env from setup()
 * @param {object} [opts]
 * @param {Array}  [opts.leads] condos to pre-load into localStorage
 * @param {Array}  [opts.equipe] team members to pre-load
 * @param {{width:number,height:number}} [opts.viewport]
 * @param {Object<string,[number,number]>} [opts.geo] address -> [lat, lng], pre-saved in the
 *        map's geocoding cache so condos have a position without calling the internet
 * @param {Object<string,[number,number]>} [opts.nominatim] fake address search: if the searched text
 *        contains the key (case/accents ignored) it answers with that position, otherwise "not found"
 * @param {boolean} [opts.fakeLeaflet] load a fake Leaflet (see fake-leaflet.js) so the map view opens
 * @param {{latitude:number,longitude:number}} [opts.geolocation] fake GPS position for the browser
 */
async function openApp(env, opts = {}) {
  const context = await env.browser.newContext({
    viewport: opts.viewport || { width: 1400, height: 900 },
    acceptDownloads: true,
    timezoneId: "America/Sao_Paulo",
    locale: "pt-BR",
    ...(opts.geolocation ? { geolocation: opts.geolocation, permissions: ["geolocation"] } : {}),
  });
  // Local mode: serve config.js with empty keys instead of the real ones.
  // Cloud mode (opts.nuvem, see criarNuvem): fake keys + a fake Supabase backed by a shared in-memory database.
  const configJs = opts.nuvem ? 'const SUPABASE_URL = "https://fake.supabase.co"; const SUPABASE_KEY = "sb_publishable_fake";'
                              : 'const SUPABASE_URL = ""; const SUPABASE_KEY = "";';
  await context.route("**/config.js", (route) => route.fulfill({ contentType: "text/javascript", body: configJs }));
  // Block everything that is not our local server.
  await context.route((u) => !u.href.startsWith(env.url), (route) => route.abort());
  // Fake address search (registered after the block above, so it takes priority for these URLs).
  if (opts.nominatim) {
    await context.route("https://nominatim.openstreetmap.org/**", (route) => {
      const q = normalizar(new URL(route.request().url()).searchParams.get("q"));
      const hit = Object.entries(opts.nominatim).find(([k]) => q.includes(normalizar(k)));
      const body = hit ? [{ lat: String(hit[1][0]), lon: String(hit[1][1]) }] : [];
      route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
    });
  }
  if (opts.fakeLeaflet) await context.addInitScript({ path: path.join(__dirname, "fake-leaflet.js") });
  // Pre-save positions in the map's geocoding cache, with the same key the app computes:
  // normalized "<address>, Brasil" (addresses here always include the city).
  if (opts.geo) {
    const cache = {};
    for (const [end, [lat, lng]] of Object.entries(opts.geo)) cache[normalizar(end + ", Brasil")] = { lat, lng, t: Date.now() };
    await context.addInitScript((c) => localStorage.setItem("quitandinha:geocache", JSON.stringify(c)), cache);
  }
  if (opts.nuvem) await opts.nuvem.ligar(context);
  if (opts.initScript) await context.addInitScript(opts.initScript);   // e.g. something already saved in this browser
  // Pre-load data before the page's own scripts run.
  await context.addInitScript(({ leads, equipe }) => {
    if (leads) localStorage.setItem("quitandinha:condominios", JSON.stringify(leads));
    if (equipe) localStorage.setItem("quitandinha:equipe", JSON.stringify(equipe));
  }, { leads: opts.leads, equipe: opts.equipe });

  const page = await context.newPage();
  if (opts.nuvem) opts.nuvem.paginas.push(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));   // collect JavaScript crashes
  await page.goto(env.url);
  await page.waitForSelector(".coluna");                  // board finished drawing
  return { page, context, errors };
}

/** Opens the ☰ side menu and clicks one of its items (e.g. "#btnVista", "#btnLembretes"). */
async function irPeloMenu(page, seletor) {
  await page.click("#btnMenu");
  await page.waitForSelector("#menuLateral.aberto");
  await page.click(seletor);
}

/** Same as normalizarNome() in app.js: no accents, lowercase, single spaces. */
function normalizar(s) {
  return String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * A fake Supabase for cloud-mode tests: one in-memory database shared by every page
 * opened with openApp(env, {nuvem}). Pages are logged in as the same user (like one
 * person on a laptop and a phone). After each write, the other pages get a Realtime event.
 * nuvem.tabelas.condominios = [...] pre-loads rows (database format).
 */
function criarNuvem(usuario = { id: "u-tasnim", email: "tasnim@kmd3.com.br" }) {
  const tabelas = {};
  const paginas = [];
  const tab = (t) => (tabelas[t] = tabelas[t] || []);
  const passa = (linha, filtros) => filtros.every(([op, c, v]) => {
    const x = linha[c];
    if (op === "eq") return x === v;
    if (op === "neq") return x !== v;
    if (op === "lt") return x < v;
    if (op === "gte") return x >= v;
    if (op === "lte") return x <= v;
    if (op === "in") return v.includes(x);
    return true;
  });
  function executar(q) {
    const linhas = tab(q.tabela);
    const chave = q.onConflict || (q.tabela === "rotas" ? "usuario" : "id");
    let data = null, mudou = false;
    if (q.op === "select") data = linhas.filter((l) => passa(l, q.filtros));
    else if (q.op === "insert" || q.op === "upsert") {
      for (const nova of q.linhas) {
        const i = linhas.findIndex((l) => l[chave] === nova[chave]);
        if (i >= 0 && q.op === "upsert") linhas[i] = { ...linhas[i], ...nova }; else linhas.push({ ...nova });
      }
      data = q.linhas; mudou = true;
    } else if (q.op === "update") {
      data = linhas.filter((l) => passa(l, q.filtros));
      data.forEach((l) => Object.assign(l, q.valores)); mudou = data.length > 0;
    } else if (q.op === "delete") {
      data = linhas.filter((l) => passa(l, q.filtros));
      tabelas[q.tabela] = linhas.filter((l) => !data.includes(l)); mudou = data.length > 0;
    }
    if (mudou) for (const p of paginas) p.evaluate((t) => window.__fakeEmit && window.__fakeEmit(t), q.tabela).catch(() => {});
    if (q.unico) data = (data || [])[0] || null;
    return { data: JSON.parse(JSON.stringify(data)), error: null };
  }
  return {
    tabelas, paginas, usuario,
    async ligar(context) {
      await context.route("**/supabase-js@2*", (route) =>
        route.fulfill({ contentType: "text/javascript", path: path.join(__dirname, "fake-supabase.js") }));
      await context.exposeBinding("__fakeDb", (_src, q) => executar(q));
      await context.addInitScript((u) => { window.__fakeSessao = { user: u }; }, usuario);
    },
  };
}

/** Builds a condo object with sensible defaults (override what the test needs). */
function lead(over = {}) {
  const now = new Date().toISOString();
  return {
    id: "c_" + Math.random().toString(36).slice(2, 9), nome: "Condomínio Teste", endereco: "Rua A, 10",
    aptos: 50, fase: "cadastro", status: "nenhum", ordem: 0, zona: "", importante: "",
    contatos: [], concorrente: "", fimContrato: "", responsavel: "", criadoPor: "Teste",
    criadoEm: now, atualizadoEm: now, historico: [], observacoes: [], lembretes: [], ...over,
  };
}

/** "YYYY-MM-DDTHH:mm" in local time, `days` from now (negative = past). */
function localDateTime(days, hour = 10) {
  const d = new Date(); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

module.exports = { setup, openApp, lead, localDateTime, normalizar, irPeloMenu, criarNuvem };
