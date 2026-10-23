// E2E tests: the accessibility tree is well-formed (Lighthouse "Accessibility tree is not well-formed").
// The same kinds of checks as axe / Lighthouse, done in the page on the main screens:
//  - aria-label only on elements that can have a name (not on a plain div / span / i without a role);
//  - every visible button and link has a name; every field has a label;
//  - aria-hidden never hides something focusable; aria-controls / activedescendant point to real ids;
//  - listbox children are options; lists only contain list items.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, openApp, lead, localDateTime, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

function checar() {
  const out = [];
  const visivel = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && getComputedStyle(el).visibility !== "hidden";
  const nome = (el) => (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "").trim() || (el.getAttribute("aria-labelledby") ? "x" : "");
  const id = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).join(".") : "");
  const GENERICOS = ["div", "span", "i", "b", "p", "small", "em", "strong", "code"];
  document.querySelectorAll("[aria-label],[aria-labelledby]").forEach((el) => {
    if (GENERICOS.includes(el.tagName.toLowerCase()) && !el.getAttribute("role")) out.push("aria-label on a generic element: " + id(el));
  });
  document.querySelectorAll("button, a[href], [role=button]").forEach((el) => { if (visivel(el) && !nome(el)) out.push("no name: " + id(el)); });
  document.querySelectorAll("[aria-hidden=true]").forEach((el) => {
    const f = el.querySelector("a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex='-1'])");
    if (f && !f.closest("[inert]")) out.push("aria-hidden hides something focusable: " + id(el));
  });
  document.querySelectorAll("[role=listbox]").forEach((el) => [...el.children].forEach((c) => {
    if (!["option", "group"].includes(c.getAttribute("role"))) out.push("listbox child without role=option: " + id(c)); }));
  document.querySelectorAll("[aria-controls],[aria-activedescendant]").forEach((el) => ["aria-controls", "aria-activedescendant"].forEach((a) => {
    const v = el.getAttribute(a); if (v && !document.getElementById(v)) out.push(a + " points to a missing id: " + id(el)); }));
  document.querySelectorAll("input:not([type=hidden]),select,textarea").forEach((el) => {
    const ok = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.closest("label") || el.getAttribute("title") ||
      (el.id && document.querySelector("label[for='" + el.id + "']"));
    if (!ok) out.push("field without a label: " + id(el));
  });
  document.querySelectorAll("ul,ol").forEach((el) => [...el.children].forEach((c) => {
    if (!["li", "script", "template"].includes(c.tagName.toLowerCase())) out.push("list child that isn't li: " + id(el)); }));
  return [...new Set(out)];
}

describe("Accessibility tree", () => {
  test("board, condo panel, side menu and the main pages have no ARIA / naming problems", async () => {
    const { page, context, errors } = await openApp(env, { leads: [lead({ id: "a", nome: "Aurora", sults: true, visitar: true, quente: true,
      endereco: "Rua Augusta, 100 - Consolação - São Paulo - SP - 01305-000",
      observacoes: [{ texto: "Primeira visita", quando: new Date().toISOString(), por: "Karen" }],
      lembretes: [{ id: "l1", quando: localDateTime(1), texto: "Ligar", feito: false }],
      contatos: [{ nome: "Paulo", telefone: "11999990000", email: "p@x.com", tipo: "Síndico" }] })] });
    const problemas = new Set();
    const rodar = async (onde) => (await page.evaluate(checar)).forEach((p) => problemas.add(onde + ": " + p));
    await rodar("board");
    await page.click(".cartao"); await page.waitForSelector("#painel.aberto"); await rodar("condo panel");
    await page.keyboard.press("Escape");
    for (const b of ["#btnDashboard", "#btnLembretes", "#btnContatos", "#btnTemplates", "#btnEquipe"]) {
      await irPeloMenu(page, b); await page.waitForTimeout(250); await rodar(b);
      await page.keyboard.press("Escape"); await page.waitForTimeout(250);
    }
    await page.click("#btnMenu"); await page.waitForTimeout(250); await rodar("menu");
    assert.deepEqual([...problemas], []);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("the badges on a card (SULTS, Visitar, hot contact) are named images", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora", sults: true, visitar: true, quente: true,
      observacoes: [{ texto: "x", quando: new Date().toISOString(), por: "Karen" }] })] });
    for (const [sel, rotulo] of [[".selo-sults", "SULTS"], [".selo-visitar", "Para visitar"], [".selo-quente", "Contato quente"]]) {
      const el = page.locator(".cartao " + sel);
      assert.equal(await el.getAttribute("role"), "img", sel);
      assert.equal(await el.getAttribute("aria-label"), rotulo);
    }
    await context.close();
  });
});
