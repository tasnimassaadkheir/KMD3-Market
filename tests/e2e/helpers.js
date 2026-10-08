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
  await context.route("**/config.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: 'const SUPABASE_URL = ""; const SUPABASE_KEY = "";' }));
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
  // Pre-load data before the page's own scripts run.
  await context.addInitScript(({ leads, equipe }) => {
    if (leads) localStorage.setItem("quitandinha:condominios", JSON.stringify(leads));
    if (equipe) localStorage.setItem("quitandinha:equipe", JSON.stringify(equipe));
  }, { leads: opts.leads, equipe: opts.equipe });

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));   // collect JavaScript crashes
  await page.goto(env.url);
  await page.waitForSelector(".coluna");                  // board finished drawing
  return { page, context, errors };
}

/** Same as normalizarNome() in app.js: no accents, lowercase, single spaces. */
function normalizar(s) {
  return String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
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

module.exports = { setup, openApp, lead, localDateTime, normalizar };
