-- ============================================================
-- KMD3 Market — estrutura do banco
-- Cole tudo isto no SQL Editor do Supabase e clique em RUN.
-- Pode rodar de novo com segurança: não apaga nem duplica nada.
-- ATENÇÃO: este arquivo cobre as tabelas condominios e equipe.
-- As funções (posso, sou_admin, admin_*, etc.) e as organizações NÃO estão
-- aqui. Para ter o banco real completo, veja database/README.md.
-- ============================================================

-- Tabela dos condomínios (os cartões do quadro)
create table if not exists public.condominios (
  id            uuid primary key default gen_random_uuid(),
  nome          text,
  endereco      text,
  aptos         integer,
  fase          text default 'cadastro',
  status        text default 'nenhum',
  ordem         integer default 0,
  sindico       text,
  sindico_tel   text,
  sindico_email text,
  admin_nome    text,
  admin_contato text,
  admin_tel     text,
  admin_email   text,
  concorrente   text,
  fim_contrato  date,
  perfil        text,
  notas         text,
  responsavel   text,
  criado_por    text,
  criado_em     timestamptz default now(),
  atualizado_em timestamptz default now(),
  historico     jsonb default '[]'::jsonb,
  zona          text,
  importante    text,
  contatos      jsonb default '[]'::jsonb,
  observacoes   jsonb default '[]'::jsonb,
  lembretes     jsonb default '[]'::jsonb,
  sults         boolean default false,
  visitar       boolean default false
);

-- Para bancos que já existem: acrescenta as colunas que faltam (não mexe nos dados)
alter table public.condominios add column if not exists zona        text;
alter table public.condominios add column if not exists importante  text;
alter table public.condominios add column if not exists contatos    jsonb default '[]'::jsonb;
alter table public.condominios add column if not exists observacoes jsonb default '[]'::jsonb;
alter table public.condominios add column if not exists lembretes   jsonb default '[]'::jsonb;
alter table public.condominios add column if not exists sults       boolean default false;
alter table public.condominios add column if not exists visitar     boolean default false;

-- Tabela da equipe (quem pode ser responsável por um lead)
create table if not exists public.equipe (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  email     text,
  criado_em timestamptz default now()
);

-- ============================================================
-- Segurança: só quem estiver logado enxerga e edita os dados
-- ============================================================
alter table public.condominios enable row level security;
alter table public.equipe      enable row level security;

drop policy if exists "equipe logada usa condominios" on public.condominios;
create policy "equipe logada usa condominios"
  on public.condominios for all
  to authenticated
  using (true) with check (true);

drop policy if exists "equipe logada usa equipe" on public.equipe;
create policy "equipe logada usa equipe"
  on public.equipe for all
  to authenticated
  using (true) with check (true);

-- ============================================================
-- Atualização em tempo real (as sócias veem o cartão mudar sozinho)
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'condominios'
  ) then
    alter publication supabase_realtime add table public.condominios;
  end if;
end $$;
