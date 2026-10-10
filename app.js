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
// Local backup of the SULTS flag (used only if the database has no "sults" column yet).
const CHAVE_SULTS = "quitandinha:sults";

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
let sultsForm = false;

// ---------- SMALL HELPER FUNCTIONS ----------
// $("#id") = shortcut for document.querySelector: finds an element on the page.
const $ = s => document.querySelector(s);
// agora() = 'now' as an ISO text, e.g. "2026-10-05T14:30:00.000Z".
const agora = () => new Date().toISOString();
// Creates a unique-enough id like "c_lq3k9a8xyz" (time + random letters).
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
// Same idea for the "sults" column (the green SULTS flag on a condo).
let SEM_COLUNA_SULTS = false;
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
  if(!SEM_COLUNA_SULTS) o.sults = !!l.sults;
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
    sults:typeof r.sults === "boolean" ? r.sults : undefined
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
    if(c.data && c.data.length && !("sults" in c.data[0])) SEM_COLUNA_SULTS = true;
  } else {
    leads = await localGet(CHAVE_LEADS, []);
    equipe = await localGet(CHAVE_EQUIPE, []);
  }
  // If the database has no reminders column, use the reminders saved locally in this browser.
  const cacheLem = await localGet(CHAVE_LEMBRETES, {});
  leads.forEach(l => { if(l.lembretes === undefined) l.lembretes = cacheLem[l.id] || []; });
  // Same for the SULTS flag.
  const cacheSults = await localGet(CHAVE_SULTS, {});
  leads.forEach(l => { if(l.sults === undefined) l.sults = !!cacheSults[l.id]; });
}
/* ---- fila de pendências: nada se perde se a internet cair ---- */
// Saves the offline queue (and a backup copy of all condos and reminders) in local storage,
// so nothing is lost if the internet drops or the page is closed.
async function guardarPendencias(){
  await localSet(CHAVE_PENDENTES, {enviar:[...pendentes.values()], excluir:[...paraExcluir]});
  await localSet(CHAVE_LEADS, leads);            // cópia de segurança sempre
  const mapaLem = {}; leads.forEach(l => { if((l.lembretes||[]).length) mapaLem[l.id] = l.lembretes; });
  await localSet(CHAVE_LEMBRETES, mapaLem);
  const mapaSults = {}; leads.forEach(l => { if(l.sults) mapaSults[l.id] = true; });
  await localSet(CHAVE_SULTS, mapaSults);
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
      // If it fails because the 'lembretes' or 'sults' column doesn't exist, retry without that column.
      const lote = [...pendentes.values()];
      let {error} = await sb.from("condominios").upsert(lote.map(paraBanco));
      if(error && /lembretes/i.test(error.message||"") && !SEM_COLUNA_LEMBRETES){
        SEM_COLUNA_LEMBRETES = true;
        avisar("Os lembretes ficam só neste aparelho até criar a coluna no Supabase (veja o SQL).", true);
        ({error} = await sb.from("condominios").upsert(lote.map(paraBanco)));
      }
      if(error && /sults/i.test(error.message||"") && !SEM_COLUNA_SULTS){
        SEM_COLUNA_SULTS = true;
        avisar("A marcação SULTS fica só neste aparelho até criar a coluna no Supabase (veja database/schema.sql).", true);
        ({error} = await sb.from("condominios").upsert(lote.map(paraBanco)));
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
    if(st && (l.status||"nenhum") !== st) return false;
    if(resp && (l.responsavel||"") !== resp) return false;
    if(!dataNoIntervalo(l.criadoEm, dataDe, dataAte)) return false;
    if(!termo) return true;
    const textoContatos = (l.contatos||[]).map(c=>[c.nome,c.telefone,c.email].join(" ")).join(" ");
    return [l.nome,l.endereco,l.zona,l.importante,textoContatos,l.concorrente,l.perfil,l.notas,l.responsavel]
      .join(" ").toLowerCase().includes(termo);
  });
}

// DRAW THE BOARD. Called after almost every change.
// It deletes the board and rebuilds every column and card from the 'leads' array.
function desenhar(){
  atualizarFiltroResp();
  const visiveis = filtrar();
  const total = visiveis.length || 1;
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
      '<div class="trilha"><i style="width:'+Math.round(daFase.length/total*100)+'%"></i></div>'+
      '<div class="lista" data-fase="'+fase.id+'"></div>'+
      '<div class="rodape-coluna"><button class="add-coluna" data-add="'+fase.id+'">+ Adicionar condomínio</button></div>';
    const lista = col.querySelector(".lista");
    if(!daFase.length){
      const v = document.createElement("p");
      v.className = "vazio";
      v.textContent = "Nenhum condomínio aqui. Arraste um cartão ou cadastre um novo.";
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
}

// Builds ONE card element for a condo.
// draggable = can be dragged; tabIndex = 0 makes it reachable with the Tab key.
function montarCartao(l){
  const el = document.createElement("article");
  el.className = "cartao st-" + (l.status||"nenhum");
  el.draggable = true; el.dataset.id = l.id; el.tabIndex = 0;

  // Build the list of tags shown on the card.
  const etiquetas = [];
  if(l.zona) etiquetas.push('<span class="etiqueta zona">'+escapar(l.zona)+'</span>');
  if(l.aptos !== "" && l.aptos != null) etiquetas.push('<span class="etiqueta">'+escapar(l.aptos)+' aptos</span>');
  if(l.contatos && l.contatos.length) etiquetas.push('<span class="etiqueta">'+escapar(l.contatos[0].nome||("Contato"))+(l.contatos.length>1?' +'+(l.contatos.length-1):'')+'</span>');
  // Competitor tag. If the competitor's contract ends in 90 days or less (or already ended),
  // the tag turns red ('perigo'), because that's a sales opportunity.
  if(l.concorrente){
    const d = l.fimContrato ? Math.ceil((new Date(l.fimContrato)-Date.now())/86400000) : null;
    let cls="alerta", txt=escapar(l.concorrente);
    if(d !== null){
      if(d < 0){ cls="perigo"; txt += " · contrato vencido"; }
      else if(d <= 90){ cls="perigo"; txt += " · vence em "+d+"d"; }
      else txt += " · até "+dataBR(l.fimContrato);
    }
    etiquetas.push('<span class="etiqueta '+cls+'">'+txt+'</span>');
  }
  // Reminder tag (bell). If a reminder is overdue, the whole card gets the red 'lem-vencido' style.
  const proxLem = proximoLembrete(l);
  if(lembreteVencido(l)) el.classList.add("lem-vencido");
  if(proxLem){
    const c = classeLembrete(proxLem);
    etiquetas.unshift('<span class="etiqueta lem '+c+'" title="'+escapar(proxLem.texto||"Próximo passo")+'">🔔 '+
      (c==="atrasado"?"Atrasado · ":"")+escapar(quandoCurto(proxLem))+'</span>');
  }
  // Footer: 'Atualizado <date> por <name>' with a round avatar.
  // If the condo is marked SULTS, a green "S" badge goes right after the name of who edited last
  // (or on its own, if the condo has no notes yet).
  const ultimaObs = ultimaObservacao(l);
  const quemObs = ultimaObs ? (ultimaObs.por||"") : "";
  const inicial = (quemObs||"?").trim().charAt(0).toUpperCase() || "?";
  const seloSults = l.sults ? '<i class="selo-sults" title="SULTS" aria-label="SULTS">S</i>' : "";
  const metaCartao = ultimaObs
    ? '<div class="meta-cartao"><span>Atualizado '+dataHoraBR(ultimaObs.quando)+(quemObs ? "" : seloSults)+"</span>"+
      (quemObs?'<span class="quem"><i class="inicial">'+escapar(inicial)+"</i>por "+escapar(quemObs)+seloSults+"</span>":"")+
      "</div>"
    : (seloSults ? '<div class="meta-cartao"><span class="quem">'+seloSults+"</span></div>" : "");
  el.innerHTML =
    "<h3>"+escapar(l.nome||"Condomínio sem nome")+"</h3>"+
    (l.importante?'<p class="aviso-importante">⚠️ '+escapar(l.importante)+"</p>":"")+
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
    return l.contatos.map(c=>({nome:c.nome||"", telefone:c.telefone||"", email:c.email||""}));
  }
  // condomínios cadastrados antes da unificação: junta síndico e administradora num contato cada
  const legado = [];
  if(l.sindico || l.sindicoTel || l.sindicoEmail){
    legado.push({nome:l.sindico||"", telefone:l.sindicoTel||"", email:l.sindicoEmail||""});
  }
  const nomeAdmin = [l.admin, l.adminContato].filter(Boolean).join(" – ");
  if(nomeAdmin || l.adminTel || l.adminEmail){
    legado.push({nome:nomeAdmin, telefone:l.adminTel||"", email:l.adminEmail||""});
  }
  return legado;
}
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
    el.innerHTML = '<p class="contato-vazio">Nenhum contato adicionado. Clique em "Adicionar contato" abaixo.</p>';
    return;
  }
  el.innerHTML = contatosForm.map((c,i) =>
    '<div class="contato-item" data-i="'+i+'">'+
      '<div class="contato-cabeca">'+
        '<label class="campo"><span>Nome</span><input class="txt contato-nome" data-i="'+i+'" value="'+escapar(c.nome||"")+'"></label>'+
        '<button type="button" class="contato-remover" data-remover-contato="'+i+'" title="Remover contato" aria-label="Remover contato">✕</button>'+
      '</div>'+
      '<div class="linha">'+
        '<label class="campo campo-tel"><span>Telefone / WhatsApp</span>'+
          '<span class="tel-com-whats">'+
            '<input class="txt contato-tel" data-i="'+i+'" value="'+escapar(c.telefone||"")+'">'+
            '<button type="button" class="btn-whats" data-whats-contato="'+i+'" title="Abrir no WhatsApp" aria-label="Abrir no WhatsApp">'+
              '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2m0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.24 8.24m4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.24-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.47-.01a.9.9 0 0 0-.65.3c-.23.24-.86.84-.86 2.05s.88 2.38 1 2.55c.13.17 1.73 2.64 4.2 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28"/></svg>'+
            '</button>'+
          '</span>'+
        '</label>'+
        '<label class="campo"><span>E-mail</span><input class="txt contato-email" type="email" data-i="'+i+'" value="'+escapar(c.email||"")+'"></label>'+
      '</div>'+
    '</div>'
  ).join("");
}
// Adds an empty contact and puts the cursor in its name field.
function adicionarContato(){
  contatosForm.push({nome:"", telefone:"", email:""});
  renderContatos();
  const campos = document.querySelectorAll("#contatosLista .contato-nome");
  const ultimo = campos[campos.length-1];
  if(ultimo) ultimo.focus();
}
// Removes contact number i after asking for confirmation.
function removerContatoForm(i){
  if(!confirm("Remover este contato? Essa ação não pode ser desfeita.")) return;
  contatosForm.splice(i,1);
  renderContatos();
}
// Reads the contacts from the form, trimming spaces and dropping completely empty ones.
function lerContatosForm(){
  return contatosForm
    .map(c=>({nome:(c.nome||"").trim(), telefone:(c.telefone||"").trim(), email:(c.email||"").trim()}))
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
    text:"🔔 "+(l.nome||"Condomínio")+" — "+(lem.texto||"Retomar contato"),
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
    "SUMMARY:"+escICS("🔔 "+(l.nome||"Condomínio")+" — "+(lem.texto||"Retomar contato")),
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
function itemLembreteHTML(l, lem, idx, doForm){
  const c = classeLembrete(lem);
  const gcal = linkGoogleAgenda(l, lem);
  return '<div class="lem-item '+c+'">'+
    (doForm ? "" : '<button type="button" class="lem-lead" data-abrir-lead="'+escapar(l.id)+'">'+escapar(l.nome||"Condomínio sem nome")+'</button>')+
    '<span class="lem-quando">'+(c==="atrasado"?"⚠️ Atrasado · ":c==="hoje"?"📌 Hoje · ":c==="feito"?"✓ Concluído · ":"")+escapar(quandoLongo(lem))+'</span>'+
    '<span class="lem-texto">'+escapar(lem.texto||"Retomar contato")+'</span>'+
    (!doForm && l.responsavel ? '<span class="lem-resp">Responsável: '+escapar(l.responsavel)+'</span>' : '')+
    '<div class="lem-acoes">'+
      (lem.feito
        ? '<button type="button" data-lem-reabrir="'+idx+'" data-lid="'+escapar(l.id)+'">Reabrir</button>'
        : '<button type="button" class="lem-ok" data-lem-feito="'+idx+'" data-lid="'+escapar(l.id)+'">✓ Concluir</button>'+
          '<button type="button" data-lem-adiar="'+idx+'" data-lid="'+escapar(l.id)+'" title="Adiar para amanhã no mesmo horário">Adiar 1 dia</button>')+
      '<a class="lem-gcal" href="'+escapar(gcal)+'" target="_blank" rel="noopener">📅 Google Agenda</a>'+
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
}
// Adds a reminder from the date/time/text fields to the form list.
// It's only really saved when the user clicks Salvar. silencioso = don't show a message.
function adicionarLembreteForm(silencioso){
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
// Runs an action on a saved reminder: feito (done), reabrir (reopen), adiar (+1 day), remover (delete), ics (download).
async function acaoLembrete(leadId, idx, acao){
  if(!perm.editar){ negar("editar"); return; }
  const l = leads.find(x=>x.id===leadId); if(!l || !l.lembretes || !l.lembretes[idx]) return;
  const lem = l.lembretes[idx];
  if(acao==="feito"){ lem.feito = true; lem.feitoEm = agora(); await gravarLembretes(l, "Lembrete concluído: "+(lem.texto||"retomar contato")); avisar("Lembrete concluído"); }
  else if(acao==="reabrir"){ lem.feito = false; lem.feitoEm = null; await gravarLembretes(l, "Lembrete reaberto"); }
  else if(acao==="adiar"){
    const d = dtLembrete(lem); d.setDate(d.getDate()+1);
    lem.quando = dataLocalInput(d)+"T"+horaCurta(d);
    await gravarLembretes(l, "Lembrete adiado para "+quandoCurto(lem)); avisar("Adiado para "+quandoCurto(lem));
  }
  else if(acao==="remover"){
    if(!confirm("Excluir este lembrete?")) return;
    l.lembretes.splice(idx,1); await gravarLembretes(l, "Lembrete excluído");
  }
  else if(acao==="ics"){ baixarICS(l, lem); }
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
  const dia = isNaN(d) ? "—" : d.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"});
  const acoes = (lem.feito
      ? '<button type="button" data-lem-reabrir="'+idx+'" data-lid="'+escapar(l.id)+'">Reabrir</button>'
      : '<button type="button" class="lem-ok" data-lem-feito="'+idx+'" data-lid="'+escapar(l.id)+'">✓ Concluir</button>'+
        '<button type="button" data-lem-adiar="'+idx+'" data-lid="'+escapar(l.id)+'" title="Adiar para amanhã no mesmo horário">Adiar 1 dia</button>')+
    '<a class="lem-gcal" href="'+escapar(linkGoogleAgenda(l, lem))+'" target="_blank" rel="noopener">📅 Google Agenda</a>'+
    '<button type="button" data-lem-remover="'+idx+'" data-lid="'+escapar(l.id)+'" title="Excluir lembrete">✕ Cancelar</button>';
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
  const msgVazia = {pendentes:"Nenhum lembrete pendente. Abra um lead e adicione um lembrete.", atrasado:"Nada atrasado. 👏", hoje:"Nenhum lembrete para hoje.", proximo:"Nenhum lembrete futuro.", feito:"Nenhum lembrete concluído ainda."};
  const itens = por[lemAba] || [];
  $("#lemPainelLista").innerHTML = itens.map(linhaLembreteHTML).join("") || '<div class="lem-vazio">'+msgVazia[lemAba]+'</div>';
  $("#btnNotif").hidden = !("Notification" in window) || Notification.permission !== "default";
}
// True if the reminders page is open.
function lembretesAberto(){ return $("#telaLembretes").classList.contains("aberta"); }
// Opens the reminders page (on 'pending' if there are any, otherwise on 'done').
function abrirLembretes(aba){
  if(aba) lemAba = aba;
  else {
    const t = todosLembretes().filter(x=>!x.lem.feito);
    lemAba = t.length ? "pendentes" : "feito";
  }
  renderPainelLembretes();
  $("#telaLembretes").classList.add("aberta");
}
// Closes the reminders page.
function fecharLembretes(){ $("#telaLembretes").classList.remove("aberta"); }

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
  if(lembretesAberto()) renderPainelLembretes();
  // quando um lembrete vence (ou deixa de vencer), redesenha o quadro para o cartão ficar vermelho
  const chave = leads.filter(l=>lembreteVencido(l)).map(l=>l.id).sort().join(",");
  if(lemChaveVencidos !== null && chave !== lemChaveVencidos && !arrastandoId){ lemChaveVencidos = chave; desenhar(); return; }
  lemChaveVencidos = chave;
  const todos = todosLembretes().filter(t=>!t.lem.feito);
  const atrasados = todos.filter(t=>t.c==="atrasado"), hoje = todos.filter(t=>t.c==="hoje");
  const badge = $("#lemBadge"); if(!badge) return;
  const n = atrasados.length + hoje.length;
  badge.hidden = n === 0;
  badge.textContent = n;
  badge.classList.toggle("atraso", atrasados.length > 0);
  if(semAviso) return;
  // First check after opening the app: one summary message instead of one per reminder.
  if(lemPrimeiraVez){
    lemPrimeiraVez = false;
    atrasados.forEach(t=>lemAvisados.add(t.lem.id));
    if(n) avisar("🔔 Você tem "+(atrasados.length? atrasados.length+" lembrete(s) atrasado(s)"+(hoje.length?" e ":""):"")+(hoje.length? hoje.length+" para hoje":"")+".");
    return;
  }
  atrasados.forEach(t=>{
    if(lemAvisados.has(t.lem.id)) return;
    lemAvisados.add(t.lem.id);
    const msg = (t.l.nome||"Condomínio")+" — "+(t.lem.texto||"retomar contato");
    avisar("🔔 Lembrete: "+msg);
    try{ if("Notification" in window && Notification.permission==="granted") new Notification("🔔 Lembrete", {body:msg}); }catch(_){}
  });
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
  const p = equipe.find(x=>String(x.id)===String(id));
  if(!p || !confirm("Remover "+p.nome+" da lista de responsáveis? Os leads dela continuam no quadro.")) return;
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
  preencherFases();
  if(id){
    const l = leads.find(x=>x.id===id); if(!l) return;
    $("#tituloPainel").textContent = l.nome || "Condomínio sem nome";
    $("#f_nome").value=l.nome||""; $("#f_endereco").value=l.endereco||"";
    $("#avisoNomeDuplicado").hidden = true; $("#avisoNomeDuplicado").innerHTML=""; delete $("#avisoNomeDuplicado").dataset.fechadoPara;
    $("#f_aptos").value=l.aptos??""; $("#f_fase").value=l.fase||"cadastro";
    $("#f_zona").value=l.zona||""; $("#f_importante").value=l.importante||"";
    contatosForm = migrarContatosAntigos(l);
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
    ["f_nome","f_endereco","f_aptos","f_zona","f_importante",
     "f_concorrente","f_fimContrato","f_perfil"]
      .forEach(x => $("#"+x).value = "");
    $("#avisoNomeDuplicado").hidden = true; $("#avisoNomeDuplicado").innerHTML=""; delete $("#avisoNomeDuplicado").dataset.fechadoPara;
    contatosForm = [];
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
  atualizarBotaoSults();
  atualizarBotaoRotaLead();
  setTimeout(()=>$("#f_nome").focus(), 180);
}
// Green SULTS toggle at the top of the panel. On = the card shows a green "S" badge
// next to the name of who edited last. The change is saved with the "Salvar" button.
function atualizarBotaoSults(){
  const b = $("#btnSults");
  b.classList.toggle("ativo", sultsForm);
  b.setAttribute("aria-pressed", sultsForm ? "true" : "false");
  b.textContent = sultsForm ? "✓ SULTS" : "SULTS";
  b.title = sultsForm ? "Marcado como SULTS. Clique para desmarcar." : "Marcar este condomínio como SULTS";
}
// "Adicionar à rota" button in the panel. The route itself lives in mapa.js (window.__rota).
// Shows "📍 Adicionar à rota de visitas" or "✓ Parada 2 de 5 na rota · Remover".
// Hidden for a new condo (it has no id until it's saved).
function atualizarBotaoRotaLead(){
  const bloco = $("#blocoRotaLead"), btn = $("#btnRotaLead"), api = window.__rota;
  bloco.hidden = !(editandoId && api);
  if(bloco.hidden) return;
  const na = api.tem(editandoId);
  btn.classList.toggle("na-rota", na);
  btn.textContent = na
    ? "✓ Parada "+api.posicao(editandoId)+" de "+api.total()+" na rota · Remover"
    : "📍 Adicionar à rota de visitas";
}
function alternarRotaLead(){
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
function abrirEquipe(){
  desenharEquipe();
  $("#painelEquipe").classList.add("aberto");
  $("#fundo").classList.add("aberto");
  setTimeout(()=>$("#eq_nome").focus(), 180);
}

// Reads every field in the panel and returns a condo object with those values.
function lerFormulario(){
  return {
    sults:sultsForm,
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
    "Data de cadastro","Última atualização","Nº de atualizações","SULTS"];
  const linhas = leads.map(l => [
    l.nome,l.endereco,l.zona,l.aptos,(FASES.find(f=>f.id===l.fase)||{}).nome,ROTULO_STATUS[l.status||"nenhum"],l.importante,
    (l.contatos||[]).map(c=>[c.nome,c.telefone,c.email].filter(Boolean).join(" / ")).join(" | "),
    l.concorrente,l.fimContrato?dataBR(l.fimContrato):"",l.perfil,l.notas,l.responsavel,l.criadoPor,
    dataBR(l.criadoEm),dataBR(l.atualizadoEm),(l.historico||[]).length,l.sults?"Sim":"Não"
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
  } else {
    $("#nomeUsuario").textContent = "Modo local (só neste navegador)";
    $("#sinal").className = "sinal local";
  }
  desenhar();
  verificarLembretes();
}

// Entry point of the app (called at the very end of this file).
async function iniciar(){
  preencherFases();
  if(NUVEM){
    try{
      await carregarSDK();
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      const {data} = await sb.auth.getSession();
      if(data.session){ sessao = data.session; await iniciarQuadro(); }
      else mostrarEntrada();
    }catch(e){
      $("#sinal").className = "sinal off";
      $("#nomeUsuario").textContent = "Sem conexão com o banco";
      avisar("Não consegui conectar ao Supabase. Confira as chaves.");
    }
  } else {
    await iniciarQuadro();
  }
}

/* ================= eventos ================= */
// =============================================================================
// EVENTS: connect buttons/inputs to the functions above
// addEventListener("click", fn) = "when this is clicked, run fn".
// =============================================================================
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
  const editObs = e.target.closest("[data-editar-obs]");
  if(editObs) editarObservacao(parseInt(editObs.dataset.editarObs,10));
  const cancelObs = e.target.closest("[data-cancelar-obs]");
  if(cancelObs) cancelarEdicaoObservacao();
  const saveObs = e.target.closest("[data-salvar-obs]");
  if(saveObs) salvarEdicaoObservacao(parseInt(saveObs.dataset.salvarObs,10));
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
});
// Typing in a contact field updates the matching entry in contatosForm (data-i = contact index).
document.addEventListener("input", e=>{
  const i = e.target.dataset.i;
  if(i===undefined) return;
  const idx = parseInt(i,10);
  if(!contatosForm[idx]) return;
  if(e.target.classList.contains("contato-nome")) contatosForm[idx].nome = e.target.value;
  else if(e.target.classList.contains("contato-tel")) contatosForm[idx].telefone = e.target.value;
  else if(e.target.classList.contains("contato-email")) contatosForm[idx].email = e.target.value;
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
    const idx = parseInt((doForm.dataset.lemFeito ?? doForm.dataset.lemReabrir ?? doForm.dataset.lemAdiar ?? doForm.dataset.lemIcs ?? doForm.dataset.lemRemover),10);
    const lem = lembretesForm[idx]; if(!lem) return;
    if(doForm.dataset.lemFeito !== undefined){ lem.feito = true; lem.feitoEm = agora(); }
    else if(doForm.dataset.lemReabrir !== undefined){ lem.feito = false; lem.feitoEm = null; }
    else if(doForm.dataset.lemAdiar !== undefined){ const d = dtLembrete(lem); d.setDate(d.getDate()+1); lem.quando = dataLocalInput(d)+"T"+horaCurta(d); }
    else if(doForm.dataset.lemIcs !== undefined){ baixarICS(leadAtualDoForm(), lem); return; }
    else if(doForm.dataset.lemRemover !== undefined){ if(!confirm("Excluir este lembrete?")) return; lembretesForm.splice(idx,1); }
    else return;
    renderLembretesForm();
    return;
  }
  // ações no painel geral (já salvas)
  // Maps each data attribute (e.g. data-lem-feito) to an action name and runs it.
  const mapa = [["lemFeito","feito"],["lemReabrir","reabrir"],["lemAdiar","adiar"],["lemIcs","ics"],["lemRemover","remover"]];
  for(const [attr,acao] of mapa){
    const el = e.target.closest("[data-"+attr.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())+"]");
    if(el && el.dataset.lid){ acaoLembrete(el.dataset.lid, parseInt(el.dataset[attr],10), acao); return; }
  }
});
// Check reminders every 30 seconds.
setInterval(()=>verificarLembretes(), 30000);
$("#btnAddObs").addEventListener("click", adicionarObservacao);
$("#btnAddContato").addEventListener("click", adicionarContato);
$("#obsTexto").addEventListener("keydown", e=>{
  if(e.key==="Enter" && (e.ctrlKey||e.metaKey)){ e.preventDefault(); adicionarObservacao(); }
});

// Check for similar names while typing the condo name.
$("#f_nome").addEventListener("input", verificarNomeDuplicado);
// SULTS toggle in the panel.
$("#btnSults").addEventListener("click", ()=>{ sultsForm = !sultsForm; atualizarBotaoSults(); });
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
let admOrgs = [], admSel = null, admSuper = false;

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
    $("#btnAdmin").hidden = false;
    $("#nomeUsuario").textContent = meuNome + (admSuper ? " · super-admin" : " · admin");
  }catch(e){}
}
// Opens the admin screen. Only super-admins can create new organizations.
async function admAbrir(){
  $("#admTela").hidden = false;
  $("#admNova").hidden = !admSuper;
  $("#admPapelNovo").innerHTML = Object.keys(ADM_PAPEIS).map(p => `<option${p==="editor"?" selected":""}>${p}</option>`).join("");
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
      <small>${o.membros} membro(s) · ${o.condominios} lead(s)</small>
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
  const ms = await admRpc("admin_membros", {p_org: org.id});
  const ck = (c, v) => `<td class="c"><input type="checkbox" class="${c}"${v?" checked":""}></td>`;
  $("#admCorpo").innerHTML = ms.map(m => `
    <tr data-u="${m.user_id}">
      <td>${escapar(m.email)}<span class="adm-dica">${escapar(m.usuario)}</span></td>
      <td><select class="papel">${Object.keys(ADM_PAPEIS).map(p => `<option${p===m.papel?" selected":""}>${p}</option>`).join("")}</select></td>
      ${ck("ativo",m.ativo)}${ck("ver",m.ver_todos)}${ck("criar",m.pode_criar)}${ck("editar",m.pode_editar)}${ck("excluir",m.pode_excluir)}
      <td style="white-space:nowrap"><button class="adm-b admSalvar">Salvar</button> <button class="adm-b adm-x admRemover">Remover</button></td>
    </tr>`).join("") || '<tr><td colspan="8" class="adm-dica">Ninguém ainda.</td></tr>';
}
// Admin screen events.
$("#btnAdmin").addEventListener("click", admAbrir);
$("#admFechar").addEventListener("click", () => { $("#admTela").hidden = true; });
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
    const org = t.closest(".adm-org");
    if(org){ admSel = org.dataset.org; admDesenharOrgs(); await admCarregarMembros(); return; }
    const tr = t.closest("tr[data-u]");
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
// Create a new organization (super-admin only).
$("#admCriarOrg").addEventListener("click", async () => {
  const nome = $("#admNomeOrg").value.trim(); if(!nome) return;
  try{ await admRpc("criar_organizacao", {p_nome: nome}); $("#admNomeOrg").value = ""; avisar("Organização criada."); await admCarregarOrgs(true); }catch(_){}
});
// Add a member by email (the login must already exist in Supabase).
$("#admAdd").addEventListener("click", async () => {
  const org = admOrgs.find(o => o.id === admSel), email = $("#admEmail").value.trim();
  if(!org || !email) return;
  try{ await admRpc("adicionar_membro", {p_email: email, p_papel: $("#admPapelNovo").value, p_org: org.nome});
       $("#admEmail").value = ""; avisar("Membro adicionado."); await admCarregarOrgs(true); }catch(_){}
});


// START THE APP.
iniciar();
