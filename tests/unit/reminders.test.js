// Unit tests: reminders (lembretes). "Now" is frozen at 5 Oct 2026 12:00 (São Paulo).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

const app = loadApp();

describe("classeLembrete() — reminder state", () => {
  test("done reminders are 'feito' even if their date passed", () => {
    assert.equal(app.run(`classeLembrete({quando:"2026-09-01T10:00", feito:true})`), "feito");
  });
  test("a past reminder is 'atrasado' (overdue)", () => {
    assert.equal(app.run(`classeLembrete({quando:"2026-10-05T09:00"})`), "atrasado");
  });
  test("later today is 'hoje'", () => {
    assert.equal(app.run(`classeLembrete({quando:"2026-10-05T17:00"})`), "hoje");
  });
  test("a future day is 'proximo' (upcoming)", () => {
    assert.equal(app.run(`classeLembrete({quando:"2026-10-08T09:00"})`), "proximo");
  });
});

describe("quandoCurto() — short description of when", () => {
  test("today / tomorrow / other days", () => {
    assert.equal(app.run(`quandoCurto({quando:"2026-10-05T17:00"})`), "hoje 17:00");
    assert.equal(app.run(`quandoCurto({quando:"2026-10-06T09:00"})`), "amanhã 09:00");
    assert.equal(app.run(`quandoCurto({quando:"2026-10-20T14:30"})`), "20/10 14:30");
  });
  test("handles a missing date", () => {
    assert.equal(app.run(`quandoCurto({quando:""})`), "sem data");
  });
});

describe("lembreteVencido() / proximoLembrete() — card-level reminder logic", () => {
  const lead = `({lembretes:[
    {id:"a", quando:"2026-10-10T10:00", texto:"later"},
    {id:"b", quando:"2026-10-07T10:00", texto:"sooner"},
    {id:"c", quando:"2026-10-01T10:00", texto:"old but done", feito:true}
  ]})`;
  test("a condo with only future or done reminders is NOT overdue", () => {
    assert.equal(app.run(`lembreteVencido(${lead})`), false);
  });
  test("one open past reminder makes the condo overdue (card turns red)", () => {
    assert.equal(app.run(`lembreteVencido({lembretes:[{quando:"2026-10-04T10:00"}]})`), true);
  });
  test("next reminder = earliest open one, ignoring done ones", () => {
    assert.equal(app.run(`proximoLembrete(${lead}).id`), "b");
  });
  test("returns null when nothing is open", () => {
    assert.equal(app.run(`proximoLembrete({lembretes:[]})`), null);
    assert.equal(app.run(`proximoLembrete({})`), null);
  });
});

describe("calendar export", () => {
  test("escICS() escapes characters that would break an .ics file", () => {
    assert.equal(app.run(`escICS("a,b;c\\nd\\\\e")`), "a\\,b\\;c\\nd\\\\e");
  });
  test("linkGoogleAgenda() builds a 30-minute Google Calendar event", () => {
    const url = new URL(app.run(`linkGoogleAgenda(
      {nome:"Edifício Aurora", endereco:"Rua A, 10"},
      {quando:"2026-10-06T09:00", texto:"Ligar para o síndico"})`));
    assert.equal(url.hostname, "calendar.google.com");
    assert.equal(url.searchParams.get("action"), "TEMPLATE");
    assert.equal(url.searchParams.get("dates"), "20261006T090000/20261006T093000");
    assert.match(url.searchParams.get("text"), /Edifício Aurora — Ligar para o síndico/);
    assert.equal(url.searchParams.get("location"), "Rua A, 10");
  });
  test("linkGoogleAgenda() returns '#' for an invalid date", () => {
    assert.equal(app.run(`linkGoogleAgenda({}, {quando:"x"})`), "#");
  });
});
