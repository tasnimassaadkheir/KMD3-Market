// E2E tests: every full-screen page (Dashboard, Lembretes, Contatos, Templates, Busca Condomínio,
// Administração) has its own ☰ at the top left, so you can go straight to another page.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, irPeloMenu, criarNuvem } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const dados = () => [lead({ id: "c1", nome: "Residencial Aurora" })];
const PAGINAS = [
  { botao: "#btnDashboard", tela: "#telaDashboard", hash: "#dashboard" },
  { botao: "#btnLembretes", tela: "#telaLembretes", hash: "#lembretes" },
  { botao: "#btnContatos", tela: "#telaContatos", hash: "#contatos" },
  { botao: "#btnTemplates", tela: "#telaTemplates", hash: "#templates" },
  { botao: "#btnProspeccao", tela: "#telaProspeccao", hash: "#busca-condominio" },
];
const abertas = (page) => page.evaluate(() =>
  ["#telaDashboard", "#telaLembretes", "#telaContatos", "#telaTemplates", "#telaProspeccao"].filter((s) => document.querySelector(s).classList.contains("aberta")));
// The menu is really on top: the element in the middle of the first item is that item.
// (waits for the slide-in to finish first)
async function menuPorCima(page) {
  await page.waitForFunction(() => document.querySelector("#menuLateral").getBoundingClientRect().x >= 0);
  return page.evaluate(() => {
    const r = document.querySelector("#btnDashboard").getBoundingClientRect();
    const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !!(e && e.closest("#menuLateral"));
  });
}

describe("☰ on every page", () => {
  test("each full-screen page has ☰ at the top left (before 'Voltar'), and the menu opens on top of it", async () => {
    const { page, context, errors } = await openApp(env, { leads: dados() });
    for (const p of PAGINAS) {
      await irPeloMenu(page, p.botao);
      await page.waitForSelector(p.tela + ".aberta");
      const menu = page.locator(p.tela + " .tela-lem-topo > [data-abrir-menu]");
      assert.equal(await menu.count(), 1, p.tela);
      assert.equal(await menu.getAttribute("aria-label"), "Abrir menu");
      const [m, v] = [await menu.boundingBox(), await page.locator(p.tela + " .btn-voltar").boundingBox()];
      assert.ok(m.x < v.x && m.x < 40, p.tela + ": top left, before Voltar");
      await menu.click();
      await page.waitForSelector("#menuLateral.aberto");
      assert.equal(await menu.getAttribute("aria-expanded"), "true");
      assert.equal(await menuPorCima(page), true, p.tela + ": menu above the page");
      await page.keyboard.press("Escape");
      await page.waitForSelector("#menuLateral:not(.aberto)");
      assert.equal(await page.evaluate((s) => document.activeElement === document.querySelector(s + " [data-abrir-menu]"), p.tela), true, "focus back on this ☰");
      await page.click(p.tela + " .btn-voltar");
    }
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("going from page to page through ☰: the old page closes, the chosen one opens, the address follows", async () => {
    const { page, context, errors } = await openApp(env, { leads: dados() });
    await irPeloMenu(page, "#btnDashboard");
    await page.waitForSelector("#telaDashboard.aberta");
    let atual = PAGINAS[0];
    for (const proxima of [...PAGINAS.slice(1), PAGINAS[0]]) {
      await page.click(atual.tela + " [data-abrir-menu]");
      await page.waitForSelector("#menuLateral.aberto");
      await page.click(proxima.botao);
      await page.waitForSelector(proxima.tela + ".aberta");
      assert.deepEqual(await abertas(page), [proxima.tela], "only " + proxima.tela);
      await page.waitForFunction((h) => location.hash === h, proxima.hash);
      atual = proxima;
    }
    // Equipe (a side panel) and Mapa from a page: the page closes
    await page.click("#telaDashboard [data-abrir-menu]");
    await page.click("#btnEquipe");
    await page.waitForSelector("#painelEquipe.aberto");
    assert.deepEqual(await abertas(page), []);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("Administração also has ☰; the menu opens above it and choosing a page closes it", async () => {
    const adm = criarNuvem(undefined, { rpc: { sou_admin: true, sou_super: false, admin_organizacoes: [], admin_membros: [] } });
    const { page, context } = await openApp(env, { nuvem: adm });
    await page.waitForSelector("#btnAdmin:not([hidden])", { state: "attached" });
    await irPeloMenu(page, "#btnAdmin");
    await page.waitForSelector("#admTela:not([hidden])");
    const menu = page.locator("#admTela .adm-topo > [data-abrir-menu]");
    const [m, t] = [await menu.boundingBox(), await page.locator("#admTela .adm-topo h2").boundingBox()];
    assert.ok(m.x < t.x, "before the title");
    await menu.click();
    await page.waitForSelector("#menuLateral.aberto");
    assert.equal(await menuPorCima(page), true);
    await page.click("#btnLembretes");
    await page.waitForSelector("#telaLembretes.aberta");
    assert.equal(await page.locator("#admTela").isHidden(), true);
    await context.close();
  });

  test("on a phone the page headers fit with the ☰ (no sideways scroll)", async () => {
    const { page, context } = await openApp(env, { leads: dados(), viewport: { width: 360, height: 780 } });
    for (const p of PAGINAS) {
      await irPeloMenu(page, p.botao);
      await page.waitForSelector(p.tela + ".aberta");
      const topo = page.locator(p.tela + " .tela-lem-topo");
      assert.equal(await topo.evaluate((e) => e.scrollWidth <= e.clientWidth + 1), true, p.tela);
      const m = await page.locator(p.tela + " [data-abrir-menu]").boundingBox();
      assert.ok(m.x >= 0 && m.x + m.width <= 360);
      await page.click(p.tela + " .btn-voltar");
    }
    await context.close();
  });
});
