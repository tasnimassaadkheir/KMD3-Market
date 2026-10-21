// E2E tests: the Administração screen fits a phone (it used to be cut off on the right because the
// members table forced the page wider than the screen). On phones each member is a card; on a laptop
// it stays a table. Cloud mode with the fake Supabase answering the admin functions.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, criarNuvem, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const MEMBROS = [
  { user_id: "u1", email: "tasnimassaadkheir@kmd3market.com.br", usuario: "Tasnim", papel: "admin", ativo: true, ver_todos: true, pode_criar: true, pode_editar: true, pode_excluir: true },
  { user_id: "u2", email: "karen.souza@kmd3market.com.br", usuario: "Karen Souza", papel: "vendedor", ativo: true, ver_todos: false, pode_criar: true, pode_editar: true, pode_excluir: false },
];
const RPC = { sou_admin: true, sou_super: true, admin_membros: MEMBROS, admin_definir_acesso: null,
  admin_organizacoes: [{ id: "o", nome: "KMD3 Market", ativa: true, membros: 2, condominios: 0 }, { id: "t", nome: "Test", ativa: false, membros: 1, condominios: 0 }] };

async function abrirAdmin(viewport) {
  const app = await openApp(env, { nuvem: criarNuvem(undefined, { rpc: RPC }), viewport });
  await app.page.waitForSelector("#btnAdmin:not([hidden])", { state: "attached" });
  await irPeloMenu(app.page, "#btnAdmin");
  await app.page.waitForSelector("#admCorpo tr[data-u]");
  return app;
}
// elements of the admin screen that stick out past the right edge of the screen
const passando = (page) => page.evaluate(() => [...document.querySelectorAll("#admTela *")]
  .filter((e) => e.offsetParent !== null && e.getBoundingClientRect().right > innerWidth + 1)
  .map((e) => e.tagName + (e.id ? "#" + e.id : "") + (e.className ? "." + e.className : "")));

describe("Administração on a phone", () => {
  for (const largura of [390, 360]) {
    test(`${largura}px: nothing is cut off, no sideways scrolling`, async () => {
      const { page, context, errors } = await abrirAdmin({ width: largura, height: 800 });
      assert.deepEqual(await passando(page), []);
      assert.equal(await page.locator("#admTela").evaluate((e) => e.scrollWidth <= e.clientWidth), true);
      // the "Fechar" button shows its whole word (it used to be squeezed into an icon-size square)
      assert.equal(await page.locator("#admFechar").evaluate((e) => e.scrollWidth <= e.clientWidth && e.clientWidth > 40), true);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }

  test("each member is a card: e-mail, role, labeled permission boxes and full-width Salvar / Remover", async () => {
    const { page, context } = await abrirAdmin({ width: 390, height: 800 });
    assert.equal(await page.locator("#admTela thead").isVisible(), false, "no table header on the phone");
    const card = page.locator("#admCorpo tr[data-u]").first();
    const caixa = await card.boundingBox();
    assert.ok(caixa.width <= 390 - 20, "the card fits the screen");
    assert.deepEqual(await card.locator(".adm-ck span").allTextContents(), ["Ativo", "Vê todos", "Cria", "Edita", "Exclui"]);
    assert.equal(await card.locator(".adm-ck span").first().isVisible(), true, "the labels show on the phone");
    // tapping the word ticks the box (the label wraps the checkbox)
    const exclui = page.locator("#admCorpo tr[data-u] >> nth=1").locator(".adm-ck:has-text('Exclui')");
    await exclui.click();
    assert.equal(await page.locator("#admCorpo tr[data-u] >> nth=1").locator("input.excluir").isChecked(), true);
    const salvar = await card.locator(".admSalvar").boundingBox(), remover = await card.locator(".admRemover").boundingBox();
    assert.ok(salvar.width > 120 && remover.width > 120 && Math.abs(salvar.y - remover.y) < 2, "two big buttons side by side");
    await card.locator(".admSalvar").click();
    assert.match(await page.textContent("#aviso"), /Acesso salvo/);
    // the e-mail still opens the person's activity
    await card.locator(".adm-pessoa").click();
    await page.waitForSelector("#admAtiv:not([hidden])");
    await context.close();
  });

  test("on a laptop it is still a table with the header and no labels next to the boxes", async () => {
    const { page, context } = await abrirAdmin({ width: 1300, height: 800 });
    assert.equal(await page.locator("#admTela thead").isVisible(), true);
    assert.equal(await page.locator(".adm-ck span").first().isVisible(), false);
    assert.equal(await page.locator("#admCorpo tr[data-u]").first().evaluate((e) => getComputedStyle(e).display), "table-row");
    await context.close();
  });
});
