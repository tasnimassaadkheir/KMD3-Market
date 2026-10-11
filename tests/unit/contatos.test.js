// Unit tests: contact types ("Quem é") and the Contacts page data.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

const app = loadApp();
beforeEach(() => app.run(`leads = []; avulsos = []; tiposExtras = []; contatosForm = [];`));

describe("tiposContato() / registrarTipo() — the 'Quem é' options", () => {
  test("starts with the 5 fixed types", () => {
    assert.deepEqual(app.json(`tiposContato()`), ["Síndico", "ADM", "Zelador", "Morador", "Gerente predial"]);
  });
  test("learns custom types from contacts in any card and from standalone contacts, A→Z, no duplicates", () => {
    app.run(`leads = [{contatos:[{nome:"A", tipo:"Porteiro"}, {nome:"B", tipo:"zelador"}]}, {contatos:[{nome:"C", tipo:"Faxineira"}]}];
             avulsos = [{nome:"D", tipo:"Advogado"}, {nome:"E", tipo:"porteiro"}];`);
    assert.deepEqual(app.json(`tiposContato()`),
      ["Síndico", "ADM", "Zelador", "Morador", "Gerente predial", "Advogado", "Faxineira", "Porteiro"]);
  });
  test("a new type typed in 'Outro' is available right away; an existing one keeps its spelling", () => {
    assert.equal(app.run(`registrarTipo("  Porteiro  noturno ")`), "Porteiro noturno");
    assert.ok(app.json(`tiposContato()`).includes("Porteiro noturno"));
    assert.equal(app.run(`registrarTipo("SINDICO")`), "Síndico", "matches ignoring accents and case");
    assert.equal(app.run(`registrarTipo("")`), "");
  });
  test("opcoesTipo() selects the current value and always ends with 'Outro…'", () => {
    const html = app.run(`opcoesTipo("Zelador")`);
    assert.match(html, /<option value="Zelador" selected>Zelador<\/option>/);
    assert.match(html, /<option value="__outro">Outro…<\/option>$/);
  });
});

describe("todosContatos() — rows of the Contacts page", () => {
  test("joins condo contacts and standalone ones, sorted by name", () => {
    app.run(`leads = [{id:"c1", nome:"Aurora", endereco:"Rua A", contatos:[{nome:"Paulo", telefone:"11999", tipo:"Síndico"}]},
                      {id:"c2", nome:"Mirante", sindico:"Bruna"}];
             avulsos = [{id:"x1", nome:"Ana", email:"ana@x.com", tipo:"Advogado"}];`);
    const rows = app.json(`todosContatos()`);
    assert.deepEqual(rows.map((r) => [r.nome, r.condominio || "Avulso", r.tipo]),
      [["Ana", "Avulso", "Advogado"], ["Bruna", "Mirante", "Síndico"], ["Paulo", "Aurora", "Síndico"]]);
    assert.equal(rows[2].leadId, "c1");
    assert.equal(rows[0].avulsoId, "x1");
  });
  test("skips completely empty contacts", () => {
    app.run(`leads = [{id:"c1", nome:"Aurora", contatos:[{nome:"", telefone:"", email:""}]}];`);
    assert.deepEqual(app.json(`todosContatos()`), []);
  });
});

describe("tabelaNaoExiste() — falls back to the browser only when the table is missing", () => {
  test("recognizes Supabase's 'table not found' errors", () => {
    assert.equal(app.run(`tabelaNaoExiste({code:"PGRST205", message:"Could not find the table 'public.contatos_avulsos' in the schema cache"})`), true);
    assert.equal(app.run(`tabelaNaoExiste({code:"42P01", message:"relation \\"public.contatos_avulsos\\" does not exist"})`), true);
  });
  test("other errors (network, permission) are not treated as a missing table", () => {
    assert.equal(app.run(`tabelaNaoExiste({code:"42501", message:"new row violates row-level security policy"})`), false);
    assert.equal(app.run(`tabelaNaoExiste({message:"Failed to fetch"})`), false);
    assert.equal(app.run(`tabelaNaoExiste(null)`), false);
  });
});
