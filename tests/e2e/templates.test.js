// E2E tests: the Templates page (☰ → Templates): text cards with a title and a copy button.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const TEXTO = "Olá! Sou da KMD3 Market.\nPodemos marcar uma visita esta semana?";
const salvos = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:templates") || "[]"));
async function abrir(page) { await irPeloMenu(page, "#btnTemplates"); await page.waitForSelector("#telaTemplates.aberta"); }
async function criar(page, titulo, texto) {
  await page.click("#btnNovoTemplate");
  await page.fill("#tp_titulo", titulo);
  await page.fill("#tp_texto", texto);
  await page.click('#tpForm button[type="submit"]');
  await page.waitForSelector(`.tp-cartao:has-text("${titulo}")`);
}
// Replaces the clipboard so the test can read what was copied.
const espiarCopia = (page) => page.evaluate(() => { window.__copiado = null; navigator.clipboard.writeText = async (t) => { window.__copiado = t; }; });

describe("Templates page", () => {
  test("starts empty with a hint, and creates a template card with title and text", async () => {
    const { page, context, errors } = await openApp(env);
    await abrir(page);
    assert.match(await page.textContent("#tpGrade"), /Nenhum template ainda/);
    await criar(page, "Apresentação no WhatsApp", TEXTO);
    const cartao = page.locator(".tp-cartao");
    assert.equal(await cartao.locator("h3").textContent(), "Apresentação no WhatsApp");
    assert.equal(await cartao.locator(".tp-texto").innerText(), TEXTO, "line breaks are kept");
    assert.equal(await page.locator("#tpForm").isHidden(), true);
    assert.equal((await salvos(page))[0].texto, TEXTO);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("the copy button copies the text exactly and shows 'Copiado'", async () => {
    const { page, context } = await openApp(env);
    await abrir(page);
    await criar(page, "Apresentação", TEXTO);
    await espiarCopia(page);
    const botao = page.locator(".tp-copiar");
    await botao.click();
    await page.waitForFunction(() => window.__copiado);
    assert.equal(await page.evaluate(() => window.__copiado), TEXTO);
    assert.equal((await botao.textContent()).trim(), "Copiado");
    assert.match(await page.textContent("#aviso"), /copiado/);
    await context.close();
  });

  test("edits and deletes a template", async () => {
    const { page, context } = await openApp(env);
    await abrir(page);
    await criar(page, "Cobrança", "Texto antigo");
    await page.click(".tp-cartao [data-tp-editar]");
    assert.equal(await page.inputValue("#tp_titulo"), "Cobrança");
    await page.fill("#tp_texto", "Texto novo");
    await page.click('#tpForm button[type="submit"]');
    await page.waitForSelector('.tp-texto:has-text("Texto novo")');
    assert.equal((await salvos(page)).length, 1, "edited, not duplicated");

    page.on("dialog", (d) => d.accept());
    await page.click(".tp-cartao [data-tp-excluir]");
    await page.waitForSelector(".tp-cartao", { state: "detached" });
    assert.deepEqual(await salvos(page), []);
    await context.close();
  });

  test("needs a title and a text", async () => {
    const { page, context } = await openApp(env);
    await abrir(page);
    await page.click("#btnNovoTemplate");
    await page.click('#tpForm button[type="submit"]');
    assert.match(await page.textContent("#aviso"), /título/);
    await page.fill("#tp_titulo", "Só título");
    await page.click('#tpForm button[type="submit"]');
    assert.match(await page.textContent("#aviso"), /texto/);
    assert.equal(await page.locator(".tp-cartao").count(), 0);
    await context.close();
  });

  test("sorted A→Z, searchable, and still there after reloading", async () => {
    const { page, context } = await openApp(env);
    await abrir(page);
    await criar(page, "Visita", "Confirmando a visita de amanhã");
    await criar(page, "Apresentação", "Olá, tudo bem?");
    assert.deepEqual(await page.locator(".tp-cartao h3").allTextContents(), ["Apresentação", "Visita"]);
    await page.fill("#tpBusca", "amanha");
    assert.deepEqual(await page.locator(".tp-cartao h3").allTextContents(), ["Visita"], "searches the text, accents ignored");
    await page.reload();
    await page.waitForSelector("#telaTemplates.aberta");   // the page comes back by itself after a reload
    assert.equal(await page.locator(".tp-cartao").count(), 2);
    await context.close();
  });

  test("text typed by users is shown as text, never run as code", async () => {
    const { page, context } = await openApp(env);
    await abrir(page);
    await criar(page, "<b>Teste</b>", '<img src=x onerror="window.__xss=1">');
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    assert.equal(await page.locator(".tp-cartao h3").textContent(), "<b>Teste</b>");
    await context.close();
  });

  test("Esc closes the form first, then the page", async () => {
    const { page, context } = await openApp(env);
    await abrir(page);
    await page.click("#btnNovoTemplate");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#tpForm").isHidden(), true);
    assert.equal(await page.locator("#telaTemplates.aberta").count(), 1);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#telaTemplates.aberta").count(), 0);
    await context.close();
  });

  test("on a phone the cards take the full width and the page doesn't scroll sideways", async () => {
    const { page, context } = await openApp(env, { viewport: { width: 390, height: 844 } });
    await abrir(page);
    await criar(page, "Apresentação", "Um texto bem comprido ".repeat(30));
    const sobra = await page.locator("#telaTemplates .tela-lem-corpo").evaluate((el) => el.scrollWidth - el.clientWidth);
    assert.ok(sobra <= 1, `${sobra}px of sideways scroll`);
    await context.close();
  });
});
