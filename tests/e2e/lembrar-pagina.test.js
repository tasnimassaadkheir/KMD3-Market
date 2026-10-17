// E2E tests: refreshing the page keeps you on the page you were on (it's kept in the address, e.g. #dashboard).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const hash = (page) => page.evaluate(() => location.hash);
async function recarregar(page) { await page.reload(); await page.waitForSelector(".coluna", { state: "attached" }); await page.waitForTimeout(300); }

describe("Refresh stays on the same page", () => {
  const casos = [
    ["#btnDashboard", "#dashboard", "#telaDashboard.aberta"],
    ["#btnLembretes", "#lembretes", "#telaLembretes.aberta"],
    ["#btnContatos", "#contatos", "#telaContatos.aberta"],
    ["#btnTemplates", "#templates", "#telaTemplates.aberta"],
    ["#btnEquipe", "#equipe", "#painelEquipe.aberto"],
  ];
  for (const [botao, h, aberta] of casos) {
    test(`${h}: opening it puts it in the address, and a refresh comes back to it`, async () => {
      const { page, context, errors } = await openApp(env, { leads: [lead()] });
      assert.equal(await hash(page), "");
      await irPeloMenu(page, botao);
      await page.waitForSelector(aberta);
      await page.waitForFunction((x) => location.hash === x, h);
      await recarregar(page);
      await page.waitForSelector(aberta);
      assert.equal(await hash(page), h);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }

  test("Prospecção and the map come back too", async () => {
    const { page, context } = await openApp(env, { leads: [lead()], fakeLeaflet: true });
    await page.route("**/dados/prospeccao-*.json", (r) => r.fulfill({ status: 404, body: "" }));
    await irPeloMenu(page, "#btnProspeccao");
    await page.waitForFunction(() => location.hash === "#prospeccao");
    await recarregar(page);
    await page.waitForSelector("#telaProspeccao.aberta");
    await page.click("#btnFecharProspeccao");

    await irPeloMenu(page, "#btnVista");
    await page.waitForFunction(() => location.hash === "#mapa");
    await recarregar(page);
    await page.waitForFunction(() => document.body.classList.contains("vista-mapa"));
    await context.close();
  });

  test("closing the page goes back to the board, and a refresh stays on the board", async () => {
    const { page, context } = await openApp(env, { leads: [lead()] });
    await irPeloMenu(page, "#btnDashboard");
    await page.waitForFunction(() => location.hash === "#dashboard");
    await page.click("#btnFecharDashboard");
    await page.waitForFunction(() => location.hash === "");
    await recarregar(page);
    assert.equal(await page.locator("#telaDashboard.aberta").count(), 0);
    assert.equal(await hash(page), "");
    await context.close();
  });

  test("an address that isn't a page (e.g. #xyz) just opens the board", async () => {
    const { page, context, errors } = await openApp(env, { leads: [lead()] });
    await page.goto(env.url + "#xyz"); await page.waitForSelector(".coluna"); await page.waitForTimeout(300);
    assert.equal(await page.locator(".tela-lem.aberta").count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
  });
});
