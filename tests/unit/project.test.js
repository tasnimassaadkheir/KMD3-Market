// Static checks on the project files: wiring between HTML/CSS/JS and basic security.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { ROOT } = require("../helpers/load-app");

const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const html = read("index.html").replace(/<!--[\s\S]*?-->/g, ""); // ignore HTML comments
const stripComments = (js) => js.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
const js = stripComments(read("app.js")) + "\n" + stripComments(read("mapa.js"));

describe("index.html wiring", () => {
  test("links the stylesheet", () => {
    assert.match(html, /<link rel="stylesheet" href="style\.css">/);
  });
  test("loads the scripts in the required order: config -> app -> mapa", () => {
    const order = ["config.js", "app.js", "mapa.js"].map((f) => html.indexOf(`<script src="${f}">`));
    order.forEach((pos, i) => assert.ok(pos > -1, `script ${i} missing`));
    assert.ok(order[0] < order[1] && order[1] < order[2], "wrong script order");
  });
  test("every referenced local file exists", () => {
    for (const f of ["style.css", "config.js", "app.js", "mapa.js"]) {
      assert.ok(fs.existsSync(path.join(ROOT, f)), `${f} is missing`);
    }
  });
  test("every element id used by the JavaScript exists in the HTML (or is created by the JS)", () => {
    const used = new Set([...js.matchAll(/\$m?\("#([\w-]+)"\)/g)].map((m) => m[1]));
    const inHtml = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
    const createdByJs = new Set([...js.matchAll(/id=\\?['"]([\w-]+)/g)].map((m) => m[1]));
    const missing = [...used].filter((id) => !inHtml.has(id) && !createdByJs.has(id));
    assert.deepEqual(missing, [], `ids used in JS but not found: ${missing.join(", ")}`);
  });
  test("no duplicate ids in the HTML", () => {
    const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert.deepEqual(dup, []);
  });
});

describe("security", () => {
  const config = read("config.js");
  test("config.js only contains a PUBLISHABLE key, never a secret/service key", () => {
    assert.ok(!/sb_secret_/.test(config), "a Supabase SECRET key must never be in the browser");
    assert.ok(!/service_role/.test(config), "a service_role key must never be in the browser");
  });
  test("the Supabase URL uses HTTPS (or is empty for local mode)", () => {
    const url = (config.match(/SUPABASE_URL\s*=\s*"([^"]*)"/) || [])[1];
    assert.ok(url === "" || url.startsWith("https://"), `unexpected URL: ${url}`);
  });
});

describe("JavaScript syntax", () => {
  for (const f of ["config.js", "app.js", "mapa.js"]) {
    test(`${f} parses without syntax errors`, () => {
      assert.doesNotThrow(() => new Function(read(f)));
    });
  }
});
