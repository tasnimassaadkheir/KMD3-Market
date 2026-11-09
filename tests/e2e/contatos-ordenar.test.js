// E2E tests: the Contatos table can be sorted by Nome (default) or by Condomínio, A→Z or Z→A,
// with the small A-Z buttons in the headers (or the "Ordenar" select on phones). Remembered in the browser.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const dados = () => [
  lead({ id: "a", nome: "Zênite", contatos: [{ nome: "Ana", telefone: "11 90000-0001", email: "", tipo: "Síndico" }] }),
  lead({ id: "b", nome: "Água Branca", contatos: [{ nome: "Carlos", telefone: "11 90000-0002", email: "", tipo: "ADM" }] }),
  lead({ id: "c", nome: "Morada 10", contatos: [{ nome: "Bia", telefone: "", email: "bia@x.com", tipo: "" }] }),
  lead({ id: "d", nome: "Morada 2", contatos: [{ nome: "Duda", telefone: "", email: "duda@x.com", tipo: "" }] }),
];
const avulsoInit = `localStorage.setItem("quitandinha:contatosAvulsos", JSON.stringify([{id:"v1", nome:"Aaron", telefone:"11 90000-0009", email:"", tipo:""}]));`;
async function abrir(opts = {}) {
  const app = await openApp(env, { leads: dados(), initScript: avulsoInit, ...opts });
  await irPeloMenu(app.page, "#btnContatos");
  await app.page.waitForSelector("#telaContatos.aberta #ctCorpo tr");
  return app;
}
const coluna = (page, label) => page.locator(`#ctCorpo td[data-label="${label}"]`).allTextContents();
const nomes = async (page) => (await coluna(page, "Nome")).map((t) => t.replace(/(Síndico|ADM)$/, "").trim());

describe("Contatos: sorting", () => {
  test("by default A→Z by name; the Condomínio button sorts by condo (natural order, accents ignored, Avulso last), again = Z→A", async () => {
    const { page, context, errors } = await abrir();
    assert.deepEqual(await nomes(page), ["Aaron", "Ana", "Bia", "Carlos", "Duda"]);
    assert.equal(await page.getAttribute('th[data-ct-col="nome"]', "aria-sort"), "ascending");
    assert.equal(await page.getAttribute('th[data-ct-col="condominio"]', "aria-sort"), "none");

    await page.click('[data-ct-ordem="condominio"]');
    assert.deepEqual(await coluna(page, "Condomínio"), ["Água Branca", "Morada 2", "Morada 10", "Zênite", "Avulso"]);
    assert.equal(await page.getAttribute('th[data-ct-col="condominio"]', "aria-sort"), "ascending");
    assert.equal(await page.getAttribute('th[data-ct-col="nome"]', "aria-sort"), "none");
    assert.match(await page.getAttribute('[data-ct-ordem="condominio"]', "title"), /Z→A/, "the button says what the next click does");

    await page.click('[data-ct-ordem="condominio"]');
    assert.deepEqual(await coluna(page, "Condomínio"), ["Zênite", "Morada 10", "Morada 2", "Água Branca", "Avulso"], "Avulso stays last");
    assert.equal(await page.getAttribute('th[data-ct-col="condominio"]', "aria-sort"), "descending");

    await page.click('[data-ct-ordem="nome"]');
    assert.deepEqual(await nomes(page), ["Aaron", "Ana", "Bia", "Carlos", "Duda"], "another column starts at A→Z");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("works together with the search, works from the keyboard, and is remembered after reopening", async () => {
    const { page, context } = await abrir();
    await page.fill("#ctBusca", "morada");
    await page.focus('[data-ct-ordem="condominio"]');
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");                      // Z→A
    assert.deepEqual(await coluna(page, "Condomínio"), ["Morada 10", "Morada 2"]);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.ctOrdem), "condominio", "focus stays on the button");
    await page.reload();
    await irPeloMenu(page, "#btnContatos").catch(() => {});
    await page.waitForSelector("#telaContatos.aberta #ctCorpo tr");
    assert.equal(await page.getAttribute('th[data-ct-col="condominio"]', "aria-sort"), "descending", "remembered");
    await context.close();
  });

  test("on a phone (no table header) the 'Ordenar' select does the same", async () => {
    const { page, context } = await abrir({ viewport: { width: 390, height: 844 } });
    assert.equal(await page.locator("#ctOrdemCel").isVisible(), true);
    assert.equal(await page.inputValue("#ctOrdemCel"), "nome:1");
    await page.selectOption("#ctOrdemCel", "condominio:1");
    assert.deepEqual(await coluna(page, "Condomínio"), ["Água Branca", "Morada 2", "Morada 10", "Zênite", "Avulso"]);
    await context.close();
  });

  test("on a computer the phone select is hidden", async () => {
    const { page, context } = await abrir();
    assert.equal(await page.locator("#ctOrdemCel").isHidden(), true);
    await context.close();
  });
});
