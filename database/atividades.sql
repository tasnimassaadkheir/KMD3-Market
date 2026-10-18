-- ============================================================
-- KMD3 Market — registro de atividades (quem fez o quê e quando)
-- Cole tudo isto no SQL Editor do Supabase e clique em RUN.
-- Pode rodar de novo com segurança: não apaga nada.
--
-- Depois de rodar, a Administração mostra, ao clicar numa pessoa:
-- quando ela entrou no app, os condomínios que cadastrou, alterou ou EXCLUIU,
-- e os templates e contatos que mexeu.
-- Sem este arquivo, a tela mostra só o "Registro de atualizações" dos condomínios.
--
-- Usa as funções que já existem no banco: minha_org_id(), sou_admin(), sou_super().
-- ============================================================

create table if not exists public.atividades (
  id       bigint generated always as identity primary key,
  org_id   uuid default public.minha_org_id(),
  usuario  uuid default auth.uid() references auth.users(id) on delete cascade,
  email    text default (auth.jwt() ->> 'email'),
  quando   timestamptz not null default now(),
  acao     text not null,      -- entrou, abriu, criou, alterou, excluiu
  tipo     text,               -- app, condominio, template, contato
  alvo_id  text,               -- id do condomínio / template / contato
  alvo     text,               -- nome dele (fica guardado mesmo depois de excluído)
  detalhe  text                -- ex.: "Movido para Proposta enviada"
);
create index if not exists atividades_pessoa_idx on public.atividades (usuario, quando desc);
create index if not exists atividades_org_idx    on public.atividades (org_id, quando desc);

-- Segurança:
--  * cada pessoa só grava atividades em nome dela mesma (o app grava as entradas no app);
--  * só admins da organização (e super-admins) leem; cada pessoa também vê as suas;
--  * ninguém altera nem apaga o registro pelo app (não há política de update/delete).
alter table public.atividades enable row level security;

drop policy if exists "grava a propria atividade" on public.atividades;
create policy "grava a propria atividade" on public.atividades
  for insert to authenticated
  with check (usuario = auth.uid());

drop policy if exists "admin le atividades da org" on public.atividades;
create policy "admin le atividades da org" on public.atividades
  for select to authenticated
  using (usuario = auth.uid()
         or public.sou_super()
         or (org_id = public.minha_org_id() and public.sou_admin()));

-- ------------------------------------------------------------
-- Gatilho: o próprio banco anota cada cadastro, alteração e exclusão.
-- Assim fica registrado mesmo se alguém usar outro aparelho ou o app antigo.
-- Mudanças só de ordem (arrastar dentro da coluna) não são anotadas.
-- Se algo der errado aqui, a gravação do condomínio continua normalmente.
-- ------------------------------------------------------------
create or replace function public.registrar_atividade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo text := tg_argv[0];
  r jsonb;
  o jsonb;
  v_acao text;
  v_det text;
begin
  if auth.uid() is null then return null; end if;          -- robôs / painel do Supabase: não anota
  if tg_op = 'DELETE' then r := to_jsonb(old); else r := to_jsonb(new); end if;

  if tg_op = 'INSERT' then
    v_acao := 'criou';
  elsif tg_op = 'DELETE' then
    v_acao := 'excluiu';
  else
    v_acao := 'alterou';
    o := to_jsonb(old);
    if (r - 'ordem' - 'atualizado_em') = (o - 'ordem' - 'atualizado_em') then
      return null;                                          -- nada mudou de verdade
    end if;
    if v_tipo = 'condominio' and (r -> 'historico' -> 0) is distinct from (o -> 'historico' -> 0) then
      v_det := r -> 'historico' -> 0 ->> 'o_que';          -- o mesmo texto do "Registro de atualizações"
    end if;
  end if;

  insert into public.atividades (org_id, usuario, email, acao, tipo, alvo_id, alvo, detalhe)
  values (coalesce(nullif(r ->> 'org_id', '')::uuid, public.minha_org_id()),
          auth.uid(), auth.jwt() ->> 'email', v_acao, v_tipo,
          r ->> 'id', coalesce(r ->> 'nome', r ->> 'titulo'), v_det);
  return null;
exception when others then
  return null;
end;
$$;

drop trigger if exists anota_atividade on public.condominios;
create trigger anota_atividade after insert or update or delete on public.condominios
  for each row execute function public.registrar_atividade('condominio');

drop trigger if exists anota_atividade on public.templates;
create trigger anota_atividade after insert or update or delete on public.templates
  for each row execute function public.registrar_atividade('template');

drop trigger if exists anota_atividade on public.contatos_avulsos;
create trigger anota_atividade after insert or update or delete on public.contatos_avulsos
  for each row execute function public.registrar_atividade('contato');
