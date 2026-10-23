// =============================================================================
// Fake Supabase client (test double), served in place of the supabase-js SDK.
// -----------------------------------------------------------------------------
// Lets the E2E tests run the app in CLOUD mode without a real database.
// Every query is sent to the test (Node) through window.__fakeDb (a Playwright
// binding), where ONE shared in-memory database lives. So two browser windows
// (e.g. "laptop" and "phone") logged in as the same person see the same data,
// and a change in one reaches the other through the fake Realtime
// (window.__fakeEmit, called by the test after every write).
// Only what the app uses is implemented: from().select/insert/upsert/update/delete
// with eq/neq/lt/gte/lte/in/order/range/limit/maybeSingle/single, rpc, auth, channel.
// =============================================================================
(function () {
  const ouvintes = [];   // [{tabela, cb}]
  window.__fakeEmit = (tabela) => ouvintes.filter((o) => o.tabela === tabela).forEach((o) => { try { o.cb({}); } catch (e) {} });

  function consulta(tabela) {
    const q = { tabela, op: "select", filtros: [], linhas: null, valores: null, onConflict: null, unico: null, comRetorno: false };
    const api = {
      select() { if (q.op !== "select") q.comRetorno = true; return api; },
      insert(linhas) { q.op = "insert"; q.linhas = [].concat(linhas); return api; },
      upsert(linhas, o) { q.op = "upsert"; q.linhas = [].concat(linhas); q.onConflict = (o && o.onConflict) || null; return api; },
      update(valores) { q.op = "update"; q.valores = valores; return api; },
      delete() { q.op = "delete"; return api; },
      eq(c, v) { q.filtros.push(["eq", c, v]); return api; },
      neq(c, v) { q.filtros.push(["neq", c, v]); return api; },
      lt(c, v) { q.filtros.push(["lt", c, v]); return api; },
      gte(c, v) { q.filtros.push(["gte", c, v]); return api; },
      lte(c, v) { q.filtros.push(["lte", c, v]); return api; },
      in(c, v) { q.filtros.push(["in", c, v]); return api; },
      ilike() { return api; }, order() { return api; }, range() { return api; }, limit() { return api; },
      maybeSingle() { q.unico = "talvez"; return api; },
      single() { q.unico = "um"; return api; },
      then(ok, falha) { return window.__fakeDb(q).then(ok, falha); },
    };
    return api;
  }
  window.supabase = {
    createClient() {
      return {
        from: consulta,
        // "posso" (can I?): yes, unless the test made this user read-only (window.__fakeLeitor); never an admin
        // window.__fakeRpc = {nome: data} answers other functions (e.g. sou_admin, admin_membros) for admin tests.
        rpc: async (nome) => {
          if (window.__fakeRpc && nome in window.__fakeRpc) return { data: window.__fakeRpc[nome], error: null };
          return { data: nome === "posso" ? !window.__fakeLeitor : false, error: null };
        },
        auth: {
          getSession: async () => ({ data: { session: window.__fakeSessao || null } }),
          signInWithPassword: async () => ({ data: { session: window.__fakeSessao }, error: null }),
          signOut: async () => ({ error: null }),
          // password change / reset: recorded in the test's database (table "_auth"); window.__fakeAuthErro forces an error
          updateUser: async (o) => {
            if (window.__fakeAuthErro) return { data: null, error: { message: window.__fakeAuthErro } };
            await window.__fakeDb({ tabela: "_auth", op: "insert", linhas: [{ acao: "updateUser", ...o }], filtros: [] });
            return { data: { user: window.__fakeSessao && window.__fakeSessao.user }, error: null };
          },
          resetPasswordForEmail: async (email, o) => {
            await window.__fakeDb({ tabela: "_auth", op: "insert", linhas: [{ acao: "reset", email, redirectTo: o && o.redirectTo }], filtros: [] });
            return { data: {}, error: null };
          },
          // window.__fakeRecuperacao = true -> fires PASSWORD_RECOVERY (like opening the e-mail's reset link)
          onAuthStateChange: (cb) => { if (window.__fakeRecuperacao) setTimeout(() => cb("PASSWORD_RECOVERY", window.__fakeSessao), 50);
            return { data: { subscription: { unsubscribe() {} } } }; },
        },
        // Edge Functions: answered by the test through window.__fakeFn (a Playwright binding) -> {status, json}.
        // Like supabase-js, a non-2xx answer becomes error.context = the Response.
        functions: {
          invoke: async (nome, o) => {
            const r = window.__fakeFn ? await window.__fakeFn(nome, (o && o.body) || {}) : { status: 404, json: { message: "Requested function was not found" } };
            if (r.status >= 200 && r.status < 300) return { data: r.json, error: null };
            return { data: null, error: { name: "FunctionsHttpError", message: "Edge Function returned a non-2xx status code",
              context: new Response(JSON.stringify(r.json), { status: r.status, headers: { "Content-Type": "application/json" } }) } };
          },
        },
        channel() {
          const ch = {
            on(_ev, filtro, cb) { ouvintes.push({ tabela: filtro && filtro.table, cb }); return ch; },
            subscribe() { return ch; },
          };
          return ch;
        },
      };
    },
  };
})();
