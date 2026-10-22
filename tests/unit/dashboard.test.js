// Unit tests: the numbers of the Dashboard page (calcularDashboard and its helpers).
// The clock is frozen at 5 Oct 2026, 12:00 (São Paulo).
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

const app = loadApp();
beforeEach(() => app.run(`leads = [];`));
const calc = (lista) => app.json(`calcularDashboard(${JSON.stringify(lista)})`);

describe("faixaTamanho() — P / M / G by number of apartments", () => {
  test("P < 200, M 200–300 (200–249 included), G > 300, 'sem' when empty or invalid", () => {
    const casos = [[1, "P"], [199, "P"], [200, "M"], [249, "M"], [250, "M"], [300, "M"], [301, "G"], [900, "G"],
      ["", "sem"], [null, "sem"], [0, "sem"], ["abc", "sem"], ["280", "M"]];
    for (const [aptos, faixa] of casos)
      assert.equal(app.run(`faixaTamanho(${JSON.stringify({ aptos })})`), faixa, `aptos=${aptos}`);
  });
});

describe("temContato() / semInformacao()", () => {
  test("a contact counts only with a phone or an e-mail (a name alone is not enough)", () => {
    assert.equal(app.run(`temContato({contatos:[{nome:"Paulo", telefone:"11999"}]})`), true);
    assert.equal(app.run(`temContato({contatos:[{nome:"", email:"a@x.com"}]})`), true);
    assert.equal(app.run(`temContato({contatos:[{nome:"Paulo"}]})`), false);
    assert.equal(app.run(`temContato({sindicoTel:"11999"})`), true, "old-format condos too");
    assert.equal(app.run(`temContato({})`), false);
  });
  test("'sem nenhuma informação' = only name/address/zone", () => {
    assert.equal(app.run(`semInformacao({nome:"A", endereco:"Rua 1", zona:"Sul", aptos:""})`), true);
    for (const extra of [`{aptos:120}`, `{contatos:[{nome:"Paulo"}]}`, `{concorrente:"Market4u"}`, `{perfil:"Família"}`,
      `{notas:"x"}`, `{importante:"x"}`, `{observacoes:[{texto:"x"}]}`])
      assert.equal(app.run(`semInformacao(Object.assign({nome:"A", aptos:""}, ${extra}))`), false, extra);
  });
});

describe("calcularDashboard()", () => {
  const base = { contatos: [], lembretes: [], observacoes: [], atualizadoEm: "2026-10-01T12:00:00Z" };
  const L = (o) => ({ ...base, ...o });

  test("total, stages (unknown stage counts as Cadastro), situation and size", () => {
    const r = calc([
      L({ id: "1", fase: "contato", status: "amarelo", aptos: 150 }),
      L({ id: "2", fase: "contato", status: "verde", aptos: 280 }),
      L({ id: "3", fase: "xyz", status: "", aptos: 420 }),
      L({ id: "4", fase: "contrato", status: "vermelho", aptos: "" }),
    ]);
    assert.equal(r.total, 4);
    assert.equal(r.fases.contato, 2);
    assert.equal(r.fases.cadastro, 1);
    assert.equal(r.fases.contrato, 1);
    assert.equal(r.fases.assembleia, 0);
    assert.deepEqual(r.status, { verde: 1, amarelo: 1, vermelho: 1, nenhum: 1 });
    assert.deepEqual(r.tamanho, { P: 1, M: 1, G: 1, sem: 1 });
    assert.equal(r.aptosTotal, 850);
    assert.equal(r.aptosFechados, 280);
    assert.equal(r.conversao, 50, "1 closed out of 1 closed + 1 lost");
  });

  test("contacts and condos with no information", () => {
    const r = calc([
      L({ id: "1", nome: "Com", contatos: [{ nome: "Paulo", telefone: "11999" }] }),
      L({ id: "2", nome: "Só nome", contatos: [{ nome: "Ana" }] }),
      L({ id: "3", nome: "Zeta vazio", aptos: "" }),
      L({ id: "4", nome: "Alfa vazio", aptos: "" }),
    ]);
    assert.equal(r.comContato, 1);
    assert.equal(r.semContato, 3);
    assert.deepEqual(r.semInfo.map((l) => l.nome), ["Alfa vazio", "Zeta vazio"], "A→Z");
  });

  test("competitor minimarkets are grouped ignoring accents/case, most common first", () => {
    const r = calc([
      L({ id: "1", concorrente: "Market4u" }), L({ id: "2", concorrente: " market4U " }),
      L({ id: "3", concorrente: "Honest Market" }), L({ id: "4", concorrente: "" }), L({ id: "5" }),
    ]);
    assert.deepEqual(r.concorrentes, [{ nome: "Market4u", n: 2 }, { nome: "Honest Market", n: 1 }]);
    assert.equal(r.semConcorrente, 2);
  });

  test("competitor contracts ending within 90 days (or already ended), soonest first", () => {
    const r = calc([
      L({ id: "a", concorrente: "X", fimContrato: "2026-12-20" }),   // 76 days
      L({ id: "b", concorrente: "X", fimContrato: "2026-09-01" }),   // ended
      L({ id: "c", concorrente: "X", fimContrato: "2027-06-01" }),   // too far
      L({ id: "d", concorrente: "", fimContrato: "2026-10-10" }),    // no competitor
    ]);
    assert.deepEqual(r.vencendo.map((l) => l.id), ["b", "a"]);
  });

  test("people, reminders, Visitar, SULTS and stale open deals", () => {
    const velho = "2026-08-01T12:00:00Z";
    const r = calc([
      L({ id: "1", responsavel: "Tasnim", visitar: true, quente: true, atualizadoEm: velho, status: "amarelo" }),
      L({ id: "2", responsavel: "Tasnim", sults: true, atualizadoEm: velho, status: "verde" }),
      L({ id: "3", responsavel: "", lembretes: [{ texto: "ligar", quando: "2026-10-01T10:00", feito: false }] }),
      L({ id: "4", responsavel: "Karen", atualizadoEm: "2026-09-20T12:00:00Z" }),
    ]);
    assert.deepEqual(r.responsaveis, [{ nome: "Tasnim", n: 2 }, { nome: "Karen", n: 1 }, { nome: "", n: 1 }],
      "'Sem responsável' last");
    assert.equal(r.lembretesVencidos, 1);
    assert.equal(r.visitar, 1);
    assert.equal(r.sults, 1);
    assert.equal(r.quentes, 1, "hot contacts");
    assert.deepEqual(r.parados.map((l) => l.id), ["1"], "closed deals and recent ones are not 'parados'");
  });

  test("an empty funnel gives zeros and no conversion rate", () => {
    const r = calc([]);
    assert.equal(r.total, 0);
    assert.equal(r.conversao, null);
    assert.equal(r.comContato, 0);
  });
});

describe("grupoDashboard() — which condos are behind each number", () => {
  const LISTA = [
    { id: "1", nome: "Bravo", fase: "reuniao", status: "amarelo", aptos: 220, concorrente: "Market4u", responsavel: "Karen",
      contatos: [{ nome: "Ana", telefone: "11" }] },
    { id: "2", nome: "alfa", fase: "nada", status: "", aptos: "", concorrente: " MARKET4U ", responsavel: "" },
    { id: "3", nome: "Charlie", fase: "reuniao", status: "verde", aptos: 400, concorrente: "", responsavel: "Karen", visitar: true },
  ];
  beforeEach(() => app.run(`leads = ${JSON.stringify(LISTA)};`));
  const grp = (k) => app.json(`(g => ({titulo: g.titulo, ids: g.lista.map(l => l.id), quadro: g.quadro}))(grupoDashboard(${JSON.stringify(k)}))`);

  test("every key gives the right condos, A→Z ignoring case", () => {
    assert.deepEqual(grp("todos").ids, ["2", "1", "3"]);
    assert.deepEqual(grp("fase:reuniao").ids, ["1", "3"]);
    assert.deepEqual(grp("fase:cadastro").ids, ["2"], "unknown stage = Cadastro, like on the board");
    assert.deepEqual(grp("status:nenhum").ids, ["2"]);
    assert.deepEqual(grp("tam:M").ids, ["1"]);
    assert.deepEqual(grp("tam:sem").ids, ["2"]);
    assert.deepEqual(grp("contato:com").ids, ["1"]);
    assert.deepEqual(grp("contato:sem").ids, ["2", "3"]);
    assert.deepEqual(grp("conc:market4u").ids, ["2", "1"], "spellings grouped");
    assert.deepEqual(grp("conc:").ids, ["3"]);
    assert.deepEqual(grp("resp:Karen").ids, ["1", "3"]);
    assert.deepEqual(grp("resp:").ids, ["2"]);
    assert.deepEqual(grp("visitar").ids, ["3"]);
    assert.deepEqual(grp("aptos").ids, ["3", "1"], "biggest first");
  });

  test("the counts on the page match the lists", () => {
    const r = app.json(`calcularDashboard(leads)`);
    assert.equal(grp("contato:com").ids.length, r.comContato);
    assert.equal(grp("contato:sem").ids.length, r.semContato);
    assert.equal(grp("conc:").ids.length, r.semConcorrente);
    for (const f of ["P", "M", "G", "sem"]) assert.equal(grp("tam:" + f).ids.length, r.tamanho[f], f);
  });

  test("titles, and a board filter only where the board has one", () => {
    assert.deepEqual(grp("fase:reuniao").quadro, { fase: "reuniao" });
    assert.equal(grp("fase:reuniao").titulo, "Fase: Reunião");
    assert.deepEqual(grp("status:verde").quadro, { status: "verde" });
    assert.deepEqual(grp("resp:Karen").quadro, { resp: "Karen" });
    assert.deepEqual(grp("conc:market4u").quadro, { busca: "Market4u" });
    assert.equal(grp("conc:market4u").titulo, "Concorrente: Market4u");
    assert.equal(grp("tam:M").quadro, null);
    assert.equal(grp("tam:M").titulo, "Tamanho M — 200 a 300 aptos");
  });
});
