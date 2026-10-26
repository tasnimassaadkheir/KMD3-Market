// E2E tests: on phones the page must not zoom in by itself.
// iPhones zoom the whole page in when a field with text smaller than 16px gets focus (by a tap
// or by the app putting the cursor there). So on touch screens: no automatic focus when a panel
// or form opens, and every field uses 16px text. Pinch-zoom by hand stays allowed.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const CELULAR = { viewport: { width: 390, height: 844 }, toque: true };
const dados = () => [lead({ id: "c1", nome: "Residencial Aurora", endereco: "Rua A, 1, São Paulo, SP",
  contatos: [{ nome: "João", telefone: "11999999999", email: "joao@x.com", tipo: "Síndico" }] })];
// Visible text fields with text smaller than 16px, and the field that has the cursor (if any).
const auditar = (page) => page.evaluate(() => {
  const visivel = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; };
  const pequenos = [...document.querySelectorAll("input,select,textarea")]
    .filter((e) => !/checkbox|radio|hidden|range|color/.test(e.type) && visivel(e))
    .filter((e) => parseFloat(getComputedStyle(e).fontSize) < 16).map((e) => (e.id || e.className) + " " + getComputedStyle(e).fontSize);
  const a = document.activeElement;
  return { pequenos, foco: a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) ? a.id || a.className : "" };
});

describe("Phones: no zoom when opening things", () => {
  test("the page still allows pinch-zoom (no user-scalable=no / maximum-scale)", async () => {
    const { page, context } = await openApp(env, { leads: dados(), ...CELULAR });
    const vp = await page.getAttribute('meta[name="viewport"]', "content");
    assert.doesNotMatch(vp, /user-scalable\s*=\s*no|maximum-scale/);
    await context.close();
  });

  test("opening a condo card: no field gets the cursor and every field has 16px text", async () => {
    const { page, context, errors } = await openApp(env, { leads: dados(), ...CELULAR });
    assert.deepEqual((await auditar(page)).pequenos, [], "header search and filters");
    await page.click(".cartao");
    await page.waitForSelector("#painel.aberto");
    await page.waitForTimeout(350);                                  // the old focus came 180 ms after opening
    const r = await auditar(page);
    assert.equal(r.foco, "", "no keyboard popping up");
    assert.deepEqual(r.pequenos, []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390, "no sideways scroll");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("the other pages: no automatic cursor and 16px fields (Equipe, Contatos form, Templates form, Lembretes, Dashboard, Busca Condomínio, Mapa)", async () => {
    const { page, context } = await openApp(env, { leads: dados(), fakeLeaflet: true, ...CELULAR });
    const paginas = [["#btnEquipe"], ["#btnContatos", "#btnNovoContato"], ["#btnTemplates", "#btnNovoTemplate"], ["#btnLembretes"], ["#btnDashboard"], ["#btnProspeccao"], ["#btnVista"]];
    for (const [botao, novo] of paginas) {
      await irPeloMenu(page, botao);
      await page.waitForTimeout(500);
      if (novo) { await page.click(novo); await page.waitForTimeout(250); }
      const r = await auditar(page);
      assert.equal(r.foco, "", botao + ": no automatic cursor");
      assert.deepEqual(r.pequenos, [], botao + ": all fields 16px");
      await page.goto(page.url().split("#")[0]);
      await page.waitForSelector(".cartao");
    }
    await context.close();
  });

  test("on a computer nothing changes: opening a card still puts the cursor in the name", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await page.click(".cartao");
    await page.waitForFunction(() => document.activeElement && document.activeElement.id === "f_nome");
    assert.equal(await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector("#busca")).fontSize) < 16), true, "desktop keeps its smaller text");
    await context.close();
  });
});
