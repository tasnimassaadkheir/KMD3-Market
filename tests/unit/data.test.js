// Unit tests: converting data to/from the database, migrations of old data, and the change log.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

const app = loadApp();

describe("paraBanco() / doBanco() — app format <-> database format", () => {
  const lead = `({id:"c1", nome:"Aurora", endereco:"Rua A", aptos:"48", fase:"reuniao", status:"amarelo",
    ordem:2, zona:"Centro", contatos:[{nome:"Paulo", telefone:"11999990000", email:""}],
    concorrente:"Hirota", fimContrato:"2026-12-31", responsavel:"Ana", criadoPor:"Ana",
    criadoEm:"2026-10-01T10:00:00.000Z", atualizadoEm:"2026-10-02T10:00:00.000Z",
    historico:[], observacoes:[], lembretes:[]})`;

  test("converts camelCase fields to snake_case database columns", () => {
    const row = app.json(`paraBanco(${lead})`);
    assert.equal(row.fim_contrato, "2026-12-31");
    assert.equal(row.criado_por, "Ana");
    assert.equal(row.criado_em, "2026-10-01T10:00:00.000Z");
    assert.equal(row.aptos, 48, "apartments become a number");
  });
  test("clears the old legacy contact columns", () => {
    const row = app.json(`paraBanco(${lead})`);
    for (const col of ["sindico", "sindico_tel", "admin_nome", "admin_email"]) assert.equal(row[col], null);
  });
  test("empty values become null and stage/status get defaults", () => {
    const row = app.json(`paraBanco({id:"x", aptos:""})`);
    assert.equal(row.nome, null);
    assert.equal(row.aptos, null);
    assert.equal(row.fase, "cadastro");
    assert.equal(row.status, "nenhum");
    assert.equal(row.ordem, 0);
  });
  test("round trip: app -> database -> app keeps the important fields", () => {
    const back = app.json(`doBanco(paraBanco(${lead}))`);
    assert.equal(back.nome, "Aurora");
    assert.equal(back.fase, "reuniao");
    assert.equal(back.fimContrato, "2026-12-31");
    assert.deepEqual(back.contatos, [{ nome: "Paulo", telefone: "11999990000", email: "" }]);
  });
  test("doBanco() fills missing columns with safe defaults", () => {
    const l = app.json(`doBanco({id:"y"})`);
    assert.equal(l.nome, "");
    assert.equal(l.fase, "cadastro");
    assert.deepEqual(l.contatos, []);
    assert.equal(l.lembretes, undefined, "no reminders column -> undefined (uses local backup)");
  });
});

describe("migrarContatosAntigos() — old síndico/administradora fields -> contacts list", () => {
  test("keeps the new contacts list when it exists", () => {
    assert.deepEqual(app.json(`migrarContatosAntigos({contatos:[{nome:"Ana"}]})`),
      [{ nome: "Ana", telefone: "", email: "" }]);
  });
  test("converts the old fields into two contacts", () => {
    const c = app.json(`migrarContatosAntigos({sindico:"Paulo", sindicoTel:"119", admin:"Lello", adminContato:"Rita", adminEmail:"r@l.com"})`);
    assert.deepEqual(c, [
      { nome: "Paulo", telefone: "119", email: "" },
      { nome: "Lello – Rita", telefone: "", email: "r@l.com" },
    ]);
  });
  test("returns an empty list when there is nothing", () => {
    assert.deepEqual(app.json(`migrarContatosAntigos({})`), []);
  });
});

describe("migrarNotasAntigas() / ultimaObservacao() — notes timeline", () => {
  test("turns the old free-text 'notas' field into one note marked 'antiga'", () => {
    const n = app.json(`migrarNotasAntigas({notas:"  ligar segunda  ", criadoPor:"Ana", atualizadoEm:"2026-10-01T10:00:00Z"})`);
    assert.deepEqual(n, [{ texto: "ligar segunda", quando: "2026-10-01T10:00:00Z", por: "Ana", antiga: true }]);
  });
  test("returns a COPY of the notes (editing it doesn't change the original)", () => {
    assert.equal(app.run(`(() => { const l={observacoes:[{texto:"a"}]}; migrarNotasAntigas(l)[0].texto="b"; return l.observacoes[0].texto; })()`), "a");
  });
  test("ultimaObservacao() picks the most recent note, counting edits", () => {
    const u = app.json(`ultimaObservacao({observacoes:[
      {texto:"1", quando:"2026-10-01T10:00:00Z", por:"Ana"},
      {texto:"2", quando:"2026-09-01T10:00:00Z", por:"Bia", editadoQuando:"2026-10-03T10:00:00Z", editadoPor:"Carla"}
    ]})`);
    assert.deepEqual(u, { quando: "2026-10-03T10:00:00Z", por: "Carla" });
  });
});

describe("descreverAlteracoes() / registrarAtualizacao() — change history", () => {
  test("describes stage and status changes with readable names", () => {
    const p = app.json(`descreverAlteracoes({fase:"cadastro", status:"nenhum"}, {fase:"reuniao", status:"verde"})`);
    assert.ok(p.includes("Fase: Cadastro de Oportunidade → Reunião"), p.join(" | "));
    assert.ok(p.some((x) => x.startsWith("Situação:")), p.join(" | "));
  });
  test("reports nothing when nothing changed", () => {
    assert.deepEqual(app.json(`descreverAlteracoes({fase:"cadastro", nome:"A"}, {fase:"cadastro", nome:"A "})`), []);
  });
  test("detects changed contacts and reminders", () => {
    const p = app.json(`descreverAlteracoes({fase:"a", contatos:[]}, {fase:"a", contatos:[{nome:"x"}], lembretes:[{}]})`);
    assert.ok(p.includes("Contatos alterados"));
    assert.ok(p.includes("Lembretes alterados"));
  });
  test("history keeps the newest entry first and at most 40 entries", () => {
    const h = app.json(`(() => { const l={}; for(let i=1;i<=45;i++) registrarAtualizacao(l, "change "+i); return l.historico; })()`);
    assert.equal(h.length, 40);
    assert.equal(h[0].o_que, "change 45");
  });
});

describe("SULTS flag", () => {
  test("is sent to the database as a true/false 'sults' column", () => {
    assert.equal(app.json(`paraBanco({id:"a", sults:true})`).sults, true);
    assert.equal(app.json(`paraBanco({id:"b"})`).sults, false, "missing = false");
  });
  test("is read back from the database; a missing column stays undefined (uses the local backup)", () => {
    assert.equal(app.json(`doBanco({id:"a", sults:true})`).sults, true);
    assert.equal(app.json(`doBanco({id:"b"})`).sults, undefined);
  });
  test("turning it on or off is written in the history", () => {
    assert.ok(app.json(`descreverAlteracoes({fase:"a"}, {fase:"a", sults:true})`).includes("Marcado como SULTS"));
    assert.ok(app.json(`descreverAlteracoes({fase:"a", sults:true}, {fase:"a", sults:false})`).includes("Desmarcado de SULTS"));
    assert.deepEqual(app.json(`descreverAlteracoes({fase:"a", sults:false}, {fase:"a"})`), [], "false and missing are the same");
  });
});

describe("Visitar flag", () => {
  test("is sent to and read from the database as a true/false 'visitar' column", () => {
    assert.equal(app.json(`paraBanco({id:"a", visitar:true})`).visitar, true);
    assert.equal(app.json(`paraBanco({id:"b"})`).visitar, false);
    assert.equal(app.json(`doBanco({id:"a", visitar:true})`).visitar, true);
    assert.equal(app.json(`doBanco({id:"b"})`).visitar, undefined, "missing column -> uses the browser backup");
  });
  test("if the database has no 'visitar' column, it is left out of the save (and SULTS still goes)", () => {
    const row = app.json(`(() => { SEM_COLUNA_FLAG.add("visitar"); const r = paraBanco({id:"a", visitar:true, sults:true}); SEM_COLUNA_FLAG.clear(); return r; })()`);
    assert.equal("visitar" in row, false);
    assert.equal(row.sults, true);
  });
});
