// =============================================================================
// Test helper: loads app.js inside Node WITHOUT a browser.
// -----------------------------------------------------------------------------
// app.js is a normal browser script (it expects `document`, `window`,
// `localStorage`...). To unit-test its functions in Node, we run it inside a
// sandbox (Node's built-in `vm` module) where those browser objects are
// replaced by harmless fakes. Then we can call any function from app.js.
//
// Time is FROZEN (default: 5 Oct 2026, 12:00 in São Paulo) so tests that depend
// on "today" or "overdue" give the same result every day.
// =============================================================================
process.env.TZ = "America/Sao_Paulo";   // dates are always interpreted in Brazil's timezone

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..", "..");
const APP_CODE = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");

// A "do-nothing" fake DOM element: any property returns another fake,
// any call returns another fake. This lets app.js run its startup code
// ($("#x").addEventListener(...), etc.) without crashing.
function fakeElement() {
  const fn = function () { return fakeElement(); };
  const props = {};
  return new Proxy(fn, {
    get(_t, key) {
      if (key in props) return props[key];
      if (key === Symbol.toPrimitive) return () => "";
      if (key === Symbol.iterator) return function* () {};
      if (key === "then") return undefined;            // not a Promise
      if (key === "value" || key === "textContent" || key === "innerHTML") return "";
      if (key === "length") return 0;
      return fakeElement();
    },
    set(_t, key, value) { props[key] = value; return true; },
    apply() { return fakeElement(); },
  });
}

// Simple in-memory replacement for the browser's localStorage.
function fakeLocalStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    clear: () => data.clear(),
  };
}

// A Date that always thinks "now" is the frozen moment.
function frozenDate(nowISO) {
  const NOW = new Date(nowISO).getTime();
  class FrozenDate extends Date {
    constructor(...args) { args.length ? super(...args) : super(NOW); }
    static now() { return NOW; }
  }
  return FrozenDate;
}

/**
 * Loads app.js in a sandbox and returns a helper to call its code.
 * @param {object} [opts]
 * @param {string} [opts.now] frozen "now" (local time), e.g. "2026-10-05T12:00:00"
 * @returns {{ run: (code:string)=>any, json: (code:string)=>any, ctx: object }}
 *   run("escapar('<b>')") evaluates code inside the app's global scope.
 */
function loadApp(opts = {}) {
  // The same selector always returns the same fake element, so a test can do
  // run('$("#busca").value = "abc"') and the app will read "abc" back.
  const elements = new Map();
  const getEl = (sel) => { if (!elements.has(sel)) elements.set(sel, fakeElement()); return elements.get(sel); };
  const document = {
    querySelector: getEl,
    querySelectorAll: () => [],
    getElementById: () => fakeElement(),
    createElement: () => fakeElement(),
    addEventListener: () => {},
    body: fakeElement(),
    head: fakeElement(),
    hidden: false,
  };
  const ctx = {
    // config.js values: empty = LOCAL MODE (never touches the real database)
    SUPABASE_URL: "",
    SUPABASE_KEY: "",
    document,
    localStorage: fakeLocalStorage(),
    navigator: { onLine: true, userAgent: "node" },
    location: { reload() {}, href: "http://localhost/" },
    console,
    Date: frozenDate(opts.now || "2026-10-05T12:00:00"),
    Intl, URL, URLSearchParams, Blob, JSON, Math, Promise, Map, Set,
    setTimeout: () => 0,       // timers are disabled: tests stay fast
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    confirm: () => true,
    alert: () => {},
    crypto: globalThis.crypto,
  };
  ctx.window = ctx;            // in a browser, `window` is the global object
  ctx.globalThis = ctx;
  ctx.addEventListener = () => {};
  vm.createContext(ctx);
  vm.runInContext(APP_CODE, ctx, { filename: "app.js" });
  const run = (code) => vm.runInContext(code, ctx);
  return {
    ctx,
    run,
    // Same as run(), but returns a plain copy of the result. Objects created inside the
    // sandbox come from a different "realm", so assert.deepStrictEqual needs a copy.
    json: (code) => JSON.parse(vm.runInContext("JSON.stringify(" + code + ")", ctx) ?? "null"),
  };
}

module.exports = { loadApp, ROOT };
