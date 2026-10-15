// E2E tests: the Prospecção page (☰ → Prospecção): IPTU import, list, map and "+ Funil".
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
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

async function abrir(page) {
  await irPeloMenu(page, "#btnProspeccao");
  await page.waitForSelector("#telaProspeccao.aberta");
}
async function importar(page, buffer = csvIptu(), nome = "IPTU_2026.csv") {
  await page.setInputFiles("#prArquivo", { name: nome, mimeType: "text/csv", buffer });
}
const nomes = (page) => page.locator("#prLista .pr-end").allTextContents();
// Circles the fake map drew for the Prospecção page.
const circulos = (page) => page.evaluate(() => window.__leaflet.groups.flatMap((g) => g.layers)
  .filter((l) => l.type === "circle" && String(l.popup || "").includes("pr-pop"))
  .map((l) => ({ latlng: l.latlng, cor: l.o.fillColor, popup: l.popup })));

describe("Prospecção page", () => {
  test("is in the menu; before importing it explains how to get the IPTU file", async () => {
    const { page, context, errors } = await openApp(env, { fakeLeaflet: true });
    await abrir(page);
    assert.equal(await page.locator("#prVazio").isVisible(), true);
    assert.match(await page.textContent("#prVazio"), /GeoSampa/);
    assert.equal(await page.locator("#prSplit").isHidden(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#telaProspeccao.aberta").count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("imports the IPTU file: one row per building, apartments counted, biggest first, no owner names", async () => {
    const { page, context, errors } = await openApp(env, { fakeLeaflet: true, nominatim: GEO });
    await abrir(page);
    await importar(page);
    await page.waitForSelector(".pr-item");
    assert.match(await page.textContent("#prInfo"), /IPTU 2026 · 3 condomínios/);
    assert.deepEqual(await nomes(page), ["Rua Doutor Neto de Araujo, 320"], "default filter: 200+ apartments");
    await page.selectOption("#prMinimo", "0");
    await page.waitForFunction(() => document.querySelectorAll(".pr-item").length === 3);
    assert.deepEqual(await nomes(page), ["Rua Doutor Neto de Araujo, 320", "Avenida Paulista, 1000", "Alameda Inexistente, 77"]);
    const primeiro = await page.locator(".pr-item").first().innerText();
    assert.match(primeiro, /250\s+aptos/);
    assert.match(primeiro, /Vila Mariana · 04111-000 · 20 andares · de 1998/);
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
    await importar(page);
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
    assert.match(await page.textContent("#prGeoStatus"), /1 endereço\(s\) não encontrado/);
    assert.equal(consultas, 4, "2 found at the first try + 2 tries for the one not found: " + urls.join(" | "));

    // positions are saved: opening the page again doesn't look anything up
    await page.waitForFunction(() => new Promise((ok) => {
      const r = indexedDB.open("kmd3market", 1);
      r.onsuccess = () => { const t = r.result.transaction("kv").objectStore("kv").get("prospeccao_sp");
        t.onsuccess = () => ok((t.result?.linhas || []).every((l) => l.geo_em)); };
    }));
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
    await importar(page);
    await page.waitForSelector(".pr-item .pr-add");
    await page.waitForFunction(() => document.querySelector(".pr-loc").textContent.includes("📍"), null, { timeout: 10000 });
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
    // "✓ No funil" opens the card
    await page.click(".pr-item .pr-no-funil");
    await page.waitForSelector("#painel.aberto");
    assert.equal(await page.inputValue("#f_nome"), "Condomínio Rua Doutor Neto de Araujo, 320");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator('.coluna[data-fase="futura"] .cartao', { hasText: "Neto de Araujo" }).count(), 1);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("'Só nesta área do mapa' lists only buildings already placed inside the visible area", async () => {
    const { page, context } = await openApp(env, { fakeLeaflet: true, nominatim: GEO });
    await abrir(page);
    await importar(page);
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

  test("a file that isn't the IPTU one is refused with a clear message", async () => {
    const { page, context } = await openApp(env, { fakeLeaflet: true });
    await abrir(page);
    await importar(page, Buffer.from("nome;telefone\nAna;1199\n"), "contatos.csv");
    await page.waitForFunction(() => /não parece ser o do IPTU/.test(document.querySelector("#aviso").textContent));
    assert.equal(await page.locator("#prVazio").isVisible(), true);
    await context.close();
  });

  test("on a phone, Lista / Mapa tabs switch between the list and the map, without sideways scroll", async () => {
    const { page, context } = await openApp(env, { fakeLeaflet: true, nominatim: GEO, viewport: { width: 390, height: 844 } });
    await abrir(page);
    await importar(page);
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
