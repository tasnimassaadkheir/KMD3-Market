// =============================================================================
// KMD3 Market — main application logic (app.js)
// -----------------------------------------------------------------------------
// This file makes the page work: it loads the condos ("leads") from the
// database, draws the Kanban board, opens the edit panel, saves changes,
// handles reminders, the team list, login, and the admin screen.
//
// Quick vocabulary (the code uses Portuguese names):
//   lead / condomínio = a condo you are trying to sell to (one card)
//   fase       = funnel stage (one column)       quadro    = the board
//   desenhar   = draw / render                   painel    = side panel
//   salvar     = save        excluir = delete    buscar    = fetch
//   equipe     = team        lembrete = reminder observação = note
//   responsável = person in charge of the lead   pendentes = not yet saved
//
// Where data lives:
//   - "Cloud mode": in a Supabase database (shared by everyone).
//   - "Local mode": only in this browser (localStorage), if no keys are set.
//   The keys come from config.js, which must be loaded BEFORE this file.
// =============================================================================
//
// ---------- CONSTANTS ----------
// FASES = the funnel stages, in order. Each one becomes a column on the board.
// "id" is what gets saved in the database; "nome" is what the user sees.
const FASES = [
  {id:"concorrencia", nome:"Possui Concorrência"},
  {id:"futura",    nome:"Futura Prospecção"},
  {id:"cadastro",  nome:"Cadastro de Oportunidade"},
  {id:"contato",   nome:"Contato Realizado"},
  {id:"reuniao",   nome:"Reunião"},
  {id:"proposta",  nome:"Proposta Comercial"},
  {id:"assembleia",nome:"Assembleia"},
  {id:"contrato",  nome:"Assinatura de Contrato"}
];
// Human-readable labels for each status value (verde = green = closed, etc.).
const ROTULO_STATUS = {verde:"Fechado", amarelo:"Em andamento", vermelho:"Perdido", nenhum:"Sem situação"};
// Keys (names) used to store data in the browser's localStorage.
// localStorage is a small key/value storage that survives page reloads.
const CHAVE_LEADS = "quitandinha:condominios";
const CHAVE_EQUIPE = "quitandinha:equipe";
const CHAVE_PENDENTES = "quitandinha:pendentes";
const CHAVE_INVERTIDAS = "quitandinha:colunasInvertidas";
const CHAVE_LEMBRETES = "quitandinha:lembretes";
// Optional true/false columns on a condo:
//   sults   = green SULTS mark (green "S" badge next to who edited last)
//   visitar = "to visit" mark (small car badge on the card's corner)
//   quente  = hot contact (orange flame next to the condo's name on the card)
// If the database doesn't have one of these columns yet, the app keeps working:
// the flag is kept in this browser under 'chave' and the 'aviso' warning is shown once.
const FLAGS = {
  sults:   {chave:"quitandinha:sults",   aviso:"A marcação SULTS fica só neste aparelho até criar a coluna no Supabase (veja database/schema.sql)."},
  visitar: {chave:"quitandinha:visitar", aviso:"A marcação Visitar fica só neste aparelho até criar a coluna no Supabase (veja database/schema.sql)."},
  quente:  {chave:"quitandinha:quente",  aviso:"A marcação Contato quente fica só neste aparelho até criar a coluna no Supabase (veja database/schema.sql)."}
};

// Which columns the user has reversed (e.g. {reuniao:true}).
// Read from localStorage at startup; try/catch protects against corrupted data.
let colunasInvertidas = {};
try{ colunasInvertidas = JSON.parse(localStorage.getItem(CHAVE_INVERTIDAS) || "{}"); }catch(e){ colunasInvertidas = {}; }
// Saves the 'reversed columns' choice in localStorage so it is remembered next time.
function salvarColunasInvertidas(){
  try{ localStorage.setItem(CHAVE_INVERTIDAS, JSON.stringify(colunasInvertidas)); }catch(e){}
}

// ---------- OFFLINE QUEUE ----------
// pendentes   = condos changed locally but not yet sent to the database (Map: id -> condo).
// paraExcluir = ids of condos deleted locally but not yet deleted in the database.
const pendentes = new Map();   // alterações que ainda não chegaram ao banco
const paraExcluir = new Set(); // exclusões que ainda não chegaram ao banco
// sincronizando = true while a save is in progress; ultimaSync = time of the last successful save.
let sincronizando = false, ultimaSync = null;

// ---------- GLOBAL STATE ----------
// NUVEM (cloud) = true when both Supabase keys exist -> cloud mode. Otherwise local mode.
const NUVEM = Boolean(SUPABASE_URL && SUPABASE_KEY);
// sb = Supabase client, sessao = login session, meuNome = name of the logged-in person.
let sb = null, sessao = null, meuNome = "";
// leads = all condos currently loaded, equipe = the team list.
let leads = [], equipe = [];

/* ---- permissões da pessoa logada (vêm do banco; sem nuvem, tudo liberado) ---- */
// Permissions of the logged-in user: can they create / edit / delete?
// They start as 'true' and are replaced by the real values from the database after login.
const perm = {criar:true, editar:true, excluir:true};
// Text used in the 'you don't have permission to ...' message.
const ACOES = {criar:"criar condomínios", editar:"editar condomínios", excluir:"excluir condomínios"};
// Shows the 'permission denied' message for an action.
function negar(acao){ avisar("Você não tem permissão para "+ACOES[acao]+". Fale com um administrador.", true); }
// READ-ONLY MODE (role "leitor": can see everything, can't create, edit or delete anything).
// Buttons that change data are hidden (style.css, body.somente-leitura), the condo panel's fields
// are locked, and every function that writes checks bloqueado() too.
let somenteLeitura = false;
function aplicarModoLeitura(){
  somenteLeitura = NUVEM && !perm.criar && !perm.editar && !perm.excluir;
  document.body.classList.toggle("somente-leitura", somenteLeitura);
  $("#btnCancelar").textContent = somenteLeitura ? "Fechar" : "Cancelar";
  travarPainel();
}
// Locks every field of the condo panel (text can still be selected and copied).
function travarPainel(){
  if(!somenteLeitura) return;
  document.querySelectorAll("#painel input, #painel select, #painel textarea").forEach(el => {
    if(el.matches("select, input[type=checkbox], input[type=radio], input[type=date], input[type=time]")) el.disabled = true;
    else el.readOnly = true;
  });
}
// true (with a message) when the user is read-only: used at the start of functions that write.
function bloqueado(){
  if(!somenteLeitura) return false;
  avisar("Seu acesso é só de leitura.", true);
  return true;
}
// Asks the database what the current user is allowed to do.
// sb.rpc("posso", {acao}) calls a database function named "posso" ("can I?").
// Promise.all runs the 3 questions at the same time and waits for all answers.
async function carregarPermissoes(){
  if(!NUVEM) return;
  try{
    const acoes = ["criar","editar","excluir"];
    const r = await Promise.all(acoes.map(a => sb.rpc("posso",{acao:a})));
    acoes.forEach((a,i) => { perm[a] = r[i].error ? true : !!r[i].data; });   // se a consulta falhar, o banco continua barrando
  }catch(e){}
  aplicarModoLeitura();
}
// ---------- PANEL / FORM STATE ----------
// editandoId   = id of the condo open in the panel (null = creating a new one)
// arrastandoId = id of the card currently being dragged
// The *Form arrays hold the panel's notes, reminders and contacts while you edit,
// before you click Salvar (save).
let editandoId = null, arrastandoId = null;
let observacoesForm = [];
let lembretesForm = [];
let obsEditandoIndex = null;
let contatosForm = [];
// SULTS toggle in the panel: true/false while editing, saved with the condo on "Salvar".
let sultsForm = false, quenteForm = false;

// ---------- SMALL HELPER FUNCTIONS ----------
// $("#id") = shortcut for document.querySelector: finds an element on the page.
const $ = s => document.querySelector(s);
// agora() = 'now' as an ISO text, e.g. "2026-10-05T14:30:00.000Z".
const agora = () => new Date().toISOString();
// Creates a unique-enough id like "c_lq3k9a8xyz" (time + random letters).
// "1 lembrete" / "3 lembretes": real singular and plural instead of "lembrete(s)".
const plural = (n, um, varios) => Number(n).toLocaleString("pt-BR") + " " + (Number(n) === 1 ? um : varios);
// Small line icons (same style as the side menu), used inside text.
const ICONE_SINO = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>';
const ICONE_PIN = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 0114 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
const gerarId = () => "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2,7);

// Formats a date the Brazilian way: 05/10/2026. Returns "—" if empty/invalid.
function dataBR(iso){ if(!iso) return "—"; const d=new Date(iso); return isNaN(d)?"—":d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"}); }
// Same as dataBR but with time: "05/10/2026 às 14:30".
function dataHoraBR(iso){ if(!iso) return "—"; const d=new Date(iso); if(isNaN(d)) return "—";
  return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"})+" às "+
    d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}); }
// How many whole days have passed since a date (86400000 ms = 1 day).
function diasDesde(iso){ return iso ? Math.floor((Date.now()-new Date(iso).getTime())/86400000) : null; }
// Finds the most recent note of a condo (considering edits too)
// and returns {quando: when, por: who}. Used for the 'Atualizado ...' line on cards.
function ultimaObservacao(l){
  const lista = (l.observacoes && l.observacoes.length) ? l.observacoes : migrarNotasAntigas(l);
  if(!lista.length) return null;
  let melhor = null;
  lista.forEach(o=>{
    const quando = o.editadoQuando || o.quando;
    const por = o.editadoQuando ? (o.editadoPor||o.por) : o.por;
    if(!quando) return;
    if(!melhor || new Date(quando) > new Date(melhor.quando)) melhor = {quando, por};
  });
  return melhor;
}
// Turns a number of days into text: 'hoje', 'ontem', 'há 5 dias'.
function textoDias(n){ if(n===null) return "—"; if(n<=0) return "hoje"; if(n===1) return "ontem"; return "há "+n+" dias"; }
// IMPORTANT for security: replaces < > & " ' with safe codes before putting user text into HTML.
// Without this, someone could type HTML/JavaScript into a field and it would run on other people's screens.
function escapar(s){ return String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
// Shows a toast message at the bottom of the screen for 2.4s (5.5s if it's an error).
// el._t stores the timer so a new message cancels the old timer.
function avisar(msg, erro){ const el=$("#aviso"); el.textContent=msg; el.classList.toggle("erro",!!erro); el.classList.add("on"); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove("on"), erro?5500:2400); }

// Simplifies text for comparisons: removes accents (NFD + regex), lowercase,
// trims and collapses multiple spaces. "  Condomínio  Água " -> "condominio agua".
function normalizarNome(s){
  return String(s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().trim().replace(/\s+/g," ");
}
// Small words ignored when comparing condo names (de, da, do, condominio...).
const PALAVRAS_IGNORADAS = new Set(["de","da","do","das","dos","e","a","o","em","no","na","um","uma","condominio"]);
// Splits a name into meaningful words (2+ letters, not in the ignored list).
function palavrasNome(s){
  return normalizarNome(s).split(" ").filter(p => p.length>=2 && !PALAVRAS_IGNORADAS.has(p));
}
// Two words 'match' if one starts with the other (min. 3 letters).
function palavrasCombinam(pAlvo, pExistente){
  // Considera correspondência mesmo com o nome ainda incompleto:
  // "gran" já combina com "granada" (e vice-versa).
  return pAlvo.length>=3 && pExistente.startsWith(pAlvo) ||
         pExistente.length>=3 && pAlvo.startsWith(pExistente);
}
// DUPLICATE CHECK: runs every time you type in the 'name' field.
// Looks for existing condos with a similar name and shows them in a dropdown,
// so the team doesn't register the same condo twice.
function verificarNomeDuplicado(){
  const box = $("#avisoNomeDuplicado");
  const bruto = $("#f_nome").value;
  const alvo = normalizarNome(bruto);
  const palavrasAlvo = palavrasNome(bruto);
  // Se o usuário fechou o aviso manualmente, não reabrir enquanto ele
  // continuar digitando o mesmo nome (ou uma continuação dele).
  if(box.dataset.fechadoPara && alvo.startsWith(box.dataset.fechadoPara)){
    return;
  }
  if(!alvo || !palavrasAlvo.length){ box.hidden = true; box.innerHTML=""; delete box.dataset.fechadoPara; return; }
  // Go through all condos (skipping the one being edited) and collect the similar ones.
  const achados = [];
  leads.forEach(l=>{
    if(editandoId && l.id === editandoId) return;
    const nomeL = normalizarNome(l.nome);
    if(!nomeL) return;
    const palavrasL = palavrasNome(l.nome);
    const temPalavraComum = palavrasAlvo.some(p => palavrasL.some(pl => palavrasCombinam(p, pl)));
    if(nomeL === alvo || nomeL.startsWith(alvo) || temPalavraComum) achados.push(l);
  });
  if(!achados.length){ box.hidden = true; box.innerHTML=""; delete box.dataset.fechadoPara; return; }
  // Build the dropdown HTML (max 8 results) and show it.
  box.innerHTML = "<div class='dd-cabeca'><div class='dd-titulo'>Condomínios já cadastrados com nome parecido</div>"+
    "<button type='button' class='dd-fechar' id='fecharAvisoNomeDuplicado' aria-label='Fechar aviso'>✕</button></div><ul>"+
    achados.slice(0,8).map(l=>"<li><span class='dd-nome'>"+escapar(l.nome||"Condomínio sem nome")+"</span>"+
      (l.endereco ? "<span class='dd-end'>"+escapar(l.endereco)+"</span>" : "")+"</li>").join("")+
    "</ul>";
  box.hidden = false;
  // Close button: hide it and remember which text it was closed for.
  $("#fecharAvisoNomeDuplicado").addEventListener("click", ()=>{
    box.hidden = true;
    box.dataset.fechadoPara = alvo;
  });
}

/* ================= camada de dados ================= */
// =============================================================================
// DATA LAYER: converting, loading and saving condos
// =============================================================================
// Becomes true if the database table doesn't have a "lembretes" (reminders) column yet.
let SEM_COLUNA_LEMBRETES = false;   // vira true se o banco ainda não tem a coluna "lembretes"
// Names of the FLAGS whose column is missing in the database (e.g. "visitar").
const SEM_COLUNA_FLAG = new Set();
// paraBanco = "to database": converts a condo from the app format (camelCase, e.g. fimContrato)
// to the database column format (snake_case, e.g. fim_contrato). Empty values become null.
function paraBanco(l){
  const o = {
    id:l.id, nome:l.nome||null, endereco:l.endereco||null,
    aptos:l.aptos===""||l.aptos==null?null:parseInt(l.aptos,10),
    fase:l.fase||"cadastro", status:l.status||"nenhum", ordem:l.ordem??0,
    zona:l.zona||null, importante:l.importante||null,
    contatos:l.contatos||[], concorrente:l.concorrente||null,
    // limpa as colunas antigas (síndico/administradora) para que um contato
    // apagado não volte a aparecer reconstruído a partir delas
    sindico:null, sindico_tel:null, sindico_email:null,
    admin_nome:null, admin_contato:null, admin_tel:null, admin_email:null,
    fim_contrato:l.fimContrato||null, perfil:l.perfil||null, notas:l.notas||null,
    responsavel:l.responsavel||null, criado_por:l.criadoPor||null,
    criado_em:l.criadoEm, atualizado_em:l.atualizadoEm, historico:l.historico||[],
    observacoes:l.observacoes||[]
  };
  if(!SEM_COLUNA_LEMBRETES) o.lembretes = l.lembretes||[];
  Object.keys(FLAGS).forEach(f => { if(!SEM_COLUNA_FLAG.has(f)) o[f] = !!l[f]; });
  return o;
}
// doBanco = "from database": the opposite of paraBanco. Converts a database row
// into the format the app uses, filling missing values with "" or defaults.
function doBanco(r){
  return {
    id:r.id, nome:r.nome||"", endereco:r.endereco||"", aptos:r.aptos??"",
    fase:r.fase||"cadastro", status:r.status||"nenhum", ordem:r.ordem??0,
    zona:r.zona||"", importante:r.importante||"",
    contatos:r.contatos||[],
    // colunas antigas: mantidas só para migrar automaticamente condomínios cadastrados antes da unificação
    sindico:r.sindico||"", sindicoTel:r.sindico_tel||"", sindicoEmail:r.sindico_email||"",
    admin:r.admin_nome||"", adminContato:r.admin_contato||"", adminTel:r.admin_tel||"",
    adminEmail:r.admin_email||"", concorrente:r.concorrente||"", fimContrato:r.fim_contrato||"",
    perfil:r.perfil||"", notas:r.notas||"", responsavel:r.responsavel||"",
    criadoPor:r.criado_por||"", criadoEm:r.criado_em, atualizadoEm:r.atualizado_em,
    historico:r.historico||[], observacoes:r.observacoes||[],
    lembretes:Array.isArray(r.lembretes) ? r.lembretes : undefined,
    // flags: undefined when the column doesn't exist (then the browser backup is used)
    sults:typeof r.sults === "boolean" ? r.sults : undefined,
    visitar:typeof r.visitar === "boolean" ? r.visitar : undefined,
    quente:typeof r.quente === "boolean" ? r.quente : undefined
  };
}

/* guarda local: usa window.storage dentro do Claude e localStorage na Vercel */
// Reads a value from local storage. window.storage exists when the app runs inside Claude;
// on the real website (Vercel) it uses the browser's localStorage. Returns 'padrao' (default) if nothing is saved.
async function localGet(chave, padrao){
  try{ if(window.storage){ const r = await window.storage.get(chave); if(r) return JSON.parse(r.value); } }catch(e){}
  try{ const v = localStorage.getItem(chave); if(v) return JSON.parse(v); }catch(e){}
  return padrao;
}
// Writes a value to local storage (as JSON text). Returns true if it worked.
async function localSet(chave, valor){
  try{ if(window.storage){ await window.storage.set(chave, JSON.stringify(valor)); return true; } }catch(e){}
  try{ localStorage.setItem(chave, JSON.stringify(valor)); return true; }catch(e){}
  return false;
}

// Loads everything: condos + team.
// Cloud mode: two database queries at the same time (Promise.all), condos sorted by 'ordem' (position).
// Local mode: reads from localStorage.
async function buscarTudo(){
  if(NUVEM){
    const [c,e] = await Promise.all([
      sb.from("condominios").select("*").order("ordem",{ascending:true}),
      sb.from("equipe").select("*").order("nome",{ascending:true})
    ]);
    if(c.error) throw c.error;
    leads = (c.data||[]).map(doBanco);
    equipe = e.error ? [] : (e.data||[]);
    if(c.data && c.data.length && !("lembretes" in c.data[0])) SEM_COLUNA_LEMBRETES = true;
    if(c.data && c.data.length) Object.keys(FLAGS).forEach(f => { if(!(f in c.data[0])) SEM_COLUNA_FLAG.add(f); });
  } else {
    leads = await localGet(CHAVE_LEADS, []);
    equipe = await localGet(CHAVE_EQUIPE, []);
  }
  // If the database has no reminders column, use the reminders saved locally in this browser.
  const cacheLem = await localGet(CHAVE_LEMBRETES, {});
  leads.forEach(l => { if(l.lembretes === undefined) l.lembretes = cacheLem[l.id] || []; });
  // Same for the flags (SULTS, Visitar).
  for(const f of Object.keys(FLAGS)){
    const cache = await localGet(FLAGS[f].chave, {});
    leads.forEach(l => { if(l[f] === undefined) l[f] = !!cache[l.id]; });
  }
}
/* ---- fila de pendências: nada se perde se a internet cair ---- */
// Saves the offline queue (and a backup copy of all condos and reminders) in local storage,
// so nothing is lost if the internet drops or the page is closed.
async function guardarPendencias(){
  await localSet(CHAVE_PENDENTES, {enviar:[...pendentes.values()], excluir:[...paraExcluir]});
  await localSet(CHAVE_LEADS, leads);            // cópia de segurança sempre
  const mapaLem = {}; leads.forEach(l => { if((l.lembretes||[]).length) mapaLem[l.id] = l.lembretes; });
  await localSet(CHAVE_LEMBRETES, mapaLem);
  for(const f of Object.keys(FLAGS)){
    const mapa = {}; leads.forEach(l => { if(l[f]) mapa[l.id] = true; });
    await localSet(FLAGS[f].chave, mapa);
  }
  atualizarBotaoSync();
}
// At startup: reloads the offline queue saved by guardarPendencias().
async function carregarPendencias(){
  const p = await localGet(CHAVE_PENDENTES, {enviar:[], excluir:[]});
  (p.enviar||[]).forEach(l => pendentes.set(l.id, l));
  (p.excluir||[]).forEach(id => paraExcluir.add(id));
  atualizarBotaoSync();
}
// Adds condos to the 'to be sent' queue.
function enfileirar(lista){
  lista.forEach(l => pendentes.set(l.id, l));
}

// Save ONE condo: queue it, back it up locally, then try to send it to the database.
// Returns false if the database refused (no permission).
async function gravarLead(l){
  enfileirar([l]);
  await guardarPendencias();
  return await sincronizar(false);
}
// Same as gravarLead, but for several condos at once (used when reordering cards).
async function gravarVarios(lista){
  enfileirar(lista);
  await guardarPendencias();
  return await sincronizar(false);
}
// Delete a condo: remove it from the send queue and add it to the delete queue.
async function apagarLead(id){
  pendentes.delete(id);
  paraExcluir.add(id);
  await guardarPendencias();
  return await sincronizar(false);
}

/* ---- envia tudo o que está pendente e busca o que mudou ---- */
// SYNC: sends all pending changes/deletions to the database.
// manual = true when the user clicked the Sync button (then it also reloads and shows a message).
async function sincronizar(manual){
  if(!NUVEM){
    await localSet(CHAVE_LEADS, leads);
    pendentes.clear(); paraExcluir.clear();
    await guardarPendencias();
    ultimaSync = Date.now();
    atualizarBotaoSync();
    if(manual) avisar("Salvo neste navegador. Para as sócias verem, é preciso publicar com o Supabase.");
    return;
  }
  // Don't start a second sync while one is running; nothing to do if the queue is empty.
  if(sincronizando) return;
  if(!pendentes.size && !paraExcluir.size && !manual){ atualizarBotaoSync(); return; }

  sincronizando = true;
  atualizarBotaoSync();
  // 'fase' tracks which step we're in (save or delete) so we know what failed.
  let fase = "salvar", negou = null;
  try{
    if(pendentes.size){
      // upsert = insert new rows OR update existing ones (matched by id).
      // If it fails because the 'lembretes' column or a flag column (sults, visitar) doesn't exist,
      // retry without that column.
      const lote = [...pendentes.values()];
      let {error} = await sb.from("condominios").upsert(lote.map(paraBanco));
      if(error && /lembretes/i.test(error.message||"") && !SEM_COLUNA_LEMBRETES){
        SEM_COLUNA_LEMBRETES = true;
        avisar("Os lembretes ficam só neste aparelho até criar a coluna no Supabase (veja o SQL).", true);
        ({error} = await sb.from("condominios").upsert(lote.map(paraBanco)));
      }
      for(const f of Object.keys(FLAGS)){
        if(error && new RegExp(f, "i").test(error.message||"") && !SEM_COLUNA_FLAG.has(f)){
          SEM_COLUNA_FLAG.add(f);
          avisar(FLAGS[f].aviso, true);
          ({error} = await sb.from("condominios").upsert(lote.map(paraBanco)));
        }
      }
      if(error) throw error;
      lote.forEach(l => pendentes.delete(l.id));
    }
    // Now send the deletions.
    fase = "excluir";
    if(paraExcluir.size){
      const ids = [...paraExcluir];
      const {data, error} = await sb.from("condominios").delete().in("id", ids).select("id");
      if(error) throw error;
      // o banco não dá erro quando a permissão barra um DELETE: ele só apaga 0 linhas
      const apagados = new Set((data||[]).map(r => r.id));
      const faltam = ids.filter(id => !apagados.has(id));
      if(faltam.length){
        const r = await sb.from("condominios").select("id").in("id", faltam);
        if(!r.error && (r.data||[]).length) negou = "excluir condomínios";
      }
      paraExcluir.clear();
    }
    // Everything worked: remember the time and update the local backup.
    ultimaSync = Date.now();
    await guardarPendencias();
    if(manual && !negou){
      await buscarTudo();
      desenhar();
      avisar("Tudo salvo. As outras pessoas já veem esta versão.");
    }
  // Error handling. Code 42501 / 'row-level security' = the database refused because of permissions.
  // Any other error is treated as 'no internet': keep the queue and try again later.
  }catch(e){
    const recusado = e && (e.code === "42501" || /row-level security/i.test(e.message || ""));
    if(recusado){
      negou = fase === "salvar" ? "salvar estas alterações" : "excluir condomínios";
      if(fase === "salvar") pendentes.clear(); else paraExcluir.clear();   // não tentar de novo: seria recusado sempre
    } else {
      await guardarPendencias();
      avisar("Sem conexão com o banco. Guardei as alterações e tento de novo em instantes.");
    }
  // finally always runs (success or error): unlock syncing and refresh the button.
  }finally{
    sincronizando = false;
    atualizarBotaoSync();
  }
  // If something was refused, reload the real data from the database to undo it on screen.
  if(negou){
    try{ await guardarPendencias(); await buscarTudo(); desenhar(); }catch(_){}   // desfaz na tela o que o banco recusou
    avisar("Você não tem permissão para "+negou+". A alteração foi desfeita.", true);
    return false;
  }
}

// Updates the Sync button text/color: 'Salvando...', 'Salvar alterações (3)', 'Tudo salvo há 2 min', etc.
function atualizarBotaoSync(){
  const btn = $("#btnSync"), txt = $("#txtSync");
  if(!btn) return;
  const qtd = pendentes.size + paraExcluir.size;
  btn.classList.toggle("ocupado", sincronizando);
  btn.classList.toggle("pendente", qtd > 0 && !sincronizando);
  if(sincronizando){ txt.textContent = "Salvando..."; return; }
  if(qtd > 0){
    txt.innerHTML = "Salvar alterações <span class=\"contador\">"+qtd+"</span>";
    return;
  }
  if(!NUVEM){ txt.textContent = "Salvo neste navegador"; return; }
  if(!ultimaSync){ txt.textContent = "Sincronizar"; return; }
  const min = Math.floor((Date.now()-ultimaSync)/60000);
  txt.textContent = min < 1 ? "Tudo salvo agora" : "Tudo salvo há "+min+" min";
}
// Saves the team list locally (in cloud mode the team is saved directly in the database).
async function gravarEquipe(){
  if(!NUVEM) await localSet(CHAVE_EQUIPE, equipe);
}

/* ================= quadro ================= */
// =============================================================================
// BOARD (Kanban): filtering and drawing
// =============================================================================
// Checks if a creation date is inside the 'from'/'to' date filter.
// Dates are compared as "YYYY-MM-DD" text, which sorts correctly.
function dataNoIntervalo(criadoEm, de, ate){
  if(!de && !ate) return true;
  if(!criadoEm) return false;
  const d = new Date(criadoEm);
  if(isNaN(d)) return false;
  const diaCriado = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  if(de && diaCriado < de) return false;
  if(ate && diaCriado > ate) return false;
  return true;
}
// Returns only the condos that match the current filters:
// status, person responsible, date range and the search text (searched across many fields).
function filtrar(){
  const termo = $("#busca").value.trim().toLowerCase();
  const st = $("#filtroStatus").value, resp = $("#filtroResp").value;
  const dataDe = $("#filtroDataDe").value, dataAte = $("#filtroDataAte").value;
  $("#btnLimparData").hidden = !dataDe && !dataAte;
  return leads.filter(l => {
    if(st === "sults:sim"){ if(!l.sults) return false; }           // registered in SULTS
    else if(st === "sults:nao"){ if(l.sults) return false; }       // not in SULTS yet
    else if(st === "quente:sim"){ if(!l.quente) return false; }     // hot contacts
    else if(st === "quente:nao"){ if(l.quente) return false; }
    else if(st && (l.status||"nenhum") !== st) return false;
    if(resp && (l.responsavel||"") !== resp) return false;
    if(!dataNoIntervalo(l.criadoEm, dataDe, dataAte)) return false;
    if(!termo) return true;
    const textoContatos = (l.contatos||[]).map(c=>[c.nome,c.telefone,c.email,c.tipo].join(" ")).join(" ");
    return [l.nome,l.endereco,l.zona,l.importante,textoContatos,l.concorrente,l.perfil,l.notas,l.responsavel]
      .join(" ").toLowerCase().includes(termo);
  });
}

// DRAW THE BOARD. Called after almost every change.
// It deletes the board and rebuilds every column and card from the 'leads' array.
function desenhar(){
  atualizarFiltroResp();
  const visiveis = filtrar();
  const quadro = $("#quadro");

  /* guarda a posição de rolagem atual antes de reconstruir o quadro,
     senão tudo volta pro topo a cada vez que algo é salvo */
  const scrollQuadroX = quadro.scrollLeft;
  const scrollColunas = {};
  quadro.querySelectorAll(".lista[data-fase]").forEach(l => {
    scrollColunas[l.dataset.fase] = l.scrollTop;
  });

  quadro.innerHTML = "";

  // For each stage: get its condos, sort by 'ordem' (position), reverse if needed,
  // then build the column's HTML (header, counter, progress bar, card list, add button).
  FASES.forEach(fase => {
    const invertida = Boolean(colunasInvertidas[fase.id]);
    const daFase = visiveis.filter(l => (l.fase||"cadastro") === fase.id)
      .sort((a,b)=>(a.ordem??0)-(b.ordem??0));
    if(invertida) daFase.reverse();
    const col = document.createElement("section");
    col.className = "coluna"; col.dataset.fase = fase.id;
    col.innerHTML =
      '<div class="cabeca"><h2>'+escapar(fase.nome)+'</h2>'+
      '<button class="btn-inverter'+(invertida?" ativo":"")+'" data-inverter="'+fase.id+'" '+
      'title="Inverter ordem dos cartões" aria-label="Inverter ordem dos cartões">'+
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v11M3 10l4 4 4-4"/><path d="M17 21V10M13 14l4 4 4-4"/></svg>'+
      '</button>'+
      '<span class="contagem">'+daFase.length+'</span></div>'+
      '<div class="lista" data-fase="'+fase.id+'"></div>'+
      '<div class="rodape-coluna"><button class="add-coluna" data-add="'+fase.id+'">+ Adicionar condomínio</button></div>';
    const lista = col.querySelector(".lista");
    if(!daFase.length){
      const v = document.createElement("p");
      v.className = "vazio";
      v.textContent = "Nenhum condomínio nesta fase.";
      lista.appendChild(v);
    } else daFase.forEach(l => lista.appendChild(montarCartao(l)));
    quadro.appendChild(col);
  });
  // Attach drag-and-drop behaviour to the new cards and columns.
  ligarArrastar();

  /* restaura a posição de rolagem de cada coluna e do quadro */
  quadro.scrollLeft = scrollQuadroX;
  Object.keys(scrollColunas).forEach(faseId => {
    const lista = quadro.querySelector('.lista[data-fase="'+faseId+'"]');
    if(lista) lista.scrollTop = scrollColunas[faseId];
  });
  // If the map view exists (mapa.js), tell it to refresh too; then update reminder badges.
  if(window.__atualizarMapa) window.__atualizarMapa();
  if(typeof verificarLembretes === "function") verificarLembretes(true);
  if(contatosAberto()) renderContatosPagina();
  if(dashboardAberto()) renderDashboard();
  if(window.Prospeccao) Prospeccao.atualizar();   // "✓ No funil" marks on the Prospecção page
}

// Builds ONE card element for a condo.
// draggable = can be dragged; tabIndex = 0 makes it reachable with the Tab key.
// Small car icon (drawn with SVG so it looks the same on every phone and computer).
// Flame: "contato quente" (hot contact). Filled, so it reads well at 13px on the card.
const ICONE_FOGO = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';
const ICONE_CARRO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<path d="M3.5 16.5V12l2.2-4.6A1.5 1.5 0 0 1 7.1 6.5h8.6a1.5 1.5 0 0 1 1.3.8l2.5 4.7h.5a1 1 0 0 1 1 1v3.5"/>'+
  '<path d="M3.5 12h17"/><circle cx="7.5" cy="16.5" r="1.9"/><circle cx="16.5" cy="16.5" r="1.9"/><path d="M9.4 16.5h5.2"/></svg>';
function montarCartao(l){
  const el = document.createElement("article");
  el.className = "cartao st-" + (l.status||"nenhum");
  el.draggable = !somenteLeitura; el.dataset.id = l.id; el.tabIndex = 0;

  // Plain lines of information under the name; color (tags) only for what needs attention.
  const info = [];
  const zonaAptos = [l.zona, (l.aptos !== "" && l.aptos != null) ? l.aptos+" aptos" : ""].filter(Boolean).join(", ");
  if(zonaAptos) info.push(escapar(zonaAptos));
  if(l.contatos && l.contatos.length){
    const c0 = l.contatos[0];
    info.push(escapar(c0.nome||"Contato")+(textoTipo(c0) ? " ("+escapar(textoTipo(c0))+")" : "")+
      (l.contatos.length>1 ? ' <span class="mais">+'+(l.contatos.length-1)+'</span>' : ''));
  }
  const etiquetas = [];
  // Competitor: plain text, unless its contract ends in 90 days or less (or already ended):
  // then it's a red tag, because that's a sales opportunity.
  if(l.concorrente){
    const d = l.fimContrato ? Math.ceil((new Date(l.fimContrato)-Date.now())/86400000) : null;
    if(d !== null && d <= 90){
      etiquetas.push('<span class="etiqueta perigo">'+escapar(l.concorrente)+': '+
        (d < 0 ? "contrato vencido" : d === 0 ? "contrato vence hoje" : "contrato vence em "+plural(d, "dia", "dias"))+'</span>');
    } else {
      info.push("Concorrente: "+escapar(l.concorrente)+(d !== null ? ", até "+dataBR(l.fimContrato) : ""));
    }
  }
  // Reminder tag (bell). If a reminder is overdue, the whole card gets the red 'lem-vencido' style.
  const proxLem = proximoLembrete(l);
  if(lembreteVencido(l)) el.classList.add("lem-vencido");
  if(proxLem){
    const c = classeLembrete(proxLem);
    etiquetas.unshift('<span class="etiqueta lem '+c+'" title="'+escapar(proxLem.texto||"Próximo passo")+'">'+ICONE_SINO+' '+
      (c==="atrasado"?"Atrasado, ":"")+escapar(quandoCurto(proxLem))+'</span>');
  }
  // Footer: 'Atualizado <date> por <name>' with a round avatar.
  // If the condo is marked SULTS, a green "S" badge goes right after the name of who edited last
  // (or on its own, if the condo has no notes yet).
  const ultimaObs = ultimaObservacao(l);
  const quemObs = ultimaObs ? (ultimaObs.por||"") : "";
  const inicial = (quemObs||"?").trim().charAt(0).toUpperCase() || "?";
  const seloSults = l.sults ? '<i class="selo-sults" role="img" title="SULTS" aria-label="SULTS">S</i>' : "";
  const metaCartao = ultimaObs
    ? '<div class="meta-cartao"><span>Atualizado '+dataHoraBR(ultimaObs.quando)+(quemObs ? "" : seloSults)+"</span>"+
      (quemObs?'<span class="quem"><i class="inicial">'+escapar(inicial)+"</i>por "+escapar(quemObs)+seloSults+"</span>":"")+
      "</div>"
    : (seloSults ? '<div class="meta-cartao"><span class="quem">'+seloSults+"</span></div>" : "");
  // "Visitar" mark: a small car on the card's top-right corner, sticking out of the card.
  const seloVisitar = l.visitar
    ? '<span class="selo-visitar" role="img" title="Para visitar" aria-label="Para visitar">'+ICONE_CARRO+'</span>' : "";
  el.innerHTML =
    seloVisitar+
    "<h3>"+escapar(l.nome||"Condomínio sem nome")+
      (l.quente ? '<i class="selo-quente" role="img" title="Contato quente" aria-label="Contato quente">'+ICONE_FOGO+'</i>' : "")+"</h3>"+
    (l.importante?'<p class="aviso-importante">'+escapar(l.importante)+"</p>":"")+
    info.map(t => '<p class="cartao-info">'+t+'</p>').join("")+
    (etiquetas.length?'<div class="etiquetas">'+etiquetas.join("")+"</div>":"")+
    metaCartao;
  // Clicking the card (or pressing Enter on it) opens the edit panel.
  el.addEventListener("click", () => abrirPainel(l.id));
  el.addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); abrirPainel(l.id); } });
  return el;
}

// DRAG AND DROP (HTML5 drag events):
// dragstart -> a card starts moving, dragover -> it's above a column,
// drop -> it was released, dragend -> drag finished (success or not).
function ligarArrastar(){
  document.querySelectorAll(".cartao").forEach(c => {
    c.addEventListener("dragstart", e=>{
      if(!perm.editar){ e.preventDefault(); negar("editar"); return; }
      arrastandoId=c.dataset.id; c.classList.add("arrastando");
    });
    c.addEventListener("dragend", ()=>{
      c.classList.remove("arrastando"); arrastandoId=null;
      document.querySelectorAll(".coluna").forEach(x=>x.classList.remove("alvo"));
    });
  });
  // Each column accepts dropped cards.
  document.querySelectorAll(".coluna").forEach(col => {
    const lista = col.querySelector(".lista");
    // While dragging over a column: e.preventDefault() allows dropping here,
    // and the card is moved live to the position closest to the mouse.
    col.addEventListener("dragover", e => {
      e.preventDefault(); col.classList.add("alvo");
      const movel = document.querySelector(".arrastando"); if(!movel) return;
      const vazio = lista.querySelector(".vazio"); if(vazio) vazio.remove();
      const depois = alvoPosicao(lista, e.clientY);
      if(depois == null) lista.appendChild(movel); else lista.insertBefore(movel, depois);
    });
    col.addEventListener("dragleave", e => { if(!col.contains(e.relatedTarget)) col.classList.remove("alvo"); });
    // On drop: set the condo's new stage, renumber the 'ordem' of every card in that column,
    // log the move in the history, save, and redraw.
    col.addEventListener("drop", async e => {
      e.preventDefault(); col.classList.remove("alvo");
      if(!arrastandoId) return;
      const lead = leads.find(l => l.id === arrastandoId); if(!lead) return;
      const novaFase = col.dataset.fase;
      const mudou = lead.fase !== novaFase;
      lead.fase = novaFase;
      const tocados = [];
      [...lista.querySelectorAll(".cartao")].forEach((c,i)=>{
        const l = leads.find(x=>x.id===c.dataset.id);
        if(l){ l.ordem = i; tocados.push(l); }
      });
      if(mudou) registrarAtualizacao(lead, "Movido para "+FASES.find(f=>f.id===novaFase).nome);
      const okMover = await gravarVarios(tocados);
      desenhar();
      if(okMover !== false && mudou) avisar((lead.nome||"Cartão")+" → "+FASES.find(f=>f.id===novaFase).nome);
    });
  });
}
// Given the mouse height (y), finds which card the dragged card should go BEFORE.
// Returns null if it should go at the end of the list.
function alvoPosicao(lista, y){
  let melhor=null, menor=Infinity;
  [...lista.querySelectorAll(".cartao:not(.arrastando)")].forEach(c=>{
    const r=c.getBoundingClientRect(), dif=y-r.top-r.height/2;
    if(dif<0 && Math.abs(dif)<menor){ menor=Math.abs(dif); melhor=c; }
  });
  return melhor;
}

/* ================= contatos (síndico/administradora unificados) ================= */
// =============================================================================
// CONTACTS
// =============================================================================
// Older condos stored 'síndico' (building manager) and 'administradora' (management company)
// in separate fields. This converts them into the new unified 'contatos' list.
function migrarContatosAntigos(l){
  if(Array.isArray(l.contatos) && l.contatos.length){
    return l.contatos.map(c=>({nome:c.nome||"", telefone:c.telefone||"", email:c.email||"", tipo:c.tipo||""}));
  }
  // condomínios cadastrados antes da unificação: junta síndico e administradora num contato cada
  const legado = [];
  if(l.sindico || l.sindicoTel || l.sindicoEmail){
    legado.push({nome:l.sindico||"", telefone:l.sindicoTel||"", email:l.sindicoEmail||"", tipo:"Síndico"});
  }
  const nomeAdmin = [l.admin, l.adminContato].filter(Boolean).join(" – ");
  if(nomeAdmin || l.adminTel || l.adminEmail){
    legado.push({nome:nomeAdmin, telefone:l.adminTel||"", email:l.adminEmail||"", tipo:"ADM"});
  }
  return legado;
}
// ---- "Quem é" (contact type) ----
// Fixed options + any custom type someone typed with "Outro…". Custom types are learned from
// every saved contact (condo contacts and standalone ones), so a type created on one card shows
// up in the dropdown of all other cards. 'tiposExtras' also remembers new types right away,
// before the contact is saved.
const TIPOS_PADRAO = ["Síndico","ADM","Zelador","Morador","Gerente predial"];
const CHAVE_TIPOS = "quitandinha:tiposContato";
let tiposExtras = [];
try{ tiposExtras = JSON.parse(localStorage.getItem(CHAVE_TIPOS) || "[]"); if(!Array.isArray(tiposExtras)) tiposExtras = []; }catch(e){ tiposExtras = []; }
// All types, without duplicates (accents/case ignored): fixed ones first, then custom ones A→Z.
function tiposContato(){
  const vistos = new Set(TIPOS_PADRAO.map(normalizarNome)), extras = [];
  const add = t => { t = String(t||"").trim(); const k = normalizarNome(t); if(t && !vistos.has(k)){ vistos.add(k); extras.push(t); } };
  tiposExtras.forEach(add);
  leads.forEach(l => (l.contatos||[]).forEach(c => add(c.tipo)));
  (typeof avulsos !== "undefined" ? avulsos : []).forEach(c => add(c.tipo));
  contatosForm.forEach(c => add(c.tipo));
  return TIPOS_PADRAO.concat(extras.sort((a,b) => a.localeCompare(b, "pt-BR")));
}
// Saves a type typed in "Outro…". If it already exists (e.g. "zelador"), returns the existing spelling.
function registrarTipo(txt){
  txt = String(txt||"").trim().replace(/\s+/g," "); if(!txt) return "";
  const existente = tiposContato().find(t => normalizarNome(t) === normalizarNome(txt));
  if(existente) return existente;
  tiposExtras.push(txt);
  try{ localStorage.setItem(CHAVE_TIPOS, JSON.stringify(tiposExtras)); }catch(e){}
  return txt;
}
// <option>s for a "Vínculo" dropdown, with the current value selected and "Outro…" at the end.
function opcoesTipo(atual){
  const tipos = tiposContato();
  if(atual && !tipos.includes(atual)) tipos.push(atual);
  return '<option value="">Selecione…</option>'+
    tipos.map(t => '<option value="'+escapar(t)+'"'+(t===atual?' selected':'')+'>'+escapar(t)+'</option>').join("")+
    '<option value="__outro">Outro…</option>';
}
// Contact type as a short label for cards and lists ("" when not set).
const textoTipo = c => (c && c.tipo) ? String(c.tipo) : "";

// Builds a "tel:" link that opens the phone's keypad with the number typed, ready to call.
// Keeps digits (and a leading +). Returns null if there aren't enough digits for a phone number.
function telLink(telefone){
  const t = String(telefone||"").trim();
  const digitos = t.replace(/\D/g,"");
  if(digitos.length < 8) return null;
  return "tel:" + (t.startsWith("+") ? "+" : "") + digitos;
}
// Opens the tel: link: on a phone this shows the keypad with the number, ready to call.
// (On a computer, it opens whatever app handles calls, e.g. FaceTime or Teams, if any.)
function ligarPara(link){ window.location.href = link; }
// Phone icon for the "Ligar" buttons.
const ICONE_TELEFONE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>';
// Builds a WhatsApp link (https://wa.me/55...) from a phone number.
// Keeps digits only; Brazilian numbers with 10/11 digits get the country code 55 added.
function whatsappLink(telefone){
  const digitos = String(telefone||"").replace(/\D/g,"");
  if(digitos.length < 8) return null;
  // números brasileiros sem DDI: adiciona o 55 na frente
  const numero = (digitos.length===10 || digitos.length===11) ? "55"+digitos : digitos;
  return "https://wa.me/"+numero;
}
// Draws the contact fields in the panel (name, phone + WhatsApp button, email) from contatosForm.
function renderContatos(){
  const el = $("#contatosLista");
  if(!contatosForm.length){
    el.innerHTML = '<p class="contato-vazio">Nenhum contato.</p>';
    return;
  }
  // "Quem é" appears once the name has text. 'tipoOutroAberto' = the contact where the
  // "Outro…" text box is open (to type a new type).
  el.innerHTML = contatosForm.map((c,i) =>
    '<div class="contato-item" data-i="'+i+'">'+
      '<div class="contato-cabeca">'+
        '<label class="campo"><span>Nome</span><input class="txt contato-nome" data-i="'+i+'" value="'+escapar(c.nome||"")+'"></label>'+
        '<label class="campo contato-tipo" data-i="'+i+'"'+((c.nome||"").trim() ? '' : ' hidden')+'><span>Vínculo</span>'+
          (tipoOutroAberto === i
            ? '<span class="tipo-outro"><input class="txt tipo-outro-txt" data-i="'+i+'" placeholder="Ex.: Porteiro" maxlength="40">'+
              '<button type="button" class="tipo-ok" data-tipo-ok="'+i+'">OK</button>'+
              '<button type="button" class="tipo-cancelar" data-tipo-cancelar="'+i+'" aria-label="Cancelar">✕</button></span>'
            : '<select class="txt contato-tipo-sel" data-i="'+i+'">'+opcoesTipo(c.tipo||"")+'</select>')+
        '</label>'+
        '<button type="button" class="contato-remover" data-remover-contato="'+i+'" title="Remover contato" aria-label="Remover contato">✕</button>'+
      '</div>'+
      '<div class="linha">'+
        '<label class="campo campo-tel"><span>Telefone / WhatsApp</span>'+
          '<span class="tel-com-whats">'+
            '<input class="txt contato-tel" data-i="'+i+'" value="'+escapar(c.telefone||"")+'">'+
            '<button type="button" class="btn-whats" data-whats-contato="'+i+'" title="Abrir no WhatsApp" aria-label="Abrir no WhatsApp">'+
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2m0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.24 8.24m4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.47-.01a.9.9 0 0 0-.65.3c-.23.24-.86.84-.86 2.05s.88 2.38 1 2.55c.13.17 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28"/></svg>'+
            '</button>'+
            // "Ligar": opens the phone keypad with this number (tel: link)
            '<button type="button" class="btn-ligar" data-ligar-contato="'+i+'" title="Ligar" aria-label="Ligar para este número">'+ICONE_TELEFONE+'</button>'+
          '</span>'+
        '</label>'+
        '<label class="campo"><span>E-mail</span>'+
          '<span class="email-com-copiar">'+
            '<input class="txt contato-email" type="email" data-i="'+i+'" value="'+escapar(c.email||"")+'">'+
            // "Copiar": small icon inside the e-mail box (right side); copies the e-mail typed right now
            '<button type="button" class="btn-copiar" data-copiar-email="'+i+'" title="Copiar e-mail" aria-label="Copiar e-mail">'+ICONE_COPIAR+'</button>'+
          '</span>'+
        '</label>'+
      '</div>'+
    '</div>'
  ).join("");
  if(tipoOutroAberto !== null){ const t = el.querySelector(".tipo-outro-txt"); if(t) t.focus(); }
}
let tipoOutroAberto = null;
// "Outro…" box: OK saves the new type on that contact (and in the shared list of types).
function confirmarTipoOutro(i){
  const campo = $("#contatosLista .tipo-outro-txt");
  const tipo = registrarTipo(campo ? campo.value : "");
  if(!tipo){ avisar("Escreva o vínculo do contato (ex.: Porteiro)."); if(campo) campo.focus(); return; }
  contatosForm[i].tipo = tipo;
  tipoOutroAberto = null;
  renderContatos();
}
function cancelarTipoOutro(){ tipoOutroAberto = null; renderContatos(); }
// Adds an empty contact and puts the cursor in its name field.
function adicionarContato(){
  if(bloqueado()) return;
  contatosForm.push({nome:"", telefone:"", email:"", tipo:""});
  renderContatos();
  const campos = document.querySelectorAll("#contatosLista .contato-nome");
  const ultimo = campos[campos.length-1];
  if(ultimo) ultimo.focus();
}
// Removes contact number i after asking for confirmation.
function removerContatoForm(i){
  if(!confirm("Remover este contato? Essa ação não pode ser desfeita.")) return;
  contatosForm.splice(i,1);
  tipoOutroAberto = null;
  renderContatos();
}
// Reads the contacts from the form, trimming spaces and dropping completely empty ones.
function lerContatosForm(){
  return contatosForm
    .map(c=>({nome:(c.nome||"").trim(), telefone:(c.telefone||"").trim(), email:(c.email||"").trim(), tipo:(c.tipo||"").trim()}))
    .filter(c=>c.nome||c.telefone||c.email);
}

/* ================= observações (data e autor automáticos) ================= */
// =============================================================================
// NOTES / TIMELINE (date and author added automatically)
// =============================================================================
// Returns a copy of the condo's notes. Old condos had one free-text 'notas' field;
// it is converted into a single note marked 'antiga' (old).
function migrarNotasAntigas(l){
  if(l.observacoes && l.observacoes.length) return JSON.parse(JSON.stringify(l.observacoes));
  if(l.notas && l.notas.trim()){
    return [{texto:l.notas.trim(), quando:l.atualizadoEm||l.criadoEm||agora(), por:l.criadoPor||"", antiga:true}];
  }
  return [];
}
// Draws the notes list. The note being edited is shown as a textarea with Cancel/Save buttons.
function renderObservacoes(){
  const el = $("#obsLista");
  if(!observacoesForm.length){
    el.innerHTML = '<p class="obs-vazia">Nenhuma observação ainda. Escreva abaixo para registrar a primeira.</p>';
    return;
  }
  el.innerHTML = observacoesForm.map((o,i) => {
    const meta = dataHoraBR(o.quando)+
      (o.por ? ' — <b>'+escapar(o.por)+'</b>' : (o.antiga ? ' — <b>observação anterior</b>' : ''))+
      (o.editadoQuando ? ' <i class="obs-editado">(editado '+dataHoraBR(o.editadoQuando)+
        (o.editadoPor?' por '+escapar(o.editadoPor):'')+')</i>' : '');
    if(i === obsEditandoIndex){
      return '<div class="obs-item obs-item-editando">'+
        '<span class="obs-meta">'+meta+'</span>'+
        '<textarea class="obs-editar-texto" id="obsEditarTexto">'+escapar(o.texto)+'</textarea>'+
        '<div class="obs-editar-botoes">'+
          '<button type="button" class="obs-btn-cancelar" data-cancelar-obs="1">Cancelar</button>'+
          '<button type="button" class="obs-btn-salvar" data-salvar-obs="'+i+'">Salvar</button>'+
        '</div>'+
      '</div>';
    }
    return '<div class="obs-item">'+
      '<div class="obs-acoes">'+
        // copy this note's text (same small icon as the e-mail box); stays available to read-only users
        '<button type="button" class="obs-copiar" data-copiar-obs="'+i+'" title="Copiar observação" aria-label="Copiar observação">'+ICONE_COPIAR+'</button>'+
        '<button type="button" class="obs-editar" data-editar-obs="'+i+'" title="Editar observação">✎</button>'+
        '<button type="button" class="obs-remover" data-remover-obs="'+i+'" title="Remover observação">✕</button>'+
      '</div>'+
      '<span class="obs-meta">'+meta+'</span>'+
      '<span class="obs-texto">'+escapar(o.texto)+'</span>'+
    '</div>';
  }).join("");
  if(obsEditandoIndex !== null){
    const t = $("#obsEditarTexto");
    if(t){ t.focus(); t.selectionStart = t.selectionEnd = t.value.length; }
  }
}
// Start editing note i.
function editarObservacao(i){
  obsEditandoIndex = i;
  renderObservacoes();
}
// Stop editing without saving.
function cancelarEdicaoObservacao(){
  obsEditandoIndex = null;
  renderObservacoes();
}
// Save the edited text and record when/who edited it.
function salvarEdicaoObservacao(i){
  const campo = $("#obsEditarTexto");
  const novoTexto = campo.value.trim();
  if(!novoTexto){ avisar("A observação não pode ficar vazia"); return; }
  observacoesForm[i].texto = novoTexto;
  observacoesForm[i].editadoQuando = agora();
  observacoesForm[i].editadoPor = meuNome||"";
  obsEditandoIndex = null;
  renderObservacoes();
}
// Add a new note at the TOP of the list (unshift) with the current date and user.
function adicionarObservacao(){
  if(bloqueado()) return;
  const campo = $("#obsTexto");
  const texto = campo.value.trim();
  if(!texto){ avisar("Escreva a observação antes de adicionar"); return; }
  observacoesForm.unshift({texto, quando:agora(), por:meuNome||""});
  campo.value = "";
  renderObservacoes();
  campo.focus();
}
// Delete note i after confirmation.
function removerObservacaoForm(i){
  if(!confirm("Remover esta observação? Essa ação não pode ser desfeita.")) return;
  observacoesForm.splice(i,1);
  if(obsEditandoIndex === i) obsEditandoIndex = null;
  renderObservacoes();
}
// Turns all notes into plain text (used for the CSV export and the old 'notas' column).
function formatarObservacoesTexto(lista){
  return (lista||[]).map(o =>
    "["+dataHoraBR(o.quando)+(o.por?" — "+o.por:"")+"] "+o.texto
  ).join("\n\n");
}


/* ================= lembretes / próximos passos ================= */
// =============================================================================
// REMINDERS / NEXT STEPS
// =============================================================================
// A reminder looks like: {id, quando:"2026-10-05T09:00", texto, feito:false, feitoEm, por, criadoEm}
//
// p2(5) -> "05" (pads numbers to 2 digits).
const p2 = n => String(n).padStart(2,"0");
// Date -> "YYYY-MM-DD" (the format an <input type=date> uses).
function dataLocalInput(d){ return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate()); }
// Turns a reminder's 'quando' text into a Date object.
function dtLembrete(lem){ return new Date(lem.quando); }          // "AAAA-MM-DDTHH:mm" = horário local
// True if two dates fall on the same calendar day.
function mesmoDia(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
// Classifies a reminder: 'feito' (done), 'atrasado' (overdue), 'hoje' (today) or 'proximo' (upcoming).
function classeLembrete(lem){
  if(lem.feito) return "feito";
  const d = dtLembrete(lem), agoraD = new Date();
  if(isNaN(d)) return "proximo";
  if(d < agoraD) return "atrasado";
  if(mesmoDia(d, agoraD)) return "hoje";
  return "proximo";
}
// Date -> "14:30".
function horaCurta(d){ return p2(d.getHours())+":"+p2(d.getMinutes()); }
// Short description: 'hoje 14:30', 'amanhã 09:00' or '05/10 09:00'.
function quandoCurto(lem){
  const d = dtLembrete(lem), hoje = new Date(), amanha = new Date(Date.now()+86400000);
  if(isNaN(d)) return "sem data";
  if(mesmoDia(d,hoje)) return "hoje "+horaCurta(d);
  if(mesmoDia(d,amanha)) return "amanhã "+horaCurta(d);
  return p2(d.getDate())+"/"+p2(d.getMonth()+1)+" "+horaCurta(d);
}
// Long description: 'Seg., 05/10/2026 às 09:00'.
function quandoLongo(lem){
  const d = dtLembrete(lem); if(isNaN(d)) return "Sem data";
  const dia = d.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"});
  return dia.charAt(0).toUpperCase()+dia.slice(1)+" às "+horaCurta(d);
}
// True if the condo has at least one reminder that is not done and is already in the past.
function lembreteVencido(l){
  return (l.lembretes||[]).some(x=>!x.feito && x.quando && dtLembrete(x) < new Date());
}
// Returns the next open reminder (the earliest one), or null.
function proximoLembrete(l){
  const abertos = (l.lembretes||[]).filter(x=>!x.feito && x.quando);
  if(!abertos.length) return null;
  return abertos.sort((a,b)=>dtLembrete(a)-dtLembrete(b))[0];
}

/* ---- Google Agenda e .ics ---- */
// ---- Calendar integration ----
// Date -> "20261005T090000" (format used by Google Calendar and .ics files).
function fmtAgenda(d){ return d.getFullYear()+p2(d.getMonth()+1)+p2(d.getDate())+"T"+p2(d.getHours())+p2(d.getMinutes())+"00"; }
// Builds the event description: next step, address, contacts, important info.
function detalhesLembrete(l, lem){
  const linhas = [];
  if(lem.texto) linhas.push("Próximo passo: "+lem.texto);
  if(l.endereco) linhas.push("Endereço: "+l.endereco);
  (l.contatos||[]).forEach(c=>{
    const t = [c.nome,c.telefone,c.email].filter(Boolean).join(" · ");
    if(t) linhas.push("Contato: "+t);
  });
  if(l.importante) linhas.push("Importante: "+l.importante);
  linhas.push("Funil KMD3 Market");
  return linhas.join("\n");
}
// Builds a link that opens Google Calendar with a 30-minute event already filled in.
// URLSearchParams safely encodes the text for use in a URL.
function linkGoogleAgenda(l, lem){
  const ini = dtLembrete(lem); if(isNaN(ini)) return "#";
  const fim = new Date(ini.getTime()+30*60000);
  const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || "America/Sao_Paulo";
  const p = new URLSearchParams({
    action:"TEMPLATE",
    text:(l.nome||"Condomínio")+": "+(lem.texto||"Retomar contato"),
    dates:fmtAgenda(ini)+"/"+fmtAgenda(fim),
    details:detalhesLembrete(l,lem),
    ctz:tz
  });
  if(l.endereco) p.set("location", l.endereco);
  return "https://calendar.google.com/calendar/render?"+p.toString();
}
// Escapes special characters (\ , ; and line breaks) as the .ics format requires.
function escICS(t){ return String(t||"").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;"); }
// Creates and downloads a .ics calendar file (works with Apple Calendar / Outlook),
// with an alarm 10 minutes before (TRIGGER:-PT10M).
// Blob = a file created in memory; a temporary <a download> link is clicked to download it.
function baixarICS(l, lem){
  const ini = dtLembrete(lem); if(isNaN(ini)) return;
  const fim = new Date(ini.getTime()+30*60000);
  const carimbo = new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  const linhas = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//KMD3 Market//Funil//PT-BR","CALSCALE:GREGORIAN","BEGIN:VEVENT",
    "UID:"+lem.id+"@kmd3market","DTSTAMP:"+carimbo,
    "DTSTART:"+fmtAgenda(ini),"DTEND:"+fmtAgenda(fim),
    "SUMMARY:"+escICS((l.nome||"Condomínio")+": "+(lem.texto||"Retomar contato")),
    "DESCRIPTION:"+escICS(detalhesLembrete(l,lem)),
    l.endereco ? "LOCATION:"+escICS(l.endereco) : null,
    "BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+escICS(l.nome||"Lembrete"),"TRIGGER:-PT10M","END:VALARM",
    "END:VEVENT","END:VCALENDAR"
  ].filter(Boolean);
  const blob = new Blob([linhas.join("\r\n")],{type:"text/calendar;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "lembrete-"+(l.nome||"condominio").toLowerCase().replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"")+".ics";
  a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}

/* ---- seção dentro do painel do condomínio ---- */
// ---- Reminders inside the condo panel ----
// Clears the 'new reminder' fields.
function limparNovoLembrete(){
  $("#lem_data").value = ""; $("#lem_hora").value = "09:00"; $("#lem_texto").value = "";
}
// Returns the HTML of one reminder with its buttons.
// doForm = true when shown inside the condo panel (then the condo name isn't repeated).
// The data-* attributes tell the click handler (near the end of this file) what to do.
// ---- Editing a reminder (date, time and text) ----
// Only one reminder is edited at a time. lemEditando = {onde, idx}:
//   onde = "form" -> a reminder inside the open condo panel (saved with the panel's "Salvar")
//   onde = <condo id> -> a reminder on the Lembretes page (saved right away)
let lemEditando = null;
const editandoLem = (onde, idx) => !!lemEditando && lemEditando.onde === onde && lemEditando.idx === idx;
// The small edit form that replaces the reminder while it's being edited.
// data-lid is turned into data-form="1" for reminders inside the panel (see renderLembretesForm).
function formEdicaoLembreteHTML(lem, idx, lid){
  const partes = String(lem.quando||"").split("T");
  return '<div class="lem-edicao">'+
    '<div class="lem-edicao-campos">'+
      '<label><span>Data</span><input type="date" class="txt" id="lemEdData" value="'+escapar(partes[0]||"")+'"></label>'+
      '<label><span>Horário</span><input type="time" class="txt" id="lemEdHora" value="'+escapar((partes[1]||"09:00").slice(0,5))+'"></label>'+
    '</div>'+
    '<label class="lem-edicao-texto"><span>Próximo passo</span><input class="txt" id="lemEdTexto" autocomplete="off" value="'+escapar(lem.texto||"")+'"></label>'+
    '<div class="lem-acoes">'+
      '<button type="button" class="lem-ok" data-lem-salvar-ed="'+idx+'" data-lid="'+escapar(lid)+'">Salvar</button>'+
      '<button type="button" data-lem-cancelar-ed="'+idx+'" data-lid="'+escapar(lid)+'">Cancelar</button>'+
    '</div>'+
  '</div>';
}
// Reads the edit form. Returns {quando, texto}, or null (with a message) if the date is missing.
function lerEdicaoLembrete(){
  const data = $("#lemEdData").value, hora = $("#lemEdHora").value || "09:00";
  if(!data){ avisar("Escolha a data do lembrete"); $("#lemEdData").focus(); return null; }
  return {quando:data+"T"+hora, texto:$("#lemEdTexto").value.trim()};
}
function focarEdicaoLembrete(){ const t = $("#lemEdTexto"); if(t){ t.focus(); t.selectionStart = t.selectionEnd = t.value.length; } }
// Panel: apply the edit to the form copy (saved for real when the condo is saved).
function salvarEdicaoLembreteForm(){
  const v = lerEdicaoLembrete(); if(!v) return false;
  const lem = lembretesForm[lemEditando.idx];
  if(lem){ Object.assign(lem, v, {editadoEm:agora(), editadoPor:meuNome||""}); lemAvisados.delete(lem.id); }
  lemEditando = null;
  renderLembretesForm();
  return true;
}

function itemLembreteHTML(l, lem, idx, doForm){
  const c = classeLembrete(lem);
  if(editandoLem(doForm ? "form" : l.id, idx)){
    return '<div class="lem-item editando">'+
      (doForm ? "" : '<button type="button" class="lem-lead" data-abrir-lead="'+escapar(l.id)+'">'+escapar(l.nome||"Condomínio sem nome")+'</button>')+
      formEdicaoLembreteHTML(lem, idx, l.id)+'</div>';
  }
  const gcal = linkGoogleAgenda(l, lem);
  return '<div class="lem-item '+c+'">'+
    (doForm ? "" : '<button type="button" class="lem-lead" data-abrir-lead="'+escapar(l.id)+'">'+escapar(l.nome||"Condomínio sem nome")+'</button>')+
    '<span class="lem-quando">'+(c==="atrasado"?"Atrasado, ":c==="hoje"?"Hoje, ":c==="feito"?"Concluído, ":"")+escapar(quandoLongo(lem))+'</span>'+
    '<span class="lem-texto">'+escapar(lem.texto||"Retomar contato")+'</span>'+
    (!doForm && l.responsavel ? '<span class="lem-resp">Responsável: '+escapar(l.responsavel)+'</span>' : '')+
    '<div class="lem-acoes">'+
      (lem.feito
        ? '<button type="button" data-lem-reabrir="'+idx+'" data-lid="'+escapar(l.id)+'">Reabrir</button>'
        : '<button type="button" class="lem-ok" data-lem-feito="'+idx+'" data-lid="'+escapar(l.id)+'">Concluir</button>'+
          '<button type="button" data-lem-adiar="'+idx+'" data-lid="'+escapar(l.id)+'" title="Adiar para amanhã no mesmo horário">Adiar 1 dia</button>'+
          '<button type="button" data-lem-semana="'+idx+'" data-lid="'+escapar(l.id)+'" title="Adiar 7 dias, no mesmo horário">Adiar 1 semana</button>')+
      '<button type="button" data-lem-editar="'+idx+'" data-lid="'+escapar(l.id)+'" title="Mudar data, horário ou texto">Editar</button>'+
      '<a class="lem-gcal" href="'+escapar(gcal)+'" target="_blank" rel="noopener">Google Agenda</a>'+
      '<button type="button" data-lem-ics="'+idx+'" data-lid="'+escapar(l.id)+'" title="Arquivo para Apple/Outlook, com alarme 10 min antes">.ics</button>'+
    '</div>'+
    '<button type="button" class="lem-x" data-lem-remover="'+idx+'" data-lid="'+escapar(l.id)+'" aria-label="Excluir lembrete" title="Excluir lembrete">✕</button>'+
  '</div>';
}
// Builds a temporary condo object from what's typed in the form right now.
function leadAtualDoForm(){
  // lead "virtual" com o que está digitado agora (serve para montar o link do Google Agenda de um lead novo)
  const base = editandoId ? (leads.find(x=>x.id===editandoId)||{}) : {};
  return Object.assign({}, base, {id:editandoId||"novo", nome:$("#f_nome").value.trim(), endereco:$("#f_endereco").value.trim(),
    importante:$("#f_importante").value.trim(), contatos:lerContatosForm()});
}
// =============================================================================
// ADDRESS IN SEPARATE FIELDS (CEP, street, number, complement, neighborhood, city, state)
// -----------------------------------------------------------------------------
// The condo keeps ONE address text (column "endereco"), exactly as before, so the map, the
// visit route, the search, the calendar links and Prospecção keep working without any database
// change. The panel splits that text into fields (separarEndereco) and, when a field is edited,
// rebuilds it (montarEndereco) as "Rua X, 155, Bloco B - Bairro - Cidade - UF - 00000-000".
// An old address that nobody edits is kept exactly as it was typed.
// Lookups use ViaCEP (free, no key): CEP -> address, and street (+ city/UF) -> list of CEPs.
// =============================================================================
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
// Cities we expect around here: a lone last part like "Osasco" is read as the city, not the neighborhood.
const CIDADES_CONHECIDAS = ["sao paulo","osasco","barueri","carapicuiba","cotia","guarulhos","santo andre","sao bernardo do campo",
  "sao caetano do sul","diadema","taboao da serra","embu das artes","santana de parnaiba","jandira","itapevi","maua","campinas"];
const CIDADE_PADRAO_CEP = "São Paulo", UF_PADRAO_CEP = "SP";

// "01310100" -> "01310-100" (keeps only digits, at most 8).
function formatarCep(v){
  const d = String(v || "").replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
}
// Splits a one-line address into its parts. Understands the format written by montarEndereco,
// the Prospecção format ("Rua X, 155 - Bairro - Osasco - SP - 06000-000") and common hand-typed ones.
function separarEndereco(texto){
  const r = {cep:"", rua:"", numero:"", complemento:"", bairro:"", cidade:"", uf:""};
  let t = String(texto || "").replace(/\s+/g, " ").trim();
  if(!t) return r;
  const m = t.match(/\b(\d{5})-?(\d{3})\b/);
  if(m){ r.cep = m[1] + "-" + m[2]; t = t.replace(m[0], " ").replace(/\bCEP:?\s*/i, " "); }
  const limpar = x => x.replace(/^[\s,\-–/]+|[\s,\-–/]+$/g, "").trim();
  let segs = t.split(/\s+[-–]\s+/).map(limpar).filter(Boolean);
  if(!segs.length) return r;
  // state: a last part that is a UF ("SP"), or a ", SP" / "/SP" at the end of the last part
  const ult = segs[segs.length - 1];
  if(UFS.includes(ult.toUpperCase()) && segs.length > 1){ r.uf = ult.toUpperCase(); segs.pop(); }
  else {
    const fim = ult.match(/^(.*?)\s*[,/]\s*([A-Za-z]{2})$/);
    if(fim && UFS.includes(fim[2].toUpperCase())){ r.uf = fim[2].toUpperCase(); segs[segs.length - 1] = limpar(fim[1]); segs = segs.filter(Boolean); }
  }
  const ehNumero = x => /^(\d+[A-Za-z]?|s\/?n\.?)$/i.test(x || "");
  const ehCidade = x => CIDADES_CONHECIDAS.includes(normalizarNome(x));
  const partes0 = segs[0].split(/\s*,\s*/).filter(Boolean);
  r.rua = partes0.shift() || "";
  if(ehNumero(partes0[0])) r.numero = partes0.shift();
  let resto = segs.slice(1).flatMap(x => x.split(/\s*,\s*/)).filter(Boolean);
  if(segs.length === 1){
    // everything was separated by commas: "Rua X, 100, Consolação, São Paulo"
    resto = partes0.splice(0);
    if(resto.length && (r.uf || ehCidade(resto[resto.length - 1]))) r.cidade = resto.pop();
    if(r.cidade && resto.length) r.bairro = resto.pop();
    r.complemento = resto.join(", ");
    return r;
  }
  r.complemento = partes0.join(", ");
  if(resto.length && (r.uf || resto.length >= 2 || ehCidade(resto[resto.length - 1]))) r.cidade = resto.pop();
  r.bairro = resto.join(", ");
  return r;
}
// The opposite: builds the one-line address from the parts (empty parts are skipped).
function montarEndereco(p){
  p = p || {};
  const tr = x => String(x || "").trim();
  const linha = [tr(p.rua), tr(p.numero), tr(p.complemento)].filter(Boolean).join(", ");
  return [linha, tr(p.bairro), tr(p.cidade), tr(p.uf).toUpperCase(), formatarCep(p.cep).length === 9 ? formatarCep(p.cep) : ""]
    .filter(Boolean).join(" - ");
}
// What to send to ViaCEP for a typed street: without "Rua", "Av."... (ViaCEP searches the name).
function termoRua(rua){
  return String(rua || "").trim()
    .replace(/^(rua|r\.|avenida|av\.?|alameda|al\.?|travessa|tv\.?|tr\.?|pra[cç]a|p[cç]a\.?|estrada|estr?\.?|rodovia|rod\.?|largo|lgo\.?|viela|passagem|vila)\s+/i, "")
    .trim();
}
// Does this CEP cover this building number? ViaCEP writes the range in "complemento":
// "até 600 - lado par", "de 601 a 1299 - lado ímpar", "de 1301 ao fim". Returns true / false,
// or null when the CEP covers the whole street (or the number is unknown).
function cepCombinaNumero(complemento, numero){
  const n = parseInt(String(numero || "").replace(/\D/g, ""), 10);
  const c = normalizarNome(complemento);
  if(!n || !c) return null;
  let regra = false;
  if(/lado par/.test(c)){ regra = true; if(n % 2) return false; }
  if(/lado impar/.test(c)){ regra = true; if(!(n % 2)) return false; }
  // "602/603" = the first number on each side of the street: from the smaller, up to the larger
  const N = "(\\d+)(?:\\/(\\d+))?";
  const menor = (a, b) => Math.min(+a, b ? +b : +a), maior = (a, b) => Math.max(+a, b ? +b : +a);
  let m;
  if((m = c.match(new RegExp("de " + N + " a " + N)))){ regra = true; if(n < menor(m[1], m[2]) || n > maior(m[3], m[4])) return false; }
  else if((m = c.match(new RegExp("de " + N + " ao fim")))){ regra = true; if(n < menor(m[1], m[2])) return false; }
  else if((m = c.match(new RegExp("ate " + N)))){ regra = true; if(n > maior(m[1], m[2])) return false; }
  return regra ? true : null;
}

// ---- ViaCEP ----
async function viacepPorCep(cep){
  const d = String(cep || "").replace(/\D/g, "");
  if(d.length !== 8) return null;
  const r = await fetch("https://viacep.com.br/ws/" + d + "/json/");
  if(!r.ok) throw new Error("http " + r.status);
  const j = await r.json();
  return j && !j.erro ? j : null;
}
async function viacepPorRua(uf, cidade, termo){
  const r = await fetch("https://viacep.com.br/ws/" + encodeURIComponent(uf) + "/" + encodeURIComponent(cidade) + "/" + encodeURIComponent(termo) + "/json/");
  if(!r.ok) throw new Error("http " + r.status);
  const j = await r.json();
  return Array.isArray(j) ? j : [];
}

// ---- the fields in the panel ----
const CAMPOS_END = {cep:"#f_cep", rua:"#f_rua", numero:"#f_numero", complemento:"#f_complemento", bairro:"#f_bairro", cidade:"#f_cidade", uf:"#f_uf"};
let endSugestoes = [], endSugIndex = -1, endBuscaN = 0, endTimer = null, endUltimoCep = "", endOpcoesRua = [];
function lerPartesEndereco(){
  const p = {};
  Object.entries(CAMPOS_END).forEach(([k, sel]) => { p[k] = $(sel).value.trim(); });
  return p;
}
function statusEndereco(txt, tipo){
  const el = $("#endStatus");
  el.textContent = txt || "";
  el.className = "end-status" + (tipo ? " " + tipo : "");
}
// Opens the panel: shows the saved address split into fields (the saved text stays as is until edited).
function preencherEndereco(texto){
  const p = separarEndereco(texto);
  Object.entries(CAMPOS_END).forEach(([k, sel]) => { $(sel).value = p[k] || ""; });
  $("#f_endereco").value = texto || "";
  endUltimoCep = (p.cep || "").replace(/\D/g, "");
  endOpcoesRua = [];
  fecharSugestoesEndereco();
  statusEndereco("");
}
// Any address field edited: rebuild the one-line address.
function atualizarEnderecoCompleto(){ $("#f_endereco").value = montarEndereco(lerPartesEndereco()); }
// Puts a ViaCEP result into the fields (keeps number and complement typed by the person).
function aplicarViacep(j){
  if(j.logradouro) $("#f_rua").value = j.logradouro;
  if(j.bairro) $("#f_bairro").value = j.bairro;
  if(j.localidade) $("#f_cidade").value = j.localidade;
  if(j.uf) $("#f_uf").value = j.uf;
  // "Zona" is never filled automatically: it is typed by hand only
  if(j.cep){ $("#f_cep").value = formatarCep(j.cep); endUltimoCep = j.cep.replace(/\D/g, ""); }
  atualizarEnderecoCompleto();
}
// CEP typed: when it has 8 digits, fill in the rest.
async function buscarPorCep(){
  const d = $("#f_cep").value.replace(/\D/g, "");
  if(d.length !== 8 || d === endUltimoCep) return;
  endUltimoCep = d;
  const n = ++endBuscaN;
  statusEndereco("Buscando o CEP…");
  try{
    const j = await viacepPorCep(d);
    if(n !== endBuscaN) return;
    if(!j){ statusEndereco("CEP não encontrado. Confira os números ou preencha à mão.", "erro"); return; }
    aplicarViacep(j);
    statusEndereco("Endereço preenchido pelo CEP", "ok");
    if(!$("#f_numero").value.trim()) $("#f_numero").focus();
  }catch(e){
    if(n === endBuscaN) statusEndereco("Sem conexão para buscar o CEP agora. Dá para preencher à mão.", "erro");
  }
}
// Street typed: after a short pause, ask ViaCEP for the matching streets in the city (São Paulo if empty).
function agendarBuscaRua(){
  clearTimeout(endTimer);
  const termo = termoRua($("#f_rua").value);
  if(termo.length < 3){ fecharSugestoesEndereco(); statusEndereco(""); return; }
  endTimer = setTimeout(buscarPorRua, 400);
}
async function buscarPorRua(){
  const termo = termoRua($("#f_rua").value);
  if(termo.length < 3) return;
  const uf = ($("#f_uf").value.trim() || UF_PADRAO_CEP).toUpperCase(), cidade = $("#f_cidade").value.trim() || CIDADE_PADRAO_CEP;
  const n = ++endBuscaN;
  statusEndereco("Procurando a rua em " + cidade + "…");
  try{
    const lista = await viacepPorRua(uf, cidade, termo);
    if(n !== endBuscaN || document.activeElement !== $("#f_rua")) return;
    endOpcoesRua = lista;
    if(!lista.length){ fecharSugestoesEndereco(); statusEndereco("Nenhuma rua encontrada em " + cidade + ". Confira a cidade ou digite o CEP.", "erro"); return; }
    statusEndereco("");
    mostrarSugestoesEndereco(lista);
  }catch(e){
    if(n === endBuscaN){ fecharSugestoesEndereco(); statusEndereco("Sem conexão para buscar a rua agora. Dá para preencher à mão.", "erro"); }
  }
}
// The list under the street field: street, neighborhood, CEP and its number range.
// The CEPs that cover the number already typed come first.
function mostrarSugestoesEndereco(lista){
  const num = $("#f_numero").value;
  const peso = j => { const c = cepCombinaNumero(j.complemento, num); return c === true ? 0 : c === null ? 1 : 2; };
  endSugestoes = lista.slice().sort((a, b) => peso(a) - peso(b)).slice(0, 8);
  endSugIndex = -1;
  const box = $("#endSugestoes");
  box.innerHTML = endSugestoes.map((j, i) => {
    const combina = cepCombinaNumero(j.complemento, num) === true;
    return '<button type="button" role="option" class="end-sug" data-end-sug="'+i+'" id="endSug'+i+'">'+
      '<b>'+escapar(j.logradouro || "")+'</b>'+
      '<span>'+escapar([j.bairro, j.localidade + (j.uf ? " - " + j.uf : "")].filter(Boolean).join(", "))+'</span>'+
      '<span class="end-sug-cep">'+escapar(formatarCep(j.cep))+(j.complemento ? ' <i>'+escapar(j.complemento)+'</i>' : '')+
        (combina ? ' <em>combina com o nº '+escapar(num.trim())+'</em>' : '')+'</span>'+
    '</button>';
  }).join("");
  box.hidden = false;
  $("#f_rua").setAttribute("aria-expanded", "true");
}
function fecharSugestoesEndereco(){
  const box = $("#endSugestoes");
  if(!box) return;
  box.hidden = true; box.innerHTML = ""; endSugestoes = []; endSugIndex = -1;
  $("#f_rua").setAttribute("aria-expanded", "false");
  $("#f_rua").removeAttribute("aria-activedescendant");
}
function escolherSugestaoEndereco(i){
  const j = endSugestoes[i]; if(!j) return;
  aplicarViacep(j);
  fecharSugestoesEndereco();
  statusEndereco("CEP " + formatarCep(j.cep) + " preenchido" + (j.complemento ? " (" + j.complemento + ")" : ""), "ok");
  $(!$("#f_numero").value.trim() ? "#f_numero" : "#f_complemento").focus();
}
// A street with several CEPs (one per stretch of numbers): when the number is typed after
// choosing the street, switch to the CEP that covers that number.
function ajustarCepPeloNumero(){
  if(!endOpcoesRua.length) return;
  const rua = normalizarNome($("#f_rua").value), num = $("#f_numero").value;
  const mesmas = endOpcoesRua.filter(j => normalizarNome(j.logradouro) === rua && normalizarNome(j.bairro || "") === normalizarNome($("#f_bairro").value));
  if(mesmas.length < 2) return;
  const certo = mesmas.find(j => cepCombinaNumero(j.complemento, num) === true);
  if(certo && certo.cep.replace(/\D/g, "") !== $("#f_cep").value.replace(/\D/g, "")){
    $("#f_cep").value = formatarCep(certo.cep); endUltimoCep = certo.cep.replace(/\D/g, "");
    atualizarEnderecoCompleto();
    statusEndereco("CEP ajustado para o nº " + num.trim() + ": " + formatarCep(certo.cep), "ok");
  }
}
Object.values(CAMPOS_END).forEach(sel => $(sel).addEventListener("input", atualizarEnderecoCompleto));
$("#f_cep").addEventListener("input", e => {
  const f = formatarCep(e.target.value);
  if(f !== e.target.value) e.target.value = f;
  atualizarEnderecoCompleto();
  buscarPorCep();
});
$("#f_uf").addEventListener("input", e => { e.target.value = e.target.value.toUpperCase(); atualizarEnderecoCompleto(); });
$("#f_rua").addEventListener("input", agendarBuscaRua);
$("#f_numero").addEventListener("input", () => {
  ajustarCepPeloNumero();
  if(!$("#endSugestoes").hidden) mostrarSugestoesEndereco(endOpcoesRua);
});
$("#f_rua").addEventListener("keydown", e => {
  if($("#endSugestoes").hidden || !endSugestoes.length) return;
  if(e.key === "ArrowDown" || e.key === "ArrowUp"){
    e.preventDefault();
    endSugIndex = (endSugIndex + (e.key === "ArrowDown" ? 1 : -1) + endSugestoes.length) % endSugestoes.length;
    document.querySelectorAll("#endSugestoes .end-sug").forEach((b, i) => b.classList.toggle("ativa", i === endSugIndex));
    $("#f_rua").setAttribute("aria-activedescendant", "endSug" + endSugIndex);
  } else if(e.key === "Enter" && endSugIndex >= 0){
    e.preventDefault(); escolherSugestaoEndereco(endSugIndex);
  } else if(e.key === "Escape"){
    e.preventDefault(); e.stopPropagation();          // closes only the list, not the panel
    fecharSugestoesEndereco();
  }
});
$("#f_rua").addEventListener("blur", () => setTimeout(fecharSugestoesEndereco, 180));
// mousedown (not click) so the street field doesn't lose focus and close the list first
$("#endSugestoes").addEventListener("mousedown", e => {
  const b = e.target.closest("[data-end-sug]"); if(!b) return;
  e.preventDefault(); escolherSugestaoEndereco(parseInt(b.dataset.endSug, 10));
});

// Draws the reminders inside the panel: open ones first, sorted by date, done ones last.
// data-lid is replaced by data-form="1" so clicks change the form copy, not the saved data.
function renderLembretesForm(){
  const box = $("#lemLista");
  if(!lembretesForm.length){ box.innerHTML = '<div class="lem-vazio">Nenhum lembrete. Escolha data e horário abaixo.</div>'; return; }
  const l = leadAtualDoForm();
  const ordem = lembretesForm.map((x,i)=>({x,i})).sort((a,b)=>{
    if(!!a.x.feito !== !!b.x.feito) return a.x.feito ? 1 : -1;
    return dtLembrete(a.x) - dtLembrete(b.x);
  });
  box.innerHTML = ordem.map(o=>itemLembreteHTML(l, o.x, o.i, true).replace(/data-lid="[^"]*"/g,'data-form="1"')).join("");
  if(lemEditando && lemEditando.onde === "form") focarEdicaoLembrete();
}
// Adds a reminder from the date/time/text fields to the form list.
// It's only really saved when the user clicks Salvar. silencioso = don't show a message.
function adicionarLembreteForm(silencioso){
  if(bloqueado()) return;
  const data = $("#lem_data").value, hora = $("#lem_hora").value || "09:00";
  if(!data){ avisar("Escolha a data do lembrete"); return; }
  const texto = $("#lem_texto").value.trim();
  lembretesForm.push({id:gerarId(), quando:data+"T"+hora, texto, feito:false, feitoEm:null, por:meuNome||"", criadoEm:agora()});
  limparNovoLembrete();
  renderLembretesForm();
  if(!silencioso) avisar("Lembrete adicionado. Clique em Salvar para guardar.");
}

/* ---- ações em lembretes já salvos (painel Lembretes) ---- */
// ---- Actions on already-saved reminders (from the Lembretes page) ----
// Logs the change, saves the condo, and refreshes everything.
async function gravarLembretes(l, descricao){
  registrarAtualizacao(l, descricao);
  await gravarLead(l);
  desenhar();
  verificarLembretes(true);
  renderPainelLembretes();
}
// Moves a reminder N days later, same time.
function adiarLembrete(lem, dias){
  const d = dtLembrete(lem); d.setDate(d.getDate()+dias);
  lem.quando = dataLocalInput(d)+"T"+horaCurta(d);
}
// Runs an action on a saved reminder: feito (done), reabrir (reopen), adiar (+1 day), semana (+7 days), remover (delete), ics (download).
async function acaoLembrete(leadId, idx, acao){
  if(!perm.editar){ negar("editar"); return; }
  const l = leads.find(x=>x.id===leadId); if(!l || !l.lembretes || !l.lembretes[idx]) return;
  const lem = l.lembretes[idx];
  if(acao==="feito"){ lem.feito = true; lem.feitoEm = agora(); await gravarLembretes(l, "Lembrete concluído: "+(lem.texto||"retomar contato")); avisar("Lembrete concluído"); }
  else if(acao==="reabrir"){ lem.feito = false; lem.feitoEm = null; await gravarLembretes(l, "Lembrete reaberto"); }
  else if(acao==="adiar" || acao==="semana"){
    adiarLembrete(lem, acao==="semana" ? 7 : 1);
    lemAvisados.delete(lem.id);          // if it becomes overdue again, it alerts again
    await gravarLembretes(l, "Lembrete adiado para "+quandoCurto(lem)); avisar("Adiado para "+quandoCurto(lem));
  }
  else if(acao==="remover"){
    if(!confirm("Excluir este lembrete?")) return;
    l.lembretes.splice(idx,1); await gravarLembretes(l, "Lembrete excluído");
  }
  else if(acao==="ics"){ baixarICS(l, lem); }
  else if(acao==="editar"){ lemEditando = {onde:leadId, idx}; renderPainelLembretes(); focarEdicaoLembrete(); }
  else if(acao==="cancelarEd"){ lemEditando = null; renderPainelLembretes(); }
  else if(acao==="salvarEd"){
    const v = lerEdicaoLembrete(); if(!v) return;
    Object.assign(lem, v, {editadoEm:agora(), editadoPor:meuNome||""});
    lemAvisados.delete(lem.id);          // if it becomes overdue again, it alerts again
    lemEditando = null;
    await gravarLembretes(l, "Lembrete editado: "+quandoCurto(lem)+" · "+(lem.texto||"retomar contato"));
    avisar("Lembrete atualizado");
  }
}

/* ---- painel Lembretes (aba geral) ---- */
// ---- Full-screen 'Lembretes' page ----
// lemAba = which tab is selected.
let lemAba = "pendentes";
// True if the reminder 'belongs' to me (I'm responsible for the condo or I created the reminder).
function meuLembrete(l, lem){
  if(!meuNome) return true;
  return (l.responsavel||"")===meuNome || (lem.por||"")===meuNome;
}
// Collects ALL reminders from ALL condos (optionally only mine).
function todosLembretes(){
  const soMeus = $("#lemSoMeus") && $("#lemSoMeus").checked;
  const lista = [];
  leads.forEach(l => (l.lembretes||[]).forEach((lem,idx)=>{
    if(soMeus && !meuLembrete(l, lem)) return;
    lista.push({l, lem, idx, c:classeLembrete(lem)});
  }));
  return lista;
}
// Relative time: 'Em 3 h', 'Atrasado há 2 dias', 'Agora'...
function relativoLembrete(lem){
  if(lem.feito) return "Concluído";
  const diff = dtLembrete(lem) - new Date();
  const min = Math.round(Math.abs(diff)/60000);
  let txt;
  if(min < 60) txt = min+" min";
  else if(min < 1440) txt = Math.floor(min/60)+" h";
  else { const d = Math.floor(min/1440); txt = d+(d===1?" dia":" dias"); }
  return diff < 0 ? "Atrasado há "+txt : (min<1 ? "Agora" : "Em "+txt);
}
// HTML of one row on the reminders page.
function linhaLembreteHTML(t){
  const {l, lem, idx, c} = t, d = dtLembrete(lem);
  if(editandoLem(l.id, idx)){
    return '<div class="lemr editando"><div class="lemr-corpo">'+
      '<button type="button" class="lem-lead" data-abrir-lead="'+escapar(l.id)+'">'+escapar(l.nome||"Condomínio sem nome")+'</button>'+
      formEdicaoLembreteHTML(lem, idx, l.id)+'</div></div>';
  }
  const dia = isNaN(d) ? "—" : d.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"});
  const acoes = (lem.feito
      ? '<button type="button" data-lem-reabrir="'+idx+'" data-lid="'+escapar(l.id)+'">Reabrir</button>'
      : '<button type="button" class="lem-ok" data-lem-feito="'+idx+'" data-lid="'+escapar(l.id)+'">Concluir</button>'+
        '<button type="button" data-lem-adiar="'+idx+'" data-lid="'+escapar(l.id)+'" title="Adiar para amanhã no mesmo horário">Adiar 1 dia</button>'+
        '<button type="button" data-lem-semana="'+idx+'" data-lid="'+escapar(l.id)+'" title="Adiar 7 dias, no mesmo horário">Adiar 1 semana</button>')+
    '<button type="button" data-lem-editar="'+idx+'" data-lid="'+escapar(l.id)+'" title="Mudar data, horário ou texto">Editar</button>'+
    '<a class="lem-gcal" href="'+escapar(linkGoogleAgenda(l, lem))+'" target="_blank" rel="noopener">Google Agenda</a>'+
    '<button type="button" data-lem-remover="'+idx+'" data-lid="'+escapar(l.id)+'" title="Excluir lembrete">Excluir</button>';
  return '<div class="lemr '+c+'">'+
    '<div class="lemr-data"><b>'+escapar(dia.charAt(0).toUpperCase()+dia.slice(1))+'</b><span>'+(isNaN(d)?"":horaCurta(d))+'</span><em>'+escapar(relativoLembrete(lem))+'</em></div>'+
    '<div class="lemr-corpo"><button type="button" class="lem-lead" data-abrir-lead="'+escapar(l.id)+'">'+escapar(l.nome||"Condomínio sem nome")+'</button>'+
      '<span class="lemr-texto">'+escapar(lem.texto||"Retomar contato")+'</span>'+
      (l.responsavel ? '<span class="lem-resp">Responsável: '+escapar(l.responsavel)+'</span>' : '')+'</div>'+
    '<div class="lem-acoes">'+acoes+'</div>'+
  '</div>';
}
// Draws the reminders page: groups reminders (overdue / today / upcoming / done),
// sorts them, builds the tabs with counters and shows the list for the selected tab.
function renderPainelLembretes(){
  const todos = todosLembretes();
  const por = {atrasado:[], hoje:[], proximo:[], feito:[]};
  todos.forEach(t => por[t.c].push(t));
  const cron = (a,b)=>dtLembrete(a.lem)-dtLembrete(b.lem);
  por.atrasado.sort(cron); por.hoje.sort(cron); por.proximo.sort(cron);
  por.feito.sort((a,b)=>new Date(b.lem.feitoEm||0)-new Date(a.lem.feitoEm||0));
  por.pendentes = [...por.atrasado, ...por.hoje, ...por.proximo];
  const abas = [["pendentes","Todos pendentes"],["atrasado","Atrasados"],["hoje","Hoje"],["proximo","Próximos"],["feito","Concluídos"]];
  $("#lemAbas").innerHTML = abas.map(([k,n]) =>
    '<button type="button" class="lem-aba'+(k==="atrasado"?" atraso":"")+(lemAba===k?" on":"")+'" data-lem-aba="'+k+'">'+n+'<span class="n">'+por[k].length+'</span></button>').join("");
  const msgVazia = {pendentes:"Nenhum lembrete pendente.", atrasado:"Nada atrasado.", hoje:"Nenhum lembrete para hoje.", proximo:"Nenhum lembrete futuro.", feito:"Nenhum lembrete concluído ainda."};
  renderCalendarioLembretes(todos);
  // a day chosen on the calendar: only that day's reminders (all of them, done ones too), no tabs
  $("#lemAbas").hidden = !!lemDia;
  $("#lemDiaCab").hidden = !lemDia;
  if(lemDia){
    const doDia = (agruparLembretesPorDia(todos).get(lemDia) || []);
    const [a, m, d] = lemDia.split("-").map(Number), data = new Date(a, m-1, d);
    const nome = data.toLocaleDateString("pt-BR", {weekday:"long", day:"numeric", month:"long"});
    $("#lemDiaCab").innerHTML = '<b>'+escapar(nome.charAt(0).toUpperCase()+nome.slice(1))+'</b><span>'+
      (doDia.length === 1 ? "1 lembrete" : doDia.length+" lembretes")+'</span>'+
      '<button type="button" class="lem-dia-todos" data-lem-dia-limpar>Ver todos os lembretes</button>';
    $("#lemPainelLista").innerHTML = doDia.map(linhaLembreteHTML).join("") || '<div class="lem-vazio">Nenhum lembrete neste dia.</div>';
  } else {
    const itens = por[lemAba] || [];
    $("#lemPainelLista").innerHTML = itens.map(linhaLembreteHTML).join("") || '<div class="lem-vazio">'+msgVazia[lemAba]+'</div>';
  }
  $("#btnNotif").hidden = !("Notification" in window) || Notification.permission !== "default";
}
// True if the reminders page is open.
function lembretesAberto(){ return $("#telaLembretes").classList.contains("aberta"); }
// Opens the reminders page (on 'pending' if there are any, otherwise on 'done').
function abrirLembretes(aba){
  const hoje = new Date();
  lemMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);   // the calendar opens on this month
  lemDia = null;
  carregarNotas().then(renderNotas);
  if(aba) lemAba = aba;
  else {
    const t = todosLembretes().filter(x=>!x.lem.feito);
    lemAba = t.length ? "pendentes" : "feito";
  }
  renderPainelLembretes();
  $("#telaLembretes").classList.add("aberta");
}
// Closes the reminders page.
function fecharLembretes(){ lemEditando = null; notaEditando = null; $("#telaLembretes").classList.remove("aberta"); }

// =============================================================================
// CALENDAR on the reminders page: the month, with each day's reminders (colored like the
// list: overdue red, today gold, upcoming blue, done gray). Clicking a day lists only that day.
// =============================================================================
let lemMes = null, lemDia = null;           // month shown (1st day) / chosen day "YYYY-MM-DD" (null = none)
const chaveDia = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
// The days shown for a month: whole weeks (Sunday to Saturday), 5 or 6 rows.
function diasDoCalendario(ano, mes){
  const primeiro = new Date(ano, mes, 1), diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const linhas = Math.ceil((primeiro.getDay() + diasNoMes) / 7);
  return Array.from({length: linhas * 7}, (_, i) => new Date(ano, mes, 1 - primeiro.getDay() + i));
}
// Reminders grouped by day ("YYYY-MM-DD" -> list sorted by time).
function agruparLembretesPorDia(lista){
  const m = new Map();
  (lista || []).forEach(t => {
    const d = dtLembrete(t.lem); if(isNaN(d)) return;
    const k = chaveDia(d); if(!m.has(k)) m.set(k, []); m.get(k).push(t);
  });
  m.forEach(v => v.sort((a, b) => dtLembrete(a.lem) - dtLembrete(b.lem)));
  return m;
}
function renderCalendarioLembretes(todos){
  if(!lemMes){ const h = new Date(); lemMes = new Date(h.getFullYear(), h.getMonth(), 1); }
  const porDia = agruparLembretesPorDia(todos), hoje = chaveDia(new Date());
  const ano = lemMes.getFullYear(), mes = lemMes.getMonth();
  const titulo = lemMes.toLocaleDateString("pt-BR", {month:"long", year:"numeric"});
  const MAX = 3;
  const celulas = diasDoCalendario(ano, mes).map(d => {
    const k = chaveDia(d), lista = porDia.get(k) || [];
    const atraso = lista.filter(t => t.c === "atrasado").length;
    const cls = ["lem-cal-dia", d.getMonth() !== mes ? "fora" : "", k === hoje ? "hoje" : "", k === lemDia ? "sel" : "", lista.length ? "tem" : ""].filter(Boolean).join(" ");
    const rot = d.toLocaleDateString("pt-BR", {day:"numeric", month:"long"}) + ": " +
      (lista.length ? (lista.length === 1 ? "1 lembrete" : lista.length + " lembretes") + (atraso ? ", " + atraso + " atrasado" + (atraso > 1 ? "s" : "") : "") : "nenhum lembrete");
    const chips = lista.slice(0, MAX).map(t => {
      const dt = dtLembrete(t.lem);
      return '<span class="lem-cal-chip c-'+t.c+'">'+escapar(horaCurta(dt))+' '+escapar(t.l.nome || "Condomínio")+'</span>';
    }).join("") + (lista.length > MAX ? '<span class="lem-cal-mais">+'+(lista.length - MAX)+' mais</span>' : "");
    // on phones the chips become colored dots
    const pontos = lista.length ? '<span class="lem-cal-pontos">'+lista.slice(0, 4).map(t => '<i class="c-'+t.c+'"></i>').join("")+'</span>' : "";
    return '<button type="button" class="'+cls+'" data-lem-dia="'+k+'" aria-label="'+escapar(rot)+'"'+(k === lemDia ? ' aria-pressed="true"' : ' aria-pressed="false"')+'>'+
      '<span class="lem-cal-num">'+d.getDate()+'</span>'+chips+pontos+'</button>';
  }).join("");
  $("#lemCal").innerHTML =
    '<div class="lem-cal-topo">'+
      '<button type="button" class="lem-cal-nav" data-lem-mes="-1" aria-label="Mês anterior">‹</button>'+
      '<h3 class="lem-cal-titulo">'+escapar(titulo.charAt(0).toUpperCase()+titulo.slice(1))+'</h3>'+
      '<button type="button" class="lem-cal-nav" data-lem-mes="1" aria-label="Próximo mês">›</button>'+
      '<button type="button" class="lem-cal-hoje" data-lem-mes="0">Hoje</button>'+
    '</div>'+
    '<div class="lem-cal-grade" role="group" aria-label="Calendário de lembretes">'+
      DIAS_SEMANA.map(n => '<span class="lem-cal-sem" aria-hidden="true">'+n+'</span>').join("")+celulas+
    '</div>';
}
$("#lemCal").addEventListener("click", e => {
  const nav = e.target.closest("[data-lem-mes]");
  if(nav){
    const passo = parseInt(nav.dataset.lemMes, 10), h = new Date();
    lemMes = passo === 0 ? new Date(h.getFullYear(), h.getMonth(), 1) : new Date(lemMes.getFullYear(), lemMes.getMonth() + passo, 1);
    if(passo === 0) lemDia = chaveDia(h);
    renderPainelLembretes(); return;
  }
  const dia = e.target.closest("[data-lem-dia]");
  if(dia){
    const k = dia.dataset.lemDia;
    lemDia = lemDia === k ? null : k;                 // clicking the chosen day again shows everything
    if(lemDia){ const [a, m] = k.split("-").map(Number); lemMes = new Date(a, m - 1, 1); }
    lemEditando = null;
    renderPainelLembretes();
    if(lemDia) $("#lemDiaCab").scrollIntoView({block:"nearest"});
  }
});
$("#lemDiaCab").addEventListener("click", e => {
  if(e.target.closest("[data-lem-dia-limpar]")){ lemDia = null; renderPainelLembretes(); }
});

// =============================================================================
// TEAM NOTEPAD (Bloco de notas) on the reminders page: short notes everyone in the organization
// sees. Supabase table "notas_equipe" (database/notas_equipe.sql); until it exists (and in local
// mode) the notes are kept in this browser. The author can edit / delete their note; admins can
// delete any; read-only users only read.
// =============================================================================
const TABELA_NOTAS = "notas_equipe", CHAVE_NOTAS = "quitandinha:notas", NOTA_MAX = 2000;
let notas = [], notasSemTabela = false, notaEditando = null, souAdmin = false, notasCanal = null;
const notasNaNuvem = () => NUVEM && sb && !notasSemTabela;
function notasLocais(){ try{ return JSON.parse(localStorage.getItem(CHAVE_NOTAS) || "[]") || []; }catch(e){ return []; } }
function gravarNotasLocais(lista){ try{ localStorage.setItem(CHAVE_NOTAS, JSON.stringify(lista)); }catch(e){} }
const ordenarNotas = lista => lista.slice().sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
async function carregarNotas(){
  if(notasNaNuvem()){
    const {data, error} = await sb.from(TABELA_NOTAS).select("*").order("criado_em", {ascending:false}).limit(200);
    if(!error){ notas = ordenarNotas(data || []); ligarNotasRealtime(); return; }
    if(tabelaNaoExiste(error, TABELA_NOTAS)) notasSemTabela = true;
    else { console.warn("notas:", error); return; }
  }
  notas = ordenarNotas(notasLocais());
}
// Someone else adds / changes a note: the open page updates by itself.
function ligarNotasRealtime(){
  if(notasCanal || !sb || !sb.channel) return;
  notasCanal = sb.channel("notas").on("postgres_changes", {event:"*", schema:"public", table:TABELA_NOTAS}, async () => {
    if(!lembretesAberto() || notaEditando) return;
    await carregarNotas(); renderNotas();
  }).subscribe();
}
const meuId = () => (sessao && sessao.user && sessao.user.id) || null;
const minhaNota = n => !NUVEM || notasSemTabela || (n.por_id && n.por_id === meuId());
const podeEditarNota = n => !somenteLeitura && minhaNota(n);
const podeExcluirNota = n => !somenteLeitura && (minhaNota(n) || souAdmin);
function renderNotas(){
  $("#notaForm").hidden = somenteLeitura;
  const aviso = $("#notasAviso");
  aviso.hidden = !(NUVEM && notasSemTabela);
  aviso.textContent = "As notas estão ficando só neste navegador: falta criar a tabela no Supabase (database/notas_equipe.sql). Depois disso, toda a equipe vê.";
  $("#notasLista").innerHTML = notas.map(n => {
    const quando = dataHoraBR(n.criado_em) + (n.editado_em ? " (editada)" : "");
    if(notaEditando === n.id) return '<li class="nota editando" data-nota="'+escapar(n.id)+'">'+
      '<textarea class="txt" id="notaEditarTexto" rows="3" aria-label="Editar nota" maxlength="'+NOTA_MAX+'">'+escapar(n.texto)+'</textarea>'+
      '<div class="nota-botoes"><button type="button" class="adm-b" data-nota-cancelar>Cancelar</button><button type="button" class="btn-salvar" data-nota-salvar>Salvar</button></div></li>';
    return '<li class="nota" data-nota="'+escapar(n.id)+'">'+
      '<p class="nota-texto">'+escapar(n.texto)+'</p>'+
      '<span class="nota-meta">'+escapar(n.por || "Alguém")+' · '+escapar(quando)+'</span>'+
      ((podeEditarNota(n) || podeExcluirNota(n)) ? '<span class="nota-acoes">'+
        (podeEditarNota(n) ? '<button type="button" data-nota-editar title="Editar nota" aria-label="Editar nota">✎</button>' : '')+
        (podeExcluirNota(n) ? '<button type="button" data-nota-excluir title="Excluir nota" aria-label="Excluir nota">✕</button>' : '')+
      '</span>' : '')+
    '</li>';
  }).join("") || '<li class="nota-vazia">Nenhuma nota ainda.</li>';
  if(notaEditando){ const t = $("#notaEditarTexto"); if(t){ t.focus(); t.selectionStart = t.selectionEnd = t.value.length; } }
}
async function adicionarNota(texto){
  texto = String(texto || "").trim().slice(0, NOTA_MAX);
  if(!texto){ avisar("Escreva a nota antes de adicionar."); return false; }
  if(somenteLeitura){ bloqueado(); return false; }
  const nova = {id: NUVEM && window.crypto && crypto.randomUUID ? crypto.randomUUID() : gerarId(), texto, por: meuNome || "", por_id: meuId(), criado_em: agora()};
  if(notasNaNuvem()){
    const {error} = await sb.from(TABELA_NOTAS).insert(nova);
    if(error && !tabelaNaoExiste(error, TABELA_NOTAS)){ avisar("Não foi possível salvar a nota: " + error.message, true); return false; }
    if(error) notasSemTabela = true;
  }
  if(!notasNaNuvem()) gravarNotasLocais([nova, ...notasLocais()]);
  await carregarNotas(); renderNotas();
  return true;
}
async function salvarEdicaoNota(id, texto){
  texto = String(texto || "").trim().slice(0, NOTA_MAX);
  if(!texto){ avisar("A nota não pode ficar vazia."); return; }
  const mud = {texto, editado_em: agora()};
  if(notasNaNuvem()){
    const {error} = await sb.from(TABELA_NOTAS).update(mud).eq("id", id);
    if(error){ avisar("Não foi possível salvar a nota: " + error.message, true); return; }
  } else gravarNotasLocais(notasLocais().map(n => n.id === id ? {...n, ...mud} : n));
  notaEditando = null;
  await carregarNotas(); renderNotas();
}
async function excluirNota(id){
  if(!confirm("Excluir esta nota?")) return;
  if(notasNaNuvem()){
    const {error} = await sb.from(TABELA_NOTAS).delete().eq("id", id);
    if(error){ avisar("Não foi possível excluir a nota: " + error.message, true); return; }
  } else gravarNotasLocais(notasLocais().filter(n => n.id !== id));
  await carregarNotas(); renderNotas();
}
$("#notaForm").addEventListener("submit", async e => {
  e.preventDefault();
  const b = $("#notaAdd"); b.disabled = true;
  const ok = await adicionarNota($("#notaTexto").value);
  b.disabled = false;
  if(ok){ $("#notaTexto").value = ""; avisar("Nota adicionada"); }
});
// Ctrl/⌘ + Enter adds the note
$("#notaTexto").addEventListener("keydown", e => { if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){ e.preventDefault(); $("#notaForm").requestSubmit(); } });
$("#notasLista").addEventListener("click", e => {
  const li = e.target.closest("[data-nota]"); if(!li) return;
  const id = li.dataset.nota;
  if(e.target.closest("[data-nota-editar]")){ notaEditando = id; renderNotas(); }
  else if(e.target.closest("[data-nota-cancelar]")){ notaEditando = null; renderNotas(); }
  else if(e.target.closest("[data-nota-salvar]")) salvarEdicaoNota(id, $("#notaEditarTexto").value);
  else if(e.target.closest("[data-nota-excluir]")) excluirNota(id);
});
$("#notasLista").addEventListener("keydown", e => {
  if(!notaEditando || e.target.id !== "notaEditarTexto") return;
  if(e.key === "Escape"){ e.preventDefault(); e.stopPropagation(); notaEditando = null; renderNotas(); }
  if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){ e.preventDefault(); salvarEdicaoNota(notaEditando, e.target.value); }
});

/* ---- selo no botão + aviso quando chega a hora ---- */
// ---- Badge on the toolbar button + alerts when a reminder is due ----
// lemAvisados = reminders already announced (so each one alerts only once).
let lemAvisados = new Set(), lemPrimeiraVez = true;
let lemChaveVencidos = null;
// Runs every 30 seconds (and after each redraw).
// - Redraws the board if the set of overdue condos changed (so cards turn red on time).
// - Updates the number badge on the 'Lembretes' button.
// - Shows a toast / browser notification for newly overdue reminders (unless semAviso).
function verificarLembretes(semAviso){
  if(lembretesAberto() && !lemEditando) renderPainelLembretes();   // don't wipe an edit being typed
  // quando um lembrete vence (ou deixa de vencer), redesenha o quadro para o cartão ficar vermelho
  const chave = leads.filter(l=>lembreteVencido(l)).map(l=>l.id).sort().join(",");
  if(lemChaveVencidos !== null && chave !== lemChaveVencidos && !arrastandoId){ lemChaveVencidos = chave; desenhar(); return; }
  lemChaveVencidos = chave;
  const todos = todosLembretes().filter(t=>!t.lem.feito);
  const atrasados = todos.filter(t=>t.c==="atrasado"), hoje = todos.filter(t=>t.c==="hoje");
  const badge = $("#lemBadge"); if(!badge) return;
  const n = atrasados.length + hoje.length;
  // number on the "Lembretes" item of the ☰ menu (red when something is overdue)
  badge.hidden = n === 0;
  badge.textContent = n;
  badge.classList.toggle("atraso", atrasados.length > 0);
  if(semAviso) return;
  // First check after opening the app: one summary message instead of one per reminder.
  if(lemPrimeiraVez){
    lemPrimeiraVez = false;
    atrasados.forEach(t=>lemAvisados.add(t.lem.id));
    if(n) avisar("Você tem "+(atrasados.length? plural(atrasados.length, "lembrete atrasado", "lembretes atrasados")+(hoje.length?" e ":""):"")+
      (hoje.length? (atrasados.length ? hoje.length+" para hoje" : plural(hoje.length, "lembrete para hoje", "lembretes para hoje")):"")+".");
    return;
  }
  atrasados.forEach(t=>{
    if(lemAvisados.has(t.lem.id)) return;
    lemAvisados.add(t.lem.id);
    const msg = (t.l.nome||"Condomínio")+" — "+(t.lem.texto||"retomar contato");
    avisar("Lembrete: "+msg);
    try{ if("Notification" in window && Notification.permission==="granted") new Notification("Lembrete", {body:msg}); }catch(_){}
  });
}

/* ================= página de contatos ================= */
// =============================================================================
// CONTACTS PAGE (☰ → Contatos)
// =============================================================================
// Lists every contact: the ones saved inside the condos + "avulsos" (standalone contacts
// that don't belong to any condo). Avulsos are saved in the Supabase table
// "contatos_avulsos", seen by the whole team. If that table doesn't exist yet, they are
// kept in this browser only and a warning explains it (see database/schema.sql).
const CHAVE_AVULSOS = "quitandinha:contatosAvulsos";
let avulsos = [];                 // [{id, nome, telefone, email, tipo, criadoPor, criadoEm}]
let SEM_TABELA_AVULSOS = false;
let avulsoEditando = null;        // id of the standalone contact open in the form (null = new)

// True when Supabase says the table doesn't exist (so we fall back to the browser).
// 'tabela' = the table that was queried (contatos_avulsos or templates).
function tabelaNaoExiste(e, tabela){
  const msg = (e && e.message) || "";
  return !!e && (e.code === "42P01" || e.code === "PGRST205" ||
    (new RegExp(tabela || "contatos_avulsos", "i").test(msg) && /(does not exist|could not find|schema cache)/i.test(msg)));
}
const avulsoDoBanco = r => ({id:r.id, nome:r.nome||"", telefone:r.telefone||"", email:r.email||"", tipo:r.tipo||"",
  criadoPor:r.criado_por||"", criadoEm:r.criado_em||""});
const avulsoParaBanco = c => ({id:c.id, nome:c.nome, telefone:c.telefone||null, email:c.email||null, tipo:c.tipo||null,
  criado_por:c.criadoPor||null, criado_em:c.criadoEm||agora()});
function avisarSemTabela(){
  avisar("Os contatos avulsos ficam só neste aparelho até criar a tabela no Supabase (veja database/schema.sql).", true);
}
// Loads the standalone contacts (database, or the browser copy).
async function buscarAvulsos(){
  if(NUVEM && !SEM_TABELA_AVULSOS){
    const r = await sb.from("contatos_avulsos").select("*").order("nome", {ascending:true});
    if(!r.error){ avulsos = (r.data||[]).map(avulsoDoBanco); await localSet(CHAVE_AVULSOS, avulsos); return; }
    if(tabelaNaoExiste(r.error)) SEM_TABELA_AVULSOS = true;
  }
  avulsos = await localGet(CHAVE_AVULSOS, []);
}
// Creates or updates a standalone contact. Returns false if it couldn't be saved.
async function gravarAvulso(c){
  if(NUVEM && !SEM_TABELA_AVULSOS){
    const {error} = await sb.from("contatos_avulsos").upsert(avulsoParaBanco(c));
    if(error){
      if(tabelaNaoExiste(error)){ SEM_TABELA_AVULSOS = true; avisarSemTabela(); }
      else if(error.code === "42501" || /row-level security/i.test(error.message||"")){ avisar("Você não tem permissão para salvar contatos.", true); return false; }
      else { avisar("Sem conexão com o banco. O contato não foi salvo; tente de novo.", true); return false; }
    }
  }
  const i = avulsos.findIndex(x => x.id === c.id);
  if(i >= 0) avulsos[i] = c; else avulsos.push(c);
  await localSet(CHAVE_AVULSOS, avulsos);
  return true;
}
async function apagarAvulso(id){
  if(NUVEM && !SEM_TABELA_AVULSOS){
    const {error} = await sb.from("contatos_avulsos").delete().eq("id", id);
    if(error && !tabelaNaoExiste(error)){ avisar("Não foi possível excluir o contato agora. Tente de novo.", true); return false; }
  }
  avulsos = avulsos.filter(x => x.id !== id);
  await localSet(CHAVE_AVULSOS, avulsos);
  return true;
}

// One row per contact: condo contacts (from every card) + standalone ones, A→Z by name.
function todosContatos(){
  const linhas = [];
  leads.forEach(l => migrarContatosAntigos(l).forEach(c => {
    if(c.nome || c.telefone || c.email)
      linhas.push({nome:c.nome, telefone:c.telefone, email:c.email, tipo:c.tipo||"",
        condominio:l.nome || "Condomínio sem nome", endereco:l.endereco || "", leadId:l.id});
  }));
  avulsos.forEach(c => linhas.push({nome:c.nome, telefone:c.telefone, email:c.email, tipo:c.tipo||"",
    condominio:"", endereco:"", avulsoId:c.id}));
  return linhas.sort((a,b) => (a.nome||"").localeCompare(b.nome||"", "pt-BR") || (a.condominio||"").localeCompare(b.condominio||"", "pt-BR"));
}
// Applies the search box and the "Quem é" filter.
function contatosFiltrados(){
  const termo = normalizarNome($("#ctBusca").value), tipo = $("#ctFiltroTipo").value;
  return todosContatos().filter(c => {
    if(tipo === "__sem" ? c.tipo : (tipo && c.tipo !== tipo)) return false;
    if(!termo) return true;
    const digitos = termo.replace(/\D/g,"");
    return normalizarNome([c.nome,c.email,c.condominio,c.tipo].join(" ")).includes(termo) ||
      (digitos.length >= 3 && String(c.telefone||"").replace(/\D/g,"").includes(digitos));
  });
}
function renderContatosPagina(){
  const filtroAtual = $("#ctFiltroTipo").value;
  $("#ctFiltroTipo").innerHTML = '<option value="">Todos os vínculos</option>'+
    tiposContato().map(t => '<option value="'+escapar(t)+'">'+escapar(t)+'</option>').join("")+
    '<option value="__sem">Sem tipo</option>';
  $("#ctFiltroTipo").value = filtroAtual;
  if($("#ctFiltroTipo").value !== filtroAtual) $("#ctFiltroTipo").value = "";

  const todos = todosContatos(), lista = contatosFiltrados();
  const nAvulsos = todos.filter(c => c.avulsoId).length;
  $("#ctResumo").textContent = lista.length === todos.length
    ? plural(todos.length, "contato", "contatos")+": "+(todos.length-nAvulsos)+" de condomínios e "+plural(nAvulsos, "avulso", "avulsos")
    : lista.length+" de "+plural(todos.length, "contato", "contatos");
  // WhatsApp logo (same as in the condo panel), a bit smaller to fit the table row
  const zap = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2m0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.24 8.24m4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.47-.01a.9.9 0 0 0-.65.3c-.23.24-.86.84-.86 2.05s.88 2.38 1 2.55c.13.17 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28"/></svg>';
  $("#ctCorpo").innerHTML = lista.map(c => {
    const wa = whatsappLink(c.telefone), tel = telLink(c.telefone);
    return '<tr>'+
      '<td data-label="Nome"><b>'+escapar(c.nome || "(sem nome)")+'</b>'+(c.tipo ? '<span class="ct-tipo">'+escapar(c.tipo)+'</span>' : '')+'</td>'+
      // number + WhatsApp + call stay together on one line (.ct-numero = no wrapping)
      '<td data-label="Número">'+(c.telefone ? '<span class="ct-numero">'+escapar(c.telefone)+(wa ? ' <a class="ct-zap" href="'+escapar(wa)+'" target="_blank" rel="noopener" title="Abrir no WhatsApp" aria-label="Abrir no WhatsApp">'+zap+'</a>' : '')+
        (tel ? '<a class="ct-ligar" href="'+escapar(tel)+'" title="Ligar" aria-label="Ligar para '+escapar(c.nome||"este contato")+'">'+ICONE_TELEFONE+'</a>' : '')+'</span>' : '<span class="ct-vazio">—</span>')+'</td>'+
      '<td data-label="E-mail">'+(c.email ? '<span class="ct-email"><a href="mailto:'+escapar(c.email)+'">'+escapar(c.email)+'</a>'+
        '<button type="button" class="ct-copiar" data-ct-copiar="'+escapar(c.email)+'" title="Copiar e-mail" aria-label="Copiar o e-mail de '+escapar(c.nome||"este contato")+'">'+ICONE_COPIAR+'</button></span>' : '<span class="ct-vazio">—</span>')+'</td>'+
      '<td data-label="Condomínio">'+(c.leadId
        ? '<button type="button" class="ct-condo" data-ct-abrir="'+escapar(c.leadId)+'" title="Abrir o condomínio">'+escapar(c.condominio)+'</button>'
        : '<span class="ct-avulso">Avulso</span>')+'</td>'+
      '<td class="ct-acoes">'+(c.avulsoId
        ? '<button type="button" data-ct-editar="'+escapar(c.avulsoId)+'" title="Editar contato" aria-label="Editar contato">✎</button>'+
          '<button type="button" data-ct-excluir="'+escapar(c.avulsoId)+'" title="Excluir contato" aria-label="Excluir contato">✕</button>'
        : '')+'</td>'+
    '</tr>';
  }).join("") || '<tr class="ct-nada"><td colspan="5">'+(todos.length
    ? 'Nenhum contato encontrado com esse filtro.'
    : 'Nenhum contato ainda. Eles aparecem aqui quando você adiciona contatos nos condomínios, ou clique em "+ Novo contato".')+'</td></tr>';
}
function contatosAberto(){ return $("#telaContatos").classList.contains("aberta"); }
async function abrirContatos(){
  renderContatosPagina();
  $("#telaContatos").classList.add("aberta");
  await buscarAvulsos();             // refresh the standalone contacts from the database
  renderContatosPagina();
}
function fecharContatos(){ fecharFormAvulso(); $("#telaContatos").classList.remove("aberta"); }

// ---- form for a standalone contact ----
function abrirFormAvulso(id){
  if(!perm.editar){ negar("editar"); return; }
  const c = id ? avulsos.find(x => x.id === id) : null;
  avulsoEditando = c ? c.id : null;
  $("#ctFormTitulo").textContent = c ? "Editar contato" : "Novo contato";
  $("#ct_nome").value = c ? c.nome : "";
  $("#ct_tel").value = c ? (c.telefone||"") : "";
  $("#ct_email").value = c ? (c.email||"") : "";
  $("#ct_tipo").innerHTML = opcoesTipo(c ? c.tipo : "");
  $("#ct_tipoOutro").value = ""; $("#ct_tipoOutro").hidden = true;
  $("#ctForm").hidden = false;
  focarSemTeclado("#ct_nome");
}
function fecharFormAvulso(){ $("#ctForm").hidden = true; avulsoEditando = null; }
async function salvarAvulso(){
  if(bloqueado()) return;
  const nome = $("#ct_nome").value.trim();
  if(!nome){ avisar("Escreva o nome do contato."); $("#ct_nome").focus(); return; }
  let tipo = $("#ct_tipo").value;
  if(tipo === "__outro"){
    tipo = registrarTipo($("#ct_tipoOutro").value);
    if(!tipo){ avisar("Escreva o vínculo do contato (ex.: Porteiro)."); $("#ct_tipoOutro").focus(); return; }
  }
  const antigo = avulsoEditando ? avulsos.find(x => x.id === avulsoEditando) : null;
  const c = {
    id: antigo ? antigo.id : (NUVEM ? crypto.randomUUID() : gerarId()),
    nome, telefone:$("#ct_tel").value.trim(), email:$("#ct_email").value.trim(), tipo,
    criadoPor: antigo ? antigo.criadoPor : (meuNome||""), criadoEm: antigo ? antigo.criadoEm : agora()
  };
  if(await gravarAvulso(c) === false) return;
  fecharFormAvulso();
  renderContatosPagina();
  avisar(antigo ? "Contato atualizado" : "Contato adicionado");
}
async function excluirAvulso(id){
  if(!perm.excluir){ negar("excluir"); return; }
  const c = avulsos.find(x => x.id === id); if(!c) return;
  if(!confirm('Excluir o contato "'+(c.nome||"sem nome")+'"? Essa ação não pode ser desfeita.')) return;
  if(await apagarAvulso(id) === false) return;
  if(avulsoEditando === id) fecharFormAvulso();
  renderContatosPagina();
  avisar("Contato excluído");
}
// Downloads the contacts shown on screen (search and filter applied) as a CSV for Excel.
function exportarContatos(){
  const lista = contatosFiltrados();
  if(!lista.length){ avisar("Não há contatos para exportar"); return; }
  const cab = ["Nome","Vínculo","Número","E-mail","Condomínio","Endereço do condomínio"];
  const linhas = lista.map(c => [c.nome, c.tipo, c.telefone, c.email, c.leadId ? c.condominio : "Avulso", c.endereco]);
  const csv = [cab, ...linhas].map(r => r.map(x => '"'+String(x ?? "").replace(/"/g,'""')+'"').join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿"+csv], {type:"text/csv;charset=utf-8"}));
  a.download = "contatos-"+new Date().toISOString().slice(0,10)+".csv";
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  avisar("Planilha de contatos gerada ("+lista.length+")");
}

/* ================= página de templates ================= */
// =============================================================================
// TEMPLATES PAGE (☰ → Templates)
// =============================================================================
// Ready-made texts (WhatsApp messages, e-mails, scripts...) as cards with a title and a
// "copy" button. Saved in the Supabase table "templates", seen by the whole team.
// If that table doesn't exist yet, they are kept in this browser only and a warning
// explains it (see database/schema.sql).
const CHAVE_TEMPLATES = "quitandinha:templates";
let templates = [];               // [{id, titulo, texto, criadoPor, criadoEm, atualizadoEm}]
let SEM_TABELA_TEMPLATES = false;
let templateEditando = null;      // id of the template open in the form (null = new)

const templateDoBanco = r => ({id:r.id, titulo:r.titulo||"", texto:r.texto||"", criadoPor:r.criado_por||"",
  criadoEm:r.criado_em||"", atualizadoEm:r.atualizado_em||""});
const templateParaBanco = t => ({id:t.id, titulo:t.titulo, texto:t.texto, criado_por:t.criadoPor||null,
  criado_em:t.criadoEm||agora(), atualizado_em:t.atualizadoEm||agora()});
async function buscarTemplates(){
  if(NUVEM && !SEM_TABELA_TEMPLATES){
    const r = await sb.from("templates").select("*").order("titulo", {ascending:true});
    if(!r.error){ templates = (r.data||[]).map(templateDoBanco); await localSet(CHAVE_TEMPLATES, templates); return; }
    if(tabelaNaoExiste(r.error, "templates")) SEM_TABELA_TEMPLATES = true;
  }
  templates = await localGet(CHAVE_TEMPLATES, []);
}
// Creates or updates a template. Returns false if it couldn't be saved.
async function gravarTemplate(t){
  if(NUVEM && !SEM_TABELA_TEMPLATES){
    const {error} = await sb.from("templates").upsert(templateParaBanco(t));
    if(error){
      if(tabelaNaoExiste(error, "templates")){
        SEM_TABELA_TEMPLATES = true;
        avisar("Os templates ficam só neste aparelho até criar a tabela no Supabase (veja database/schema.sql).", true);
      }
      else if(error.code === "42501" || /row-level security/i.test(error.message||"")){ avisar("Você não tem permissão para salvar templates.", true); return false; }
      else { avisar("Sem conexão com o banco. O template não foi salvo; tente de novo.", true); return false; }
    }
  }
  const i = templates.findIndex(x => x.id === t.id);
  if(i >= 0) templates[i] = t; else templates.push(t);
  await localSet(CHAVE_TEMPLATES, templates);
  return true;
}
async function apagarTemplate(id){
  if(NUVEM && !SEM_TABELA_TEMPLATES){
    const {error} = await sb.from("templates").delete().eq("id", id);
    if(error && !tabelaNaoExiste(error, "templates")){ avisar("Não foi possível excluir o template agora. Tente de novo.", true); return false; }
  }
  templates = templates.filter(x => x.id !== id);
  await localSet(CHAVE_TEMPLATES, templates);
  return true;
}

// Templates A→Z by title, filtered by the search box (title or text).
function templatesFiltrados(){
  const termo = normalizarNome($("#tpBusca").value);
  return templates
    .filter(t => !termo || normalizarNome(t.titulo+" "+t.texto).includes(termo))
    .sort((a,b) => (a.titulo||"").localeCompare(b.titulo||"", "pt-BR"));
}
const ICONE_COPIAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
  '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
function renderTemplates(){
  const lista = templatesFiltrados();
  $("#tpResumo").textContent = templates.length
    ? (lista.length === templates.length ? plural(templates.length, "template", "templates") : lista.length+" de "+plural(templates.length, "template", "templates"))
    : "";
  $("#tpGrade").innerHTML = lista.map(t =>
    '<article class="tp-cartao" data-tp="'+escapar(t.id)+'">'+
      '<div class="tp-cabeca">'+
        '<h3>'+escapar(t.titulo || "Sem título")+'</h3>'+
        '<button type="button" class="tp-copiar" data-tp-copiar="'+escapar(t.id)+'" title="Copiar texto" aria-label="Copiar o texto de '+escapar(t.titulo||"template")+'">'+ICONE_COPIAR+'<span>Copiar</span></button>'+
      '</div>'+
      '<p class="tp-texto">'+escapar(t.texto)+'</p>'+
      '<div class="tp-rodape">'+
        '<span>'+(t.criadoPor ? "por "+escapar(t.criadoPor) : "")+'</span>'+
        '<span class="tp-acoes">'+
          '<button type="button" data-tp-editar="'+escapar(t.id)+'" title="Editar template" aria-label="Editar template">✎</button>'+
          '<button type="button" data-tp-excluir="'+escapar(t.id)+'" title="Excluir template" aria-label="Excluir template">✕</button>'+
        '</span>'+
      '</div>'+
    '</article>'
  ).join("") || '<p class="tp-vazio">'+(templates.length
    ? "Nenhum template encontrado com essa busca."
    : 'Nenhum template ainda.')+'</p>';
}
function templatesAberto(){ return $("#telaTemplates").classList.contains("aberta"); }
async function abrirTemplates(){
  renderTemplates();
  $("#telaTemplates").classList.add("aberta");
  try{ await buscarTemplates(); }catch(e){}       // refresh from the database
  renderTemplates();
}
function fecharTemplates(){ fecharFormTemplate(); $("#telaTemplates").classList.remove("aberta"); }

// ---- form (new / edit) ----
function abrirFormTemplate(id){
  if(!perm.editar){ negar("editar"); return; }
  const t = id ? templates.find(x => x.id === id) : null;
  templateEditando = t ? t.id : null;
  $("#tpFormTitulo").textContent = t ? "Editar template" : "Novo template";
  $("#tp_titulo").value = t ? t.titulo : "";
  $("#tp_texto").value = t ? t.texto : "";
  $("#tpForm").hidden = false;
  focarSemTeclado("#tp_titulo");
}
function fecharFormTemplate(){ $("#tpForm").hidden = true; templateEditando = null; }
async function salvarTemplate(){
  if(bloqueado()) return;
  const titulo = $("#tp_titulo").value.trim(), texto = $("#tp_texto").value.replace(/\s+$/, "");
  if(!titulo){ avisar("Dê um título ao template."); $("#tp_titulo").focus(); return; }
  if(!texto.trim()){ avisar("Escreva o texto do template."); $("#tp_texto").focus(); return; }
  const antigo = templateEditando ? templates.find(x => x.id === templateEditando) : null;
  const t = {
    id: antigo ? antigo.id : (NUVEM ? crypto.randomUUID() : gerarId()),
    titulo, texto,
    criadoPor: antigo ? antigo.criadoPor : (meuNome||""), criadoEm: antigo ? antigo.criadoEm : agora(),
    atualizadoEm: agora()
  };
  if(await gravarTemplate(t) === false) return;
  fecharFormTemplate();
  renderTemplates();
  avisar(antigo ? "Template atualizado" : "Template criado");
}
async function excluirTemplate(id){
  if(!perm.excluir){ negar("excluir"); return; }
  const t = templates.find(x => x.id === id); if(!t) return;
  if(!confirm('Excluir o template "'+(t.titulo||"sem título")+'"? Essa ação não pode ser desfeita.')) return;
  if(await apagarTemplate(id) === false) return;
  if(templateEditando === id) fecharFormTemplate();
  renderTemplates();
  avisar("Template excluído");
}
// Copies the text exactly as written (line breaks included). Falls back to a hidden
// textarea on browsers without the Clipboard API. The button shows "✓ Copiado" for 2 s.
async function copiarTexto(texto){
  try{ await navigator.clipboard.writeText(texto); return true; }
  catch(e){
    const ta = document.createElement("textarea");
    ta.value = texto; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    let ok;
    try{ ok = document.execCommand("copy"); }catch(_){ ok = false; }
    ta.remove();
    return ok;
  }
}
// Copies an e-mail (condo panel or Contatos page); the icon turns green for 1.5 s.
async function copiarEmail(email, botao){
  email = String(email || "").trim();
  if(!email){ avisar("Não há e-mail para copiar"); return; }
  await copiarComAviso(email, botao, "E-mail copiado: " + email);
}
// Copies a text, shows 'mensagem' and turns the small copy icon green for 1.5 s.
async function copiarComAviso(texto, botao, mensagem){
  if(!(await copiarTexto(texto))){ avisar("Não consegui copiar. Selecione o texto e copie manualmente.", true); return; }
  avisar(mensagem);
  if(botao){
    botao.classList.add("copiado");
    clearTimeout(botao._t);
    botao._t = setTimeout(() => botao.classList.remove("copiado"), 1500);
  }
}
async function copiarTemplate(id, botao){
  const t = templates.find(x => x.id === id); if(!t) return;
  const ok = await copiarTexto(t.texto);
  if(!ok){ avisar("Não consegui copiar. Selecione o texto e copie manualmente.", true); return; }
  avisar('Texto de "'+(t.titulo||"template")+'" copiado');
  if(botao){
    botao.classList.add("copiado");
    botao.querySelector("span").textContent = "Copiado";
    clearTimeout(botao._t);
    botao._t = setTimeout(() => { botao.classList.remove("copiado"); botao.querySelector("span").textContent = "Copiar"; }, 2000);
  }
}

/* ================= histórico ================= */
// =============================================================================
// HISTORY (change log)
// =============================================================================
// Adds an entry {when, what, who} to the start of the condo's history and keeps only the last 40.
function registrarAtualizacao(lead, descricao){
  lead.atualizadoEm = agora();
  lead.historico = lead.historico || [];
  lead.historico.unshift({quando:lead.atualizadoEm, o_que:descricao, por:meuNome||""});
  lead.historico = lead.historico.slice(0,40);
}
// Builds the 'Registro de atualizações' text: created on, last update, total, average frequency, last 6 changes.
function resumoFrequencia(lead){
  const h = lead.historico || [];
  const linhas = [
    "Cadastrado em <b>"+dataBR(lead.criadoEm)+"</b>"+(lead.criadoPor?" por <b>"+escapar(lead.criadoPor)+"</b>":""),
    "Última atualização: <b>"+dataBR(lead.atualizadoEm)+"</b> ("+textoDias(diasDesde(lead.atualizadoEm))+")",
    "Total de atualizações: <b>"+h.length+"</b>"
  ];
  if(h.length >= 2){
    const t = h.map(x=>new Date(x.quando).getTime());
    let soma = 0; for(let i=0;i<t.length-1;i++) soma += t[i]-t[i+1];
    const media = soma/(t.length-1)/86400000;
    linhas.push("Frequência média: <b>a cada "+(media<1?"menos de 1 dia":media.toFixed(1)+" dias")+"</b>");
  }
  const ultimos = h.slice(0,6).map(x=>"• "+dataBR(x.quando)+" — "+escapar(x.o_que)+(x.por?" ("+escapar(x.por)+")":"")).join("<br>");
  return linhas.join("<br>") + (ultimos ? "<br><br>"+ultimos : "");
}

/* ================= equipe ================= */
// =============================================================================
// TEAM
// =============================================================================
// List of names that can be 'responsável': team members + anyone already assigned to a condo.
// new Set removes duplicates; localeCompare sorts alphabetically with Portuguese rules.
function nomesEquipe(){
  const doBancoNomes = equipe.map(p=>p.nome).filter(Boolean);
  const dosLeads = leads.map(l=>l.responsavel).filter(Boolean);
  return [...new Set([...doBancoNomes, ...dosLeads])].sort((a,b)=>a.localeCompare(b,"pt-BR"));
}
// Fills the 'Responsável' dropdown in the panel and selects the current value.
function preencherResponsavel(valor){
  const sel = $("#f_responsavel");
  const nomes = nomesEquipe();
  sel.innerHTML = '<option value="">— sem responsável —</option>' +
    nomes.map(n=>'<option value="'+escapar(n)+'">'+escapar(n)+"</option>").join("");
  if(valor && !nomes.includes(valor)){
    sel.insertAdjacentHTML("beforeend", '<option value="'+escapar(valor)+'">'+escapar(valor)+"</option>");
  }
  sel.value = valor || "";
}
// Draws the team list in the Team panel.
function desenharEquipe(){
  const ul = $("#listaEquipe");
  if(!equipe.length){
    ul.innerHTML = '<li style="color:var(--tinta-suave);font-size:13px">Ninguém cadastrado ainda. Adicione você e suas sócias abaixo.</li>';
    return;
  }
  ul.innerHTML = equipe.map(p =>
    "<li><i class=\"inicial\">"+escapar((p.nome||"?").charAt(0).toUpperCase())+"</i>"+
    "<span>"+escapar(p.nome)+(p.email?'<br><span class="email">'+escapar(p.email)+"</span>":"")+"</span>"+
    '<button data-remover="'+escapar(p.id)+'">Remover</button></li>'
  ).join("");
}
// Adds a person to the team (in the database or locally), after checking the name isn't repeated.
async function adicionarEquipe(){
  if(bloqueado()) return;
  const nome = $("#eq_nome").value.trim();
  const email = $("#eq_email").value.trim();
  if(!nome){ avisar("Escreva o nome do responsável"); return; }
  if(equipe.some(p=>p.nome.toLowerCase()===nome.toLowerCase())){ avisar("Esse nome já está cadastrado"); return; }
  const novo = {id:gerarId(), nome, email:email||null};
  if(NUVEM){
    const {data,error} = await sb.from("equipe").insert({nome, email:email||null}).select().single();
    if(error){ avisar("Erro: "+error.message); return; }
    equipe.push(data);
  } else {
    equipe.push(novo);
    await gravarEquipe();
  }
  $("#eq_nome").value = ""; $("#eq_email").value = "";
  desenharEquipe(); desenhar(); avisar(nome+" entrou na equipe");
}
// Removes a person from the team. Their condos stay on the board.
async function removerEquipe(id){
  if(bloqueado()) return;
  const p = equipe.find(x=>String(x.id)===String(id));
  if(!p || !confirm("Remover "+p.nome+" da lista de responsáveis? Os leads dela continuam na Prospecção.")) return;
  if(NUVEM){
    const {error} = await sb.from("equipe").delete().eq("id", id);
    if(error){ avisar("Erro: "+error.message); return; }
  }
  equipe = equipe.filter(x=>String(x.id)!==String(id));
  await gravarEquipe(); desenharEquipe(); desenhar();
}

/* ================= painel ================= */
// =============================================================================
// CONDO PANEL (create / edit)
// =============================================================================
// Fills the 'Fase do funil' dropdown with the stages.
function preencherFases(){
  $("#f_fase").innerHTML = FASES.map(f=>'<option value="'+f.id+'">'+escapar(f.nome)+"</option>").join("");
}
// Highlights the selected status option.
function marcarSemaforo(){
  document.querySelectorAll("#semaforo label").forEach(l=>l.classList.toggle("on", l.querySelector("input").checked));
}
// Opens the panel.
// - With an id: loads that condo's data into every field (edit mode).
// - Without an id: clears everything (new condo), optionally pre-selecting a stage.
function abrirPainel(id, faseInicial){
  if(!id && !perm.criar){ negar("criar"); return; }
  editandoId = id || null;
  lemEditando = null;                    // no reminder starts in edit mode
  preencherFases();
  if(id){
    const l = leads.find(x=>x.id===id); if(!l) return;
    $("#tituloPainel").textContent = l.nome || "Condomínio sem nome";
    $("#f_nome").value=l.nome||""; preencherEndereco(l.endereco||"");
    $("#avisoNomeDuplicado").hidden = true; $("#avisoNomeDuplicado").innerHTML=""; delete $("#avisoNomeDuplicado").dataset.fechadoPara;
    $("#f_aptos").value=l.aptos??""; $("#f_fase").value=l.fase||"cadastro";
    $("#f_zona").value=l.zona||""; $("#f_importante").value=l.importante||"";
    contatosForm = migrarContatosAntigos(l);
    tipoOutroAberto = null;
    renderContatos();
    $("#f_concorrente").value=l.concorrente||"";
    $("#f_fimContrato").value=l.fimContrato||""; $("#f_perfil").value=l.perfil||"";
    observacoesForm = migrarNotasAntigas(l);
    obsEditandoIndex = null;
    $("#obsTexto").value = "";
    renderObservacoes();
    lembretesForm = (l.lembretes||[]).map(x=>Object.assign({},x));
    limparNovoLembrete(); renderLembretesForm();
    preencherResponsavel(l.responsavel||"");
    (document.querySelector('#semaforo input[value="'+(l.status||"nenhum")+'"]')||{}).checked = true;
    marcarSemaforo();
    $("#blocoHistorico").style.display=""; $("#historico").innerHTML = resumoFrequencia(l);
    $("#historico").hidden = true; $("#btnToggleHistorico").setAttribute("aria-expanded","false");
    $("#btnExcluir").style.display="";
  } else {
    $("#tituloPainel").textContent = "Novo condomínio";
    ["f_nome","f_aptos","f_zona","f_importante",
     "f_concorrente","f_fimContrato","f_perfil"]
      .forEach(x => $("#"+x).value = "");
    preencherEndereco("");
    $("#avisoNomeDuplicado").hidden = true; $("#avisoNomeDuplicado").innerHTML=""; delete $("#avisoNomeDuplicado").dataset.fechadoPara;
    contatosForm = [];
    tipoOutroAberto = null;
    renderContatos();
    observacoesForm = [];
    obsEditandoIndex = null;
    $("#obsTexto").value = "";
    renderObservacoes();
    lembretesForm = [];
    limparNovoLembrete(); renderLembretesForm();
    $("#f_fase").value = faseInicial || "cadastro";
    preencherResponsavel("");
    document.querySelector('#semaforo input[value="nenhum"]').checked = true;
    marcarSemaforo();
    $("#blocoHistorico").style.display="none"; $("#btnExcluir").style.display="none";
  }
  // Slide the panel in, show the dark overlay, and focus the name field after the animation.
  $("#painel").classList.add("aberto"); $("#fundo").classList.add("aberto");
  sultsForm = id ? !!(leads.find(x=>x.id===id)||{}).sults : false;
  quenteForm = id ? !!(leads.find(x=>x.id===id)||{}).quente : false;
  atualizarBotaoSults();
  atualizarBotaoQuente();
  atualizarBotaoRotaLead();
  atualizarBotaoVisitar();
  setTimeout(()=>focarSemTeclado("#f_nome"), 180);
}
// "Visitar" button, next to "Adicionar à rota" (only for saved condos).
// Unlike the form fields, it saves RIGHT AWAY when clicked (like the route button beside it),
// and the card gets a small car on its corner.
function atualizarBotaoVisitar(){
  const b = $("#btnVisitarLead");
  const l = editandoId ? leads.find(x=>x.id===editandoId) : null;
  const on = !!(l && l.visitar);
  b.classList.toggle("ativo", on);
  b.setAttribute("aria-pressed", on ? "true" : "false");
  b.innerHTML = ICONE_CARRO + (on ? " Marcado para visitar" : " Visitar");
  b.title = on ? "Marcado para visitar. Clique para desmarcar." : "Marcar este condomínio para visitar";
}
async function alternarVisitar(){
  if(!editandoId) return;
  if(!perm.editar){ negar("editar"); return; }
  const l = leads.find(x=>x.id===editandoId); if(!l) return;
  l.visitar = !l.visitar;
  registrarAtualizacao(l, l.visitar ? "Marcado para visitar" : "Desmarcado de visitar");
  atualizarBotaoVisitar();
  const ok = await gravarLead(l);
  desenhar();
  atualizarBotaoVisitar();              // if the database refused, this shows the real state again
  if(ok !== false) avisar((l.nome||"Condomínio")+(l.visitar ? " marcado para visitar" : " não está mais marcado para visitar"));
}
// Green SULTS toggle at the top of the panel. On = the card shows a green "S" badge
// next to the name of who edited last. The change is saved with the "Salvar" button.
function atualizarBotaoSults(){
  const b = $("#btnSults");
  b.classList.toggle("ativo", sultsForm);
  b.setAttribute("aria-pressed", sultsForm ? "true" : "false");
  b.textContent = "SULTS";
  b.title = sultsForm ? "Marcado como SULTS. Clique para desmarcar." : "Marcar este condomínio como SULTS";
}
// Orange "Quente" toggle next to SULTS: a hot contact. On = an orange flame next to the condo's
// name on the card. Like SULTS, the change is saved with the "Salvar" button.
function atualizarBotaoQuente(){
  const b = $("#btnQuente");
  b.classList.toggle("ativo", quenteForm);
  b.setAttribute("aria-pressed", quenteForm ? "true" : "false");
  b.innerHTML = ICONE_FOGO + "<span>Quente</span>";
  b.title = quenteForm ? "Contato quente. Clique para desmarcar." : "Marcar como contato quente";
}
// "Adicionar à rota" button in the panel. The route itself lives in mapa.js (window.__rota).
// Shows "Adicionar à rota de visitas" (with a pin icon) or "Na rota, parada 2 de 5. Remover".
// Hidden for a new condo (it has no id until it's saved).
function atualizarBotaoRotaLead(){
  const bloco = $("#blocoRotaLead"), btn = $("#btnRotaLead"), api = window.__rota;
  bloco.hidden = !editandoId;            // the block also holds the "Visitar" button
  btn.hidden = !api;                     // route button needs mapa.js
  if(bloco.hidden || !api) return;
  const na = api.tem(editandoId);
  btn.classList.toggle("na-rota", na);
  btn.textContent = na
    ? "Na rota, parada "+api.posicao(editandoId)+" de "+api.total()+". Remover"
    : "Adicionar à rota de visitas";
  btn.insertAdjacentHTML("afterbegin", na ? "" : ICONE_PIN+" ");
}
function alternarRotaLead(){
  if(bloqueado()) return;
  if(!editandoId || !window.__rota) return;
  const l = leads.find(x=>x.id===editandoId) || {};
  const entrou = window.__rota.alternar(editandoId);
  avisar(entrou
    ? (l.nome||"Condomínio")+" entrou na rota de visitas. Abra o Mapa para ver o trajeto."
    : (l.nome||"Condomínio")+" saiu da rota de visitas.");
}
// Closes the condo panel and the team panel.
function fecharTudo(){
  $("#painel").classList.remove("aberto");
  $("#painelEquipe").classList.remove("aberto");
  $("#fundo").classList.remove("aberto");
  editandoId = null;
}
// Opens the Team panel.
// On phones/tablets (touch screen) we don't put the cursor in a field by ourselves when a panel or
// form opens: that pops up the keyboard over the panel (and older iPhones also zoom in). The person
// taps the field they want. On a computer the field still gets focus, as before.
const telaDeToque = () => !!(window.matchMedia && matchMedia("(pointer:coarse)").matches);
function focarSemTeclado(sel){ if(!telaDeToque()){ const e = $(sel); if(e) e.focus(); } }
function abrirEquipe(){
  desenharEquipe();
  $("#painelEquipe").classList.add("aberto");
  $("#fundo").classList.add("aberto");
  setTimeout(()=>focarSemTeclado("#eq_nome"), 180);
}

// Reads every field in the panel and returns a condo object with those values.
function lerFormulario(){
  return {
    sults:sultsForm, quente:quenteForm,
    nome:$("#f_nome").value.trim(), endereco:$("#f_endereco").value.trim(),
    aptos:$("#f_aptos").value.trim(), fase:$("#f_fase").value,
    zona:$("#f_zona").value.trim(), importante:$("#f_importante").value.trim(),
    contatos:lerContatosForm(), concorrente:$("#f_concorrente").value.trim(),
    fimContrato:$("#f_fimContrato").value, perfil:$("#f_perfil").value.trim(),
    observacoes:observacoesForm, notas:formatarObservacoesTexto(observacoesForm),
    lembretes:lembretesForm.map(x=>Object.assign({},x)),
    responsavel:$("#f_responsavel").value,
    status:(document.querySelector("#semaforo input:checked")||{}).value || "nenhum"
  };
}

// Field names used to describe what changed in the history.
const RÓTULOS_CAMPO = {
  nome:"Nome do condomínio", endereco:"Endereço", aptos:"Nº de apartamentos",
  zona:"Zona", importante:"Informação importante",
  concorrente:"Concorrente", fimContrato:"Fim do contrato",
  perfil:"Perfil dos moradores", notas:"Observações", responsavel:"Responsável"
};
// Compares the condo before and after editing and returns a list of what changed,
// e.g. ["Fase: Reunião → Proposta Comercial", "Zona alterado(a)"].
function descreverAlteracoes(antes, depois){
  const partes = [];
  if(antes.fase !== depois.fase){
    partes.push("Fase: "+(FASES.find(f=>f.id===antes.fase)||{}).nome+" → "+(FASES.find(f=>f.id===depois.fase)||{}).nome);
  }
  const statusAntes = antes.status||"nenhum", statusDepois = depois.status||"nenhum";
  if(statusAntes !== statusDepois){
    partes.push("Situação: "+ROTULO_STATUS[statusAntes]+" → "+ROTULO_STATUS[statusDepois]);
  }
  if(JSON.stringify(antes.contatos||[]) !== JSON.stringify(depois.contatos||[])){
    partes.push("Contatos alterados");
  }
  if(JSON.stringify(antes.lembretes||[]) !== JSON.stringify(depois.lembretes||[])){
    partes.push("Lembretes alterados");
  }
  if(!!antes.sults !== !!depois.sults){
    partes.push(depois.sults ? "Marcado como SULTS" : "Desmarcado de SULTS");
  }
  if(!!antes.quente !== !!depois.quente){
    partes.push(depois.quente ? "Marcado como contato quente" : "Desmarcado de contato quente");
  }
  Object.keys(RÓTULOS_CAMPO).forEach(campo => {
    const v1 = (antes[campo] ?? "").toString().trim();
    const v2 = (depois[campo] ?? "").toString().trim();
    if(v1 !== v2) partes.push(RÓTULOS_CAMPO[campo]+" alterado(a)");
  });
  return partes;
}
// SAVE BUTTON. Checks permission, includes any note/reminder still typed but not added,
// then either updates the existing condo or creates a new one, and saves it.
async function salvar(){
  const acaoSalvar = editandoId ? "editar" : "criar";
  if(!perm[acaoSalvar]){ negar(acaoSalvar); return; }
  if(obsEditandoIndex !== null) salvarEdicaoObservacao(obsEditandoIndex);
  // a reminder still open in edit mode is applied too (stops if its date is empty)
  if(lemEditando && lemEditando.onde === "form" && !salvarEdicaoLembreteForm()) return;
  const obsPendente = $("#obsTexto").value.trim();
  if(obsPendente) adicionarObservacao();
  if($("#lem_data").value) adicionarLembreteForm(true);
  const dados = lerFormulario();
  try{
    if(editandoId){
      const l = leads.find(x=>x.id===editandoId);
      const antes = Object.assign({}, l);
      const partes = descreverAlteracoes(antes, dados);
      Object.assign(l, dados);
      const desc = partes.length ? partes.join(" · ") : "Cadastro editado (sem alterações detectadas)";
      registrarAtualizacao(l, desc);
      if(await gravarLead(l) === false){ fecharTudo(); desenhar(); return; }
      avisar("Alterações salvas");
    } else {
      // New condo: generate an id (a real UUID in cloud mode), set creation info and history,
      // then merge in the form data.
      const novo = Object.assign({
        id: NUVEM ? crypto.randomUUID() : gerarId(),
        criadoEm: agora(), atualizadoEm: agora(),
        criadoPor: meuNome || dados.responsavel || "",
        ordem: leads.length,
        historico:[{quando:agora(), o_que:"Condomínio cadastrado", por: meuNome||""}]
      }, dados);
      leads.push(novo);
      if(await gravarLead(novo) === false){ fecharTudo(); desenhar(); return; }
      avisar("Condomínio cadastrado");
    }
    fecharTudo(); desenhar();
  }catch(e){ /* erro já avisado */ }
}

// DELETE BUTTON. Asks for confirmation, removes the condo from the list and queues the deletion.
async function excluir(){
  if(!editandoId) return;
  if(!perm.excluir){ negar("excluir"); return; }
  const l = leads.find(x=>x.id===editandoId);
  if(!confirm('Excluir "'+(l.nome||"este condomínio")+'"? Essa ação não pode ser desfeita.')) return;
  const id = editandoId;
  leads = leads.filter(x=>x.id!==id);
  let ok;
  try{ ok = await apagarLead(id); }catch(e){}
  fecharTudo(); desenhar();
  if(ok !== false) avisar("Condomínio excluído");
}

/* ================= filtros e CSV ================= */
// =============================================================================
// FILTERS AND CSV EXPORT
// =============================================================================
// Refreshes the 'person responsible' filter options, keeping the current choice.
function atualizarFiltroResp(){
  const sel = $("#filtroResp"), atual = sel.value, nomes = nomesEquipe();
  sel.innerHTML = '<option value="">Todos os responsáveis</option>' +
    nomes.map(n=>'<option value="'+escapar(n)+'">'+escapar(n)+"</option>").join("");
  if(nomes.includes(atual)) sel.value = atual;
}
// Downloads all condos as a CSV file (opens in Excel).
// Uses ';' as separator (standard for Brazilian Excel), wraps every value in quotes,
// and starts with \uFEFF (BOM) so Excel reads the accents correctly.
function exportarCSV(){
  if(!leads.length){ avisar("Não há condomínios para exportar"); return; }
  const cab = ["Condomínio","Endereço","Zona","Apartamentos","Fase","Situação","Informação importante","Contatos",
    "Concorrente","Fim do contrato","Perfil dos moradores","Observações","Responsável","Cadastrado por",
    "Data de cadastro","Última atualização","Nº de atualizações","SULTS","Visitar","Contato quente"];
  const linhas = leads.map(l => [
    l.nome,l.endereco,l.zona,l.aptos,(FASES.find(f=>f.id===l.fase)||{}).nome,ROTULO_STATUS[l.status||"nenhum"],l.importante,
    (l.contatos||[]).map(c=>[c.nome,c.telefone,c.email].filter(Boolean).join(" / ")).join(" | "),
    l.concorrente,l.fimContrato?dataBR(l.fimContrato):"",l.perfil,l.notas,l.responsavel,l.criadoPor,
    dataBR(l.criadoEm),dataBR(l.atualizadoEm),(l.historico||[]).length,l.sults?"Sim":"Não",l.visitar?"Sim":"Não",l.quente?"Sim":"Não"
  ]);
  const csv = [cab,...linhas].map(r=>r.map(c=>'"'+String(c??"").replace(/"/g,'""')+'"').join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "minha-quitandinha-"+new Date().toISOString().slice(0,10)+".csv";
  a.click(); URL.revokeObjectURL(a.href);
  avisar("CSV gerado");
}

/* ================= entrada / sessão ================= */
// =============================================================================
// LOGIN AND SESSION
// =============================================================================
// Loads the Supabase library from the internet. Tries 3 different CDNs in order,
// in case one is down. Resolves when window.supabase exists.
function carregarSDK(){
  const fontes = [
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
    "https://unpkg.com/@supabase/supabase-js@2",
    "https://cdn.skypack.dev/@supabase/supabase-js@2"
  ];
  return new Promise((ok, falha) => {
    let i = 0;
    (function tentar(){
      if(i >= fontes.length){ falha(new Error("SDK indisponível")); return; }
      const s = document.createElement("script");
      s.src = fontes[i++];
      s.onload = () => window.supabase ? ok() : tentar();
      s.onerror = tentar;
      document.head.appendChild(s);
    })();
  });
}
// Shows the login screen, optionally with an error message.
function mostrarEntrada(msg){
  $("#entrada").classList.add("aberta");
  if(msg){ $("#erroEntrada").style.display=""; $("#erroEntrada").textContent = msg; }
  else $("#erroEntrada").style.display="none";
}
// Login: sends email + password to Supabase. On success, hides the login screen and starts the board.
async function entrar(){
  const email = $("#in_email").value.trim(), senha = $("#in_senha").value;
  if(!email || !senha){ mostrarEntrada("Preencha e-mail e senha."); return; }
  $("#btnEntrar").textContent = "Entrando...";
  const {data,error} = await sb.auth.signInWithPassword({email, password:senha});
  $("#btnEntrar").textContent = "Entrar";
  if(error){ mostrarEntrada("E-mail ou senha incorretos."); return; }
  sessao = data.session;
  entrouAgora = true;                     // the activity log says "Entrou no app" (not just "Abriu")
  $("#entrada").classList.remove("aberta");
  await iniciarQuadro();
}
// Logout: ends the session and reloads the page.
async function sair(){
  if(sb) await sb.auth.signOut();
  location.reload();
}

// Starts the board after login (or right away in local mode):
// 1) reload the offline queue, 2) load the data, 3) re-apply changes made offline and send them.
async function iniciarQuadro(){
  await carregarPendencias();
  await buscarTudo();
  window.__dadosProntos = true;                 // the visit route may now drop stops of deleted condos
  try{ await buscarAvulsos(); }catch(e){}       // standalone contacts (Contatos page)
  if(pendentes.size || paraExcluir.size){
    // havia coisas gravadas offline na última visita: sobem agora
    pendentes.forEach(l => {
      const i = leads.findIndex(x=>x.id===l.id);
      if(i >= 0) leads[i] = l; else leads.push(l);
    });
    paraExcluir.forEach(id => { leads = leads.filter(x=>x.id!==id); });
    await sincronizar(false);
  }
  // Cloud mode: find the user's name in the team (by email), load permissions,
  // check if they're an admin, and subscribe to REALTIME updates.
  if(NUVEM && sessao){
    const eu = equipe.find(p => p.email && p.email.toLowerCase() === sessao.user.email.toLowerCase());
    meuNome = eu ? eu.nome : sessao.user.email.split("@")[0];
    $("#nomeUsuario").textContent = meuNome;
    $("#btnSair").style.display = "";
    await carregarPermissoes();
    verificarAdmin();
    registrarAcesso();
    $("#btnMinhaSenha").hidden = false;
    // logged in with a temporary password (created or reset by an admin): must choose their own now
    if(sessao.user && sessao.user.user_metadata && sessao.user.user_metadata.trocar_senha) abrirMinhaSenha(true);
    $("#sinal").className = "sinal";
    // Realtime: whenever ANYONE changes the 'condominios' table, reload and redraw,
    // except while this user has the panel open or has unsaved changes.
    sb.channel("quadro")
      .on("postgres_changes",{event:"*",schema:"public",table:"condominios"}, async ()=>{
        if($("#painel").classList.contains("aberto")) return;   // não atrapalha quem está digitando
        if(pendentes.size || paraExcluir.size) return;          // não sobrescreve o que ainda não subiu
        await buscarTudo(); desenhar();
      })
      .subscribe();
    ultimaSync = Date.now();
    // The visit route follows the user across devices (table "rotas").
    if(window.__rota && window.__rota.sincronizar) window.__rota.sincronizar().catch(() => {});
  } else {
    $("#nomeUsuario").textContent = "Modo local";
    $("#sinal").className = "sinal local";
  }
  desenhar();
  verificarLembretes();
  restaurarTela();
}

/* ================= página aberta no endereço (#dashboard, #mapa…) ================= */
// REMEMBER THE OPEN PAGE: the page on screen is kept in the address (e.g. ".../#prospeccao"),
// so refreshing (or opening that link) comes back to the same page instead of the board.
// Watching the pages' "open" class means no open/close function needs to know about this.
const TELAS = [
  {hash:"dashboard",  aberta:() => dashboardAberto(),                         abrir:() => $("#btnDashboard").click()},
  {hash:"busca-condominio", aberta:() => !!(window.Prospeccao && Prospeccao.aberto()), abrir:() => $("#btnProspeccao").click()},
  {hash:"lembretes",  aberta:() => lembretesAberto(),                         abrir:() => $("#btnLembretes").click()},
  {hash:"contatos",   aberta:() => contatosAberto(),                          abrir:() => $("#btnContatos").click()},
  {hash:"templates",  aberta:() => templatesAberto(),                         abrir:() => $("#btnTemplates").click()},
  {hash:"equipe",     aberta:() => $("#painelEquipe").classList.contains("aberto"), abrir:() => $("#btnEquipe").click()},
  {hash:"mapa",       aberta:() => document.body.classList.contains("vista-mapa"), abrir:() => $("#btnVista").click()}
];
let telaRestaurada = false;
function lembrarTela(){
  if(!telaRestaurada) return;                       // don't erase the address before it's been used
  const t = TELAS.find(x => x.aberta());
  const novo = t ? "#" + t.hash : "";
  if(location.hash !== novo) history.replaceState(null, "", novo || location.pathname + location.search);
}
// Called once the board has loaded: opens the page named in the address, if any.
// Waits until every script has loaded (mapa.js and prospeccao.js handle some of the buttons).
function restaurarTela(){
  if(telaRestaurada) return;
  const fazer = () => {
    telaRestaurada = true;
    const antigos = {"#prospeccao": "#busca-condominio"};          // old links / bookmarks keep working
    const hash = antigos[location.hash] || location.hash;
    const t = TELAS.find(x => "#" + x.hash === hash);
    if(t && !t.aberta()) t.abrir();
  };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fazer, {once:true});
  else setTimeout(fazer, 0);
}
if(typeof MutationObserver === "function"){
  const vigia = new MutationObserver(() => lembrarTela());
  ["#telaDashboard", "#telaProspeccao", "#telaLembretes", "#telaContatos", "#telaTemplates", "#painelEquipe"]
    .forEach(sel => { const el = $(sel); if(el && el.nodeType) vigia.observe(el, {attributes:true, attributeFilter:["class"]}); });
  vigia.observe(document.body, {attributes:true, attributeFilter:["class"]});
}

// Entry point of the app (called at the very end of this file).
async function iniciar(){
  preencherFases();
  if(NUVEM){
    try{
      await carregarSDK();
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      // opened a "reset password" link from the e-mail: Supabase logs the person in; ask for the new password
      sb.auth.onAuthStateChange(ev => { if(ev === "PASSWORD_RECOVERY") setTimeout(() => abrirMinhaSenha(true, "recuperar"), 0); });
      const {data} = await sb.auth.getSession();
      if(data.session){ sessao = data.session; await iniciarQuadro(); }
      else mostrarEntrada();
    }catch(e){
      $("#sinal").className = "sinal off";
      if(navigator.onLine === false){
        // Opened with no internet (e.g. the installed app on a phone without signal): the app itself
        // opens (sw.js keeps a copy), but the condos live in the database. Reload by itself when it's back.
        $("#nomeUsuario").textContent = "Sem internet";
        avisar("Sem internet. Os condomínios aparecem assim que a conexão voltar.", true);
        window.addEventListener("online", () => location.reload(), {once:true});
      } else {
        $("#nomeUsuario").textContent = "Sem conexão com o banco";
        avisar("Não consegui conectar ao Supabase. Confira as chaves.");
      }
    }
  } else {
    await iniciarQuadro();
  }
}

/* ================= dashboard ================= */
// =============================================================================
// DASHBOARD PAGE (☰ → Dashboard): numbers of the whole funnel.
// calcularDashboard() only counts (easy to test); renderDashboard() draws it.
// It always uses ALL condos — the board filters (search, situation…) do not apply here.
// =============================================================================
// Size by number of apartments. 200–249 has no band in the original rule
// (P < 200, M = 250–300, G > 300), so it counts as M: M = 200 to 300.
const FAIXAS_TAMANHO = [
  {id:"P",   nome:"P", desc:"menos de 200 aptos"},
  {id:"M",   nome:"M", desc:"200 a 300 aptos"},
  {id:"G",   nome:"G", desc:"mais de 300 aptos"},
  {id:"sem", nome:"?", desc:"sem nº de aptos"}
];
const DIAS_PARADO = 30;          // "parado" = no change for this many days (open deals only)
const DIAS_FIM_CONTRATO = 90;    // competitor contracts ending within this many days
// Number of apartments, or null when empty / not a positive number.
function numAptos(l){
  if(l.aptos === "" || l.aptos == null) return null;
  const n = Number(l.aptos);
  return isFinite(n) && n > 0 ? n : null;
}
// "P", "M", "G" or "sem".
function faixaTamanho(l){
  const n = numAptos(l);
  if(n == null) return "sem";
  return n < 200 ? "P" : n <= 300 ? "M" : "G";
}
// Has a way to reach someone: at least one contact with a phone or an e-mail.
function temContato(l){
  return migrarContatosAntigos(l).some(c => String(c.telefone||"").trim() || String(c.email||"").trim());
}
// Nothing besides name/address/zone: no contact at all, no apartments, no competitor,
// no profile, notes, important info or observations.
function semInformacao(l){
  return !migrarContatosAntigos(l).some(c => String(c.nome||"").trim() || String(c.telefone||"").trim() || String(c.email||"").trim())
    && numAptos(l) == null && !String(l.concorrente||"").trim() && !String(l.perfil||"").trim()
    && !String(l.notas||"").trim() && !String(l.importante||"").trim() && !(l.observacoes||[]).length;
}
// Days until a date (negative = already passed), same rule as the card's competitor tag.
function diasAte(iso){ return Math.ceil((new Date(iso) - Date.now())/86400000); }

// Counts everything shown on the page.
function calcularDashboard(lista){
  const r = {
    total: lista.length, fases: {}, status: {verde:0, amarelo:0, vermelho:0, nenhum:0},
    tamanho: {P:0, M:0, G:0, sem:0}, comContato: 0, semContato: 0, semInfo: [],
    concorrentes: [], semConcorrente: 0, vencendo: [], aptosTotal: 0, aptosFechados: 0,
    lembretesVencidos: 0, visitar: 0, sults: 0, quentes: 0, parados: [], responsaveis: [], conversao: null
  };
  FASES.forEach(f => r.fases[f.id] = 0);
  const conc = new Map(), resp = new Map();
  const limiteParado = Date.now() - DIAS_PARADO*86400000;
  lista.forEach(l => {
    r.fases[r.fases[l.fase] != null ? l.fase : "cadastro"]++;
    const st = r.status[l.status] != null ? l.status : "nenhum";
    r.status[st]++;
    r.tamanho[faixaTamanho(l)]++;
    const n = numAptos(l) || 0;
    r.aptosTotal += n;
    if(st === "verde") r.aptosFechados += n;
    if(temContato(l)) r.comContato++; else r.semContato++;
    if(semInformacao(l)) r.semInfo.push(l);
    // competitor minimarket, grouped ignoring accents/case (keeps the first spelling seen)
    const nomeConc = String(l.concorrente||"").trim();
    if(nomeConc){
      const k = normalizarNome(nomeConc);
      if(!conc.has(k)) conc.set(k, {nome: nomeConc, n: 0});
      conc.get(k).n++;
      if(l.fimContrato && diasAte(l.fimContrato) <= DIAS_FIM_CONTRATO) r.vencendo.push(l);
    } else r.semConcorrente++;
    const nomeResp = String(l.responsavel||"").trim();
    if(!resp.has(nomeResp)) resp.set(nomeResp, 0);
    resp.set(nomeResp, resp.get(nomeResp) + 1);
    if(lembreteVencido(l)) r.lembretesVencidos++;
    if(l.visitar) r.visitar++;
    if(l.sults) r.sults++;
    if(l.quente) r.quentes++;
    const t = new Date(l.atualizadoEm || l.criadoEm || 0).getTime();
    if(st !== "verde" && st !== "vermelho" && t && t < limiteParado) r.parados.push(l);
  });
  r.concorrentes = [...conc.values()].sort((a,b) => b.n - a.n || a.nome.localeCompare(b.nome, "pt-BR"));
  r.responsaveis = [...resp.entries()].map(([nome, n]) => ({nome, n}))
    .sort((a,b) => (a.nome ? 0 : 1) - (b.nome ? 0 : 1) || b.n - a.n || a.nome.localeCompare(b.nome, "pt-BR"));
  r.vencendo.sort((a,b) => new Date(a.fimContrato) - new Date(b.fimContrato));
  r.parados.sort((a,b) => new Date(a.atualizadoEm || a.criadoEm) - new Date(b.atualizadoEm || b.criadoEm));
  r.semInfo.sort((a,b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));
  const decididos = r.status.verde + r.status.vermelho;
  r.conversao = decididos ? Math.round(r.status.verde / decididos * 100) : null;
  return r;
}

// ---- groups: which condos are behind each number ----
// Every clickable number has a key (e.g. "fase:reuniao", "tam:M", "conc:market4u").
// grupoDashboard(key) returns the title, the condos in it, and (when it makes sense)
// a board filter for the "Ver no quadro" button.
function grupoDashboard(chave, lista){
  lista = lista || leads;
  const [tipo, ...resto] = String(chave).split(":");
  const val = resto.join(":");
  const st = l => ROTULO_STATUS[l.status] ? l.status : "nenhum";
  const porNome = arr => arr.slice().sort((a,b) => String(a.nome||"").localeCompare(String(b.nome||""), "pt-BR"));
  const g = (titulo, filtro, quadro, ordenar) => {
    const arr = lista.filter(filtro);
    return {titulo, lista: ordenar ? ordenar(arr) : porNome(arr), quadro: quadro || null};
  };
  const limiteParado = Date.now() - DIAS_PARADO*86400000;
  switch(tipo){
    case "todos":    return g("Todos os condomínios", () => true);
    case "aptos":    return g("Condomínios com nº de apartamentos", l => numAptos(l) != null, null,
                         arr => arr.sort((a,b) => numAptos(b) - numAptos(a)));
    case "fase": {
      const f = FASES.find(x => x.id === val);
      return g("Fase: "+(f ? f.nome : val), l => (FASES.some(x => x.id === l.fase) ? l.fase : "cadastro") === val, {fase: val});
    }
    case "status":   return g("Situação: "+(ROTULO_STATUS[val] || val), l => st(l) === val, {status: val});
    case "tam": {
      const f = FAIXAS_TAMANHO.find(x => x.id === val);
      return g("Tamanho "+(f ? f.nome+" — "+f.desc : val), l => faixaTamanho(l) === val, null,
        arr => arr.sort((a,b) => (numAptos(b)||0) - (numAptos(a)||0) || String(a.nome||"").localeCompare(String(b.nome||""), "pt-BR")));
    }
    case "contato":  return val === "com"
      ? g("Com contato (telefone ou e-mail)", temContato)
      : g("Sem contato (sem telefone nem e-mail)", l => !temContato(l));
    case "seminfo":  return g("Sem informação", semInformacao);
    case "conc": {
      if(!val) return g("Sem concorrente", l => !String(l.concorrente||"").trim());
      const um = lista.find(l => normalizarNome(l.concorrente) === val);
      const nome = um ? String(um.concorrente).trim() : val;
      return g("Concorrente: "+nome, l => normalizarNome(l.concorrente) === val, {busca: nome});
    }
    case "vencendo": return g("Contrato do concorrente vencendo (até "+DIAS_FIM_CONTRATO+" dias)",
                         l => String(l.concorrente||"").trim() && l.fimContrato && diasAte(l.fimContrato) <= DIAS_FIM_CONTRATO, null,
                         arr => arr.sort((a,b) => new Date(a.fimContrato) - new Date(b.fimContrato)));
    case "resp":     return val
      ? g("Responsável: "+val, l => String(l.responsavel||"").trim() === val, {resp: val})
      : g("Sem responsável", l => !String(l.responsavel||"").trim());
    case "lembrete": return g("Com lembrete vencido", lembreteVencido);
    case "visitar":  return g("Para visitar", l => !!l.visitar);
    case "sults":    return g("No SULTS", l => !!l.sults, {status: "sults:sim"});
    case "quente":   return g("Contatos quentes", l => !!l.quente, {status: "quente:sim"});
    case "parados":  return g("Parados há mais de "+DIAS_PARADO+" dias (em aberto)", l => {
                         const t = new Date(l.atualizadoEm || l.criadoEm || 0).getTime();
                         return st(l) !== "verde" && st(l) !== "vermelho" && t && t < limiteParado;
                       }, null, arr => arr.sort((a,b) => new Date(a.atualizadoEm || a.criadoEm) - new Date(b.atualizadoEm || b.criadoEm)));
  }
  return {titulo: "", lista: [], quadro: null};
}

// ---- drawing ----
const pctDb = (n, total) => total ? Math.round(n / total * 100) : 0;
const numBR = n => Number(n).toLocaleString("pt-BR");
const attrGrupo = chave => 'data-db-grupo="'+escapar(chave)+'" title="Ver quais condomínios"';
// One row with label, count, % and a bar. Click = list of those condos.
function barraDb(rotulo, n, total, chave, cls){
  const pct = pctDb(n, total);
  return '<button type="button" '+attrGrupo(chave)+' class="db-barra'+(cls ? " "+cls : "")+'">'+
    '<span class="db-rot">'+rotulo+'</span>'+
    '<span class="db-num">'+n+' <small>'+pct+'%</small></span>'+
    '<span class="db-trilha"><i style="width:'+pct+'%"></i></span></button>';
}
// List of condo names (click = open the condo). 'extra' adds a small text on the right.
function listaDb(arr, extra, vazio){
  if(!arr.length) return '<p class="db-vazio">'+vazio+'</p>';
  return '<ul class="db-lista">'+arr.map(l =>
    '<li><button type="button" data-db-lead="'+escapar(l.id)+'">'+escapar(l.nome || "Sem nome")+'</button>'+
    (extra ? '<span>'+extra(l)+'</span>' : '')+'</li>').join("")+'</ul>';
}
function kpiDb(valor, rotulo, sub, cls, chave){
  return '<button type="button" '+attrGrupo(chave)+' class="db-kpi'+(cls ? " "+cls : "")+'"><b>'+valor+'</b><span>'+rotulo+'</span>'+(sub ? '<small>'+sub+'</small>' : '')+'</button>';
}
function cartaoDb(titulo, corpo, cls){
  return '<section class="db-cartao'+(cls ? " "+cls : "")+'"><h3>'+titulo+'</h3>'+corpo+'</section>';
}
function textoVencimento(l){
  const d = diasAte(l.fimContrato);
  return d < 0 ? "vencido" : d === 0 ? "vence hoje" : "vence em "+plural(d, "dia", "dias");
}
function renderDashboard(){
  const r = calcularDashboard(leads), T = r.total;
  if(!T){
    $("#dbConteudo").innerHTML = '<p class="db-vazio db-vazio-grande">Nenhum condomínio cadastrado ainda. Quando você cadastrar, os números aparecem aqui.</p>';
    if(dashDetalhe) fecharDetalheDashboard();
    return;
  }
  const html = [];
  // big numbers
  html.push('<div class="db-kpis">'+
    kpiDb(T, "condomínios", "", "destaque", "todos")+
    kpiDb(numBR(r.aptosTotal), "apartamentos no funil", r.aptosFechados ? numBR(r.aptosFechados)+" em condomínios fechados" : "", "", "aptos")+
    kpiDb(r.comContato, "com contato", pctDb(r.comContato, T)+"% do total", "ok", "contato:com")+
    kpiDb(r.semInfo.length, "sem informação", "", r.semInfo.length ? "alerta" : "", "seminfo")+
    kpiDb(r.status.verde, "fechados", r.conversao == null ? "" : r.conversao+"% de conversão", "ok", "status:verde")+
    kpiDb(r.lembretesVencidos, "com lembrete vencido", "", r.lembretesVencidos ? "perigo" : "", "lembrete")+
  '</div>');
  const cartoes = [];
  // stages
  cartoes.push(cartaoDb("Por fase", FASES.map(f =>
    barraDb(escapar(f.nome), r.fases[f.id], T, "fase:"+f.id)).join("")));
  // size
  cartoes.push(cartaoDb("Tamanho", '<div class="db-tamanhos">'+FAIXAS_TAMANHO.map(f =>
    '<button type="button" '+attrGrupo("tam:"+f.id)+' class="db-tam'+(f.id === "sem" ? " sem" : "")+'"><b>'+f.nome+'</b><strong>'+r.tamanho[f.id]+'</strong>'+
    '<span>'+f.desc+'</span><small>'+pctDb(r.tamanho[f.id], T)+'%</small></button>').join("")+'</div>'));
  // contacts / information
  cartoes.push(cartaoDb("Contato e informação",
    barraDb("Com contato (telefone ou e-mail)", r.comContato, T, "contato:com", "ok")+
    barraDb("Sem contato", r.semContato, T, "contato:sem", "alerta")+
    barraDb("Sem informação", r.semInfo.length, T, "seminfo", "perigo")+
    '<h4>Quais estão sem informação</h4>'+
    listaDb(r.semInfo, null, "Todos têm alguma informação.")));
  // competitor minimarket
  cartoes.push(cartaoDb("Minimercado concorrente",
    r.concorrentes.map(c => barraDb(escapar(c.nome), c.n, T, "conc:"+normalizarNome(c.nome), "alerta")).join("")+
    barraDb("Sem concorrente", r.semConcorrente, T, "conc:", "ok")+
    '<h4>Contrato do concorrente vencendo (até '+DIAS_FIM_CONTRATO+' dias)</h4>'+
    listaDb(r.vencendo, l => escapar(l.concorrente)+', '+textoVencimento(l),
      "Nenhum contrato vencendo nos próximos "+DIAS_FIM_CONTRATO+" dias.")));
  // situation
  cartoes.push(cartaoDb("Situação", ["verde","amarelo","vermelho","nenhum"].map(s =>
    barraDb(escapar(ROTULO_STATUS[s]), r.status[s], T, "status:"+s, "st-"+s)).join("")));
  // people
  cartoes.push(cartaoDb("Por responsável", r.responsaveis.map(p => p.nome
    ? barraDb(escapar(p.nome), p.n, T, "resp:"+p.nome)
    : barraDb("Sem responsável", p.n, T, "resp:", "alerta")).join("")));
  // follow-up
  cartoes.push(cartaoDb("Acompanhamento",
    '<div class="db-mini">'+
      '<button type="button" '+attrGrupo("visitar")+'><b>'+r.visitar+'</b> para visitar</button>'+
      '<button type="button" '+attrGrupo("quente")+'><b>'+r.quentes+'</b> '+(r.quentes === 1 ? "contato quente" : "contatos quentes")+'</button>'+
      '<button type="button" '+attrGrupo("sults")+'><b>'+r.sults+'</b> no SULTS</button>'+
      '<button type="button" '+attrGrupo("parados")+'><b>'+r.parados.length+'</b> parados há '+DIAS_PARADO+'+ dias</button>'+
    '</div>'+
    '<h4>Parados há mais de '+DIAS_PARADO+' dias (em aberto)</h4>'+
    listaDb(r.parados, l => "desde "+dataBR(l.atualizadoEm || l.criadoEm), "Nenhum condomínio parado.")));
  html.push('<div class="db-grade">'+cartoes.join("")+'</div>');
  $("#dbConteudo").innerHTML = html.join("");
  if(dashDetalhe) renderDetalheDashboard();   // keep the open list up to date
}

// ---- the list window ("which condos?") ----
let dashDetalhe = null;   // key of the group being shown, or null
// One line per condo: name (opens it) and a summary of what we know.
function linhaDetalheDb(l, chave){
  const fase = (FASES.find(f => f.id === l.fase) || FASES.find(f => f.id === "cadastro")).nome;
  const st = ROTULO_STATUS[l.status] ? l.status : "nenhum";
  const contatos = migrarContatosAntigos(l);
  const c = contatos.find(x => String(x.telefone||"").trim() || String(x.email||"").trim());
  const info = [escapar(fase), escapar(ROTULO_STATUS[st])];
  info.push(numAptos(l) != null ? numAptos(l)+" aptos" : "sem nº de aptos");
  if(l.responsavel) info.push(escapar(l.responsavel));
  if(l.zona) info.push(escapar(l.zona));
  const linha2 = [];
  if(c) linha2.push("Contato: "+escapar([c.nome, c.telefone || c.email].filter(Boolean).join(", ")));
  else if(contatos.some(x => x.nome)) linha2.push("Contato: "+escapar(contatos.find(x => x.nome).nome)+", sem telefone nem e-mail");
  if(l.concorrente) linha2.push("Concorrente: "+escapar(l.concorrente)+(l.fimContrato ? ", contrato "+textoVencimento(l).replace(/^vence/, "vence")+" ("+dataBR(l.fimContrato)+")" : ""));
  if(chave === "parados") linha2.push("Sem mudanças desde "+dataBR(l.atualizadoEm || l.criadoEm));
  const lem = proximoLembrete(l);
  if(lem && (chave === "lembrete" || lembreteVencido(l))) linha2.push("Lembrete: "+escapar(lem.texto || "sem texto")+", "+dataBR(dtLembrete(lem)));
  return '<li class="db-det-item st-'+st+'">'+
    '<button type="button" data-db-lead="'+escapar(l.id)+'">'+escapar(l.nome || "Sem nome")+'</button>'+
    '<span class="db-det-info">'+info.join(", ")+'</span>'+
    (linha2.length ? '<span class="db-det-extra">'+linha2.join("<br>")+'</span>' : '')+
  '</li>';
}
function renderDetalheDashboard(){
  const grp = grupoDashboard(dashDetalhe);
  $("#dbDetTitulo").textContent = grp.titulo;
  $("#dbDetResumo").textContent = grp.lista.length === 1 ? "1 condomínio" : grp.lista.length+" condomínios";
  $("#dbDetQuadro").hidden = $("#dbDetRodape").hidden = !grp.quadro;
  $("#dbDetLista").innerHTML = grp.lista.length
    ? grp.lista.map(l => linhaDetalheDb(l, dashDetalhe.split(":")[0])).join("")
    : '<li class="db-vazio">Nenhum condomínio aqui.</li>';
}
function abrirDetalheDashboard(chave){
  dashDetalhe = chave;
  renderDetalheDashboard();
  $("#dbDetalhe").hidden = false;
  $("#dbDetLista").scrollTop = 0;
  $("#dbDetFechar").focus();
}
function fecharDetalheDashboard(){ dashDetalhe = null; $("#dbDetalhe").hidden = true; }
function detalheDashboardAberto(){ return !$("#dbDetalhe").hidden; }
// "Ver no quadro": close everything and apply that filter on the board.
function verGrupoNoQuadro(){
  const q = (grupoDashboard(dashDetalhe).quadro) || {};
  fecharDetalheDashboard();
  fecharDashboard();
  if(q.status){ $("#filtroStatus").value = q.status; desenhar(); }
  else if(q.resp){ $("#filtroResp").value = q.resp; desenhar(); }
  else if(q.busca){ $("#busca").value = q.busca; desenhar(); }
  else if(q.fase){
    const col = document.querySelector('.coluna[data-fase="'+q.fase+'"]');
    if(col){
      col.scrollIntoView({behavior:"smooth", block:"nearest", inline:"center"});
      col.classList.add("piscar"); setTimeout(() => col.classList.remove("piscar"), 1600);
    }
  }
}

function dashboardAberto(){ return $("#telaDashboard").classList.contains("aberta"); }
function abrirDashboard(){ fecharDetalheDashboard(); renderDashboard(); $("#telaDashboard").classList.add("aberta"); $("#telaDashboard .tela-lem-corpo").scrollTop = 0; }
function fecharDashboard(){ fecharDetalheDashboard(); $("#telaDashboard").classList.remove("aberta"); }
// Clicks inside the dashboard: a condo name opens the condo; any number opens its list.
function cliqueDashboard(e){
  const lead = e.target.closest("[data-db-lead]");
  if(lead){ abrirPainel(lead.dataset.dbLead); return; }   // the panel opens on top of the page
  const grp = e.target.closest("[data-db-grupo]");
  if(grp) abrirDetalheDashboard(grp.dataset.dbGrupo);
}

/* ================= menu lateral (☰) ================= */
// SIDE MENU: Dashboard, Mapa, Prospecção, Administração, Lembretes, Equipe, Contatos, Templates.
// The menu buttons keep their old ids, so their own click handlers (here and in mapa.js) still run;
// this code only opens/closes the drawer.
// 'inert' on the closed menu keeps keyboard focus out of the hidden buttons.
function menuAberto(){ return $("#menuLateral").classList.contains("aberto"); }
function abrirMenu(){
  const m = $("#menuLateral");
  m.inert = false;
  m.classList.add("aberto");
  $("#menuFundo").hidden = false;
  $("#btnMenu").setAttribute("aria-expanded", "true");
  const primeiro = m.querySelector(".menu-item:not([hidden])");
  if(primeiro) setTimeout(() => primeiro.focus(), 50);
}
// devolverFoco = put the keyboard focus back on ☰ (when closing with Esc or ✕)
function fecharMenu(devolverFoco){
  const m = $("#menuLateral");
  m.classList.remove("aberto");
  m.inert = true;
  $("#menuFundo").hidden = true;
  $("#btnMenu").setAttribute("aria-expanded", "false");
  if(devolverFoco) $("#btnMenu").focus();
}

/* ================= eventos ================= */
// =============================================================================
// EVENTS: connect buttons/inputs to the functions above
// addEventListener("click", fn) = "when this is clicked, run fn".
// =============================================================================
// Side menu: ☰ toggles it; ✕ or a click on the dark background closes it;
// choosing an item closes it (the item's own action runs too).
$("#btnMenu").addEventListener("click", ()=>{ menuAberto() ? fecharMenu() : abrirMenu(); });
$("#btnFecharMenu").addEventListener("click", ()=>fecharMenu(true));
$("#menuFundo").addEventListener("click", ()=>fecharMenu());
$("#menuLateral").addEventListener("click", e=>{ if(e.target.closest(".menu-item")) fecharMenu(); });
$("#btnNovo").addEventListener("click", ()=>abrirPainel(null));
$("#btnFechar").addEventListener("click", fecharTudo);
$("#btnFecharEquipe").addEventListener("click", fecharTudo);
$("#btnCancelar").addEventListener("click", fecharTudo);
$("#fundo").addEventListener("click", fecharTudo);
$("#btnSalvar").addEventListener("click", salvar);
$("#btnExcluir").addEventListener("click", excluir);
$("#btnExportar").addEventListener("click", exportarCSV);
$("#btnEquipe").addEventListener("click", abrirEquipe);
$("#btnSync").addEventListener("click", ()=>sincronizar(true));
$("#btnToggleHistorico").addEventListener("click", ()=>{
  const btn = $("#btnToggleHistorico"), corpo = $("#historico");
  const abrir = corpo.hidden;
  corpo.hidden = !abrir;
  btn.setAttribute("aria-expanded", abrir ? "true" : "false");
});
// When the internet comes back, try to send pending changes.
window.addEventListener("online", ()=>sincronizar(false));
// Warn the user before closing the tab if there are unsaved changes.
window.addEventListener("beforeunload", e=>{
  if(pendentes.size || paraExcluir.size){ e.preventDefault(); e.returnValue = ""; }
});
// Every 30 seconds: retry sending pending changes (or just refresh the 'saved X min ago' text).
setInterval(()=>{ if(pendentes.size || paraExcluir.size) sincronizar(false); else atualizarBotaoSync(); }, 30000);
$("#linkEquipe").addEventListener("click", ()=>{ fecharTudo(); abrirEquipe(); });
$("#btnAddEquipe").addEventListener("click", adicionarEquipe);
$("#btnEntrar").addEventListener("click", entrar);
// Eye button: toggles the password between hidden (type=password) and visible (type=text) and swaps the icon.
$("#btnOlho").addEventListener("click", ()=>{
  const campo = $("#in_senha"), btn = $("#btnOlho");
  const mostrando = campo.type === "text";
  campo.type = mostrando ? "password" : "text";
  btn.setAttribute("aria-pressed", String(!mostrando));
  btn.setAttribute("aria-label", mostrando ? "Mostrar senha" : "Ocultar senha");
  $("#iconeOlho").innerHTML = mostrando
    ? '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'
    : '<path d="M3 3l18 18"/><path d="M10.6 10.6a3 3 0 0 0 4.2 4.2"/><path d="M9.4 5.2A9.5 9.5 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1"/><path d="M6.2 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 3.6-.7"/>';
  campo.focus();
});
$("#btnSair").addEventListener("click", sair);
$("#in_senha").addEventListener("keydown", e=>{ if(e.key==="Enter") entrar(); });
$("#eq_nome").addEventListener("keydown", e=>{ if(e.key==="Enter") adicionarEquipe(); });
// Any change in the search or filters redraws the board.
$("#busca").addEventListener("input", desenhar);
$("#filtroStatus").addEventListener("change", desenhar);
$("#filtroResp").addEventListener("change", desenhar);
$("#filtroDataDe").addEventListener("change", desenhar);
$("#filtroDataAte").addEventListener("change", desenhar);
$("#btnLimparData").addEventListener("click", ()=>{
  $("#filtroDataDe").value = ""; $("#filtroDataAte").value = "";
  desenhar();
});
$("#semaforo").addEventListener("change", marcarSemaforo);
// Esc key: cancel note editing, or close the reminders page, or close the panels.
document.addEventListener("keydown", e=>{
  if(e.key==="Escape"){
    if(menuAberto()){ fecharMenu(true); return; }
    if(minhaSenhaAberta()){ fecharMinhaSenha(); return; }       // (does nothing when it's mandatory)
    if(!$("#admSenhaDlg").hidden){ fecharNovaSenhaAdmin(); return; }
    if(atividadeAberta()){ fecharAtividade(); return; }
    // Contacts page: Esc closes its form first, then the page (if no condo panel is open on top)
    if(window.Prospeccao && Prospeccao.aberto() && !$("#painel").classList.contains("aberto")){ Prospeccao.fechar(); return; }
    if(dashboardAberto() && !$("#painel").classList.contains("aberto")){
      if(detalheDashboardAberto()) fecharDetalheDashboard(); else fecharDashboard();
      return;
    }
    if(templatesAberto()){
      if(!$("#tpForm").hidden) fecharFormTemplate(); else fecharTemplates();
      return;
    }
    if(contatosAberto() && !$("#painel").classList.contains("aberto")){
      if(!$("#ctForm").hidden) fecharFormAvulso(); else fecharContatos();
      return;
    }
    if(obsEditandoIndex !== null){ cancelarEdicaoObservacao(); }
    else if(!$("#painel").classList.contains("aberto") && !$("#painelEquipe").classList.contains("aberto") && lembretesAberto()) fecharLembretes();
    else fecharTudo();
  }
});
// ONE click listener for the whole page ("event delegation").
// Buttons created dynamically carry data-* attributes; e.target.closest("[data-x]") finds
// the clicked button even if you clicked the icon inside it.
document.addEventListener("click", e=>{
  const inverter = e.target.closest("[data-inverter]");
  if(inverter){
    const faseId = inverter.dataset.inverter;
    colunasInvertidas[faseId] = !colunasInvertidas[faseId];
    salvarColunasInvertidas();
    desenhar();
    return;
  }
  const add = e.target.closest("[data-add]");
  if(add) abrirPainel(null, add.dataset.add);
  const rem = e.target.closest("[data-remover]");
  if(rem) removerEquipe(rem.dataset.remover);
  const remObs = e.target.closest("[data-remover-obs]");
  if(remObs) removerObservacaoForm(parseInt(remObs.dataset.removerObs,10));
  const copObs = e.target.closest("[data-copiar-obs]");
  if(copObs){ const o = observacoesForm[parseInt(copObs.dataset.copiarObs,10)]; if(o) copiarComAviso(o.texto, copObs, "Observação copiada"); }
  const editObs = e.target.closest("[data-editar-obs]");
  if(editObs) editarObservacao(parseInt(editObs.dataset.editarObs,10));
  const cancelObs = e.target.closest("[data-cancelar-obs]");
  if(cancelObs) cancelarEdicaoObservacao();
  const saveObs = e.target.closest("[data-salvar-obs]");
  if(saveObs) salvarEdicaoObservacao(parseInt(saveObs.dataset.salvarObs,10));
  const tipoOk = e.target.closest("[data-tipo-ok]");
  if(tipoOk) confirmarTipoOutro(parseInt(tipoOk.dataset.tipoOk,10));
  if(e.target.closest("[data-tipo-cancelar]")) cancelarTipoOutro();
  const remContato = e.target.closest("[data-remover-contato]");
  if(remContato) removerContatoForm(parseInt(remContato.dataset.removerContato,10));
  const btnWhats = e.target.closest("[data-whats-contato]");
  if(btnWhats){
    const item = btnWhats.closest(".contato-item");
    const tel = item ? item.querySelector(".contato-tel").value : "";
    const link = whatsappLink(tel);
    if(link) window.open(link, "_blank");
    else avisar("Telefone inválido para abrir o WhatsApp");
  }
  const btnCopiarEmail = e.target.closest("[data-copiar-email]");
  if(btnCopiarEmail){
    e.preventDefault();                   // inside a <label>: don't send the click to the input
    const item = btnCopiarEmail.closest(".contato-item");
    copiarEmail(item ? item.querySelector(".contato-email").value : "", btnCopiarEmail);
  }
  // "Ligar": reads the number typed right now and opens the phone's keypad.
  const btnLigar = e.target.closest("[data-ligar-contato]");
  if(btnLigar){
    const item = btnLigar.closest(".contato-item");
    const link = telLink(item ? item.querySelector(".contato-tel").value : "");
    if(link) ligarPara(link);
    else avisar("Telefone inválido para ligar");
  }
});
// Typing in a contact field updates the matching entry in contatosForm (data-i = contact index).
document.addEventListener("input", e=>{
  const i = e.target.dataset.i;
  if(i===undefined) return;
  const idx = parseInt(i,10);
  if(!contatosForm[idx]) return;
  if(e.target.classList.contains("contato-nome")){
    contatosForm[idx].nome = e.target.value;
    const tipo = document.querySelector('#contatosLista .contato-tipo[data-i="'+idx+'"]');
    if(tipo) tipo.hidden = !e.target.value.trim();     // "Vínculo" appears after the name is filled
  }
  else if(e.target.classList.contains("contato-tel")) contatosForm[idx].telefone = e.target.value;
  else if(e.target.classList.contains("contato-email")) contatosForm[idx].email = e.target.value;
});
// "Quem é" dropdown: picking "Outro…" opens a text box to type a new type.
document.addEventListener("change", e=>{
  if(!e.target.classList.contains("contato-tipo-sel")) return;
  const idx = parseInt(e.target.dataset.i,10);
  if(!contatosForm[idx]) return;
  if(e.target.value === "__outro"){ tipoOutroAberto = idx; renderContatos(); }
  else contatosForm[idx].tipo = e.target.value;
});
// In the "Outro…" box: Enter = OK, Esc = cancel (without closing the whole panel).
$("#contatosLista").addEventListener("keydown", e=>{
  if(!e.target.classList.contains("tipo-outro-txt")) return;
  const idx = parseInt(e.target.dataset.i,10);
  if(e.key === "Enter"){ e.preventDefault(); confirmarTipoOutro(idx); }
  if(e.key === "Escape"){ e.stopPropagation(); cancelarTipoOutro(); }
});
// Ctrl+Enter (Cmd+Enter on Mac) while editing a note saves it.
document.addEventListener("keydown", e=>{
  if(e.target && e.target.id === "obsEditarTexto" && e.key==="Enter" && (e.ctrlKey||e.metaKey)){
    e.preventDefault();
    salvarEdicaoObservacao(parseInt($("[data-salvar-obs]").dataset.salvarObs,10));
  }
});

// Reminder-related buttons.
$("#btnLembretes").addEventListener("click", ()=>abrirLembretes());
$("#btnFecharLembretes").addEventListener("click", fecharLembretes);
$("#lemSoMeus").addEventListener("change", ()=>{ renderPainelLembretes(); });
$("#btnAddLem").addEventListener("click", ()=>adicionarLembreteForm());
$("#lem_texto").addEventListener("keydown", e=>{ if(e.key==="Enter"){ e.preventDefault(); adicionarLembreteForm(); } });
// Asks the browser for permission to show desktop notifications.
$("#btnNotif").addEventListener("click", async ()=>{
  try{ await Notification.requestPermission(); }catch(_){}
  renderPainelLembretes();
  if(Notification.permission==="granted") avisar("Avisos ativados enquanto o sistema estiver aberto.");
});
// Quick date buttons (Hoje, Amanhã, Em 3 dias...): fill the date field with today + N days.
$("#lemRapido").addEventListener("click", e=>{
  const b = e.target.closest("[data-dias]"); if(!b) return;
  const d = new Date(); d.setDate(d.getDate()+parseInt(b.dataset.dias,10));
  $("#lem_data").value = dataLocalInput(d);
});
// Clicks on reminder buttons and tabs (again using event delegation).
// - data-form="1" -> reminder inside the panel (changes only the unsaved form copy)
// - data-lid      -> reminder on the reminders page (changes the saved condo)
document.addEventListener("click", e=>{
  const aba = e.target.closest("[data-lem-aba]");
  if(aba){ lemAba = aba.dataset.lemAba; renderPainelLembretes(); return; }
  const abrir = e.target.closest("[data-abrir-lead]");
  if(abrir){ const id = abrir.dataset.abrirLead; fecharTudo(); abrirPainel(id); return; }
  // ações dentro do formulário do condomínio (ainda não salvas)
  const doForm = e.target.closest('[data-form="1"]');
  if(doForm){
    const idx = parseInt((doForm.dataset.lemFeito ?? doForm.dataset.lemReabrir ?? doForm.dataset.lemAdiar ?? doForm.dataset.lemSemana ?? doForm.dataset.lemIcs ??
      doForm.dataset.lemRemover ?? doForm.dataset.lemEditar ?? doForm.dataset.lemSalvarEd ?? doForm.dataset.lemCancelarEd),10);
    const lem = lembretesForm[idx]; if(!lem) return;
    if(doForm.dataset.lemEditar !== undefined){ lemEditando = {onde:"form", idx}; renderLembretesForm(); return; }
    if(doForm.dataset.lemSalvarEd !== undefined){ salvarEdicaoLembreteForm(); return; }
    if(doForm.dataset.lemCancelarEd !== undefined){ lemEditando = null; renderLembretesForm(); return; }
    if(doForm.dataset.lemFeito !== undefined){ lem.feito = true; lem.feitoEm = agora(); }
    else if(doForm.dataset.lemReabrir !== undefined){ lem.feito = false; lem.feitoEm = null; }
    else if(doForm.dataset.lemAdiar !== undefined) adiarLembrete(lem, 1);
    else if(doForm.dataset.lemSemana !== undefined) adiarLembrete(lem, 7);
    else if(doForm.dataset.lemIcs !== undefined){ baixarICS(leadAtualDoForm(), lem); return; }
    else if(doForm.dataset.lemRemover !== undefined){ if(!confirm("Excluir este lembrete?")) return; lembretesForm.splice(idx,1); lemEditando = null; }
    else return;
    renderLembretesForm();
    return;
  }
  // ações no painel geral (já salvas)
  // Maps each data attribute (e.g. data-lem-feito) to an action name and runs it.
  const mapa = [["lemFeito","feito"],["lemReabrir","reabrir"],["lemAdiar","adiar"],["lemSemana","semana"],["lemIcs","ics"],["lemRemover","remover"],
    ["lemEditar","editar"],["lemSalvarEd","salvarEd"],["lemCancelarEd","cancelarEd"]];
  for(const [attr,acao] of mapa){
    const el = e.target.closest("[data-"+attr.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())+"]");
    if(el && el.dataset.lid){ acaoLembrete(el.dataset.lid, parseInt(el.dataset[attr],10), acao); return; }
  }
});
// While editing a reminder: Enter = Salvar, Esc = Cancelar (without closing the panel or the page).
["#lemLista", "#lemPainelLista"].forEach(sel => $(sel).addEventListener("keydown", e=>{
  if(!lemEditando || !["lemEdData","lemEdHora","lemEdTexto"].includes(e.target.id)) return;
  const noForm = lemEditando.onde === "form";
  if(e.key === "Enter"){
    e.preventDefault();
    if(noForm) salvarEdicaoLembreteForm(); else acaoLembrete(lemEditando.onde, lemEditando.idx, "salvarEd");
  }
  if(e.key === "Escape"){
    e.stopPropagation();
    lemEditando = null;
    if(noForm) renderLembretesForm(); else renderPainelLembretes();
  }
}));
// Check reminders every 30 seconds.
setInterval(()=>verificarLembretes(), 30000);
$("#btnAddObs").addEventListener("click", adicionarObservacao);
$("#btnAddContato").addEventListener("click", adicionarContato);
$("#obsTexto").addEventListener("keydown", e=>{
  if(e.key==="Enter" && (e.ctrlKey||e.metaKey)){ e.preventDefault(); adicionarObservacao(); }
});

// Check for similar names while typing the condo name.
$("#f_nome").addEventListener("input", verificarNomeDuplicado);
// "Visitar" button in the panel (saves right away).
$("#btnVisitarLead").addEventListener("click", alternarVisitar);
// Dashboard page.
$("#btnDashboard").addEventListener("click", abrirDashboard);
$("#btnFecharDashboard").addEventListener("click", fecharDashboard);
$("#dbConteudo").addEventListener("click", cliqueDashboard);
$("#dbDetalhe").addEventListener("click", e=>{
  if(e.target.id === "dbDetalhe" || e.target.closest("#dbDetFechar")){ fecharDetalheDashboard(); return; }   // background or ✕
  if(e.target.closest("#dbDetQuadro")){ verGrupoNoQuadro(); return; }
  cliqueDashboard(e);
});
// Templates page.
$("#btnTemplates").addEventListener("click", abrirTemplates);
$("#btnFecharTemplates").addEventListener("click", fecharTemplates);
$("#tpBusca").addEventListener("input", renderTemplates);
$("#btnNovoTemplate").addEventListener("click", ()=>abrirFormTemplate(null));
$("#tpForm").addEventListener("submit", e=>{ e.preventDefault(); salvarTemplate(); });
$("#tpCancelar").addEventListener("click", fecharFormTemplate);
$("#tpGrade").addEventListener("click", e=>{
  const c = e.target.closest("[data-tp-copiar]");
  if(c){ copiarTemplate(c.dataset.tpCopiar, c); return; }
  const ed = e.target.closest("[data-tp-editar]");
  if(ed){ abrirFormTemplate(ed.dataset.tpEditar); return; }
  const ex = e.target.closest("[data-tp-excluir]");
  if(ex) excluirTemplate(ex.dataset.tpExcluir);
});
// Contacts page.
$("#btnContatos").addEventListener("click", abrirContatos);
$("#btnFecharContatos").addEventListener("click", fecharContatos);
$("#ctBusca").addEventListener("input", renderContatosPagina);
$("#ctFiltroTipo").addEventListener("change", renderContatosPagina);
$("#btnNovoContato").addEventListener("click", ()=>abrirFormAvulso(null));
$("#btnExportarContatos").addEventListener("click", exportarContatos);
$("#ctForm").addEventListener("submit", e=>{ e.preventDefault(); salvarAvulso(); });
$("#ctCancelar").addEventListener("click", fecharFormAvulso);
$("#ct_tipo").addEventListener("change", ()=>{
  const outro = $("#ct_tipo").value === "__outro";
  $("#ct_tipoOutro").hidden = !outro;
  if(outro) $("#ct_tipoOutro").focus();
});
$("#ctCorpo").addEventListener("click", e=>{
  const cp = e.target.closest("[data-ct-copiar]");
  if(cp){ copiarEmail(cp.dataset.ctCopiar, cp); return; }
  const abrir = e.target.closest("[data-ct-abrir]");
  if(abrir){ abrirPainel(abrir.dataset.ctAbrir); return; }   // the panel opens on top of the page
  const ed = e.target.closest("[data-ct-editar]");
  if(ed){ abrirFormAvulso(ed.dataset.ctEditar); return; }
  const ex = e.target.closest("[data-ct-excluir]");
  if(ex) excluirAvulso(ex.dataset.ctExcluir);
});
// SULTS toggle in the panel.
$("#btnSults").addEventListener("click", ()=>{ if(bloqueado()) return; sultsForm = !sultsForm; atualizarBotaoSults(); });
// "Quente" (hot contact) toggle in the panel.
$("#btnQuente").addEventListener("click", ()=>{ if(bloqueado()) return; quenteForm = !quenteForm; atualizarBotaoQuente(); });
// Read-only users: lock the condo panel's fields again whenever its content is redrawn (contacts, notes…).
if(typeof MutationObserver === "function") new MutationObserver(() => travarPainel()).observe($("#painel"), {childList:true, subtree:true});
// Visit route button in the panel; mapa.js fires "rota-mudou" whenever the route changes.
$("#btnRotaLead").addEventListener("click", alternarRotaLead);
document.addEventListener("rota-mudou", atualizarBotaoRotaLead);

/* ================= administração (organizações, membros, acessos) ================= */
// =============================================================================
// ADMIN (organizations, members, permissions)
// =============================================================================
// Roles and their default permissions, in the order: see all, create, edit, delete (1 = yes, 0 = no).
const ADM_PAPEIS = {admin:[1,1,1,1], editor:[1,1,1,0], vendedor:[0,1,1,0], leitor:[1,0,0,0]}; // vê todos, cria, edita, exclui
// admOrgs = organizations list, admSel = selected organization id, admSuper = is super-admin.
let admOrgs = [], admSel = null, admSuper = false, admMembros = [];

// Calls a database function (RPC) and shows an error message if it fails.
async function admRpc(nome, args){
  const {data, error} = await sb.rpc(nome, args || {});
  if(error){ avisar(error.message); throw error; }
  return data;
}
// chamado logo após o login: quem é admin (ou super-admin) ganha o botão
async function verificarAdmin(){
  try{
    const [sup, adm] = await Promise.all([sb.rpc("sou_super"), sb.rpc("sou_admin")]);
    if(adm.error || !adm.data) return;
    admSuper = !!sup.data;
    souAdmin = true;                       // admins can delete any note in the team notepad
    $("#btnAdmin").hidden = false;
    $("#nomeUsuario").textContent = meuNome + (admSuper ? " · super-admin" : " · admin");
  }catch(e){}
}
// Opens the admin screen. Only super-admins can create new organizations.
async function admAbrir(){
  $("#admTela").hidden = false;
  $("#admNova").hidden = !admSuper;
  $("#admPapelNovo").innerHTML = Object.keys(ADM_PAPEIS).map(p => `<option${p==="editor"?" selected":""}>${p}</option>`).join("");
  if(!$("#admSenha").value) $("#admSenha").value = gerarSenha();
  $("#admResultado").hidden = true;
  await admCarregarOrgs();
}
// Loads organizations; keeps the current selection if 'manter' (keep) is true.
async function admCarregarOrgs(manter){
  admOrgs = await admRpc("admin_organizacoes");
  if(!manter || !admOrgs.find(o => o.id === admSel)) admSel = (admOrgs.find(o => o.ativa) || admOrgs[0] || {}).id || null;
  admDesenharOrgs();
  await admCarregarMembros();
}
// Draws the organizations list (uses template literals: `text ${value}`).
function admDesenharOrgs(){
  $("#admOrgs").innerHTML = admOrgs.map(o => `
    <div class="adm-org ${o.id===admSel?"sel":""}" data-org="${o.id}">
      <b>${escapar(o.nome)}</b>${o.ativa?'<span class="adm-tag">você está aqui</span>':""}
      <small>${plural(o.membros, "membro", "membros")}, ${plural(o.condominios, "condomínio", "condomínios")}</small>
      ${admSuper && !o.ativa ? `<div class="adm-linha"><button class="adm-b" data-entrar="${escapar(o.nome)}">Entrar nesta organização</button></div>` : ""}
    </div>`).join("") || '<p class="adm-dica">Nenhuma organização.</p>';
  const at = admOrgs.find(o => o.ativa);
  if(admSuper && at) $("#nomeUsuario").textContent = meuNome + " · super-admin · " + at.nome;
}
// Loads and draws the members table of the selected organization with permission checkboxes.
async function admCarregarMembros(){
  const org = admOrgs.find(o => o.id === admSel);
  $("#admBloco").hidden = !org;
  $("#admTitulo").textContent = org ? "Membros de " + org.nome : "Selecione uma organização";
  if(!org) return;
  const ms = admMembros = await admRpc("admin_membros", {p_org: org.id});
  // each checkbox has its own label: hidden on the laptop (the table header says it), shown on phones (one card per person)
  const ck = (c, v, rot) => `<td class="c"><label class="adm-ck"><input type="checkbox" class="${c}"${v?" checked":""}><span>${rot}</span></label></td>`;
  $("#admCorpo").innerHTML = ms.map(m => `
    <tr data-u="${m.user_id}"${m.ativo ? "" : ' class="adm-inativo"'}>
      <td class="adm-quem"><button type="button" class="adm-pessoa" data-ativ="${escapar(m.user_id)}" title="Ver o que ${escapar(m.usuario || m.email)} tem feito">${escapar(m.email)}</button><span class="adm-dica">${escapar(m.usuario)}${m.ativo ? "" : ' <b class="adm-cancelado">Acesso cancelado</b>'}</span></td>
      <td class="adm-papel"><select class="papel" aria-label="Papel">${Object.keys(ADM_PAPEIS).map(p => `<option${p===m.papel?" selected":""}>${p}</option>`).join("")}</select></td>
      ${ck("ativo",m.ativo,"Ativo")}${ck("ver",m.ver_todos,"Vê todos")}${ck("criar",m.pode_criar,"Cria")}${ck("editar",m.pode_editar,"Edita")}${ck("excluir",m.pode_excluir,"Exclui")}
      <td class="adm-botoes"><button class="adm-b admSalvar">Salvar</button>
        <button class="adm-b admNovaSenha" title="Definir uma senha temporária e enviar por e-mail">Nova senha</button>
        ${m.user_id === (sessao && sessao.user && sessao.user.id) ? "" : m.ativo
          ? '<button class="adm-b adm-x admCancelar" title="Bloqueia o login: a pessoa não consegue mais entrar">Cancelar acesso</button>'
          : '<button class="adm-b adm-ok admReativar" title="Libera o login de novo">Reativar</button>'}
        <button class="adm-b adm-x admRemover" title="Tira a pessoa desta organização (o login continua existindo)">Remover</button></td>
    </tr>`).join("") || '<tr><td colspan="8" class="adm-dica">Ninguém ainda.</td></tr>';
}
// Admin screen events.
$("#btnAdmin").addEventListener("click", admAbrir);
$("#admFechar").addEventListener("click", () => { fecharAtividade(); $("#admTela").hidden = true; });
// Clicks inside the admin screen: enter an organization, select one,
// save a member's permissions, or remove a member.
$("#admTela").addEventListener("click", async e => {
  const t = e.target;
  try{
    if(t.dataset.entrar){
      avisar(await admRpc("entrar_organizacao", {p_nome: t.dataset.entrar}));
      await carregarPermissoes();
      await admCarregarOrgs(true);
      if(!pendentes.size && !paraExcluir.size){ await buscarTudo(); desenhar(); }   // recarrega o quadro na nova organização
      return;
    }
    const pessoa = t.closest("[data-ativ]");
    if(pessoa){ await abrirAtividade(pessoa.dataset.ativ); return; }
    const org = t.closest(".adm-org");
    if(org){ admSel = org.dataset.org; admDesenharOrgs(); await admCarregarMembros(); return; }
    const tr = t.closest("tr[data-u]");
    if(t.classList.contains("admNovaSenha")){ abrirNovaSenhaAdmin(tr.dataset.u); return; }
    if(t.classList.contains("admCancelar") || t.classList.contains("admReativar")){
      const cancelar = t.classList.contains("admCancelar");
      const m = admMembros.find(x => x.user_id === tr.dataset.u) || {};
      if(cancelar && !confirm("Cancelar o acesso de " + (m.usuario || m.email) + "?\n\nO login fica bloqueado: a pessoa não consegue mais entrar. Os dados que ela cadastrou continuam. Dá para reativar depois.")) return;
      t.disabled = true;
      const r = await admFuncao({acao: cancelar ? "cancelar" : "reativar", org: admSel, user: tr.dataset.u});
      t.disabled = false;
      if(r){ avisar(cancelar ? "Acesso de " + (m.usuario || m.email) + " cancelado." : "Acesso de " + (m.usuario || m.email) + " reativado."); await admCarregarMembros(); }
      return;
    }
    if(t.classList.contains("admSalvar")){
      const v = c => tr.querySelector("." + c).checked;
      await admRpc("admin_definir_acesso", {p_user: tr.dataset.u, p_papel: tr.querySelector(".papel").value,
        p_ativo: v("ativo"), p_ver: v("ver"), p_criar: v("criar"), p_editar: v("editar"), p_excluir: v("excluir")});
      avisar("Acesso salvo.");
    }
    if(t.classList.contains("admRemover") && confirm("Remover esta pessoa da organização?")){
      await admRpc("admin_remover_membro", {p_user: tr.dataset.u});
      avisar("Membro removido."); await admCarregarOrgs(true);
    }
  }catch(_){}
});
// Changing a member's role auto-fills the suggested permission checkboxes.
$("#admTela").addEventListener("change", e => {
  if(!e.target.classList.contains("papel")) return;
  const tr = e.target.closest("tr"), p = ADM_PAPEIS[e.target.value];
  ["ver","criar","editar","excluir"].forEach((c,i) => tr.querySelector("." + c).checked = !!p[i]);
});
// Create a new organization (super-admin only), then select it so its first users can be created right away.
$("#admCriarOrg").addEventListener("click", async () => {
  const nome = $("#admNomeOrg").value.trim(); if(!nome) return;
  try{
    await admRpc("criar_organizacao", {p_nome: nome}); $("#admNomeOrg").value = "";
    admOrgs = await admRpc("admin_organizacoes");
    const nova = admOrgs.find(o => normalizarNome(o.nome) === normalizarNome(nome));
    if(nova) admSel = nova.id;
    admDesenharOrgs(); await admCarregarMembros();
    avisar("Organização " + nome + " criada. Agora crie os usuários dela.");
    $("#admNovoNome").focus();
  }catch(_){}
});

// =============================================================================
// USERS (Administração): create, cancel / reactivate, new password.
// All through the Edge Function "admin-usuarios" (supabase/functions/admin-usuarios): creating a
// login needs Supabase's secret key, which never comes to the browser. The function checks that
// you are a super-admin, or an admin of that organization, before doing anything.
// =============================================================================
const SENHA_MINIMA = 8;
// Random temporary password, easy to read and type (no 0/O, 1/l/I), with upper, lower, digit and a symbol.
function gerarSenha(tamanho = 12, aleatorio){
  const MAI = "ABCDEFGHJKLMNPQRSTUVWXYZ", MIN = "abcdefghijkmnopqrstuvwxyz", NUM = "23456789", SIM = "-_.!@#";
  const todos = MAI + MIN + NUM + SIM;
  const rnd = aleatorio || (n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; });
  const pega = c => c[rnd(c.length)];
  const out = [pega(MAI), pega(MIN), pega(NUM), pega(SIM)];
  while(out.length < tamanho) out.push(pega(todos));
  for(let i = out.length - 1; i > 0; i--){ const j = rnd(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out.join("");
}
// Plain-language reason when the e-mail with the password didn't go out.
function motivoEmailTexto(m){
  return m === "sem_config" ? "o envio de e-mail ainda não está configurado no Supabase (RESEND_API_KEY / EMAIL_FROM)"
    : m === "erro_envio" ? "o serviço de e-mail recusou o envio (confira o remetente EMAIL_FROM no Resend)"
    : m === "nao_pedido" ? "você escolheu não enviar" : "";
}
// Turns an error from sb.functions.invoke into a message that says what is really wrong:
//  - our function answered with an error ({codigo, erro}) -> its own message;
//  - 404 -> the function isn't published (or has another name);
//  - Supabase refused the login BEFORE reaching the function ("Invalid JWT"), or the browser couldn't
//    reach it at all (FunctionsFetchError) -> usually "Verify JWT" is on: the function checks the login itself.
async function mensagemErroFuncao(error){
  const ctx = error && error.context, status = ctx && typeof ctx.status === "number" ? ctx.status : 0;
  let j = null;
  try{ if(ctx && typeof ctx.json === "function") j = await ctx.json(); }catch(_){}
  if(j && j.codigo && j.erro) return j.erro;                                   // our function's own message
  const txt = (j && (j.message || j.msg || j.error)) || "";
  if(status === 404)
    return "A função “admin-usuarios” não foi encontrada no Supabase. Confira se ela foi publicada com esse nome exato (veja supabase/README.md).";
  if(status === 401 || /jwt/i.test(txt))
    return "O Supabase recusou o pedido antes de chegar à função (" + (txt || "401") + "). No Supabase, abra Edge Functions → admin-usuarios → Details e desligue “Verify JWT”: a função já confere o login sozinha.";
  if(!status || (error && error.name === "FunctionsFetchError"))
    return "Não consegui falar com a função “admin-usuarios”. Se ela já está publicada, desligue “Verify JWT” em Edge Functions → admin-usuarios → Details e tente de novo. Se continuar, veja a aba Logs da função.";
  return (txt || (error && error.message) || "Erro na função") + " (código " + status + "). Veja a aba Logs da função no Supabase.";
}
// Calls the Edge Function. Returns the answer, or null after showing the error.
async function admFuncao(corpo){
  try{
    const {data, error} = await sb.functions.invoke("admin-usuarios", {body: corpo});
    if(!error) return data;
    avisar(await mensagemErroFuncao(error), true);
  }catch(e){
    avisar("Não foi possível falar com o servidor: " + (e && e.message || e), true);
  }
  return null;
}
// After creating: says what happened and, if the e-mail didn't go out, shows the password to pass on.
function mostrarResultadoUsuario(r, email, senha){
  const box = $("#admResultado");
  let html;
  if(r.jaExistia) html = "<b>"+escapar(email)+"</b> já tinha login: foi adicionado a esta organização com a senha que já usava.";
  else if(r.emailEnviado) html = "Usuário criado. Enviamos a senha para <b>"+escapar(email)+"</b>. No primeiro acesso a pessoa cria uma senha própria.";
  else html = "Usuário criado, mas o e-mail <b>não</b> foi enviado ("+escapar(motivoEmailTexto(r.motivoEmail))+"). "+
    "Passe estes dados para a pessoa:<span class=\"adm-dados\">"+escapar(email)+" &nbsp;·&nbsp; senha <code>"+escapar(senha)+"</code>"+
    " <button type=\"button\" class=\"adm-b\" data-copiar-acesso>Copiar</button></span>";
  box.innerHTML = html;
  box.className = "adm-resultado" + (r.jaExistia || r.emailEnviado ? "" : " atencao");
  box.dataset.acesso = "E-mail: " + email + "\nSenha temporária: " + senha + "\nEndereço: " + location.origin + location.pathname;
  box.hidden = false;
}
$("#admGerarSenha").addEventListener("click", () => { $("#admSenha").value = gerarSenha(); });
$("#admResultado").addEventListener("click", e => {
  const b = e.target.closest("[data-copiar-acesso]");
  if(b) copiarComAviso($("#admResultado").dataset.acesso, b, "Dados de acesso copiados");
});
$("#admNovoForm").addEventListener("submit", async e => {
  e.preventDefault();
  const org = admOrgs.find(o => o.id === admSel); if(!org) return;
  const nome = $("#admNovoNome").value.trim(), email = $("#admEmail").value.trim().toLowerCase(), senha = $("#admSenha").value;
  if(!nome){ avisar("Escreva o nome da pessoa.", true); $("#admNovoNome").focus(); return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){ avisar("E-mail inválido.", true); $("#admEmail").focus(); return; }
  if(senha.length < SENHA_MINIMA){ avisar("A senha precisa ter pelo menos " + SENHA_MINIMA + " caracteres. Use “Gerar”.", true); $("#admSenha").focus(); return; }
  const b = $("#admAdd"); b.disabled = true; b.textContent = "Criando…";
  const r = await admFuncao({acao: "criar", org: org.id, nome, email, papel: $("#admPapelNovo").value, senha, enviarEmail: $("#admEnviarEmail").checked});
  b.disabled = false; b.textContent = "Criar usuário";
  if(!r) return;
  mostrarResultadoUsuario(r, email, senha);
  $("#admNovoNome").value = ""; $("#admEmail").value = ""; $("#admSenha").value = gerarSenha();
  await admCarregarOrgs(true);
});
// "Nova senha" for a member: small dialog with the temporary password.
let admSenhaPara = null;
function abrirNovaSenhaAdmin(userId){
  const m = admMembros.find(x => x.user_id === userId); if(!m) return;
  admSenhaPara = m;
  $("#admSenhaQuem").textContent = (m.usuario ? m.usuario + ", " : "") + m.email + ". A pessoa vai precisar criar uma senha própria no próximo acesso.";
  $("#admSenhaNova").value = gerarSenha();
  $("#admSenhaEmail").checked = true;
  $("#admSenhaDlg").hidden = false;
  $("#admSenhaNova").select();
}
function fecharNovaSenhaAdmin(){ $("#admSenhaDlg").hidden = true; admSenhaPara = null; }
$("#admSenhaGerar").addEventListener("click", () => { $("#admSenhaNova").value = gerarSenha(); });
$("#admSenhaCancelar").addEventListener("click", fecharNovaSenhaAdmin);
$("#admSenhaForm").addEventListener("submit", async e => {
  e.preventDefault();
  const m = admSenhaPara, senha = $("#admSenhaNova").value; if(!m) return;
  if(senha.length < SENHA_MINIMA){ avisar("A senha precisa ter pelo menos " + SENHA_MINIMA + " caracteres.", true); return; }
  const r = await admFuncao({acao: "nova_senha", org: admSel, user: m.user_id, senha, enviarEmail: $("#admSenhaEmail").checked});
  if(!r) return;
  fecharNovaSenhaAdmin();
  mostrarResultadoUsuario({emailEnviado: r.emailEnviado, motivoEmail: r.motivoEmail}, m.email, senha);
  if(r.emailEnviado) $("#admResultado").innerHTML = "Nova senha enviada para <b>"+escapar(m.email)+"</b>. No próximo acesso a pessoa cria uma senha própria.";
});

// =============================================================================
// MY PASSWORD: anyone can change their own password (☰ → Minha senha). After logging in with a
// temporary password (user_metadata.trocar_senha) or opening a reset link, it opens by itself
// and can't be skipped.
// =============================================================================
let senhaObrigatoria = false;
function abrirMinhaSenha(obrigatoria, motivo){
  senhaObrigatoria = !!obrigatoria;
  $("#senhaTitulo").textContent = obrigatoria ? "Crie sua senha" : "Minha senha";
  $("#senhaTexto").textContent = motivo === "recuperar"
    ? "Escolha uma senha nova para entrar no KMD3 Market (pelo menos " + SENHA_MINIMA + " caracteres)."
    : obrigatoria
      ? "Você entrou com uma senha temporária. Crie uma senha só sua para continuar (pelo menos " + SENHA_MINIMA + " caracteres)."
      : "Escolha uma senha nova, com pelo menos " + SENHA_MINIMA + " caracteres.";
  $("#senhaCancelar").hidden = !!obrigatoria;
  $("#senhaNova").value = ""; $("#senhaRepete").value = ""; $("#senhaErro").hidden = true;
  $("#senhaMostrar").checked = false; $("#senhaNova").type = $("#senhaRepete").type = "password";
  $("#senhaDlg").hidden = false;
  $("#senhaNova").focus();
}
function fecharMinhaSenha(){ if(senhaObrigatoria) return; $("#senhaDlg").hidden = true; }
const minhaSenhaAberta = () => !$("#senhaDlg").hidden;
function erroSenha(msg){ $("#senhaErro").textContent = msg; $("#senhaErro").hidden = false; }
// Supabase's English messages, in Portuguese.
function traduzirErroSenha(m){
  m = String(m || "");
  if(/different from the old/i.test(m)) return "A nova senha precisa ser diferente da anterior.";
  if(/at least|too short|weak/i.test(m)) return "Senha fraca: use pelo menos " + SENHA_MINIMA + " caracteres, misturando letras e números.";
  if(/reauthenticat|session/i.test(m)) return "Sua sessão expirou. Saia e entre de novo para trocar a senha.";
  return m || "Não foi possível trocar a senha.";
}
$("#senhaMostrar").addEventListener("change", e => { $("#senhaNova").type = $("#senhaRepete").type = e.target.checked ? "text" : "password"; });
$("#senhaCancelar").addEventListener("click", fecharMinhaSenha);
$("#btnMinhaSenha").addEventListener("click", () => abrirMinhaSenha(false));
$("#senhaForm").addEventListener("submit", async e => {
  e.preventDefault();
  const a = $("#senhaNova").value, b = $("#senhaRepete").value;
  if(a.length < SENHA_MINIMA) return erroSenha("A senha precisa ter pelo menos " + SENHA_MINIMA + " caracteres.");
  if(a !== b) return erroSenha("As duas senhas não são iguais.");
  const btn = $("#senhaSalvar"); btn.disabled = true; btn.textContent = "Salvando…";
  const {error} = await sb.auth.updateUser({password: a, data: {trocar_senha: false}});
  btn.disabled = false; btn.textContent = "Salvar senha";
  if(error) return erroSenha(traduzirErroSenha(error.message));
  senhaObrigatoria = false;
  $("#senhaDlg").hidden = true;
  avisar("Senha alterada. Use a nova senha da próxima vez que entrar.");
});
// Login screen: "Esqueci minha senha" sends Supabase's reset link to the typed e-mail.
$("#btnEsqueci").addEventListener("click", async () => {
  const email = $("#in_email").value.trim();
  if(!email){ mostrarEntrada("Escreva seu e-mail acima e clique de novo em “Esqueci minha senha”."); $("#in_email").focus(); return; }
  if(!sb) return;
  const {error} = await sb.auth.resetPasswordForEmail(email, {redirectTo: location.origin + location.pathname});
  if(error && /rate|seconds/i.test(error.message || "")){ mostrarEntrada("Aguarde um minuto antes de pedir outro link."); return; }
  mostrarEntrada();
  avisar("Se este e-mail tiver acesso, enviamos um link para criar uma senha nova. Confira a caixa de entrada.");
});

/* ================= atividade de cada pessoa (Administração → clicar no e-mail) ================= */
// =============================================================================
// MEMBER ACTIVITY: in the admin screen, clicking a person shows what they have been doing.
// Two sources:
//  1. the "atividades" table (database/atividades.sql): the database itself writes a line for every
//     condo / template / contact created, changed or deleted, and the app writes when someone logs in;
//  2. the condos' own "Registro de atualizações" (historico), matched by the person's name. It works
//     even before atividades.sql is installed, and fills in the time before the table existed.
// =============================================================================
let entrouAgora = false, atividadeSemTabela = false;
const ATIV_ABRIU_MIN = 30;   // "Abriu o app" is written at most once every 30 minutes per device

// Writes "Entrou no app" (after typing the password) or "Abriu o app" (session already open).
async function registrarAcesso(){
  if(!NUVEM || !sb || !sessao || atividadeSemTabela) return;
  const acao = entrouAgora ? "entrou" : "abriu";
  entrouAgora = false;
  try{
    const ult = Number(localStorage.getItem("quitandinha:ultimoAcessoLog") || 0);
    if(acao === "abriu" && Date.now() - ult < ATIV_ABRIU_MIN * 60000) return;
    const {error} = await sb.from("atividades").insert({acao, tipo:"app", usuario:sessao.user.id, email:sessao.user.email});
    if(error){ if(tabelaFaltando(error)) atividadeSemTabela = true; return; }
    localStorage.setItem("quitandinha:ultimoAcessoLog", String(Date.now()));
  }catch(e){}
}
// "relation does not exist" (Postgres) or "table not found" (PostgREST): atividades.sql not run yet.
function tabelaFaltando(error){
  return !!error && (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message || ""));
}

// Plain-language sentence for one line of the "atividades" table.
const ATIV_TIPOS = {condominio:["o condomínio","Cadastrou o condomínio"], template:["o template","Criou o template"], contato:["o contato","Adicionou o contato"]};
function textoAtividade(a){
  if(a.tipo === "app") return a.acao === "entrou" ? "Entrou no app" : "Abriu o app";
  const [o, criou] = ATIV_TIPOS[a.tipo] || ["o item", "Criou o item"];
  if(a.acao === "criou") return criou;
  if(a.acao === "excluiu") return "Excluiu " + o;
  if(a.detalhe) return a.detalhe;
  return "Alterou " + o;
}
// Turns rows of "atividades" into the list format: {quando, texto, alvo, alvoId, tipo, acao}.
function atividadesDoBanco(linhas){
  return (linhas || []).map(a => ({quando:a.quando, texto:textoAtividade(a), alvo:a.alvo || "", alvoId:a.alvo_id || "",
    tipo:a.tipo || "", acao:a.acao || ""}));
}
// The person's changes taken from every condo's "Registro de atualizações", matched by name (accents/case ignored).
function atividadesDoHistorico(lista, nomes){
  const quem = new Set((nomes || []).filter(Boolean).map(n => normalizarNome(n)));
  if(!quem.size) return [];
  const out = [];
  (lista || []).forEach(l => (l.historico || []).forEach(h => {
    if(h && h.por && quem.has(normalizarNome(h.por)))
      out.push({quando:h.quando, texto:h.o_que || "Alterou o condomínio", alvo:l.nome || "", alvoId:l.id, tipo:"condominio",
        acao:/cadastrado/i.test(h.o_que || "") ? "criou" : "alterou"});
  }));
  return out;
}
// Joins both sources, newest first. History lines are only used for the time BEFORE the oldest line
// of the table (after that the table already has the same change, so it would show up twice).
function juntarAtividades(doBanco, doHistorico){
  const ms = x => new Date(x.quando).getTime() || 0;
  const banco = (doBanco || []).slice();
  const inicio = banco.length ? Math.min(...banco.map(ms)) : Infinity;
  const antigas = (doHistorico || []).filter(h => ms(h) < inicio);
  return banco.concat(antigas).sort((a, b) => ms(b) - ms(a));
}
// Only what happened in the last 'dias' days (0 = everything), and that matches the search text.
function filtrarAtividades(lista, dias, busca, hoje = new Date()){
  const desde = dias ? hoje.getTime() - dias * 86400000 : -Infinity;
  const q = normalizarNome(busca || "");
  return (lista || []).filter(a => new Date(a.quando).getTime() >= desde &&
    (!q || normalizarNome(a.texto + " " + a.alvo).includes(q)));
}
// Numbers at the top: changes (logins don't count), different condos touched, new condos, last time in the app.
function resumoAtividades(lista){
  const trabalho = (lista || []).filter(a => a.tipo !== "app");
  const condos = new Set(trabalho.filter(a => a.tipo === "condominio").map(a => a.alvoId || a.alvo));
  const ultimo = (lista || []).reduce((m, a) => (!m || new Date(a.quando) > new Date(m)) ? a.quando : m, null);
  return {acoes:trabalho.length, condominios:condos.size,
    novos:trabalho.filter(a => a.tipo === "condominio" && a.acao === "criou").length, ultimo};
}
// Day heading: "Hoje", "Ontem" or "sexta, 16 de outubro".
function rotuloDia(iso, hoje = new Date()){
  const d = new Date(iso), zero = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dif = Math.round((zero(hoje) - zero(d)) / 86400000);
  if(dif === 0) return "Hoje";
  if(dif === 1) return "Ontem";
  const txt = d.toLocaleDateString("pt-BR", {weekday:"long", day:"numeric", month:"long"}).replace("-feira", "");
  return txt + (d.getFullYear() !== hoje.getFullYear() ? " de " + d.getFullYear() : "");
}

let ativPessoa = null, ativLista = [];
const atividadeAberta = () => !$("#admAtiv").hidden;
// Opens the activity drawer for one member (user id from the admin table).
async function abrirAtividade(userId){
  const m = admMembros.find(x => x.user_id === userId); if(!m) return;
  ativPessoa = m;
  $("#admAtivNome").textContent = m.usuario || m.email;
  $("#admAtivSub").textContent = [m.email, m.papel].filter(Boolean).join(", ");
  $("#admAtivBusca").value = "";
  $("#admAtivLista").innerHTML = '<p class="adm-dica">Carregando…</p>';
  $("#admAtivResumo").innerHTML = ""; $("#admAtivAviso").hidden = true;
  $("#admAtiv").hidden = $("#admAtivFundo").hidden = false;
  $("#admAtivFechar").focus();

  let doBanco = [], semTabela = false;
  try{
    const {data, error} = await sb.from("atividades").select("*").eq("usuario", userId)
      .order("quando", {ascending:false}).limit(500);
    if(error){ semTabela = tabelaFaltando(error); if(!semTabela) avisar(error.message, true); }
    else doBanco = atividadesDoBanco(data);
  }catch(e){ semTabela = true; }
  if(ativPessoa !== m) return;              // another person was clicked meanwhile
  // the condos on the board belong to the organization you're in, so their history only counts for it
  const org = admOrgs.find(o => o.id === admSel), mesmaOrg = !org || org.ativa;
  const eq = equipe.find(p => p.email && m.email && p.email.toLowerCase() === m.email.toLowerCase());
  const nomes = [m.usuario, eq && eq.nome, m.email && m.email.split("@")[0]];
  ativLista = juntarAtividades(doBanco, mesmaOrg ? atividadesDoHistorico(leads, nomes) : []);
  $("#admAtivAviso").hidden = !semTabela;
  desenharAtividade();
}
function fecharAtividade(){
  if(!$("#admAtiv")) return;
  $("#admAtiv").hidden = $("#admAtivFundo").hidden = true;
  ativPessoa = null;
}
function desenharAtividade(){
  const dias = Number($("#admAtivPeriodo").value);
  const lista = filtrarAtividades(ativLista, dias, $("#admAtivBusca").value);
  const r = resumoAtividades(filtrarAtividades(ativLista, dias, ""));
  const ultimo = resumoAtividades(ativLista).ultimo;
  const num = (n, um, varios) => `<div><b>${n}</b><span>${n === 1 ? um : varios}</span></div>`;
  $("#admAtivResumo").innerHTML =
    num(r.acoes, "ação", "ações") + num(r.condominios, "condomínio mexido", "condomínios mexidos") +
    num(r.novos, "cadastrado", "cadastrados") +
    `<p class="adm-ativ-ult">Última atividade: ${ultimo ? escapar(dataHoraBR(ultimo)) + " (" + textoDias(diasDesde(ultimo)) + ")" : "nenhuma registrada"}</p>`;
  if(!lista.length){
    $("#admAtivLista").innerHTML = `<p class="adm-ativ-vazio">${ativLista.length ? "Nada neste período." : "Nenhuma atividade registrada ainda."}</p>`;
    return;
  }
  let html = "", dia = "";
  lista.forEach(a => {
    const d = rotuloDia(a.quando);
    if(d !== dia){ html += (dia ? "</ul>" : "") + `<h4>${escapar(d)}</h4><ul>`; dia = d; }
    const hora = new Date(a.quando).toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"});
    const existe = a.tipo === "condominio" && a.alvoId && leads.some(l => l.id === a.alvoId);
    const alvo = !a.alvo ? "" : existe
      ? `<button type="button" class="adm-ativ-alvo" data-ativ-lead="${escapar(a.alvoId)}">${escapar(a.alvo)}</button>`
      : `<span class="adm-ativ-alvo">${escapar(a.alvo)}</span>`;
    html += `<li class="ativ-${escapar(a.acao)}${a.tipo === "app" ? " ativ-app" : ""}"><time>${hora}</time><span>${escapar(a.texto)}${alvo ? ", " + alvo : ""}</span></li>`;
  });
  $("#admAtivLista").innerHTML = html + "</ul>";
}
$("#admAtivFechar").addEventListener("click", fecharAtividade);
$("#admAtivFundo").addEventListener("click", fecharAtividade);
$("#admAtivPeriodo").addEventListener("change", desenharAtividade);
$("#admAtivBusca").addEventListener("input", desenharAtividade);
// Clicking a condo name closes the admin screen and opens that condo's card.
$("#admAtivLista").addEventListener("click", e => {
  const b = e.target.closest("[data-ativ-lead]"); if(!b) return;
  fecharAtividade(); $("#admTela").hidden = true;
  abrirPainel(b.dataset.ativLead);
});


// =============================================================================
// INSTALL AS AN APP (PWA)
// sw.js (the service worker) + manifest.webmanifest make the site installable: an icon on the
// home screen, opening full screen without the browser bar, and opening even offline.
//  - Android / Chrome / Edge: the browser fires 'beforeinstallprompt'; we keep it and show
//    "Instalar o app" in the ☰ menu, which opens the browser's own install window.
//  - iPhone / iPad: Safari has no install button for sites, so the menu item opens the steps
//    (Compartilhar → Adicionar à Tela de Início).
//  - Already opened as the installed app: the menu item stays hidden.
// =============================================================================
let pedidoInstalar = null;                     // the browser's saved install prompt (Android/Chrome)
const abertoComoApp = () => !!((window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone);
const ehIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);        // iPads say they're a Mac
const ehSafariIOS = () => ehIOS() && !/CriOS|FxiOS|EdgiOS|Instagram|FBAN|FBAV/i.test(navigator.userAgent);
function atualizarBotaoInstalar(){
  $("#btnInstalar").hidden = abertoComoApp() || !(pedidoInstalar || ehIOS());
}
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();                          // no automatic banner: the ☰ menu item does it
  pedidoInstalar = e;
  atualizarBotaoInstalar();
});
window.addEventListener("appinstalled", () => {
  pedidoInstalar = null;
  atualizarBotaoInstalar();
  avisar("App instalado. Ele está na tela inicial do seu aparelho.");
});
function fecharInstalar(){ $("#instalarDlg").hidden = true; }
$("#btnInstalar").addEventListener("click", async () => {
  fecharMenu(false);
  if(pedidoInstalar){
    const p = pedidoInstalar; pedidoInstalar = null;   // a prompt can only be used once
    try{
      await p.prompt();
      const r = await p.userChoice;
      if(r && r.outcome !== "accepted") avisar("Instalação cancelada. Você pode instalar depois pelo ☰ menu.");
    }catch(_){}
    atualizarBotaoInstalar();
    return;
  }
  $("#instalarOutro").hidden = ehSafariIOS();
  $("#instalarDlg").hidden = false;
  $("#instalarOk").focus();
});
$("#instalarOk").addEventListener("click", fecharInstalar);
$("#instalarDlg").addEventListener("click", e => { if(e.target === e.currentTarget) fecharInstalar(); });
document.addEventListener("keydown", e => { if(e.key === "Escape" && !$("#instalarDlg").hidden) fecharInstalar(); });
atualizarBotaoInstalar();
// Registers sw.js once the page has loaded (not when the file is opened straight from the disk).
if("serviceWorker" in navigator && /^https?:$/.test(location.protocol)){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(err => console.warn("app instalável: service worker não registrado", err));
  });
}

// START THE APP.
iniciar();
