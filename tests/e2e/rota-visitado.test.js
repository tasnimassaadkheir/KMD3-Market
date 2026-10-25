// E2E tests: the "Visitado" tick on each stop of the visit route.
// Ticking a condo takes off its "Marcado para visitar" car (the card on the board loses the badge);
// unticking puts it back. The Visitar button in the condo panel still works on its own.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, irPeloMenu, criarNuvem } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const END = { a: "Rua A, 1, São Paulo, SP", b: "Rua B, 2, São Paulo, SP" };
const geo = { [END.a]: [-23.55, -46.65], [END.b]: [-23.56, -46.66] };
const dados = () => [
  lead({ id: "c1", nome: "Aurora", endereco: END.a, visitar: true }),
  lead({ id: "c2", nome: "Mirante", endereco: END.b, ordem: 1, visitar: true }),
];
const rotaJa = (ids, extras = {}) => [`(() => { localStorage.setItem("quitandinha:rota", ${JSON.stringify(JSON.stringify(ids))});
  localStorage.setItem("quitandinha:rotaExtras", ${JSON.stringify(JSON.stringify(extras))}); })()`];

async function abrirRota(opts) {
  const app = await openApp(env, { geo, fakeLeaflet: true, initScript: rotaJa(["c1", "c2"])[0], ...opts });
  await irPeloMenu(app.page, "#btnVista");
  await app.page.waitForSelector("body.vista-mapa");
  if (!(await app.page.locator("#mpRota.aberta").count())) await app.page.click("#mpRotaCab");
  await app.page.waitForSelector('#mpRotaLista li[data-id="c1"]');
  return app;
}
const tick = (page, id) => page.locator(`#mpRotaLista li[data-id="${id}"] input[data-visitado]`);
const lido = (page, id) => page.evaluate((i) => JSON.parse(localStorage.getItem("quitandinha:condominios")).find((l) => l.id === i), id);

describe("Route: 'Visitado' tick", () => {
  test("ticking a condo marks the stop visited and takes the car off its card; unticking puts it back", async () => {
    const { page, context, errors } = await abrirRota({ leads: dados() });
    assert.equal(await tick(page, "c1").isChecked(), false);
    assert.equal(await tick(page, "c1").getAttribute("aria-label"), "Visitado: Aurora");

    await tick(page, "c1").click();
    await page.waitForSelector('#mpRotaLista li.visitado[data-id="c1"]');
    assert.match(await page.textContent('#mpRotaLista li[data-id="c1"] .txt span'), /✓ Visitado/);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:condominios")).find((l) => l.id === "c1").visitar === false);
    const l = await lido(page, "c1");
    assert.ok(l.historico.some((h) => /Visitado \(rota de visitas\)/.test(h.texto || h.descricao || JSON.stringify(h))));
    assert.equal((await lido(page, "c2")).visitar, true, "the other one keeps its car");
    assert.equal(await page.evaluate(() => window.__rota.visitado("c1")), true);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:rotaExtras")).__visitados), ["c1"]);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:rota"))), ["c1", "c2"], "stays in the route");

    // back on the board: Aurora has no car, Mirante still has it
    await irPeloMenu(page, "#btnVista");
    await page.waitForSelector("body:not(.vista-mapa)");
    assert.equal(await page.locator('.cartao:has-text("Aurora") .selo-visitar').count(), 0);
    assert.equal(await page.locator('.cartao:has-text("Mirante") .selo-visitar').count(), 1);

    // untick: the car comes back
    await irPeloMenu(page, "#btnVista");
    await page.waitForSelector("body.vista-mapa");
    if (!(await page.locator("#mpRota.aberta").count())) await page.click("#mpRotaCab");
    await tick(page, "c1").click();
    await page.waitForSelector('#mpRotaLista li[data-id="c1"]:not(.visitado)');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:condominios")).find((l) => l.id === "c1").visitar === true);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("the panel's Visitar button still works by hand; a stop taken out of the route loses its tick", async () => {
    const { page, context } = await abrirRota({ leads: dados() });
    await tick(page, "c2").click();
    await page.waitForSelector('#mpRotaLista li.visitado[data-id="c2"]');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:condominios")).find((l) => l.id === "c2").visitar === false);
    await page.locator('#mpRotaLista li[data-id="c2"] button[data-acao="tira"]').click();
    await page.waitForFunction(() => !(JSON.parse(localStorage.getItem("quitandinha:rotaExtras") || "{}").__visitados));
    await irPeloMenu(page, "#btnVista");
    await page.waitForSelector("body:not(.vista-mapa)");
    // mark it again by hand in the condo panel
    await page.click('.cartao:has-text("Mirante")');
    await page.waitForSelector("#painel.aberto");
    await page.click("#btnVisitarLead");
    await page.waitForSelector('.cartao:has-text("Mirante") .selo-visitar');
    assert.equal((await lido(page, "c2")).visitar, true);
    await context.close();
  });

  test("a typed address stop can be ticked too (only the route changes); the printed page shows ✓", async () => {
    const extras = { x_1: { id: "x_1", nome: "Rua Avulsa, 10", endereco: "Rua Avulsa, 10", lat: -23.5, lng: -46.6 } };
    const app = await openApp(env, { leads: dados(), geo, fakeLeaflet: true, initScript: rotaJa(["c1", "x_1"], extras)[0] });
    const { page, context, errors } = app;
    await irPeloMenu(page, "#btnVista");
    await page.waitForSelector("body.vista-mapa");
    if (!(await page.locator("#mpRota.aberta").count())) await page.click("#mpRotaCab");
    await tick(page, "x_1").click();
    await page.waitForSelector('#mpRotaLista li.visitado[data-id="x_1"]');
    assert.equal((await lido(page, "c1")).visitar, true, "condos untouched");
    const [popup] = await Promise.all([context.waitForEvent("page"), (async () => {
      await page.click("#mpRotaExportar"); await page.click('[data-exp="imprimir"]'); })()]);
    await popup.waitForLoadState();
    assert.deepEqual(await popup.locator("td.ok").allTextContents(), ["", "✓"]);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("a read-only user sees the tick disabled for condos", async () => {
    const n = criarNuvem(undefined, { leitor: true });
    const agora = new Date().toISOString();
    n.tabelas.condominios = dados().map((l) => ({ id: l.id, nome: l.nome, endereco: l.endereco, aptos: 0, fase: "cadastro", status: "nenhum",
      ordem: l.ordem || 0, contatos: [], lembretes: [], observacoes: [], historico: [], sults: false, visitar: true, criado_em: agora, atualizado_em: agora }));
    const { page, context } = await openApp(env, { nuvem: n, geo, fakeLeaflet: true, initScript: rotaJa(["c1", "c2"])[0] });
    await irPeloMenu(page, "#btnVista");
    await page.waitForSelector('#mpRotaLista li[data-id="c1"] input[data-visitado]', { state: "attached" });
    assert.equal(await tick(page, "c1").isDisabled(), true);
    await context.close();
  });
});
