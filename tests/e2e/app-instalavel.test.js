// E2E tests: the site can be installed as an app (PWA).
// manifest.webmanifest (name, icons, colors) + sw.js (opens offline, network first) +
// "Instalar o app" in the ☰ menu (Android/Chrome install window, or the iPhone steps).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const IPHONE_SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1";
const CELULAR = { viewport: { width: 390, height: 844 }, toque: true };
const dados = () => [lead({ id: "c1", nome: "Residencial Aurora" })];
const menuTemInstalar = async (page) => {
  await page.click("#btnMenu");
  await page.waitForSelector("#menuLateral.aberto");
  const visivel = await page.locator("#btnInstalar").isVisible();
  return visivel;
};

describe("Installable app (PWA)", () => {
  test("the manifest is linked and complete; every icon exists; iPhone tags are there", async () => {
    const { page, context, errors } = await openApp(env, { leads: dados() });
    const href = await page.getAttribute('link[rel="manifest"]', "href");
    const resp = await page.request.get(new URL(href, env.url).href);
    assert.equal(resp.status(), 200);
    const m = await resp.json();
    assert.equal(m.short_name, "KMD3 Market");
    assert.equal(m.display, "standalone");
    assert.equal(m.start_url, "/");
    assert.equal(m.theme_color, "#093E4F");
    assert.ok(m.icons.some((i) => i.sizes === "192x192") && m.icons.some((i) => i.sizes === "512x512"));
    assert.ok(m.icons.some((i) => i.purpose === "maskable"), "Android round/square icons");
    const icones = [...m.icons.map((i) => i.src), await page.getAttribute('link[rel="apple-touch-icon"]', "href")];
    for (const src of icones) {
      const r = await page.request.get(new URL(src, env.url).href);
      assert.equal(r.status(), 200, src);
      assert.equal(r.headers()["content-type"], "image/png", src);
    }
    for (const s of m.shortcuts) assert.match(s.url, /^\/#(lembretes|mapa|busca-condominio)$/);
    assert.equal(await page.getAttribute('meta[name="apple-mobile-web-app-capable"]', "content"), "yes");
    assert.equal(await page.getAttribute('meta[name="apple-mobile-web-app-title"]', "content"), "KMD3 Market");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("the service worker registers, saves the app, and the app still opens with no internet", async () => {
    const { page, context, errors } = await openApp(env, { leads: dados(), serviceWorkers: "allow" });
    // Each step waits on its own and says which one got stuck (with the page's state), so a
    // failure on GitHub's Chromium is easy to read.
    const estado = () => page.evaluate(async () => ({
      online: navigator.onLine, controla: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
      salvos: (await caches.keys()).length ? (await (await caches.open((await caches.keys())[0])).keys()).map((r) => new URL(r.url).pathname) : [],
      nome: (document.querySelector("#nomeUsuario") || {}).textContent, aviso: (document.querySelector("#aviso") || {}).textContent,
    })).catch((e) => ({ erro: e.message }));
    async function esperar(passo, fn, ms = 20000) {
      const fim = Date.now() + ms;
      while (Date.now() < fim) {
        if (await page.evaluate(fn).catch(() => false)) return;
        await page.waitForTimeout(200);
      }
      throw new Error("stuck at: " + passo + " · " + JSON.stringify(await estado()));
    }
    const escopo = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
    assert.equal(escopo, env.url);
    await esperar("app saved by the worker", async () => !!(await caches.match("app.js")) && !!(await caches.match("index.html")));
    await page.reload();                                         // now the worker controls the page
    await esperar("worker controls the page", () => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload();                                         // no browser error page: the saved copy opens
    await page.waitForSelector("#btnMenu");
    // Which config.js the worker saved depends on the Playwright version: newer ones also send the
    // worker's requests through the test's fake answers (local mode, no database), older ones don't
    // (the real file: cloud mode). Either way the app must open with no internet:
    if (await page.evaluate(() => NUVEM)) {
      // cloud: the condos live in the database, so it says so (and reloads when the internet is back)
      await esperar("'Sem internet' shown", () => document.querySelector("#nomeUsuario").textContent === "Sem internet");
    } else {
      // local mode: the board opens with the condos saved in this browser
      await esperar("board with the saved condo", () => /Residencial Aurora/.test(document.querySelector("#quadro").textContent));
    }
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("Android / Chrome: 'Instalar o app' appears only when the browser offers it, and opens its install window", async () => {
    const { page, context, errors } = await openApp(env, { leads: dados(), ...CELULAR });
    assert.equal(await menuTemInstalar(page), false, "no offer yet: hidden");
    await page.keyboard.press("Escape");
    // the browser offers the install
    await page.evaluate(() => {
      const e = new Event("beforeinstallprompt", { cancelable: true });
      window.__pediu = 0;
      e.prompt = () => { window.__pediu++; return Promise.resolve(); };
      e.userChoice = Promise.resolve({ outcome: "accepted" });
      window.dispatchEvent(e);
      window.__semBanner = e.defaultPrevented;
    });
    assert.equal(await page.evaluate(() => window.__semBanner), true, "no automatic banner");
    assert.equal(await menuTemInstalar(page), true);
    await page.click("#btnInstalar");
    await page.waitForFunction(() => window.__pediu === 1);
    assert.equal(await page.locator("#menuLateral.aberto").count(), 0, "menu closed");
    await page.waitForFunction(() => document.querySelector("#btnInstalar").hidden, "a prompt is used only once");
    await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
    await page.waitForFunction(() => /App instalado/.test(document.querySelector("#aviso").textContent));
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("iPhone (Safari): the menu item opens the 3 steps; in another iPhone browser it also says to use Safari", async () => {
    const { page, context, errors } = await openApp(env, { leads: dados(), ...CELULAR, userAgent: IPHONE_SAFARI });
    assert.equal(await menuTemInstalar(page), true);
    await page.click("#btnInstalar");
    await page.waitForSelector("#instalarDlg:not([hidden])");
    assert.equal(await page.locator(".instalar-passos li").count(), 3);
    assert.match(await page.textContent(".instalar-passos"), /Compartilhar[\s\S]*Adicionar à Tela de Início[\s\S]*Adicionar/);
    assert.equal(await page.locator("#instalarOutro").isHidden(), true);
    const caixa = await page.locator("#instalarDlg .dlg").boundingBox();
    assert.ok(caixa.x >= 0 && caixa.x + caixa.width <= 390, "fits the phone");
    await page.click("#instalarOk");
    assert.equal(await page.locator("#instalarDlg").isHidden(), true);
    assert.deepEqual(errors, []);
    await context.close();

    const c = await openApp(env, { leads: dados(), ...CELULAR, userAgent: IPHONE_CHROME });
    await menuTemInstalar(c.page);
    await c.page.click("#btnInstalar");
    await c.page.waitForSelector("#instalarDlg:not([hidden])");
    assert.match(await c.page.textContent("#instalarOutro"), /Safari/);
    await c.page.keyboard.press("Escape");
    assert.equal(await c.page.locator("#instalarDlg").isHidden(), true, "Esc closes");
    await c.context.close();
  });

  test("already opened as the installed app: no 'Instalar o app'", async () => {
    const { page, context } = await openApp(env, { leads: dados(), ...CELULAR, userAgent: IPHONE_SAFARI,
      initScript: "Object.defineProperty(Navigator.prototype, 'standalone', { get: () => true });" });
    assert.equal(await menuTemInstalar(page), false);
    await context.close();
  });
});
