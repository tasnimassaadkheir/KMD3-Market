// E2E tests: "Quem é" on condo contacts (with "Outro…") and the Contacts page (☰ → Contatos).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { setup, openApp, lead, irPeloMenu } = require("./helpers");

let env;
before(async () => { env = await setup(); });
after(async () => { await env.close(); });

const salvos = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:condominios")));
const opcoes = (loc) => loc.locator("option").allTextContents();

describe("'Quem é' on a condo's contacts", () => {
  test("appears after the name is filled, with the 6 options, and is saved with the contact", async () => {
    const { page, context, errors } = await openApp(env, { leads: [lead({ id: "c1", nome: "Aurora" })] });
    await page.click(".cartao");
    await page.click("#btnAddContato");
    const tipo = page.locator('.contato-tipo[data-i="0"]');
    assert.equal(await tipo.isVisible(), false, "hidden while the name is empty");

    await page.fill(".contato-nome", "Paulo");
    assert.equal(await tipo.isVisible(), true, "shows after typing the name");
    const sel = page.locator(".contato-tipo-sel");
    assert.deepEqual(await opcoes(sel), ["Quem é?", "Síndico", "ADM", "Zelador", "Morador", "Gerente predial", "Outro…"]);

    await sel.selectOption("Síndico");
    await page.click("#btnSalvar");
    await page.waitForFunction(() => (JSON.parse(localStorage.getItem("quitandinha:condominios"))[0].contatos || []).length === 1);
    assert.deepEqual((await salvos(page))[0].contatos, [{ nome: "Paulo", telefone: "", email: "", tipo: "Síndico" }]);
    assert.match(await page.textContent(".cartao"), /Paulo \(Síndico\)/, "the card shows who it is");
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("'Outro…' opens a box; the new type is used and shows up in the other cards' dropdowns", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ id: "c1", nome: "Aurora" }), lead({ id: "c2", nome: "Mirante", ordem: 1 })] });
    await page.click('.cartao:has-text("Aurora")');
    await page.click("#btnAddContato");
    await page.fill(".contato-nome", "Seu Zé");
    await page.selectOption(".contato-tipo-sel", "__outro");
    const caixa = page.locator(".tipo-outro-txt");
    await caixa.waitFor();
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("tipo-outro-txt")), true, "cursor goes to the box");
    await caixa.fill("Porteiro");
    await caixa.press("Enter");
    assert.equal(await page.inputValue(".contato-tipo-sel"), "Porteiro");
    await page.click("#btnSalvar");
    await page.waitForFunction(() => (JSON.parse(localStorage.getItem("quitandinha:condominios")).find((l) => l.id === "c1").contatos || []).length === 1);

    // another card: the new type is in its dropdown, before "Outro…"
    await page.click('.cartao:has-text("Mirante")');
    await page.click("#btnAddContato");
    await page.fill(".contato-nome", "Maria");
    const lista = await opcoes(page.locator(".contato-tipo-sel"));
    assert.deepEqual(lista.slice(-2), ["Porteiro", "Outro…"]);
    await context.close();
  });

  test("Esc in the 'Outro…' box cancels it without closing the panel", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora" })] });
    await page.click(".cartao");
    await page.click("#btnAddContato");
    await page.fill(".contato-nome", "Paulo");
    await page.selectOption(".contato-tipo-sel", "__outro");
    await page.locator(".tipo-outro-txt").press("Escape");
    assert.equal(await page.locator("#painel.aberto").count(), 1, "panel still open");
    assert.equal(await page.inputValue(".contato-tipo-sel"), "", "back to 'Quem é?'");
    await context.close();
  });
});

describe("Contacts page (☰ → Contatos)", () => {
  const dados = () => [
    lead({ id: "c1", nome: "Aurora", endereco: "Rua A, 10", contatos: [{ nome: "Paulo", telefone: "(11) 99999-0000", email: "paulo@aurora.com", tipo: "Síndico" }] }),
    lead({ id: "c2", nome: "Mirante", ordem: 1, contatos: [{ nome: "Bruna", telefone: "11 3333-4444", email: "", tipo: "ADM" }, { nome: "Carlos", telefone: "", email: "carlos@x.com", tipo: "Zelador" }] }),
  ];
  const abrir = async (page) => { await irPeloMenu(page, "#btnContatos"); await page.waitForSelector("#telaContatos.aberta"); };
  const linhas = (page) => page.locator("#ctCorpo tr").evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll("td")].slice(0, 4).map((td) => td.innerText.trim())));

  test("lists the contacts from every card in columns Nome, Número, E-mail, Condomínio", async () => {
    const { page, context, errors } = await openApp(env, { leads: dados() });
    await abrir(page);
    assert.deepEqual(await page.locator(".ct-tabela thead th").allTextContents(), ["Nome", "Número", "E-mail", "Condomínio", "Ações"]);
    assert.deepEqual(await linhas(page), [
      ["BrunaADM", "11 3333-4444", "—", "Mirante"],
      ["CarlosZelador", "—", "carlos@x.com", "Mirante"],
      ["PauloSíndico", "(11) 99999-0000", "paulo@aurora.com", "Aurora"],
    ]);
    assert.equal(await page.getAttribute('#ctCorpo tr:has-text("Paulo") .ct-zap', "href"), "https://wa.me/5511999990000");
    assert.match(await page.textContent("#ctResumo"), /3 contatos: 3 de condomínios e 0 avulsos/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test("clicking the condo name opens that condo on top of the page", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await abrir(page);
    await page.click('#ctCorpo button.ct-condo:has-text("Aurora")');
    await page.waitForSelector("#painel.aberto");
    assert.equal(await page.inputValue("#f_nome"), "Aurora");
    await page.click("#btnFechar");
    assert.equal(await page.locator("#telaContatos.aberta").count(), 1, "back on the contacts page");
    await context.close();
  });

  test("search and the 'Quem é' filter", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await abrir(page);
    await page.fill("#ctBusca", "aurora");
    assert.deepEqual((await linhas(page)).map((r) => r[0]), ["PauloSíndico"]);
    await page.fill("#ctBusca", "3333");
    assert.deepEqual((await linhas(page)).map((r) => r[0]), ["BrunaADM"], "search by phone digits");
    await page.fill("#ctBusca", "");
    await page.selectOption("#ctFiltroTipo", "Zelador");
    assert.deepEqual((await linhas(page)).map((r) => r[0]), ["CarlosZelador"]);
    await context.close();
  });

  test("adds, edits and deletes a standalone contact (not from any condo)", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await abrir(page);
    await page.click("#btnNovoContato");
    await page.fill("#ct_nome", "Ana Advogada");
    await page.fill("#ct_tel", "11 98888-7777");
    await page.fill("#ct_email", "ana@adv.com");
    await page.selectOption("#ct_tipo", "__outro");
    await page.fill("#ct_tipoOutro", "Advogada");
    await page.click('#ctForm button[type="submit"]');
    await page.waitForSelector('#ctCorpo tr:has-text("Ana Advogada")');
    const ana = page.locator('#ctCorpo tr:has-text("Ana Advogada")');
    assert.match(await ana.textContent(), /Avulso/);
    assert.match(await ana.textContent(), /Advogada/);
    assert.equal(await page.locator("#ctForm").isHidden(), true);
    const guardados = await page.evaluate(() => JSON.parse(localStorage.getItem("quitandinha:contatosAvulsos")));
    assert.equal(guardados[0].nome, "Ana Advogada");

    // edit
    await ana.locator("[data-ct-editar]").click();
    assert.equal(await page.inputValue("#ct_tipo"), "Advogada", "the new type is now a normal option");
    await page.fill("#ct_tel", "11 97777-6666");
    await page.click('#ctForm button[type="submit"]');
    await page.waitForSelector('#ctCorpo tr:has-text("97777-6666")');

    // delete
    page.on("dialog", (d) => d.accept());
    await page.locator('#ctCorpo tr:has-text("Ana Advogada") [data-ct-excluir]').click();
    await page.waitForSelector('#ctCorpo tr:has-text("Ana Advogada")', { state: "detached" });
    await context.close();
  });

  test("a standalone contact needs a name", async () => {
    const { page, context } = await openApp(env);
    await abrir(page);
    await page.click("#btnNovoContato");
    await page.click('#ctForm button[type="submit"]');
    assert.match(await page.textContent("#aviso"), /nome do contato/);
    assert.equal(await page.locator("#ctForm").isVisible(), true);
    await context.close();
  });

  test("exports what is on screen as a spreadsheet (CSV)", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await abrir(page);
    await page.selectOption("#ctFiltroTipo", "Síndico");
    const [download] = await Promise.all([page.waitForEvent("download"), page.click("#btnExportarContatos")]);
    assert.match(download.suggestedFilename(), /^contatos-\d{4}-\d{2}-\d{2}\.csv$/);
    const csv = fs.readFileSync(await download.path(), "utf8");
    assert.ok(csv.startsWith("﻿"));
    const l = csv.slice(1).split("\r\n");
    assert.equal(l[0], '"Nome";"Quem é";"Número";"E-mail";"Condomínio";"Endereço do condomínio"');
    assert.equal(l[1], '"Paulo";"Síndico";"(11) 99999-0000";"paulo@aurora.com";"Aurora";"Rua A, 10"');
    assert.equal(l.length, 2, "only the filtered rows");
    await context.close();
  });

  test("Esc and '← Voltar ao quadro' close the page", async () => {
    const { page, context } = await openApp(env, { leads: dados() });
    await abrir(page);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#telaContatos.aberta").count(), 0);
    await abrir(page);
    await page.click("#btnFecharContatos");
    assert.equal(await page.locator("#telaContatos.aberta").count(), 0);
    await context.close();
  });

  test("on a phone, each contact shows as a card and the page doesn't scroll sideways", async () => {
    const { page, context } = await openApp(env, { leads: dados(), viewport: { width: 390, height: 844 } });
    await abrir(page);
    assert.equal(await page.locator(".ct-tabela thead").isVisible(), false);
    const sobra = await page.locator("#telaContatos .tela-lem-corpo").evaluate((el) => el.scrollWidth - el.clientWidth);
    assert.ok(sobra <= 1, `${sobra}px of sideways scroll`);
    await context.close();
  });
});

describe("Contacts page: sticky header", () => {
  test("the column headers stay visible at the top while scrolling down", async () => {
    const muitos = Array.from({ length: 40 }, (_, i) =>
      lead({ id: "c" + i, nome: "Condomínio " + i, ordem: i, contatos: [{ nome: "Contato " + String(i).padStart(2, "0"), telefone: "1137598100", email: "", tipo: "ADM" }] }));
    const { page, context } = await openApp(env, { leads: muitos, viewport: { width: 1300, height: 700 } });
    await irPeloMenu(page, "#btnContatos");
    await page.waitForSelector("#telaContatos.aberta");
    const corpo = page.locator("#telaContatos .tela-lem-corpo");
    await corpo.evaluate((el) => { el.scrollTop = 900; });
    await page.waitForTimeout(100);
    const th = await page.locator(".ct-tabela thead th").first().boundingBox();
    const area = await corpo.boundingBox();
    assert.ok(th.y >= area.y - 1 && th.y <= area.y + 4, `header at ${th.y}, visible area starts at ${area.y}`);
    // and it is the header that is on top there, not a contact row
    const noTopo = await page.evaluate(([x, y]) => document.elementFromPoint(x, y).closest("th") !== null, [th.x + 20, th.y + th.height / 2]);
    assert.equal(noTopo, true, "a row is covering the header");
    await context.close();
  });
});

describe("Contacts page: WhatsApp icon", () => {
  test("uses the same WhatsApp logo as the condo panel", async () => {
    const { page, context } = await openApp(env, { leads: [lead({ nome: "Aurora", contatos: [{ nome: "Adm", telefone: "1136072722", email: "", tipo: "ADM" }] })] });
    await page.click(".cartao");
    const doPainel = await page.locator(".btn-whats svg path").getAttribute("d");
    await page.click("#btnFechar");
    await irPeloMenu(page, "#btnContatos");
    await page.waitForSelector("#telaContatos.aberta");
    assert.equal(await page.locator(".ct-zap svg path").getAttribute("d"), doPainel);
    await context.close();
  });
});
