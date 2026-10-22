# Database

`schema.sql` creates the `condominios` and `equipe` tables, their Row Level
Security policies and Realtime. It is safe to run more than once, and it adds
any missing columns to an existing database without touching your data.

`atividades.sql` creates the activity log behind "what each person has been
doing" in Administração: the `atividades` table, its security rules, and a
trigger on `condominios`, `templates` and `contatos_avulsos`. Run it once in the
SQL Editor (it is safe to run again). It needs the live functions
`minha_org_id()`, `sou_admin()` and `sou_super()`.

`prospeccao_descartes.sql` creates the table behind the Prospecção page's
"Não quero" ticks (shared by the whole organization). Run it once in the SQL
Editor (safe to run again). It needs the live functions `minha_org_id()` and
`posso(acao)`.

## Keeping this folder in sync with Supabase

The live Supabase project also has things this file does not cover:
organizations, roles, and the RPC functions (`posso`, `sou_admin`, `sou_super`,
`admin_*`, `adicionar_membro`, `criar_organizacao`, `entrar_organizacao`). To
capture the real, current schema:

**Option A: Supabase CLI**

```
npm i -g supabase
supabase login
supabase link --project-ref yjpcjivkxvkvanzrhhnq
supabase db dump --schema public -f database/schema.full.sql
```

**Option B: Dashboard.** Open **Database → Schema Visualizer** or **SQL Editor**,
and use **Database → Functions** to copy each function's definition.

Dump the schema only, not the data, so no customer data is committed.
