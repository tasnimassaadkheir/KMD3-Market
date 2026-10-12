// E2E tests: the "🚗 Visitar" filter on the map (only condos marked "Visitar" on their card).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const END = { a: "Rua A, 1, São Paulo, SP", b: "Rua B, 2, São Paulo, SP", c: "Rua C, 3, São Paulo, SP" };
const geo = { [END.a]: [-23.55, -46.65], [END.b]: [-23.56, -46.66], [END.c]: [-23.57, -46.67] };
const dados = (visitar = ["c1", "c3"]) => [
  lead({ id: "c1", nome: "Aurora", endereco: END.a, visitar: visitar.includes("c1") }),
  lead({ id: "c2", nome: "Mirante", endereco: END.b, ordem: 1, visitar: visitar.includes("c2") }),
  lead({ id: "c3", nome: "Bosque", endereco: END.c, ordem: 2, visitar: visitar.includes("c3") }),
];
// Coordinates of the dots drawn on the (fake) map.
const pontos = (page) => page.evaluate(() => window.__leaflet.groups[0].layers.filter((l) => l.type === "circle").map((l) => l.latlng));

async function abrirMapa(opts) {
  const app = await openApp(env, { geo, fakeLeaflet: true, ...opts });
  await irPeloMenu(app.page, "#btnVista");
  await app.page.waitForSelector("body.vista-mapa");
  return app;
}

describe("Map: 'Visitar' filter", () => {
  test("shows how many condos are marked to visit; pressing it shows only those", async () => {
    const { page, context, errors } = await abrirMapa({ leads: dados() });
    const btn = page.locator("#mpSoVisitar");
    assert.equal(await page.textContent("#mpSoVisitarN"), "2");
    assert.equal(await btn.getAttribute("aria-pressed"), "false");
    assert.equal((await pontos(page)).length, 3, "all condos before");

    await btn.click();
    assert.equal(await btn.getAttribute("aria-pressed"), "true");
    assert.deepEqual(await pontos(page), [geo[END.a], geo[END.c]], "only Aurora and Bosque (with the car)");
    assert.equal(await page.textContent("#mpStatus"), "2 para visitar");

    await btn.click();
    assert.equal((await pontos(page)).length, 3, "all condos again");
    assert.equal(await page.textContent("#mpStatus"), "3 no mapa");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("when no condo is marked, it explains how to mark one and stays off", async () => {
    const { page, context } = await abrirMapa({ leads: dados([]) });
    assert.equal(await page.textContent("#mpSoVisitarN"), "0");
    await page.click("#mpSoVisitar");
    assert.equal(await page.getAttribute("#mpSoVisitar", "aria-pressed"), "false");
    assert.match(await page.textContent("#aviso"), /Nenhum condomínio marcado para visitar/);
    assert.equal((await pontos(page)).length, 3);
    await context.close();
  });

  test("works together with the board's filters (search)", async () => {
    const { page, context } = await openApp(env, { leads: dados(), geo, fakeLeaflet: true });
    await page.fill("#busca", "bosque");
    await irPeloMenu(page, "#btnVista");
    await page.waitForSelector("body.vista-mapa");
    assert.equal(await page.textContent("#mpSoVisitarN"), "1");
    await page.click("#mpSoVisitar");
    assert.deepEqual(await pontos(page), [geo[END.c]]);
    await context.close();
  });

  test("with the filter on, 'Adicionar da tela' adds only the condos to visit to the route", async () => {
    const { page, context } = await abrirMapa({ leads: dados() });
    await page.click("#mpSoVisitar");
    if (!(await page.locator("#mpRota.aberta").count())) await page.click("#mpRotaCab");
    await page.click("#mpRotaArea");
    assert.deepEqual((await page.locator("#mpRotaLista li b").allTextContents()).sort(), ["Aurora", "Bosque"]);
    await context.close();
  });
});
