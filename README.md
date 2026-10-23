# KMD3 Market — Condo Sales Funnel

A web-based Kanban board for tracking condominiums (*condomínios*) through the KMD3 Market sales funnel, from first prospecting to a signed contract. The team sees the same board in real time, can plan visit routes on a map, and gets reminders for every next step.

The interface is in Brazilian Portuguese. The code is plain HTML, CSS and JavaScript. It has no framework and no build step.

---

## Features

**Navigation**
- A ☰ side menu (top left) with **Dashboard**, **Mapa**, **Prospecção**, **Administração** (admins only), **Lembretes**, **Equipe**, **Contatos** and **Templates**. The Lembretes item shows the number of reminders due today or overdue.

**Kanban board**
- Eight funnel stages, from *Possui Concorrência* (has a competitor) to *Assinatura de Contrato* (contract signed).
- Drag and drop cards between columns and reorder them inside a column.
- Each column can be reversed with one click.
- Color-coded status on each card: 🟢 closed · 🟡 in progress · 🔴 lost · ⚪ undefined.
- Filters by text search, status, person responsible and registration date. The status filter also has **No SULTS** and **Fora do SULTS** (condos already registered in SULTS or not) and **Contatos quentes** / **Não quentes**; it applies to the map too.

**Condo details**
- Name, address, number of apartments, zone, and a highlighted "Importante" warning.
- The **address in separate fields**: CEP, Rua, Número, Complemento, Bairro, Cidade and UF.
  - Typing the street (3+ letters) lists the matching streets of that city (São Paulo when empty) with their CEP and neighborhood, from [ViaCEP](https://viacep.com.br). When a street has one CEP per stretch of numbers, the one for the typed number comes first ("combina com o nº"), and changing the number later switches to the right CEP.
  - Typing a CEP fills street, neighborhood, city and UF, and moves the cursor to the number. **Zona** is never filled automatically: it is typed by hand only.
  - Arrows + Enter choose a suggestion; Esc closes the list. Without internet the fields still work by hand.
  - It's still saved as one line in `endereco` ("Rua X, 155, Torre 2 - Bairro - Cidade - UF - 00000-000"), so the map, route, search and calendar links work as before and the database didn't change. Old addresses open split into fields and are kept exactly as typed unless edited.
- Multiple contacts per condo, each with one-click **WhatsApp** and **Ligar** (call: opens the phone keypad with the number) buttons, a small **copy** icon inside the e-mail box, and a **Quem é** dropdown (Síndico, ADM, Zelador, Morador, Gerente predial, or **Outro…** to type a new type, which then appears in every card's dropdown).

**Prospecção page (☰ → Prospecção)**
- Finds condos in São Paulo that aren't in the funnel yet, **with the number of apartments**, from the city's IPTU (property tax) register — about 24,500 buildings with 10+ apartments.
- **Nobody downloads anything.** A GitHub robot (workflow *Atualizar prospecção (IPTU)*, script `scripts/iptu.mjs`) runs every month: it takes the newest IPTU file from [GeoSampa](https://geosampa.prefeitura.sp.gov.br), groups the 3.9 million properties into buildings (address, neighborhood, CEP, apartments, floors, year built, construction standard) and saves `dados/prospeccao-sp.json`, which is published with the site. It only rebuilds when a new year appears; to rebuild now, open **Actions → Atualizar prospecção (IPTU) → Run workflow** (tick "forcar"). Owner names and CPF/CNPJ are never in the list.
- **Osasco** (and other nearby cities, when added) come from IBGE's 2022 Census address register (CNEFE), which lists every dwelling with its position: apartments at the same address are one building (687 in Osasco with 10+ apartments). A second robot (workflow *Atualizar prospecção - cidades vizinhas (IBGE)*, script `scripts/cnefe.mjs`) builds `dados/prospeccao-vizinhas.json` for the cities in `scripts/cidades.json`; it runs only by hand, because the Census data only changes with a new census. To add a city, put its IBGE code and name in that file and run the workflow. These buildings already have their map position, but no floors / year built / standard, and buildings finished after 2022 aren't there.
- Filters: **Cidade** (São Paulo, Osasco…), **Região** of São Paulo (Centro, Zona Norte/Sul/Leste/Oeste, by CEP), and size.
- Search by street, neighborhood or CEP, with a minimum size (50+, 100+ — the default —, 200+, 300+ apartments). Biggest first, up to 100 at a time. The register's neighborhood field is often empty, so street or CEP finds more.
- Results show on a **list and a map**. The register has no coordinates, so each building is looked up once by its address (OpenStreetMap, 1 per second) and the position is saved for the whole team. Buildings found only by street are marked "aproximado"; ones not found get a Google Maps link.
- **Não quero**: a tick at the left of each building's buttons marks it as not interesting. A filter at the top (where "Só nesta área do mapa" used to be) shows **Não marcados** (the default, so ticked buildings leave the list), **Marcados: não quero** (with how many) or **Todos**. Ticked buildings look faded and are gray on the map; the CSV export has a "Não quero" column. The marks are shared with the whole team through the Supabase table `prospeccao_descartes` (run [`database/prospeccao_descartes.sql`](database/prospeccao_descartes.sql) once); until it exists they're kept in each browser. Read-only users see the ticks but can't change them.
- **+ Funil** creates a card in *Cadastro de Oportunidade* with the address and apartments filled in (Zona is left empty, to be typed by hand) (and its map position, so the main map doesn't look it up again). Buildings already in the funnel show **✓ No funil** and a green dot.
- **+ Rota** puts a building in the visit route (☰ → Mapa → Rota) without creating a card — handy to visit a whole area and only register the ones that work out. The button shows **✓ Rota (n)** with its stop number; clicking again takes it out. If the building later becomes a card, its stop keeps its place and points to the card.
- On phones, **Lista / Mapa** tabs switch between the two.

**Dashboard page (☰ → Dashboard)**
- Numbers of the whole funnel (the board filters don't apply): total condos, apartments in the funnel (and in closed deals), how many have a contact (phone or e-mail), how many have **no information at all** (only name/address), closed deals and conversion rate (closed ÷ closed + lost), and condos with overdue reminders.
- Count per **stage**, per **situation** and per **responsible person**.
- **Size**: P (fewer than 200 apartments), M (200–300), G (more than 300) and "sem nº de aptos".
- **Competitor minimarket**: how many condos each competitor has (spelling differences grouped together) and how many have none, plus the list of competitor contracts ending in the next 90 days (or already ended).
- Follow-up: Visitar, hot contacts and SULTS counts, and open deals with no change for 30+ days.
- **Click any number** (a big number, a stage, a size, a competitor, a person…) to open the list of the condos behind it, each with its stage, situation, apartments, responsible person, contact and competitor. Click a name to open the condo; for stages, situations, people and competitors, **Ver no quadro** applies that filter on the board.

**Templates page (☰ → Templates)**
- Ready-made texts (WhatsApp messages, e-mails, scripts) as cards with a **title**, the text, and a **Copiar** button that copies it exactly, line breaks included.
- Create, edit, delete and search. Shared with the whole team.

**Contacts page (☰ → Contatos)**
- Every contact from every condo in one table: Nome, Número, E-mail, Condomínio. Click the condo name to open it.
- Add **standalone contacts** that don't belong to any condo, then edit or delete them.
- A small copy button after each e-mail.
- Search by name, number, e-mail or condo; filter by "Quem é"; **export** what's on screen as an Excel spreadsheet (CSV).
- Competitor and contract end date. The card turns red when the contract ends within 90 days.
- A timeline of notes, with the date and author added automatically. Notes can be edited, and a small copy icon at the top right of each note copies its text.
- An automatic change log with update frequency statistics.
- A duplicate warning while typing a name that looks like an existing condo.
- A green **SULTS** toggle in the panel header. When on, the card shows a green **S** badge next to the name of whoever edited it last.
- An orange **Quente** (hot contact) toggle with a flame, next to SULTS. When on, the card shows a small orange flame right after the condo's name. Saved with "Salvar", written in the history, and exported in the CSV.
- A **Visitar** button next to "Adicionar à rota". It saves right away, and the card shows a small car on its top-right corner.

**Reminders (Lembretes)**
- Reminders per condo, with quick buttons (*Hoje, Amanhã, Em 3 dias…*).
- **Edit** any reminder (date, time and text) with ✎ Editar, in the condo panel or on the reminders page.
- A full-screen reminders page with Overdue, Today, Upcoming and Done tabs.
- Cards turn red when a reminder is overdue, and a badge shows the count on the toolbar.
- Export to Google Calendar, or as a `.ics` file for Apple Calendar or Outlook (with an alarm 10 minutes before).
- Optional browser notifications.

**Map view**
- Shows all condos on a map, colored by status, stage or competitor.
- A gold **Voltar ao quadro** button at the top-left of the map goes back to the board.
- A **🚗 Visitar** filter shows only the condos marked "Visitar" (the car on the card), with their count.
- Heatmap mode.
- Visit route planner:
  - The route is saved to your account and is the same on all your devices (laptop, phone…): a change on one shows up on the others by itself. Needs the `rotas` table (see below); without it, each browser keeps its own route.
  - Add condos from a map point **or straight from the condo's panel** ("Adicionar à rota"), which works even with the map closed.
  - Set an optional **starting point** (*ponto de partida*): a typed address, or your current location with 📍.
  - Add **any typed address** as a stop (a supplier, a lunch stop, a prospect not registered yet).
  - Reorder stops, or sort them by proximity starting from the starting point.
  - Open the route in Google Maps, or **export** it as an Excel spreadsheet, a WhatsApp message, plain text, or a printable page / PDF with a "Visitado" column to tick on the go.
- Addresses are converted to coordinates automatically and cached in the browser.

**Team and access**
- Email and password login (Supabase Auth).
- Organizations, members and roles (*admin, editor, vendedor, leitor*) with per-person permissions: see all, create, edit, delete.
- An admin screen visible only to admins. On phones it fits the screen and each member is a card (role, labeled permission boxes, Salvar / Remover); on a laptop it is a table. Clicking a member's e-mail shows what that person has been doing (see below).

**Reliability**
- An offline queue: changes are saved in the browser first and sent when the connection returns.
- Real-time updates when someone else changes the board.
- Export all condos to CSV, formatted for Excel in Portuguese.

---

## Project structure

```
kmd3market/
├── index.html            Page structure (HTML only)
├── style.css             All styles
├── config.js             Supabase URL and key
├── app.js                Main app: board, panel, sync, reminders, team, login, admin
├── mapa.js               Map view and route planner
├── tests/
│   ├── unit/             Unit tests for the app's logic (Node, no browser)
│   ├── e2e/              End-to-end tests in a real browser (Playwright)
│   ├── api/              Runs the Postman collection with Newman
│   └── helpers/          Test setup (sandbox loader)
├── postman/              Postman collection + environment for the Supabase API
├── database/             SQL schema for the Supabase tables (see database/README.md)
├── supabase/functions/   Edge Function admin-usuarios: create / cancel users, passwords (see supabase/README.md)
├── docs/testing/         Manual Postman checks of the external integrations, with screenshots
├── .github/workflows/    Runs the tests automatically on GitHub
├── package.json          Test scripts and dev dependencies
└── README.md
```

> **All files must stay in the same folder as `index.html`.** The page finds its CSS and scripts by file name, so if one of them is missing or in a different folder, that part won't load. The logos and icons are embedded inside `index.html` itself, so there are no image files to upload.

Every file is commented in English to explain what each part does.

> **Script order matters.** `index.html` loads `config.js` → `app.js` → `mapa.js`, in that order. Each file uses things defined in the one before it.

---

## Running it

### Local mode (no database)

If the two values in `config.js` are empty, the app runs in **local mode**. There is no login, and data is saved only in the current browser (`localStorage`). This is useful for testing.

```js
const SUPABASE_URL = "";
const SUPABASE_KEY = "";
```

Open `index.html` in a browser, or serve the folder with any static server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

### Cloud mode (shared with the team)

Fill in `config.js` with your Supabase project URL and **publishable** key, found in Supabase under **Project Settings → API**:

```js
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_KEY = "sb_publishable_...";
```

The publishable key is meant to be public. Your data is protected by the **Row Level Security** rules in Supabase, so keep RLS enabled on every table.

---

## Testing

The project has three layers of automated tests. All of them run in **local mode** (empty Supabase keys) except the API tests, so they never touch real data.

| Layer | What it checks | Tool | Count |
|---|---|---|---|
| **Unit** | The app's logic in isolation: XSS escaping, name normalization and duplicate detection, WhatsApp links, Brazilian date formats, date-range filter, reminder states (overdue / today / upcoming), calendar exports, database ↔ app conversion, legacy data migration, change history, board filters, dashboard numbers and the condo list behind each number (size bands, contacts, competitors, expiring contracts, stale deals), the IPTU robot and the IBGE (CNEFE) robot for nearby cities (columns, quotes, Latin-1 files, grouping units into buildings, neighborhood chosen by majority, garages / small buildings / older years left out, no owner data kept, GeoSampa download link), reading the list in the page and the street names sent to the map lookup, the user-management Edge Function (who may create / cancel / reset, creating with a temporary password, adding to the org and undoing the login if that fails, existing logins, cancel / reactivate rules, e-mail sent / not configured / failed, escaped e-mail, single-file copy up to date), the address fields (splitting old addresses, rebuilding them, round trip, CEP format, street search term, ViaCEP number ranges), a member's activity (plain-language lines, matching history by name, joining the two sources without duplicates, period / search, summary numbers, day headings). Also static checks: HTML ↔ JS wiring, script order, duplicate ids, and that no secret key is ever shipped to the browser | Node's built-in test runner (`node:test`) | 158 |
| **End-to-end** | The real app in a real browser: board renders, create / edit / delete a condo, duplicate-name warning, drag and drop between columns (and that it's saved), search and filters, CSV export, overdue reminders turning cards red, the reminders page, editing reminders, XSS protection, the ☰ side menu (order, opening and closing, keyboard access, each item), contact types with "Outro…", the Contacts page (list, search, filter, standalone contacts, export, phone layout), the Templates page (create, copy, edit, delete, search), the Dashboard page (numbers, the condo list behind each number, "Ver no quadro", live update), the Prospecção page (list loaded from the robot's file or a clear error with "Tentar de novo", search, map positions looked up once and saved, "+ Funil", "+ Rota" and the stop turning into the card, Osasco with the city filter and positions from the Census, "Não quero" ticks and filter (local, shared through the database, read-only, missing table), phone tabs), the copy icon (inside the e-mail box, on the Contatos page, and on each Timeline note), the SULTS toggle and badge, the "No SULTS" / "Fora do SULTS" filter, the hot-contact flame (toggle, card, filter, Dashboard, read-only, phone header), the address fields (old addresses split and kept, street suggestions by city with the CEP for the number first, CEP lookup, keyboard, offline, phone layout), the Visitar button and car badge, the map's Visitar filter, read-only users (role "leitor": everything visible, nothing editable), users in Administração (create with a temporary password, e-mail not sent → password shown to copy, form checks, function not published, cancel / reactivate, new password, new organization selected, phone layout), changing your own password (forced at first login, ☰ → Minha senha, "Esqueci minha senha" and the reset link), each member's activity in Administração (logins, changes and deletions by day, summary, period and search, opening a condo from it, the condos' history before `atividades.sql` is run, phone layout), staying on the same page after a refresh (every page and the map), the visit route (synced between two devices of the same person through a fake Supabase, newest change wins, adding from the condo panel, starting point by address and GPS, typed-address stops, sorting by proximity, the Google Maps link, and all four exports), plus regression tests for fixed layout bugs (reminders count overflow, map legend scrolling with a mouse, no sideways scroll on phones, Administração cut off on phones) | Playwright (Chromium) | 170 |
| **API** | The Supabase API the app depends on: login, CRUD on `condominios`, team list, permission functions, and that nothing is readable or writable without a login (Row Level Security) | Postman collection run by Newman | 19 requests |

### Run the tests

Requires Node.js 20 or newer.

```bash
npm install                          # installs Playwright and Newman (dev only)
npx playwright install chromium      # downloads the test browser (first time only)

npm test                             # unit + end-to-end
npm run test:unit                    # unit only (no install needed)
npm run test:e2e                     # end-to-end only
```

The unit tests freeze the clock at 5 Oct 2026, 12:00 (São Paulo time), so date-dependent results are the same on any day. The end-to-end tests start a small local web server, replace `config.js` with empty keys, and block all internet requests, so they behave the same online and offline. The map tests use a small fake Leaflet (`tests/e2e/fake-leaflet.js`) that records what would be drawn, and a fake address search, so they can check the route line and its order without loading real maps.

### API tests (real Supabase)

These use a real login, passed as environment variables and never saved in the repository:

```bash
KMD3_EMAIL=you@example.com KMD3_PASSWORD=yourpassword npm run test:api
```

The collection creates a test condo named **[POSTMAN TESTE]** and deletes it at the end. You can also import the two files in `postman/` into the Postman app to run and read the requests by hand.

### Continuous integration

GitHub Actions (`.github/workflows/tests.yml`) runs the unit and end-to-end tests on every push and pull request. The API job only runs when started by hand from the **Actions** tab, using the `KMD3_EMAIL` and `KMD3_PASSWORD` repository secrets.

---

## Supabase setup

The app expects the following objects in the `public` schema.

### Table `condominios`

| Column | Type (suggested) | Notes |
|---|---|---|
| `id` | `text` / `uuid` | Primary key. New rows use `crypto.randomUUID()` |
| `nome`, `endereco`, `zona`, `importante` | `text` | |
| `aptos` | `integer` | Number of apartments |
| `fase` | `text` | Stage id, e.g. `cadastro`, `reuniao`, `contrato` |
| `status` | `text` | `verde`, `amarelo`, `vermelho`, `nenhum` |
| `ordem` | `integer` | Position inside the column |
| `contatos` | `jsonb` | `[{nome, telefone, email}]` |
| `concorrente` | `text` | |
| `fim_contrato` | `date` | |
| `perfil`, `notas` | `text` | |
| `responsavel`, `criado_por` | `text` | |
| `criado_em`, `atualizado_em` | `timestamptz` | |
| `historico` | `jsonb` | Change log |
| `observacoes` | `jsonb` | Timeline notes |
| `lembretes` | `jsonb` | Reminders (optional, see below) |
| `sults` | `boolean` | Green SULTS flag (optional, see below) |
| `quente` | `boolean` | Hot contact flag: the flame on the card (optional, see below) |
| `visitar` | `boolean` | "Visitar" flag, the car on the card (optional, see below) |
| `sindico`, `sindico_tel`, `sindico_email`, `admin_nome`, `admin_contato`, `admin_tel`, `admin_email` | `text` | Legacy columns. The app clears them and migrates old data to `contatos` |

If the `lembretes`, `sults`, `visitar` or `quente` column doesn't exist, the app still works, but that information is kept only on each person's device. A warning appears until the column is created. `database/schema.sql` adds them safely.

### Table `contatos_avulsos`

Standalone contacts from the Contatos page (contacts inside a condo stay in `condominios.contatos`). Every logged-in user can see and edit them. If the table doesn't exist yet, they are kept only in each person's browser and a warning explains it.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `nome` | `text` | Required |
| `telefone`, `email` | `text` | |
| `tipo` | `text` | "Quem é" |
| `criado_por` | `text` | Name of who added it |
| `criado_em` | `timestamptz` | |

### Table `templates`

Texts from the Templates page. Every logged-in user can see and edit them. If the table doesn't exist yet, they are kept only in each person's browser and a warning explains it.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `titulo`, `texto` | `text` | Both required |
| `criado_por` | `text` | Name of who created it |
| `criado_em`, `atualizado_em` | `timestamptz` | |

### Table `prospeccao_geo`

Map positions of the Prospecção buildings (the list itself is the file `dados/prospeccao-sp.json`). Each building is looked up once by its address and saved here for the whole team. If the table doesn't exist yet, positions are kept only in each browser (`quitandinha:prospGeo`).

| Column | Type | Notes |
|---|---|---|
| `id` | `text` | Primary key: the building's id in the list (setor + quadra + condominium number) |
| `lat`, `lng` | `double precision` | Position (empty if the address wasn't found) |
| `geo_precisao` | `text` | `numero` (exact) or `rua` (only the street was found) |
| `geo_em` | `timestamptz` | When it was looked up (not-found addresses are retried after 30 days) |

### Table `rotas`

Each person's visit route, so it follows them between devices (laptop, phone…). One row per user; Row Level Security lets each person see and change only their own. Every change is saved here and reaches the person's other open devices through Realtime (and when the app comes back to the screen). When two devices disagree, the most recent change wins. Without this table, the route stays in each browser.

| Column | Type | Notes |
|---|---|---|
| `usuario` | `uuid` | Primary key: the logged-in user (`auth.uid()`) |
| `rota` | `jsonb` | Stops in order (condo ids, or `x_…` for typed addresses and Prospecção buildings) |
| `extras` | `jsonb` | Typed addresses and Prospecção buildings in the route (name, address, position) |
| `inicio` | `jsonb` | Starting point, or empty |
| `atualizado_em` | `timestamptz` | When the route last changed (decides which copy wins) |

### Table `equipe`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` / `bigint` | Primary key |
| `nome` | `text` | Name shown in the app |
| `email` | `text` | Optional. Links the login to the name |

### Realtime

Enable Realtime on the `condominios` table so everyone's board updates automatically.

### Database functions (RPC)

| Function | Used for |
|---|---|
| `posso(acao)` | Returns whether the current user can `criar`, `editar` or `excluir` |
| `sou_admin()`, `sou_super()` | Shows the admin button and super-admin features |
| `admin_organizacoes()` | Lists organizations with member and lead counts |
| `admin_membros(p_org)` | Lists members of an organization and their permissions |
| `admin_definir_acesso(p_user, p_papel, p_ativo, p_ver, p_criar, p_editar, p_excluir)` | Saves a member's role and permissions |
| `admin_remover_membro(p_user)` | Removes a member |
| `adicionar_membro(p_email, p_papel, p_org)` | Adds an existing login to an organization |
| `criar_organizacao(p_nome)` | Creates an organization (super-admin) |
| `entrar_organizacao(p_nome)` | Switches the super-admin to another organization |

### Refreshing keeps you on the same page

The page you have open (Dashboard, Prospecção, Lembretes, Contatos, Templates, Equipe or the Mapa) is written in the address bar, e.g. `…/#dashboard` or `…/#mapa`. Refreshing the browser — or opening that link on another device — brings you back to that page instead of the board. Closing the page clears it from the address, so a refresh then opens the board as usual. An unknown address like `#xyz` just opens the board.

### Read-only users (role "leitor")

A person whose role can't create, edit or delete (the database's `posso` answers "no" to all three) gets a **read-only** app: they see the board, open cards and every page (Dashboard, Contatos, Templates, Prospecção, Lembretes, Mapa), but every button that changes data is hidden, the condo panel's fields are locked, the panel shows "Somente leitura", cards can't be dragged, and SULTS / Quente / Visitar only appear (as labels) when they're on. They can still copy templates, e-mails and notes, export lists, and open WhatsApp / call links. The real protection is the database's permissions (Row Level Security); the app just doesn't offer what the database would refuse.

### What each person has been doing (Administração)

In **Administração**, click a member's e-mail. A panel opens on the right (full screen on phones) with everything that person did, grouped by day (Hoje, Ontem, …) with the time: when they logged in, which condos they created, moved, changed or **deleted**, and the templates and contacts they touched. At the top: how many actions, how many different condos and how many new ones in the period (7, 30 or 90 days, or everything), plus their last activity. There's a search box, and clicking a condo name opens its card.

It uses two sources:

1. **The `atividades` table** — created by running [`database/atividades.sql`](database/atividades.sql) once in the Supabase SQL Editor. A database trigger writes a line for every condo, template and standalone contact that is created, changed or deleted (moving a card up/down inside a column and saves that change nothing are skipped), and the app writes a line when someone logs in ("Entrou no app") or opens it ("Abriu o app", at most every 30 minutes per device). Only admins of the organization (and super-admins) can read it, each person writes only their own lines, and nobody can edit or delete the log from the app.
2. **The condos' "Registro de atualizações"** (history), matched by the person's name. This works even before `atividades.sql` is run (the panel then says what's missing), and fills in the time before the table existed without showing any change twice.

| Column of `atividades` | Meaning |
|---|---|
| `usuario`, `email` | Who (filled in by the database from the login) |
| `quando` | When |
| `acao` | `entrou`, `abriu`, `criou`, `alterou`, `excluiu` |
| `tipo` | `app`, `condominio`, `template`, `contato` |
| `alvo_id`, `alvo` | Which item and its name (kept even after it's deleted) |
| `detalhe` | For condos, the history text, e.g. "Movido para Proposta enviada" |

### Users and organizations (no need to open Supabase)

Everything is done in **Administração**, through the Edge Function `admin-usuarios` (setup in [`supabase/README.md`](supabase/README.md)):

- **Organizations**: the super-admin creates one by typing its name and clicking **Criar**. It is selected right away, ready for its users.
- **Novo usuário**: name, e-mail, role and a **temporary password**. A strong one is already filled in; **Gerar** makes another. With **Enviar e-mail com a senha** on, the person gets an e-mail with the address, their e-mail and the password. If the e-mail can't be sent, the screen shows the password with a **Copiar** button. An e-mail that already has a login is just added to the organization.
- **Cancelar acesso** blocks the login: the person can't log in anymore, and their data stays. **Reativar** undoes it. **Nova senha** sets and e-mails a new temporary password. **Remover** takes the person out of the organization.
- Super-admins manage every organization. An organization's admins manage their own, but can't cancel or reset another admin. Nobody can cancel themselves.
- **Passwords**: at the first login with a temporary password, the app asks the person to create their own, and it can't be skipped. Anyone can change theirs in **☰ → Minha senha**. **Esqueci minha senha** on the login screen sends a reset link.

The secret key that creates logins stays inside Supabase. The browser only sends the person's own login token, and the function checks their permissions before doing anything.

---

## Deploying to Vercel

1. Put all the files at the top level of the GitHub repository, next to `index.html` (not inside a subfolder). The `.vercelignore` file keeps the test files out of the deployed site.
2. In Vercel, import the repository. No build settings are needed. Use framework **Other** and leave the build command empty.
3. Every push to the main branch redeploys automatically.

---

## External services

| Service | Purpose | Notes |
|---|---|---|
| [Supabase](https://supabase.com) | Database, login, realtime | SDK loaded from jsDelivr, with unpkg and Skypack as fallbacks |
| [Leaflet](https://leafletjs.com) + leaflet.heat | Map and heatmap | Loaded from cdnjs only when the map is opened |
| [Nominatim / OpenStreetMap](https://nominatim.org) | Address → coordinates | Limited to 1 request per second. Results are cached for 14 days when not found |
| [CARTO](https://carto.com/basemaps) | Map tiles | Key set in `mapa.js` (`CARTO_KEY`). If empty, falls back to OpenStreetMap tiles |
| Google Fonts | Schibsted Grotesk (one family for the whole app) | |

---

## Data stored in the browser

The app keeps a local copy in `localStorage` so nothing is lost if the connection drops:

| Key | Contents |
|---|---|
| `quitandinha:condominios` | Backup of all condos |
| `quitandinha:pendentes` | Changes not yet sent to the database |
| `quitandinha:equipe` | Team list (local mode) |
| `quitandinha:lembretes` | Reminders backup |
| `quitandinha:sults` | SULTS flags backup (only used if the database has no `sults` column) |
| `quitandinha:quente` | Hot-contact flags backup (only used if the database has no `quente` column) |
| `quitandinha:visitar` | Visitar flags backup (only used if the database has no `visitar` column) |
| `quitandinha:tiposContato` | "Quem é" types created with "Outro…" (so they show up right away) |
| `quitandinha:templates` | Copy of the templates (the only copy if the database has no `templates` table) |
| `quitandinha:contatosAvulsos` | Copy of the standalone contacts (the only copy if the database has no `contatos_avulsos` table) |
| `quitandinha:colunasInvertidas` | Which columns are reversed |
| `quitandinha:geocache` | Address coordinates for the map |
| `quitandinha:rota` | The current visit route (stops in order) |
| `quitandinha:rotaExtras` | Typed addresses added to the route |
| `quitandinha:rotaInicio` | The route's starting point |
| `quitandinha:rotaAtualizadaEm` | When this browser's copy of the route last changed (to compare with the database) |
| `quitandinha:prospAdicionados` | Which Prospecção buildings were turned into cards from this browser |
| `quitandinha:prospGeo` | Map positions of Prospecção buildings (only used if the database has no `prospeccao_geo` table) |

The `quitandinha:` prefix comes from the project's previous name. Changing it would make browsers lose their saved data and pending changes, so it was kept on purpose.

---

## Customizing

- **Funnel stages:** edit the `FASES` list at the top of `app.js`. Changing an `id` affects condos already saved with that stage.
- **Colors and fonts:** edit the CSS variables in `:root` at the top of `style.css`.
- **Default city for addresses:** `CIDADE_PADRAO` in `mapa.js`.
- **Roles and default permissions:** `ADM_PAPEIS` in `app.js`. The real rules are enforced in the database.

---

## License

Private project of KMD3 Market Comércio Ltda. All rights reserved.
