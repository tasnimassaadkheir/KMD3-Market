// E2E tests: the small copy icon inside the phone box of each contact (condo panel), same as the
// e-mail one, and a copy button after each number on the Contatos page.
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
const dentro = (b, c) => b.x >= c.x && b.x + b.width <= c.x + c.width && b.y >= c.y && b.y + b.height <= c.y + c.height;

describe("Copy phone button", () => {
  test("in the condo panel: a small icon inside the phone box (like the e-mail one), copies what is typed now", async () => {
    const { page, context, errors } = await abrir();
    await page.click(".cartao");
    await page.waitForSelector("#painel.aberto");
    await page.waitForTimeout(300);                                   // panel slide-in animation
    const campo = await page.locator(".contato-tel").first().boundingBox();
    const btn = page.locator('[data-copiar-tel="0"]');
    const b = await btn.boundingBox();
    assert.ok(dentro(b, campo), "inside the phone box");
    assert.ok(b.x > campo.x + campo.width / 2, "on the right side of the box");
    assert.ok(b.width <= 26 && b.height <= 26, "small icon");
    // same look as the e-mail one
    const estilo = (sel) => page.locator(sel).evaluate((e) => { const c = getComputedStyle(e); return [c.width, c.height, c.color, c.backgroundColor]; });
    assert.deepEqual(await estilo('[data-copiar-tel="0"]'), await estilo('[data-copiar-email="0"]'));
    const pad = await page.locator(".contato-tel").first().evaluate((e) => parseFloat(getComputedStyle(e).paddingRight));
    assert.ok(pad >= b.width, "the number doesn't run under the icon");
    assert.equal(await page.locator(".contato-tel").first().evaluate((e) => e.scrollWidth <= e.clientWidth), true,
      "a full number like (11) 99999-0000 fits without being cut");
    // WhatsApp and Ligar are still beside the box
    const zap = await page.locator('[data-whats-contato="0"]').boundingBox();
    assert.ok(zap.x >= campo.x + campo.width - 1, "WhatsApp after the box");

    await btn.click();
    assert.equal(await area(page), "(11) 99999-0000");
    assert.match(await page.textContent("#aviso"), /Telefone copiado: \(11\) 99999-0000/);
    assert.equal(await btn.evaluate((e) => e.classList.contains("copiado")), true, "the icon turns green for a moment");
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("contato-tel")), false,
      "clicking the button doesn't jump into the field");

    await page.fill(".contato-tel >> nth=0", " 11 98888-7777 ");
    await btn.click();
    assert.equal(await area(page), "11 98888-7777", "the typed number, without spaces around");

    await page.click('[data-copiar-tel="1"]');                       // contact without a phone
    assert.match(await page.textContent("#aviso"), /Não há telefone para copiar/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("on a phone the box, the copy icon, WhatsApp and Ligar all fit", async () => {
    const { page, context } = await abrir({ width: 360, height: 780 });
    await page.click(".cartao");
    await page.waitForSelector("#painel.aberto");
    await page.waitForTimeout(300);
    const campo = await page.locator(".contato-tel").first().boundingBox();
    assert.ok(dentro(await page.locator('[data-copiar-tel="0"]').boundingBox(), campo));
    const ligar = await page.locator('[data-ligar-contato="0"]').boundingBox();
    assert.ok(ligar.x + ligar.width <= 360, "Ligar inside the screen");
    assert.ok(campo.width >= 120, "the box still has room for the number");
    await context.close();
  });

  test("on the Contatos page: a copy button after each number (none when there is no number)", async () => {
    const { page, context, errors } = await abrir();
    await irPeloMenu(page, "#btnContatos");
    await page.waitForSelector("#telaContatos.aberta");
    assert.equal(await page.locator("#ctCorpo [data-ct-copiar-tel]").count(), 1);
    await page.click("#ctCorpo [data-ct-copiar-tel]");
    assert.equal(await area(page), "(11) 99999-0000");
    assert.match(await page.textContent("#aviso"), /Telefone copiado/);
    assert.equal(await page.getAttribute("#ctCorpo [data-ct-copiar-tel]", "aria-label"), "Copiar o telefone de Paulo");
    assert.deepEqual(errors, []);
    await context.close();
  });
});
