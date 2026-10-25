-- ============================================================
-- KMD3 Market — Bloco de notas da equipe (página Lembretes)
-- Cole tudo isto no SQL Editor do Supabase e clique em RUN.
-- Pode rodar de novo com segurança: não apaga nada.
--
-- Cada linha = uma nota que toda a organização vê.
-- Quem escreveu edita e apaga a própria nota; admins apagam qualquer uma;
-- leitores só leem. Sem esta tabela, as notas ficam só no navegador de cada pessoa.
-- Usa as funções que já existem no banco: minha_org_id(), posso(acao), sou_admin().
-- ============================================================

create table if not exists public.notas_equipe (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default public.minha_org_id(),
  texto      text not null check (char_length(texto) between 1 and 2000),
  por        text,                                   -- nome de quem escreveu (como aparece no app)
  por_id     uuid default auth.uid() references auth.users(id) on delete set null,
  criado_em  timestamptz not null default now(),
  editado_em timestamptz
);
create index if not exists notas_equipe_org_idx on public.notas_equipe (org_id, criado_em desc);

alter table public.notas_equipe enable row level security;

drop policy if exists "org le notas" on public.notas_equipe;
create policy "org le notas" on public.notas_equipe
  for select to authenticated
  using (org_id = public.minha_org_id());

drop policy if exists "escreve nota" on public.notas_equipe;
create policy "escreve nota" on public.notas_equipe
  for insert to authenticated
  with check (org_id = public.minha_org_id() and por_id = auth.uid() and public.posso('editar'));

drop policy if exists "edita a propria nota" on public.notas_equipe;
create policy "edita a propria nota" on public.notas_equipe
  for update to authenticated
  using (org_id = public.minha_org_id() and por_id = auth.uid())
  with check (org_id = public.minha_org_id() and por_id = auth.uid());

drop policy if exists "apaga nota" on public.notas_equipe;
create policy "apaga nota" on public.notas_equipe
  for delete to authenticated
  using (org_id = public.minha_org_id() and (por_id = auth.uid() or public.sou_admin()));

-- Atualização ao vivo: quando alguém escreve, a página aberta dos outros atualiza sozinha.
do $$
begin
  alter publication supabase_realtime add table public.notas_equipe;
exception when duplicate_object or undefined_object then null;
end $$;
