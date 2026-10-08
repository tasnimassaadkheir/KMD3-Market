// E2E tests: the visit route (rota de visitas) — adding a condo from its panel, the start point
// (ponto de partida), typed addresses as stops, ordering, Google Maps link and the exports.
// Uses a fake Leaflet and a fake address search (see helpers.js), so it runs offline.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { setup, openApp, lead } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

// Test places in São Paulo. PARTIDA is the start; PERTO is ~0.3 km from it, MEIO ~3 km, LONGE ~7 km.
const POS = {
  PARTIDA: [-23.5500, -46.6500],
  PERTO: [-23.5520, -46.6520],
  MEIO: [-23.5700, -46.6700],
  LONGE: [-23.6000, -46.7000],
};
const END = {
  perto: "Rua Perto, 10, São Paulo, SP",
  meio: "Rua do Meio, 20, São Paulo, SP",
  longe: "Rua Longe, 30, São Paulo, SP",
};
const condos = () => [
  lead({ id: "c_longe", nome: "Condomínio Longe", endereco: END.longe, ordem: 0, contatos: [{ nome: "Rita", telefone: "11988887777" }] }),
  lead({ id: "c_perto", nome: "Condomínio Perto", endereco: END.perto, ordem: 1, responsavel: "Ana" }),
  lead({ id: "c_meio", nome: "Condomínio Meio", endereco: END.meio, ordem: 2 }),
];
const geo = { [END.perto]: POS.PERTO, [END.meio]: POS.MEIO, [END.longe]: POS.LONGE };
const nominatim = { "rua augusta": POS.PARTIDA, "fornecedor": POS.MEIO };

const lerLS = (page, chave) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), chave);

/** Opens the app with the test condos, optionally an existing route, and switches to the map view. */
async function abrirMapa(opts = {}) {
  const app = await openApp(env, { leads: condos(), geo, nominatim, fakeLeaflet: true, ...opts });
  if (opts.rota) await app.page.evaluate((r) => localStorage.setItem("quitandinha:rota", JSON.stringify(r)), opts.rota);
  if (opts.rota) { await app.page.reload(); await app.page.waitForSelector(".coluna"); }
  await app.page.click("#btnVista");
  await app.page.waitForSelector("body.vista-mapa");
  if (!(await app.page.locator("#mpRota.aberta").count())) await app.page.click("#mpRotaCab");
  return app;
}
/** Coordinates of the route line drawn on the (fake) map, in order. */
const linhaDaRota = (page) => page.evaluate(() => {
  const camadaRota = window.__leaflet.groups[1];
  const linha = camadaRota.layers.find((l) => l.type === "polyline");
  return linha ? linha.latlngs : [];
});
/** Replaces window.open so the test can read the URLs the app tries to open. */
const capturarAberturas = (page) => page.evaluate(() => { window.__abertos = []; window.open = (u) => { window.__abertos.push(u); return null; }; });

describe("Adding a condo to the route from its panel", () => {
  test("the button adds and removes the condo, and shows its position in the route", async () => {
    const { page, context, errors } = await openApp(env, { leads: condos(), geo });
    await page.click('.cartao:has-text("Condomínio Perto")');
    const btn = page.locator("#btnRotaLead");
    assert.match(await btn.textContent(), /Adicionar à rota de visitas/);

    await btn.click();
    assert.match(await btn.textContent(), /Parada 1 de 1 na rota/);
    assert.deepEqual(await lerLS(page, "quitandinha:rota"), ["c_perto"]);
    assert.match(await page.textContent("#aviso"), /entrou na rota/);

    await btn.click();
    assert.match(await btn.textContent(), /Adicionar à rota/);
    assert.deepEqual(await lerLS(page, "quitandinha:rota"), []);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("the button is hidden while creating a new condo (it has no id yet)", async () => {
    const { page, context } = await openApp(env);
    await page.click("#btnNovo");
    assert.equal(await page.locator("#blocoRotaLead").isHidden(), true);
    await context.close();
  });

  test("a condo added from the panel appears in the map's route", async () => {
    const { page, context } = await openApp(env, { leads: condos(), geo, fakeLeaflet: true });
    await page.click('.cartao:has-text("Condomínio Meio")');
    await page.click("#btnRotaLead");
    await page.click("#btnFechar");
    await page.click("#btnVista");
    await page.waitForSelector("body.vista-mapa");
    assert.deepEqual(await page.locator("#mpRotaLista li b").allTextContents(), ["Condomínio Meio"]);
    assert.equal(await page.textContent("#mpRotaN"), "1");
    await context.close();
  });
});

describe("Start point (ponto de partida)", () => {
  test("a typed address becomes the start and the route line begins there", async () => {
    const { page, context } = await abrirMapa({ rota: ["c_perto", "c_meio"] });
    await page.fill("#mpPartidaInput", "Rua Augusta, 100, São Paulo, SP");
    await page.click("#mpPartidaOk");
    await page.waitForSelector("#mpPartidaAtual:not([hidden])");
    assert.equal(await page.textContent("#mpPartidaNome"), "Rua Augusta, 100, São Paulo, SP");
    assert.deepEqual(await linhaDaRota(page), [POS.PARTIDA, POS.PERTO, POS.MEIO]);
    assert.match(await page.textContent("#mpRotaTotal"), /saindo do ponto de partida/);
    assert.ok((await lerLS(page, "quitandinha:rotaInicio")).lat, "start point is saved");

    await page.click("#mpPartidaLimpar");
    assert.equal(await page.locator("#mpPartidaForm").isVisible(), true);
    assert.deepEqual(await linhaDaRota(page), [POS.PERTO, POS.MEIO]);
    await context.close();
  });

  test("'📍' uses the device's current location as the start", async () => {
    const { page, context } = await abrirMapa({ rota: ["c_perto"], geolocation: { latitude: POS.PARTIDA[0], longitude: POS.PARTIDA[1] } });
    await page.click("#mpPartidaGps");
    await page.waitForSelector("#mpPartidaAtual:not([hidden])");
    assert.equal(await page.textContent("#mpPartidaNome"), "Minha localização");
    assert.deepEqual(await linhaDaRota(page), [POS.PARTIDA, POS.PERTO]);
    await context.close();
  });

  test("an address that can't be found shows an error and changes nothing", async () => {
    const { page, context } = await abrirMapa({ rota: ["c_perto"] });
    await page.fill("#mpPartidaInput", "Lugar Que Não Existe 999");
    await page.click("#mpPartidaOk");
    await page.waitForFunction(() => /não encontrado/.test(document.querySelector("#aviso").textContent));
    assert.equal(await page.locator("#mpPartidaAtual").isHidden(), true);
    assert.equal(await lerLS(page, "quitandinha:rotaInicio"), null);
    await context.close();
  });
});

describe("Typed addresses as stops", () => {
  test("adds a typed address to the route with its own marker style", async () => {
    const { page, context } = await abrirMapa({ rota: ["c_perto"] });
    await page.fill("#mpEndInput", "Fornecedor de frutas, Rua X, 50, São Paulo, SP");
    await page.press("#mpEndInput", "Enter");
    await page.waitForFunction(() => document.querySelectorAll("#mpRotaLista li").length === 2);
    const itens = page.locator("#mpRotaLista li");
    assert.match(await itens.nth(1).textContent(), /Fornecedor de frutas/);
    assert.match(await itens.nth(1).textContent(), /Endereço adicionado/);
    assert.equal(await itens.nth(1).locator(".num.extra").count(), 1);
    assert.deepEqual(await linhaDaRota(page), [POS.PERTO, POS.MEIO]);
    assert.equal(await page.inputValue("#mpEndInput"), "", "field is cleared");

    const rota = await lerLS(page, "quitandinha:rota");
    const extras = await lerLS(page, "quitandinha:rotaExtras");
    assert.ok(rota[1].startsWith("x_"));
    assert.equal(extras[rota[1]].endereco, "Fornecedor de frutas, Rua X, 50, São Paulo, SP");

    // removing it from the route also forgets its saved data
    await itens.nth(1).locator('[data-acao="tira"]').click();
    assert.deepEqual(await lerLS(page, "quitandinha:rotaExtras"), {});
    await context.close();
  });

  test("the route (stops, typed addresses and start point) is still there after reloading", async () => {
    const { page, context } = await abrirMapa({ rota: ["c_meio"] });
    await page.fill("#mpPartidaInput", "Rua Augusta, 100"); await page.click("#mpPartidaOk");
    await page.waitForSelector("#mpPartidaAtual:not([hidden])");
    await page.fill("#mpEndInput", "Fornecedor, São Paulo"); await page.click("#mpEndOk");
    await page.waitForFunction(() => document.querySelectorAll("#mpRotaLista li").length === 2);

    await page.reload(); await page.waitForSelector(".coluna");
    await page.click("#btnVista"); await page.waitForSelector("body.vista-mapa");
    assert.equal(await page.textContent("#mpPartidaNome"), "Rua Augusta, 100");
    assert.equal(await page.locator("#mpRotaLista li").count(), 2);
    await context.close();
  });
});

describe("Ordering and Google Maps", () => {
  test("with a start point, 'Ordenar' goes to the closest stop first", async () => {
    const { page, context } = await abrirMapa({ rota: ["c_longe", "c_perto", "c_meio"] });
    await page.fill("#mpPartidaInput", "Rua Augusta, 100"); await page.click("#mpPartidaOk");
    await page.waitForSelector("#mpPartidaAtual:not([hidden])");
    await page.click("#mpRotaOtimizar");
    assert.deepEqual(await page.locator("#mpRotaLista li b").allTextContents(),
      ["Condomínio Perto", "Condomínio Meio", "Condomínio Longe"]);
    await context.close();
  });

  test("without a start point, the first stop is kept", async () => {
    const { page, context } = await abrirMapa({ rota: ["c_longe", "c_perto", "c_meio"] });
    await page.click("#mpRotaOtimizar");
    assert.deepEqual(await page.locator("#mpRotaLista li b").allTextContents(),
      ["Condomínio Longe", "Condomínio Meio", "Condomínio Perto"]);
    await context.close();
  });

  test("the Google Maps link leaves from the start point and passes the stops in order", async () => {
    const { page, context } = await abrirMapa({ rota: ["c_perto", "c_meio", "c_longe"] });
    await page.fill("#mpPartidaInput", "Rua Augusta, 100"); await page.click("#mpPartidaOk");
    await page.waitForSelector("#mpPartidaAtual:not([hidden])");
    await capturarAberturas(page);
    await page.click("#mpRotaGmaps");
    const url = new URL(await page.evaluate(() => window.__abertos[0]));
    const c = (p) => p[0].toFixed(6) + "," + p[1].toFixed(6);
    assert.equal(url.searchParams.get("origin"), c(POS.PARTIDA));
    assert.equal(url.searchParams.get("waypoints"), c(POS.PERTO) + "|" + c(POS.MEIO));
    assert.equal(url.searchParams.get("destination"), c(POS.LONGE));
    await context.close();
  });
});

describe("Exporting the route", () => {
  async function rotaPronta() {
    const app = await abrirMapa({ rota: ["c_perto", "c_longe"] });
    await app.page.fill("#mpPartidaInput", "Rua Augusta, 100"); await app.page.click("#mpPartidaOk");
    await app.page.waitForSelector("#mpPartidaAtual:not([hidden])");
    await app.page.fill("#mpEndInput", "Fornecedor, São Paulo"); await app.page.click("#mpEndOk");
    await app.page.waitForFunction(() => document.querySelectorAll("#mpRotaLista li").length === 3);
    await app.page.click("#mpRotaExportar");
    return app;
  }

  test("'Exportar' is disabled while the route is empty", async () => {
    const { page, context } = await abrirMapa();
    assert.equal(await page.locator("#mpRotaExportar").isDisabled(), true);
    await context.close();
  });

  test("spreadsheet (CSV): start point + stops in order, distances and links", async () => {
    const { page, context } = await rotaPronta();
    const [download] = await Promise.all([page.waitForEvent("download"), page.click('[data-exp="csv"]')]);
    assert.match(download.suggestedFilename(), /^rota-de-visitas-\d{4}-\d{2}-\d{2}\.csv$/);
    const csv = fs.readFileSync(await download.path(), "utf8");
    assert.ok(csv.startsWith("﻿"), "BOM so Excel reads accents");
    const linhas = csv.slice(1).split("\r\n").map((l) => l.split(";").map((c) => c.replace(/^"|"$/g, "")));
    assert.equal(linhas[0][0], "Ordem");
    assert.deepEqual(linhas.slice(1, 5).map((l) => [l[0], l[1], l[2]]), [
      ["Partida", "Ponto de partida", "Rua Augusta, 100"],
      ["1", "Condomínio", "Condomínio Perto"],
      ["2", "Condomínio", "Condomínio Longe"],
      ["3", "Endereço avulso", "Fornecedor, São Paulo"],
    ]);
    assert.match(linhas[2][8], /^0,\d$/, "distance from start to the first stop, in km");
    assert.equal(linhas[2][6], "Ana", "person responsible");
    assert.match(linhas[3][7], /Rita 11988887777/, "contacts");
    assert.ok(csv.includes("https://www.google.com/maps/dir/"), "full route link at the end");
    await context.close();
  });

  test("WhatsApp: opens wa.me with the route text", async () => {
    const { page, context } = await rotaPronta();
    await capturarAberturas(page);
    await page.click('[data-exp="whats"]');
    const url = await page.evaluate(() => window.__abertos[0]);
    assert.ok(url.startsWith("https://wa.me/?text="));
    const texto = decodeURIComponent(url.split("text=")[1]);
    assert.match(texto, /🏁 Partida: Rua Augusta, 100/);
    assert.match(texto, /1\. Condomínio Perto — Rua Perto, 10/);
    assert.match(texto, /3\. Fornecedor, São Paulo/);
    assert.match(texto, /Google Maps: https:\/\/www\.google\.com\/maps\/dir\//);
    await context.close();
  });

  test("copy as text puts the same route text in the clipboard", async () => {
    const { page, context } = await rotaPronta();
    await page.evaluate(() => { window.__copiado = null; navigator.clipboard.writeText = async (t) => { window.__copiado = t; }; });
    await page.click('[data-exp="copiar"]');
    await page.waitForFunction(() => window.__copiado);
    const texto = await page.evaluate(() => window.__copiado);
    assert.match(texto, /Rota de visitas — KMD3 Market/);
    assert.match(texto, /2\. Condomínio Longe/);
    assert.match(await page.textContent("#aviso"), /copiada/);
    await context.close();
  });

  test("print / PDF opens a printable page with every stop", async () => {
    const { page, context } = await rotaPronta();
    await page.evaluate(() => { window.__imprimiu = 0; });
    const [popup] = await Promise.all([page.waitForEvent("popup"), page.click('[data-exp="imprimir"]')]);
    await popup.waitForLoadState();
    const linhas = await popup.locator("tbody tr").allTextContents();
    assert.equal(linhas.length, 4);
    assert.match(linhas[0], /Partida/);
    assert.match(linhas[3], /Fornecedor/);
    await context.close();
  });

  test("names typed by users are escaped in the printable page (no code runs)", async () => {
    const { page, context } = await abrirMapa();
    await page.fill("#mpEndInput", 'Fornecedor <img src=x onerror="window.opener.__xss=1">');
    await page.click("#mpEndOk");
    await page.waitForFunction(() => document.querySelectorAll("#mpRotaLista li").length === 1);
    await page.click("#mpRotaExportar");
    const [popup] = await Promise.all([page.waitForEvent("popup"), page.click('[data-exp="imprimir"]')]);
    await popup.waitForLoadState();
    assert.match(await popup.locator("tbody").textContent(), /<img src=x/);
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    await context.close();
  });
});
