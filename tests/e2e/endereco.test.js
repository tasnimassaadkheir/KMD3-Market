// E2E tests: the address in separate fields in the condo panel, with a fake ViaCEP
// (CEP -> address, and street + city -> list of CEPs).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const MANOEL = [
  { cep: "06018-180", logradouro: "Avenida Manoel Pedro Pimentel", complemento: "até 600/601", bairro: "Continental", localidade: "Osasco", uf: "SP" },
  { cep: "06020-194", logradouro: "Avenida Manoel Pedro Pimentel", complemento: "de 602/603 ao fim", bairro: "Continental", localidade: "Osasco", uf: "SP" },
];
const AUGUSTA = { cep: "01305-000", logradouro: "Rua Augusta", complemento: "até 1199 - lado ímpar", bairro: "Consolação", localidade: "São Paulo", uf: "SP" };

// Fake ViaCEP. Records the URLs asked, so the tests can check the city/UF sent.
async function comViacep(page, { off = false } = {}) {
  const pedidos = [];
  await page.route("https://viacep.com.br/**", (route) => {
    const url = decodeURIComponent(route.request().url());
    pedidos.push(url);
    if (off) return route.abort();
    const m = url.match(/\/ws\/(\d{8})\/json/);
    if (m) return route.fulfill({ contentType: "application/json", body: JSON.stringify(m[1] === "01305000" ? AUGUSTA : { erro: true }) });
    const body = /manoel/i.test(url) && /Osasco/.test(url) ? MANOEL : [];
    route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
  return pedidos;
}
const salvo = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios"))[0]);
async function abrirCartao(page) {
  await page.click(".cartao");
  await page.waitForSelector("#painel.aberto");
  await page.waitForTimeout(300);
}

describe("Address in separate fields", () => {
  test("an old one-line address opens split into fields, and is saved untouched when not edited", async () => {
    const original = "Av Manoel Pedro Pimentel, 155 - Osasco - SP";
    const { page, context, errors } = await openApp(env, { leads: [lead({ nome: "Aurora", endereco: original })] });
    await abrirCartao(page);
    assert.equal(await page.inputValue("#f_rua"), "Av Manoel Pedro Pimentel");
    assert.equal(await page.inputValue("#f_numero"), "155");
    assert.equal(await page.inputValue("#f_cidade"), "Osasco");
    assert.equal(await page.inputValue("#f_uf"), "SP");
    await page.fill("#f_aptos", "200");                                  // change something else
    await page.click("#btnSalvar");
    await page.waitForSelector("#painel.aberto", { state: "detached" }).catch(() => {});
    assert.equal((await salvo(page)).endereco, original, "kept exactly as it was typed");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("typing the street suggests the CEPs in that city; the one for the typed number comes first; choosing fills everything", async () => {
    const { page, context, errors } = await openApp(env, { leads: [lead({ nome: "Aurora", endereco: "" })] });
    const pedidos = await comViacep(page);
    await abrirCartao(page);
    await page.fill("#f_cidade", "Osasco");
    await page.fill("#f_uf", "sp");
    assert.equal(await page.inputValue("#f_uf"), "SP", "UF in capitals");
    await page.fill("#f_numero", "800");
    await page.click("#f_rua");
    await page.keyboard.type("Av. Manoel Pedro", { delay: 15 });
    await page.waitForSelector("#endSugestoes:not([hidden])");
    assert.ok(pedidos.some((u) => u.includes("/ws/SP/Osasco/Manoel Pedro/json")), "searched in Osasco/SP without 'Av.'");
    const sug = await page.locator(".end-sug").allTextContents();
    assert.equal(sug.length, 2);
    assert.match(sug[0], /06020-194.*ao fim.*combina com o nº 800/, "the CEP for nº 800 first");

    await page.click(".end-sug >> nth=0");
    assert.equal(await page.inputValue("#f_rua"), "Avenida Manoel Pedro Pimentel");
    assert.equal(await page.inputValue("#f_cep"), "06020-194");
    assert.equal(await page.inputValue("#f_bairro"), "Continental");
    assert.equal(await page.inputValue("#f_zona"), "Continental", "an empty Zona gets the neighborhood");
    assert.equal(await page.locator("#endSugestoes").isHidden(), true);
    assert.match(await page.textContent("#endStatus"), /CEP 06020-194 preenchido/);

    // changing the number to one on the other stretch switches the CEP
    await page.fill("#f_numero", "155");
    assert.equal(await page.inputValue("#f_cep"), "06018-180");
    assert.match(await page.textContent("#endStatus"), /CEP ajustado para o nº 155/);

    await page.fill("#f_complemento", "Torre 2");
    await page.click("#btnSalvar");
    await page.waitForTimeout(300);
    assert.equal((await salvo(page)).endereco, "Avenida Manoel Pedro Pimentel, 155, Torre 2 - Continental - Osasco - SP - 06018-180");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("keyboard: arrows + Enter choose a suggestion; Esc closes only the list, not the panel", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora", endereco: "" })] });
    await comViacep(page);
    await abrirCartao(page);
    await page.fill("#f_cidade", "Osasco");
    await page.click("#f_rua");
    await page.keyboard.type("Manoel", { delay: 15 });
    await page.waitForSelector("#endSugestoes:not([hidden])");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#endSugestoes").isHidden(), true);
    assert.equal(await page.locator("#painel.aberto").count(), 1, "the panel stays open");
    await page.keyboard.type(" P", { delay: 15 });
    await page.waitForSelector("#endSugestoes:not([hidden])");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    assert.equal(await page.inputValue("#f_cep"), "06020-194", "second suggestion");
    await context.close();
  });

  test("typing a CEP fills street, neighborhood, city and UF; an unknown CEP says so", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora", endereco: "" })] });
    await comViacep(page);
    await abrirCartao(page);
    await page.click("#f_cep");
    await page.keyboard.type("01305000", { delay: 10 });
    assert.equal(await page.inputValue("#f_cep"), "01305-000", "dash added while typing");
    await page.waitForFunction(() => document.querySelector("#f_rua").value === "Rua Augusta");
    assert.equal(await page.inputValue("#f_bairro"), "Consolação");
    assert.equal(await page.inputValue("#f_cidade"), "São Paulo");
    assert.equal(await page.inputValue("#f_uf"), "SP");
    assert.equal(await page.evaluate(() => document.activeElement.id), "f_numero", "cursor goes to the number");

    await page.fill("#f_cep", "");
    await page.click("#f_cep");
    await page.keyboard.type("99999999", { delay: 10 });
    await page.waitForFunction(() => /não encontrado/.test(document.querySelector("#endStatus").textContent));
    await context.close();
  });

  test("without internet the fields still work by hand, with a clear message", async () => {
    const { page, context, errors } = await openApp(env, { leads: [lead({ nome: "Aurora", endereco: "" })] });
    await comViacep(page, { off: true });
    await abrirCartao(page);
    await page.click("#f_rua");
    await page.keyboard.type("Rua Augusta", { delay: 10 });
    await page.waitForFunction(() => /Sem conexão/.test(document.querySelector("#endStatus").textContent));
    await page.fill("#f_numero", "100");
    await page.fill("#f_bairro", "Consolação");
    await page.click("#btnSalvar");
    await page.waitForTimeout(300);
    assert.equal((await salvo(page)).endereco, "Rua Augusta, 100 - Consolação");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("on a phone the fields fit the screen", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora", endereco: "Rua Augusta, 100 - Consolação - São Paulo - SP - 01305-000" })],
      viewport: { width: 360, height: 780 } });
    await abrirCartao(page);
    for (const sel of ["#f_cep", "#f_rua", "#f_numero", "#f_complemento", "#f_bairro", "#f_cidade", "#f_uf"]) {
      const b = await page.locator(sel).boundingBox();
      assert.ok(b.x >= 0 && b.x + b.width <= 360 && b.width >= 50, sel + " inside the screen and usable");
    }
    assert.equal(await page.locator("#painel").evaluate((e) => e.scrollWidth <= e.clientWidth), true);
    await context.close();
  });
});
