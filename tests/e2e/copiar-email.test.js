// E2E tests: the small "copy e-mail" button, in the condo panel and on the Contatos page.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const dados = () => [lead({ id: "c1", nome: "Aurora", contatos: [
  { nome: "Paulo", telefone: "(11) 99999-0000", email: "paulo@aurora.com.br", tipo: "Síndico" },
  { nome: "Rita", telefone: "", email: "", tipo: "ADM" }] })];
async function abrir(viewport) {
  const app = await openApp(env, { leads: dados(), viewport });
  await app.context.grantPermissions(["clipboard-read", "clipboard-write"]);
  return app;
}
const area = (page) => page.evaluate(() => navigator.clipboard.readText());

describe("Copy e-mail button", () => {
  test("in the condo panel: next to the e-mail, copies what is typed right now, and confirms", async () => {
    const { page, context, errors } = await abrir();
    await page.click(".cartao");
    await page.waitForSelector("#painel.aberto");
    await page.waitForTimeout(300);                                   // panel slide-in animation
    const campo = await page.locator(".contato-email").first().boundingBox();
    const btn = page.locator('[data-copiar-email="0"]');
    const b = await btn.boundingBox();
    assert.ok(Math.abs(b.y - campo.y) < 4 && b.x > campo.x + campo.width - 2, "same row, right of the e-mail");
    assert.ok(b.width <= 40 && b.height <= 44, "small button");

    await btn.click();
    assert.equal(await area(page), "paulo@aurora.com.br");
    assert.match(await page.textContent("#aviso"), /E-mail copiado: paulo@aurora\.com\.br/);
    assert.equal(await btn.evaluate((e) => e.classList.contains("copiado")), true, "turns green for a moment");
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("contato-email")), false,
      "clicking the button doesn't jump into the field");

    await page.fill(".contato-email >> nth=0", "  novo@aurora.com.br ");
    await btn.click();
    assert.equal(await area(page), "novo@aurora.com.br", "the typed e-mail, without spaces");

    await page.click('[data-copiar-email="1"]');                     // contact without e-mail
    assert.match(await page.textContent("#aviso"), /Não há e-mail para copiar/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("on the Contatos page: a copy button after each e-mail (none when there is no e-mail)", async () => {
    const { page, context } = await abrir();
    await irPeloMenu(page, "#btnContatos");
    await page.waitForSelector("#telaContatos.aberta");
    assert.equal(await page.locator("#ctCorpo [data-ct-copiar]").count(), 1);
    await page.click("#ctCorpo [data-ct-copiar]");
    assert.equal(await area(page), "paulo@aurora.com.br");
    assert.match(await page.textContent("#aviso"), /E-mail copiado/);
    await context.close();
  });

  test("on a phone the panel's e-mail field and button fit without sideways scrolling", async () => {
    const { page, context } = await abrir({ width: 390, height: 844 });
    await page.click(".cartao");
    await page.waitForSelector("#painel.aberto");
    await page.waitForTimeout(300);
    const b = await page.locator('[data-copiar-email="0"]').boundingBox();
    assert.ok(b.x + b.width <= 390, "button inside the screen");
    assert.equal(await page.locator("#painel").evaluate((e) => e.scrollWidth <= e.clientWidth), true);
    await context.close();
  });
});
