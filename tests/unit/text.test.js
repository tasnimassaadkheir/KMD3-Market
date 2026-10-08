// Unit tests: text helpers (security escaping, name normalization, duplicate detection, WhatsApp links).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

const app = loadApp();

describe("escapar() — protects against HTML/script injection (XSS)", () => {
  test("escapes the 5 dangerous HTML characters", () => {
    assert.equal(app.run(`escapar("<b>\\"Tom & Jerry's\\"</b>")`),
      "&lt;b&gt;&quot;Tom &amp; Jerry&#39;s&quot;&lt;/b&gt;");
  });
  test("neutralizes a script tag typed into a field", () => {
    const out = app.run(`escapar("<img src=x onerror=alert(1)>")`);
    assert.ok(!out.includes("<"), "no raw < may survive");
    assert.ok(!out.includes(">"), "no raw > may survive");
  });
  test("handles null / undefined / numbers safely", () => {
    assert.equal(app.run(`escapar(null)`), "");
    assert.equal(app.run(`escapar(undefined)`), "");
    assert.equal(app.run(`escapar(120)`), "120");
  });
});

describe("normalizarNome() — makes names comparable", () => {
  test("removes accents, lowercases, trims and collapses spaces", () => {
    assert.equal(app.run(`normalizarNome("  Condomínio   ÁGUA  Branca ")`), "condominio agua branca");
  });
  test("returns an empty string for empty input", () => {
    assert.equal(app.run(`normalizarNome(null)`), "");
  });
});

describe("palavrasNome() / palavrasCombinam() — duplicate-name detection", () => {
  test("ignores the word 'condomínio' and small words like 'de', 'das', 'do'", () => {
    assert.deepEqual(app.json(`palavrasNome("Condomínio Jardim das Flores")`), ["jardim", "flores"]);
  });
  test("ignores 1-letter words", () => {
    assert.deepEqual(app.json(`palavrasNome("Torre A Norte")`), ["torre", "norte"]);
  });
  test("matches when one word starts with the other (min. 3 letters)", () => {
    assert.equal(app.run(`palavrasCombinam("jard", "jardim")`), true);
    assert.equal(app.run(`palavrasCombinam("jardim", "jard")`), true);
  });
  test("does not match very short prefixes or different words", () => {
    assert.equal(app.run(`palavrasCombinam("ja", "jardim")`), false);
    assert.equal(app.run(`palavrasCombinam("bosque", "jardim")`), false);
  });
});

describe("whatsappLink() — builds wa.me links from Brazilian phone numbers", () => {
  test("adds Brazil's country code (55) to an 11-digit mobile number", () => {
    assert.equal(app.run(`whatsappLink("(11) 99999-0000")`), "https://wa.me/5511999990000");
  });
  test("adds 55 to a 10-digit landline", () => {
    assert.equal(app.run(`whatsappLink("11 3333-4444")`), "https://wa.me/551133334444");
  });
  test("keeps a number that already has the country code", () => {
    assert.equal(app.run(`whatsappLink("+55 11 99999-0000")`), "https://wa.me/5511999990000");
  });
  test("returns null for numbers that are too short or empty", () => {
    assert.equal(app.run(`whatsappLink("1234")`), null);
    assert.equal(app.run(`whatsappLink("")`), null);
  });
});
