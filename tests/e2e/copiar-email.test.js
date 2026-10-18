// E2E tests: the small copy icon: inside the e-mail box, on the Contatos page, and on each note of the Timeline.
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
  test("in the condo panel: a small icon inside the e-mail box, copies what is typed right now, and confirms", async () => {
    const { page, context, errors } = await abrir();
    await page.click(".cartao");
    await page.waitForSelector("#painel.aberto");
    await page.waitForTimeout(300);                                   // panel slide-in animation
    const campo = await page.locator(".contato-email").first().boundingBox();
    const btn = page.locator('[data-copiar-email="0"]');
    const b = await btn.boundingBox();
    assert.ok(b.x >= campo.x && b.x + b.width <= campo.x + campo.width && b.y >= campo.y && b.y + b.height <= campo.y + campo.height,
      "inside the e-mail box");
    assert.ok(b.x > campo.x + campo.width / 2, "on the right side of the box");
    assert.ok(b.width <= 26 && b.height <= 26, "small icon");
    assert.equal(await btn.evaluate((e) => getComputedStyle(e).backgroundColor), "rgba(0, 0, 0, 0)", "no colored background");
    const pad = await page.locator(".contato-email").first().evaluate((e) => parseFloat(getComputedStyle(e).paddingRight));
    assert.ok(pad >= b.width, "the text doesn't run under the icon");

    await btn.click();
    assert.equal(await area(page), "paulo@aurora.com.br");
    assert.match(await page.textContent("#aviso"), /E-mail copiado: paulo@aurora\.com\.br/);
    assert.equal(await btn.evaluate((e) => e.classList.contains("copiado")), true, "the icon turns green for a moment");
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

describe("Copy icon on the Timeline (notes)", () => {
  test("each note has the copy icon at its top right, next to edit and delete; it copies the note's text exactly", async () => {
    const texto = "Síndico pediu proposta.\nLigar de novo na segunda.";
    const app = await openApp(env, { leads: [lead({ id: "c1", nome: "Aurora", observacoes: [
      { texto, quando: "2026-10-16T14:00:00Z", por: "Karen" },
      { texto: "Primeira visita", quando: "2026-10-10T09:00:00Z", por: "Karen" }] })] });
    const { page, context, errors } = app;
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.click(".cartao");
    await page.waitForSelector("#painel.aberto");
    await page.waitForTimeout(300);
    const item = await page.locator(".obs-item").first().boundingBox();
    const btn = page.locator('[data-copiar-obs="0"]');
    const b = await btn.boundingBox(), ed = await page.locator('[data-editar-obs="0"]').boundingBox();
    assert.ok(b.y - item.y < 14 && item.x + item.width - (b.x + b.width) < 80, "top right of the note");
    assert.ok(Math.abs(b.y - ed.y) < 4 && b.x < ed.x, "same row, before the edit button");
    assert.ok(b.width <= 26 && b.height <= 26, "small icon");

    await btn.click();
    assert.equal(await area(page), texto, "line breaks kept");
    assert.match(await page.textContent("#aviso"), /Observação copiada/);
    assert.equal(await btn.evaluate((e) => e.classList.contains("copiado")), true);
    await page.click('[data-copiar-obs="1"]');
    assert.equal(await area(page), "Primeira visita");
    // the text doesn't run under the three icons
    const t = await page.locator(".obs-item .obs-texto").first().boundingBox();
    assert.ok(t.x + t.width <= b.x + 2 || t.y > b.y + b.height, "text clear of the icons");
    assert.deepEqual(errors, []);
    await context.close();
  });
});
