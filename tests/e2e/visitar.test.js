// E2E tests: the "Visitar" button in the condo panel and the small car on the card's corner.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { setup, openApp, lead } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const salvo = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0]);

describe("Visitar", () => {
  test("sits next to 'Adicionar à rota' and saves right away, showing a car on the card", async () => {
    const { page, context, errors } = await openApp(env, { leads: [lead({ id: "c1", nome: "Aurora" })] });
    assert.equal(await page.locator(".cartao .selo-visitar").count(), 0);
    await page.click(".cartao");

    const btn = page.locator("#btnVisitarLead");
    const rota = await page.locator("#btnRotaLead").boundingBox();
    const vis = await btn.boundingBox();
    assert.ok(Math.abs(vis.y - rota.y) < 4 && vis.x > rota.x, "on the same row, to the right of the route button");
    assert.match(await btn.textContent(), /Visitar$/);

    await btn.click();
    assert.equal(await btn.getAttribute("aria-pressed"), "true");
    assert.match(await btn.textContent(), /Visitar ✓/);
    await page.waitForSelector(".cartao .selo-visitar svg");   // shows without pressing Salvar
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].visitar === true);
    assert.match((await salvo(page)).historico[0].o_que, /Marcado para visitar/);

    // "Cancelar" doesn't undo it (it was already saved)
    await page.click("#btnCancelar");
    assert.equal(await page.locator(".cartao .selo-visitar").count(), 1);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("the car sits on the card's top-right corner, partly outside it, and isn't cut off", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora", visitar: true })] });
    const card = await page.locator(".cartao").boundingBox();
    const carro = await page.locator(".cartao .selo-visitar").boundingBox();
    assert.ok(carro.x + carro.width > card.x + card.width, "sticks out on the right");
    assert.ok(carro.y < card.y, "sticks out on the top");
    // the scrolling list would cut anything outside its box: the whole car must be inside it
    const lista = await page.locator(".cartao").evaluate((el) => el.closest(".lista").getBoundingClientRect().toJSON());
    assert.ok(carro.y >= lista.y && carro.x + carro.width <= lista.x + lista.width, "fully visible");
    await context.close();
  });

  test("turning it off removes the car and saves it", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora", visitar: true })] });
    await page.click(".cartao");
    assert.equal(await page.getAttribute("#btnVisitarLead", "aria-pressed"), "true");
    await page.click("#btnVisitarLead");
    await page.waitForSelector(".cartao .selo-visitar", { state: "detached" });
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].visitar === false);
    assert.match((await salvo(page)).historico[0].o_que, /Desmarcado de visitar/);
    await context.close();
  });

  test("editing other fields and pressing Salvar keeps the Visitar mark", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora" })] });
    await page.click(".cartao");
    await page.click("#btnVisitarLead");
    await page.fill("#f_zona", "Moema");
    await page.click("#btnSalvar");
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].zona === "Moema");
    assert.equal((await salvo(page)).visitar, true);
    assert.equal(await page.locator(".cartao .selo-visitar").count(), 1);
    await context.close();
  });

  test("not available while creating a new condo; the CSV export has a Visitar column", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora", visitar: true })] });
    await page.click("#btnNovo");
    assert.equal(await page.locator("#btnVisitarLead").isVisible(), false);
    await page.click("#btnCancelar");
    const [download] = await Promise.all([page.waitForEvent("download"), page.click("#btnExportar")]);
    const linhas = fs.readFileSync(await download.path(), "utf8").slice(1).split("\r\n");
    assert.match(linhas[0], /"Visitar"$/);
    assert.match(linhas[1], /"Sim"$/);
    await context.close();
  });
});
