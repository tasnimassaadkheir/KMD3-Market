// E2E tests: the "Ligar" button (tel: link) next to WhatsApp, in the condo panel and on the Contacts page.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const dados = () => [lead({ id: "c1", nome: "Aurora", contatos: [{ nome: "Paulo", telefone: "(11) 99999-0000", email: "", tipo: "Síndico" }] })];

describe("Ligar (call) button", () => {
  test("in the condo panel it sits next to WhatsApp and opens tel: with the typed number", async () => {
    const { page, context, errors } = await openApp(env, { leads: dados() });
    await page.click(".cartao");
    await page.waitForTimeout(300);                           // panel slide-in animation
    const ligar = page.locator('[data-ligar-contato="0"]');
    const zap = await page.locator('[data-whats-contato="0"]').boundingBox();
    const b = await ligar.boundingBox();
    assert.ok(Math.abs(b.y - zap.y) < 4 && b.x > zap.x, "same row, right of WhatsApp");

    // capture the call instead of really opening the keypad
    await page.evaluate(() => { window.__tel = null; window.ligarPara = (l) => { window.__tel = l; }; });
    await page.fill(".contato-tel", "11 3333-4444");          // uses what is typed right now
    await ligar.click();
    const tel = await page.evaluate(() => window.__tel);
    assert.equal(tel, "tel:1133334444");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("an invalid number shows a message instead of calling", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await page.click(".cartao");
    await page.fill(".contato-tel", "123");
    await page.click('[data-ligar-contato="0"]');
    assert.match(await page.textContent("#aviso"), /Telefone inválido para ligar/);
    await context.close();
  });

  test("on a phone, the number field is wide enough (phone and e-mail stack)", async () => {
    const { page, context } = await openApp(env, { leads: dados(), viewport: { width: 390, height: 844 } });
    await page.click(".cartao");
    await page.waitForTimeout(300);
    const campo = await page.locator(".contato-tel").boundingBox();
    assert.ok(campo.width >= 150, `number field only ${campo.width}px wide`);
    const lig = await page.locator('[data-ligar-contato="0"]').boundingBox();
    const item = await page.locator(".contato-item").boundingBox();
    assert.ok(lig.x + lig.width <= item.x + item.width + 0.5, "call button inside the contact box");
    await context.close();
  });

  test("on the Contacts page each number has a call link", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await irPeloMenu(page, "#btnContatos");
    await page.waitForSelector("#telaContatos.aberta");
    assert.equal(await page.getAttribute('#ctCorpo tr:has-text("Paulo") .ct-ligar', "href"), "tel:11999990000");
    await context.close();
  });
});

describe("Contact header on phones", () => {
  test("name field fills the first line with ✕ beside it; 'Vínculo' goes below, full width", async () => {
    // Bug fixed: on iPhone the name field was squeezed and the ✕ overlapped it.
    const { page, context } = await openApp(env, { viewport: { width: 402, height: 874 },
      leads: [lead({ nome: "Aurora", contatos: [{ nome: "Paulo", telefone: "", email: "", tipo: "Zelador" }] })] });
    await page.click(".cartao");
    await page.waitForTimeout(300);
    const nome = await page.locator(".contato-nome").boundingBox();
    const x = await page.locator(".contato-remover").boundingBox();
    const tipo = await page.locator(".contato-tipo").boundingBox();
    const item = await page.locator(".contato-item").boundingBox();
    assert.ok(nome.width >= item.width * 0.7, `name field only ${nome.width}px wide`);
    assert.ok(x.x >= nome.x + nome.width, "✕ is beside the name, not on top of it");
    assert.ok(Math.abs((x.y + x.height / 2) - (nome.y + nome.height / 2)) < 6, "✕ vertically centered with the name");
    assert.ok(tipo.y > nome.y + nome.height, "'Vínculo' is below the name");
    await context.close();
  });
});

describe("Contacts page: number line", () => {
  for (const w of [1300, 1024, 390]) {
    test(`number, WhatsApp and call stay on one line (${w}px wide)`, async () => {
      // Bug fixed: with a 10-digit number the call icon dropped to the line below.
      const { page, context } = await openApp(env, { viewport: { width: w, height: 800 },
        leads: [lead({ nome: "Residencial com um nome bem comprido para apertar a tabela",
          contatos: [{ nome: "Adm", telefone: "1137598100", email: "administracao.condominio@exemplo.com.br", tipo: "ADM" }] })] });
      await irPeloMenu(page, "#btnContatos");
      await page.waitForSelector("#telaContatos.aberta");
      const ys = await page.locator('#ctCorpo tr:has-text("Adm") .ct-numero').evaluate((el) =>
        [el.firstChild, el.querySelector(".ct-zap"), el.querySelector(".ct-ligar")].map((n) => {
          const r = n.nodeType === 3 ? (() => { const g = document.createRange(); g.selectNode(n); return g.getBoundingClientRect(); })() : n.getBoundingClientRect();
          return r.top + r.height / 2;
        }));
      assert.ok(Math.max(...ys) - Math.min(...ys) < 6, `not on one line: ${ys.map(Math.round)}`);
      const sobra = await page.locator("#telaContatos .tela-lem-corpo").evaluate((el) => el.scrollWidth - el.clientWidth);
      assert.ok(sobra <= 1, `page scrolls ${sobra}px sideways`);
      await context.close();
    });
  }
});
