# Database

`schema.sql` creates the `condominios` and `equipe` tables, their Row Level
Security policies and Realtime. It is safe to run more than once, and it adds
any missing columns to an existing database without touching your data.

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
