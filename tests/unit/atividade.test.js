// Unit tests: a member's activity in the admin screen (textoAtividade, atividadesDoHistorico,
// juntarAtividades, filtrarAtividades, resumoAtividades, rotuloDia, tabelaFaltando).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

const app = loadApp();
const j = (expr) => app.json(expr);

describe("textoAtividade() — one line of the 'atividades' table in plain words", () => {
  test("logins, created / deleted items, and the condo's own history text when there is one", () => {
    const t = (a) => app.run(`textoAtividade(${JSON.stringify(a)})`);
    assert.equal(t({ tipo: "app", acao: "entrou" }), "Entrou no app");
    assert.equal(t({ tipo: "app", acao: "abriu" }), "Abriu o app");
    assert.equal(t({ tipo: "condominio", acao: "criou" }), "Cadastrou o condomínio");
    assert.equal(t({ tipo: "condominio", acao: "excluiu" }), "Excluiu o condomínio");
    assert.equal(t({ tipo: "condominio", acao: "alterou", detalhe: "Movido para Proposta" }), "Movido para Proposta");
    assert.equal(t({ tipo: "condominio", acao: "alterou" }), "Alterou o condomínio");
    assert.equal(t({ tipo: "template", acao: "criou" }), "Criou o template");
    assert.equal(t({ tipo: "contato", acao: "excluiu" }), "Excluiu o contato");
    assert.equal(t({ tipo: "outra", acao: "alterou" }), "Alterou o item");
  });
});

describe("atividadesDoHistorico() — the person's changes from the condos' history", () => {
  const condos = [
    { id: "c1", nome: "Acácias", historico: [
      { quando: "2026-10-16T14:00:00Z", o_que: "Movido para Proposta", por: "Karen Souza" },
      { quando: "2026-10-10T09:00:00Z", o_que: "Condomínio cadastrado", por: "karen souza " },
      { quando: "2026-10-09T09:00:00Z", o_que: "Observação adicionada", por: "Paulo" }] },
    { id: "c2", nome: "Sol", historico: [{ quando: "2026-10-15T08:00:00Z", o_que: "Marcado para visitar", por: "Kárén Souza" }] },
    { id: "c3", nome: "Sem histórico" },
  ];
  test("matches the name ignoring case, accents and extra spaces; marks 'cadastrado' as created", () => {
    const r = j(`atividadesDoHistorico(${JSON.stringify(condos)}, ["Karen Souza", null, ""])`);
    assert.equal(r.length, 3);
    assert.deepEqual(r.map((a) => a.alvo), ["Acácias", "Acácias", "Sol"]);
    assert.deepEqual(r.map((a) => a.acao), ["alterou", "criou", "alterou"]);
    assert.ok(r.every((a) => a.tipo === "condominio"));
  });
  test("any of the person's names counts (team name, e-mail prefix); no names = nothing", () => {
    assert.equal(j(`atividadesDoHistorico(${JSON.stringify(condos)}, ["ninguem", "paulo"])`).length, 1);
    assert.deepEqual(j(`atividadesDoHistorico(${JSON.stringify(condos)}, [null, ""])`), []);
  });
});

describe("juntarAtividades() — table + history without showing a change twice", () => {
  const banco = [{ quando: "2026-10-16T14:00:00Z", texto: "Movido para Proposta", tipo: "condominio" },
                 { quando: "2026-10-12T10:00:00Z", texto: "Entrou no app", tipo: "app" }];
  const hist = [{ quando: "2026-10-16T14:00:00Z", texto: "Movido para Proposta" },     // same change: already in the table
                { quando: "2026-10-11T09:00:00Z", texto: "Condomínio cadastrado" }];   // before the table existed
  test("history is used only before the table's oldest line, newest first", () => {
    const r = j(`juntarAtividades(${JSON.stringify(banco)}, ${JSON.stringify(hist)})`);
    assert.deepEqual(r.map((a) => a.texto), ["Movido para Proposta", "Entrou no app", "Condomínio cadastrado"]);
  });
  test("without the table, all the history is shown (sorted)", () => {
    const r = j(`juntarAtividades([], ${JSON.stringify(hist)})`);
    assert.deepEqual(r.map((a) => a.quando), ["2026-10-16T14:00:00Z", "2026-10-11T09:00:00Z"]);
  });
});

describe("filtrarAtividades() / resumoAtividades()", () => {
  const hoje = 'new Date("2026-10-17T12:00:00Z")';
  const lista = [
    { quando: "2026-10-17T10:00:00Z", texto: "Entrou no app", tipo: "app", acao: "entrou", alvo: "" },
    { quando: "2026-10-16T10:00:00Z", texto: "Cadastrou o condomínio", tipo: "condominio", acao: "criou", alvo: "Acácias", alvoId: "c1" },
    { quando: "2026-10-15T10:00:00Z", texto: "Movido para Proposta", tipo: "condominio", acao: "alterou", alvo: "Acácias", alvoId: "c1" },
    { quando: "2026-10-01T10:00:00Z", texto: "Criou o template", tipo: "template", acao: "criou", alvo: "Visita" },
  ];
  test("period in days (0 = everything) and search on the text and the condo name, accents ignored", () => {
    assert.equal(j(`filtrarAtividades(${JSON.stringify(lista)}, 7, "", ${hoje})`).length, 3);
    assert.equal(j(`filtrarAtividades(${JSON.stringify(lista)}, 0, "", ${hoje})`).length, 4);
    assert.equal(j(`filtrarAtividades(${JSON.stringify(lista)}, 0, "acacias", ${hoje})`).length, 2);
    assert.equal(j(`filtrarAtividades(${JSON.stringify(lista)}, 0, "PROPOSTA", ${hoje})`).length, 1);
  });
  test("summary: logins don't count as work; one condo touched twice counts once; last activity", () => {
    assert.deepEqual(j(`resumoAtividades(${JSON.stringify(lista)})`),
      { acoes: 3, condominios: 1, novos: 1, ultimo: "2026-10-17T10:00:00Z" });
    assert.deepEqual(j(`resumoAtividades([])`), { acoes: 0, condominios: 0, novos: 0, ultimo: null });
  });
});

describe("rotuloDia() / tabelaFaltando()", () => {
  test("Hoje, Ontem, then weekday and date (year only when it's another year)", () => {
    const hoje = 'new Date(2026, 9, 17, 12, 0)';
    assert.equal(app.run(`rotuloDia(new Date(2026, 9, 17, 8, 0).toISOString(), ${hoje})`), "Hoje");
    assert.equal(app.run(`rotuloDia(new Date(2026, 9, 16, 23, 0).toISOString(), ${hoje})`), "Ontem");
    assert.match(app.run(`rotuloDia(new Date(2026, 9, 12, 10, 0).toISOString(), ${hoje})`), /12 de outubro$/);
    assert.match(app.run(`rotuloDia(new Date(2025, 11, 30, 10, 0).toISOString(), ${hoje})`), /30 de dezembro de 2025$/);
  });
  test("recognizes 'table doesn't exist yet' errors from Postgres and PostgREST", () => {
    assert.equal(app.run(`tabelaFaltando({code:"42P01"})`), true);
    assert.equal(app.run(`tabelaFaltando({code:"PGRST205", message:"Could not find the table 'public.atividades'"})`), true);
    assert.equal(app.run(`tabelaFaltando({code:"42501", message:"permission denied"})`), false);
    assert.equal(app.run(`tabelaFaltando(null)`), false);
  });
});
