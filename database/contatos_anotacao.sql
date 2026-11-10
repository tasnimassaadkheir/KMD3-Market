-- ============================================================
-- KMD3 Market — "Anotação" dos contatos avulsos (página Contatos)
-- Cole tudo isto no SQL Editor do Supabase e clique em RUN.
-- Pode rodar de novo com segurança: não apaga nada.
--
-- Cada contato cadastrado na página Contatos ganha um bloco de notas próprio
-- (botão "Anotação" na linha do contato). Sem estas colunas, as anotações
-- ficam só no navegador de quem escreveu.
-- ============================================================

alter table public.contatos_avulsos add column if not exists anotacao     text;
alter table public.contatos_avulsos add column if not exists anotacao_em  timestamptz;
alter table public.contatos_avulsos add column if not exists anotacao_por text;

-- Faz o Supabase enxergar as colunas novas na hora.
notify pgrst, 'reload schema';
