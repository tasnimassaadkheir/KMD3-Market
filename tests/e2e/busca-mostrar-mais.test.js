// E2E tests: Busca Condomínio shows the 100 biggest first; "Mostrar mais" at the end of the list adds
// 100 more of the same search each time; a new search starts again at 100; "Exportar" exports
// every building of the search (not only the ones on screen).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { setup, openApp, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

// 250 buildings in "Moema" (1000 down to 751 apartments) + 30 in "Lapa": the robot's compact format.
function lista() {
  const linhas = [];
  for (let i = 0; i < 250; i++) linhas.push([`m${i}`, "R Teste", String(i + 1), "Moema", "04077-000", 1000 - i, 10, 2000, null]);
  for (let i = 0; i < 30; i++) linhas.push([`l${i}`, "R Lapa", String(i + 1), "Lapa", "05000-000", 500 - i, 5, 1990, null]);
  linhas.sort((a, b) => b[5] - a[5]);
  return { fonte: "Cadastro do IPTU — Prefeitura de São Paulo (GeoSampa)", ano: 2026, minimoAptos: 10, geradoEm: "2026-10-16T12:00:00Z",
    total: linhas.length, campos: ["id", "logradouro", "numero", "bairro", "cep", "apartamentos", "pavimentos", "ano_construcao", "padrao"],
    padroes: [], linhas };
}
async function abrir() {
  const app = await openApp(env, { fakeLeaflet: true });
  await app.page.route("**/dados/prospeccao-sp.json", (r) => r.fulfill({ json: lista() }));
  await app.page.route("**/dados/prospeccao-vizinhas.json", (r) => r.fulfill({ status: 404, body: "" }));
  await irPeloMenu(app.page, "#btnProspeccao");
  await app.page.waitForSelector("#telaProspeccao.aberta #prLista li");
  return app;
}
const n = (page) => page.locator("#prLista li").count();

describe("Busca Condomínio: 'Mostrar mais'", () => {
  test("starts with the 100 biggest; each click adds 100 more; the button goes away at the end", async () => {
    const { page, context, errors } = await abrir();
    assert.equal(await n(page), 100);
    assert.match(await page.textContent("#prResumo"), /Os 100 maiores de 280 condomínios/);
    const mais = page.locator("#prMais");
    assert.equal(await mais.textContent(), "Mostrar mais 100 (faltam 180)");
    await mais.click();
    assert.equal(await n(page), 200);
    assert.match(await page.textContent("#prResumo"), /Os 200 maiores de 280/);
    assert.equal(await mais.textContent(), "Mostrar mais 80 (faltam 80)");
    // the first new row is the 101st biggest, and the keyboard focus moves there
    assert.equal(await page.evaluate(() => !!document.activeElement.closest("#prLista li:nth-child(101)")), true);
    await mais.click();
    assert.equal(await n(page), 280);
    assert.match(await page.textContent("#prResumo"), /280 condomínios/);
    assert.equal(await mais.isHidden(), true);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("a new search starts again at 100; a search with fewer than 100 has no button", async () => {
    const { page, context } = await abrir();
    await page.click("#prMais");
    assert.equal(await n(page), 200);
    await page.fill("#prBusca", "moema");
    await page.waitForFunction(() => /de 250/.test(document.querySelector("#prResumo").textContent));
    assert.equal(await n(page), 100, "back to the 100 biggest of the new search");
    assert.equal(await page.textContent("#prMais"), "Mostrar mais 100 (faltam 150)");
    await page.fill("#prBusca", "lapa");
    await page.waitForFunction(() => /^30 condomínios/.test(document.querySelector("#prResumo").textContent));
    assert.equal(await n(page), 30);
    assert.equal(await page.locator("#prMais").isHidden(), true);
    await context.close();
  });

  test("'Exportar' exports every building of the search, not only the ones on screen", async () => {
    const { page, context } = await abrir();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#btnPrExportar")]);
    const linhas = fs.readFileSync(await dl.path(), "utf8").trim().split(/\r\n/);
    assert.equal(linhas.length, 1 + 280, "header + all 280");
    await context.close();
  });
});
