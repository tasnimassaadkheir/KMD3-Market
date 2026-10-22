-- ============================================================
-- KMD3 Market — Prospecção: condomínios marcados como "Não quero"
-- Cole tudo isto no SQL Editor do Supabase e clique em RUN.
-- Pode rodar de novo com segurança: não apaga nada.
--
-- Cada linha = um prédio da Prospecção que alguém do time marcou como "Não quero".
-- A marcação vale para toda a organização. Sem esta tabela, a marcação fica
-- só no navegador de cada pessoa.
-- Usa as funções que já existem no banco: minha_org_id() e posso(acao).
-- ============================================================

create table if not exists public.prospeccao_descartes (
  org_id  uuid not null default public.minha_org_id(),
  id      text not null,                  -- id do prédio na lista da Prospecção
  por     text,                           -- nome de quem marcou
  quando  timestamptz not null default now(),
  primary key (org_id, id)
);

alter table public.prospeccao_descartes enable row level security;

-- todo mundo da organização vê as marcações
drop policy if exists "org le descartes" on public.prospeccao_descartes;
create policy "org le descartes" on public.prospeccao_descartes
  for select to authenticated
  using (org_id = public.minha_org_id());

-- quem pode editar marca e desmarca (leitores só veem)
drop policy if exists "org marca descartes" on public.prospeccao_descartes;
create policy "org marca descartes" on public.prospeccao_descartes
  for insert to authenticated
  with check (org_id = public.minha_org_id() and public.posso('editar'));

drop policy if exists "org desmarca descartes" on public.prospeccao_descartes;
create policy "org desmarca descartes" on public.prospeccao_descartes
  for delete to authenticated
  using (org_id = public.minha_org_id() and public.posso('editar'));
