// E2E tests: the Prospecção page (☰ → Prospecção): list, map, "+ Funil" and "+ Rota".
// The page loads dados/prospeccao-sp.json (made every month by the GitHub robot, scripts/iptu.mjs).
// Here that file is replaced by a small list made BY THE SAME SCRIPT from a tiny fake IPTU CSV.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { Readable } = require("node:stream");
const { setup, openApp, irPeloMenu } = require("./helpers");

let env, LISTA;
before(async () => {
  env = await setup();
  const { resumirStream } = await import(path.join(__dirname, "..", "..", "scripts", "iptu.mjs"));
  LISTA = await resumirStream(Readable.from([csvIptu()]));
});
after(async () => { await env.close(); });

// A tiny IPTU-like file: 3 buildings (250, 120 and 40 apartments) + garages, a house and an older year.
function csvIptu() {
  const cab = "NUMERO DO CONTRIBUINTE;ANO DO EXERCICIO;NOME DO CONTRIBUINTE 1;NUMERO DO CONDOMINIO;NOME DE LOGRADOURO DO IMOVEL;" +
    "NUMERO DO IMOVEL;BAIRRO DO IMOVEL;CEP DO IMOVEL;TIPO DE USO DO IMOVEL;QUANTIDADE DE PAVIMENTOS;ANO DA CONSTRUCAO CORRIGIDO";
  const linhas = [cab];
  const predio = (setorQuadra, cond, n, rua, num, bairro, cep, pav, ano, exercicio = 2026) => {
    for (let i = 0; i < n; i++)
      linhas.push([`${setorQuadra}${String(1000 + i).padStart(4, "0")}1`, exercicio, "DONO SECRETO", cond, rua, num, bairro, cep,
        "Apartamento em condomínio", pav, ano].join(";"));
  };
  predio("009012", "01-3", 250, "R DR NETO DE ARAUJO", "0320", "VILA MARIANA", "04111000", 20, 1998);
  predio("010020", "02-1", 120, "AV PAULISTA", "1000", "BELA VISTA", "01310100", 12, 1985);
  predio("030040", "05-5", 40, "AL INEXISTENTE", "77", "LAPA", "05000000", 4, 2005);
  predio("009012", "01-3", 999, "R DR NETO DE ARAUJO", "0320", "VILA MARIANA", "04111000", 20, 1998, 2025);   // older year: ignored
  for (let i = 0; i < 30; i++) linhas.push(`0090129${String(i).padStart(3, "0")}1;2026;X;01-3;R DR NETO DE ARAUJO;0320;VILA MARIANA;04111000;Garagem (unidade autônoma) em edifício em condomínio;;`);
  linhas.push("05005005001;2026;X;00-0;R DAS CASAS;5;LAPA;05000000;Residencial horizontal;1;1970");
  return Buffer.from(linhas.join("\r\n"), "latin1");
}
const GEO = { "neto de araujo, 320": [-23.589, -46.634], "avenida paulista, 1000": [-23.565, -46.652] };

// Neighboring cities' list (made by scripts/cnefe.mjs from the IBGE Census): one building in Osasco.
const VIZINHAS = { fonte: "CNEFE — Censo 2022 (IBGE)", ano: 2022, minimoAptos: 10, geradoEm: "2026-10-16T12:00:00Z", total: 1,
  cidades: [{ nome: "Osasco", total: 1, ano: 2022 }],
  campos: ["id", "logradouro", "numero", "bairro", "cep", "apartamentos", "lat", "lng", "cidade"],
  linhas: [["3534401-06160180-482-ruajuanvicente", "Rua Juan Vicente", "482", "Bandeiras", "06160-180", 150, -23.5593, -46.8167, 0]] };

// Serves the lists (or an error) in place of the files in dados/, then opens the page.
// By default there are no neighboring cities (404), like before they existed.
async function abrir(page, lista = LISTA, vizinhas = null) {
  await page.unroute("**/dados/prospeccao-sp.json");
  await page.route("**/dados/prospeccao-sp.json", (r) => lista ? r.fulfill({ json: lista }) : r.fulfill({ status: 404, body: "" }));
  await page.unroute("**/dados/prospeccao-vizinhas.json");
  await page.route("**/dados/prospeccao-vizinhas.json", (r) => vizinhas ? r.fulfill({ json: vizinhas }) : r.fulfill({ status: 404, body: "" }));
  await irPeloMenu(page, "#btnProspeccao");
  await page.waitForSelector("#telaProspeccao.aberta");
}
const nomes = (page) => page.locator("#prLista .pr-end").allTextContents();
// Circles the fake map drew for the Prospecção page.
const circulos = (page) => page.evaluate(() => window.__leaflet.groups.flatMap((g) => g.layers)
  .filter((l) => l.type === "circle" && String(l.popup || "").includes("pr-pop"))
  .map((l) => ({ latlng: l.latlng, cor: l.o.fillColor, popup: l.popup })));

describe("Prospecção page", () => {
  test("is in the menu; if the list can't be loaded it says so and 'Tentar de novo' works", async () => {
    const { page, context, errors } = await openApp(env, { fakeLeaflet: true });
    await abrir(page, null);
    await page.waitForSelector("#prErro:not([hidden])");
    assert.match(await page.textContent("#prErro"), /Não consegui carregar a lista/);
    assert.equal(await page.locator("#prSplit").isHidden(), true);
    await page.unroute("**/dados/prospeccao-sp.json");
    await page.route("**/dados/prospeccao-sp.json", (r) => r.fulfill({ json: LISTA }));
    await page.click("#btnPrTentar");
    await page.waitForSelector(".pr-item");
    assert.equal(await page.locator("#prErro").isHidden(), true);
    assert.equal(await page.locator("#prCidade").isVisible(), false, "no city filter when there's only São Paulo");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#telaProspeccao.aberta").count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("shows the list made by the robot: one row per building, apartments counted, biggest first, no owner names", async () => {
    const { page, context, errors } = await openApp(env, { fakeLeaflet: true, nominatim: GEO });
    await abrir(page);
    await page.waitForSelector(".pr-item");
    assert.match(await page.textContent("#prInfo"), /^3 condomínios em São Paulo \(IPTU 2026\)\. Atualizado em/);
    assert.deepEqual(await nomes(page), ["Rua Doutor Neto de Araujo, 320", "Avenida Paulista, 1000"], "default filter: 100+ apartments");
    await page.selectOption("#prMinimo", "0");
    await page.waitForFunction(() => document.querySelectorAll(".pr-item").length === 3);
    assert.deepEqual(await nomes(page), ["Rua Doutor Neto de Araujo, 320", "Avenida Paulista, 1000", "Alameda Inexistente, 77"]);
    const primeiro = await page.locator(".pr-item").first().innerText();
    assert.match(primeiro, /250\s+aptos/);
    assert.match(primeiro, /Vila Mariana, 04111-000, 20 andares, de 1998/);
    assert.ok(!(await page.content()).includes("DONO SECRETO"));
    // search by neighborhood
    await page.fill("#prBusca", "bela vista");
    await page.waitForFunction(() => document.querySelectorAll(".pr-item").length === 1);
    assert.deepEqual(await nomes(page), ["Avenida Paulista, 1000"]);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("places the buildings on the map (once), sized by apartments; not found ones get a Google Maps link", async () => {
    const { page, context } = await openApp(env, { fakeLeaflet: true, nominatim: GEO });
    let consultas = 0; const urls = [];
    page.on("request", (r) => { if (r.url().includes("nominatim")) { consultas++; urls.push(decodeURIComponent(r.url().split("q=")[1])); } });
    await abrir(page);
    await page.waitForSelector(".pr-item");
    await page.selectOption("#prMinimo", "0");
    await page.waitForFunction(() => document.querySelectorAll(".pr-loc a").length === 1, null, { timeout: 15000 });
    await page.waitForFunction(() => !/Localizando/.test(document.querySelector("#prGeoStatus").textContent));
    const c = await circulos(page);
    assert.equal(c.length, 2, "two found, one not found");
    assert.deepEqual(c.map((x) => x.latlng), [[-23.589, -46.634], [-23.565, -46.652]]);
    assert.match(c[0].popup, /250 apartamentos/);
    assert.match(c[0].popup, /\+ Adicionar ao funil/);
    assert.match(await page.locator(".pr-item", { hasText: "Inexistente" }).innerText(), /Google Maps/);
    assert.match(await page.textContent("#prGeoStatus"), /1 endereço não encontrado no mapa/);
    assert.equal(consultas, 4, "2 found at the first try + 2 tries for the one not found: " + urls.join(" | "));

    // positions are saved: opening the page again doesn't look anything up
    const pos = await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:prospGeo") || "{}"));
    assert.deepEqual(Object.keys(pos).sort(), ["009012-013", "010020-021", "030040-055"]);
    assert.equal(pos["030040-055"].lat, null, "not found is remembered too");
    await page.reload(); await page.waitForSelector(".coluna");
    await abrir(page);
    await page.selectOption("#prMinimo", "0");
    await page.waitForFunction(() => document.querySelectorAll(".pr-item").length === 3);
    await page.waitForTimeout(1500);
    assert.equal(consultas, 4, "no new lookups");
    await context.close();
  });

  test("'+ Funil' creates a card in Futura Prospecção with address and apartments, and marks the building", async () => {
    const { page, context, errors } = await openApp(env, { fakeLeaflet: true, nominatim: GEO });
    await abrir(page);
    await page.waitForSelector(".pr-item .pr-add");
    // wait until every visible building has finished its map lookup (rows are redrawn when a position arrives)
    await page.waitForFunction(() => !document.querySelector('.pr-loc[data-loc="esperando"]') &&
      document.querySelector(".pr-loc").dataset.loc === "ok", null, { timeout: 15000 });
    await page.click(".pr-item .pr-add");
    await page.waitForSelector(".pr-item .pr-no-funil");
    const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios")).find((l) => /Neto de Araujo/.test(l.nome)));
    assert.equal(salvo.nome, "Condomínio Rua Doutor Neto de Araujo, 320");
    assert.equal(salvo.aptos, 250);
    assert.equal(salvo.fase, "futura");
    assert.equal(salvo.endereco, "Rua Doutor Neto de Araujo, 320 - Vila Mariana - São Paulo - SP - 04111-000");
    assert.equal(salvo.zona, "Vila Mariana");
    assert.match(salvo.historico[0].o_que, /Prospecção \(IPTU 2026\)/);
    // the marker turns green and the main map already knows where it is
    assert.equal((await circulos(page))[0].cor, "#2FA45F");
    const cache = await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:geocache") || "{}"));
    assert.ok(Object.values(cache).some((g) => g.lat === -23.589), "position copied to the main map");
    // "No funil" opens the card
    await page.click(".pr-item .pr-no-funil");
    await page.waitForSelector("#painel.aberto");
    assert.equal(await page.inputValue("#f_nome"), "Condomínio Rua Doutor Neto de Araujo, 320");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator('.coluna[data-fase="futura"] .cartao', { hasText: "Neto de Araujo" }).count(), 1);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("'+ Rota' puts a building in the visit route without creating a card; clicking again takes it out", async () => {
    const { page, context, errors } = await openApp(env, { fakeLeaflet: true, nominatim: GEO });
    await abrir(page);
    await page.waitForSelector(".pr-item .pr-loc", { state: "attached" });
    // wait until every visible building has finished its map lookup (rows are redrawn when a position arrives)
    await page.waitForFunction(() => !document.querySelector('.pr-loc[data-loc="esperando"]') &&
      document.querySelector(".pr-loc").dataset.loc === "ok", null, { timeout: 15000 });
    const rota = () => page.evaluate(() => ({ ids: JSON.parse(localStorage.getItem("quitandinha:rota") || "[]"),
      extras: JSON.parse(localStorage.getItem("quitandinha:rotaExtras") || "{}") }));
    await page.click(".pr-item .pr-rota");
    await page.waitForSelector(".pr-item .pr-rota.na-rota");
    assert.equal((await page.textContent(".pr-item .pr-rota")).trim(), "Na rota (1)");
    assert.match(await page.textContent("#aviso"), /Adicionado à rota como parada 1/);
    let r = await rota();
    assert.deepEqual(r.ids, ["x_009012-013"]);
    assert.deepEqual(r.extras["x_009012-013"], { id: "x_009012-013", nome: "Rua Doutor Neto de Araujo, 320",
      endereco: "Rua Doutor Neto de Araujo, 320 - Vila Mariana - São Paulo - SP - 04111-000",
      lat: -23.589, lng: -46.634, detalhe: "Prospecção: 250 aptos, Vila Mariana" });
    assert.equal(await page.locator(".cartao").count(), 0, "no card was created");
    // the route panel of the main map lists it
    assert.match(await page.textContent("#mpRotaLista"), /Rua Doutor Neto de Araujo, 320.*Prospecção: 250 aptos/s);
    // the button in the map pop-up shows it too
    assert.match((await circulos(page))[0].popup, /Na rota \(1\)/);
    // click again: out of the route
    await page.click(".pr-item .pr-rota");
    await page.waitForSelector(".pr-item .pr-rota:not(.na-rota)");
    r = await rota();
    assert.deepEqual(r.ids, []);
    assert.deepEqual(r.extras, {});
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("a building in the route that becomes a card keeps its place in the route, now as the card", async () => {
    const { page, context } = await openApp(env, { fakeLeaflet: true, nominatim: GEO });
    await abrir(page);
    await page.waitForSelector(".pr-item .pr-loc", { state: "attached" });
    // wait until every visible building has finished its map lookup (rows are redrawn when a position arrives)
    await page.waitForFunction(() => !document.querySelector('.pr-loc[data-loc="esperando"]') &&
      document.querySelector(".pr-loc").dataset.loc === "ok", null, { timeout: 15000 });
    await page.click(".pr-item .pr-rota");
    await page.waitForSelector(".pr-item .pr-rota.na-rota");
    await page.click(".pr-item .pr-add");
    await page.waitForSelector(".pr-item .pr-no-funil");
    const { ids, extras } = await page.evaluate(() => ({ ids: JSON.parse(localStorage.getItem("quitandinha:rota")),
      extras: JSON.parse(localStorage.getItem("quitandinha:rotaExtras")) }));
    const card = await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios")).find((l) => /Neto de Araujo/.test(l.nome)).id);
    assert.deepEqual(ids, [card]);
    assert.deepEqual(extras, {});
    assert.equal((await page.textContent(".pr-item .pr-rota")).trim(), "Na rota (1)", "still shown as in the route");
    // and for a card, "+ Rota" / "Na rota" toggles the card itself
    await page.click(".pr-item .pr-rota");
    await page.waitForSelector(".pr-item .pr-rota:not(.na-rota)");
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:rota"))), []);
    await page.click(".pr-item .pr-rota");
    await page.waitForSelector(".pr-item .pr-rota.na-rota");
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:rota"))), [card]);
    await context.close();
  });

  test("'Região' filters by part of the city (by CEP) and shows how many buildings each region has", async () => {
    const { page, context, errors } = await openApp(env, { fakeLeaflet: true, nominatim: GEO });
    await abrir(page);
    await page.waitForSelector(".pr-item");
    await page.selectOption("#prMinimo", "0");
    await page.waitForFunction(() => document.querySelectorAll(".pr-item").length === 3);
    assert.deepEqual(await page.locator("#prRegiao option").allTextContents(),
      ["Toda a cidade", "Centro (1)", "Zona Norte (0)", "Zona Sul (1)", "Zona Leste (0)", "Zona Oeste (1)"]);
    await page.selectOption("#prRegiao", "sul");
    await page.waitForFunction(() => document.querySelectorAll(".pr-item").length === 1);
    assert.deepEqual(await nomes(page), ["Rua Doutor Neto de Araujo, 320"]);
    assert.equal(await page.textContent("#prResumo"), "1 condomínio na Zona Sul");
    await page.selectOption("#prRegiao", "centro");
    await page.waitForFunction(() => document.querySelectorAll(".pr-item").length === 1);
    assert.deepEqual(await nomes(page), ["Avenida Paulista, 1000"]);
    assert.equal(await page.textContent("#prResumo"), "1 condomínio no Centro");
    await page.selectOption("#prRegiao", "norte");
    await page.waitForSelector(".pr-nada");
    await page.selectOption("#prRegiao", "");
    await page.waitForFunction(() => document.querySelectorAll(".pr-item").length === 3);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("Osasco (IBGE Census): 'Cidade' filter, already on the map without any lookup, and '+ Funil' with the right city", async () => {
    const { page, context, errors } = await openApp(env, { fakeLeaflet: true, nominatim: GEO });
    const consultas = [];
    page.on("request", (r) => { if (r.url().includes("nominatim")) consultas.push(decodeURIComponent(r.url())); });
    await abrir(page, LISTA, VIZINHAS);
    await page.waitForSelector(".pr-item");
    await page.selectOption("#prMinimo", "0");
    await page.waitForFunction(() => document.querySelectorAll(".pr-item").length === 4);
    assert.equal(await page.locator("#prCidade").isVisible(), true);
    assert.deepEqual(await page.locator("#prCidade option").allTextContents(), ["Todas as cidades", "São Paulo (3)", "Osasco (1)"]);
    assert.match(await page.textContent("#prInfo"), /^3 condomínios em São Paulo \(IPTU 2026\) e 1 em Osasco \(Censo 2022\)\./);
    // biggest first across cities: 250 (SP), 150 (Osasco), 120 (SP), 40 (SP)
    assert.deepEqual(await nomes(page), ["Rua Doutor Neto de Araujo, 320", "Rua Juan Vicente, 482", "Avenida Paulista, 1000", "Alameda Inexistente, 77"]);
    const item = page.locator(".pr-item", { hasText: "Juan Vicente" });
    assert.match(await item.innerText(), /Osasco, Bandeiras, 06160-180/);
    assert.equal(await item.locator(".pr-loc").getAttribute("data-loc"), "ok", "already placed");

    await page.selectOption("#prCidade", "Osasco");
    await page.waitForFunction(() => document.querySelectorAll(".pr-item").length === 1);
    assert.equal(await page.textContent("#prResumo"), "1 condomínio em Osasco");
    assert.equal(await page.locator("#prRegiao").isVisible(), false, "São Paulo zones hidden for Osasco");
    const c = await circulos(page);
    assert.deepEqual(c.map((x) => x.latlng), [[-23.5593, -46.8167]]);
    assert.match(c[0].popup, /Censo 2022 – IBGE/);

    await page.click(".pr-item .pr-add");
    await page.waitForSelector(".pr-item .pr-no-funil");
    const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios")).find((l) => /Juan Vicente/.test(l.nome)));
    assert.equal(salvo.nome, "Condomínio Rua Juan Vicente, 482");
    assert.equal(salvo.endereco, "Rua Juan Vicente, 482 - Bandeiras - Osasco - SP - 06160-180");
    assert.equal(salvo.aptos, 150);
    assert.match(salvo.historico[0].o_que, /Prospecção \(Censo 2022 – IBGE\)/);
    await page.waitForTimeout(1500);
    assert.ok(!consultas.some((u) => /juan vicente/i.test(u)), "Osasco buildings are never looked up");

    await page.selectOption("#prCidade", "São Paulo");
    await page.waitForFunction(() => document.querySelectorAll(".pr-item").length === 3);
    assert.equal(await page.locator("#prRegiao").isVisible(), true);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("'Só nesta área do mapa' lists only buildings already placed inside the visible area", async () => {
    const { page, context } = await openApp(env, { fakeLeaflet: true, nominatim: GEO });
    await abrir(page);
    await page.waitForSelector(".pr-item");
    await page.selectOption("#prMinimo", "0");
    await page.waitForFunction(() => document.querySelectorAll(".pr-loc a").length === 1, null, { timeout: 15000 });
    // visible area around Av. Paulista only
    await page.evaluate(() => { window.__leaflet.bounds = { getSouth: () => -23.57, getNorth: () => -23.56, getWest: () => -46.66, getEast: () => -46.64 }; });
    await page.check("#prArea");
    await page.waitForFunction(() => document.querySelectorAll(".pr-item").length === 1);
    assert.deepEqual(await nomes(page), ["Avenida Paulista, 1000"]);
    assert.match(await page.textContent("#prResumo"), /já localizados nesta área/);
    await context.close();
  });

  test("on a phone, Lista / Mapa tabs switch between the list and the map, without sideways scroll", async () => {
    const { page, context } = await openApp(env, { fakeLeaflet: true, nominatim: GEO, viewport: { width: 390, height: 844 } });
    await abrir(page);
    await page.waitForSelector(".pr-item");
    assert.equal(await page.locator(".pr-col-lista").isVisible(), true);
    assert.equal(await page.locator(".pr-col-mapa").isVisible(), false);
    await page.click('[data-pr-aba="mapa"]');
    assert.equal(await page.locator(".pr-col-mapa").isVisible(), true);
    assert.equal(await page.locator(".pr-col-lista").isVisible(), false);
    const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    assert.ok(sw <= cw, "no sideways scroll");
    await context.close();
  });
});
