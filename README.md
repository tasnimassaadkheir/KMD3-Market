# KMD3 Market — Condo Sales Funnel

A web-based Kanban board for tracking condominiums (*condomínios*) through the KMD3 Market sales funnel, from first prospecting to a signed contract. The team sees the same board in real time, can plan visit routes on a map, and gets reminders for every next step.

The interface is in Brazilian Portuguese. The code is plain HTML, CSS and JavaScript. It has no framework and no build step.

---

## Features

**Kanban board**
- Eight funnel stages, from *Possui Concorrência* (has a competitor) to *Assinatura de Contrato* (contract signed).
- Drag and drop cards between columns and reorder them inside a column.
- Each column can be reversed with one click.
- Color-coded status on each card: 🟢 closed · 🟡 in progress · 🔴 lost · ⚪ undefined.
- Filters by text search, status, person responsible and registration date.

**Condo details**
- Name, address, number of apartments, zone, and a highlighted "Importante" warning.
- Multiple contacts per condo, each with a one-click WhatsApp button.
- Competitor and contract end date. The card turns red when the contract ends within 90 days.
- A timeline of notes, with the date and author added automatically. Notes can be edited.
- An automatic change log with update frequency statistics.
- A duplicate warning while typing a name that looks like an existing condo.
- A green **SULTS** toggle in the panel header. When on, the card shows a green **S** badge next to the name of whoever edited it last.
- A **Visitar** button next to "Adicionar à rota". It saves right away, and the card shows a small car on its top-right corner.

**Reminders (Lembretes)**
- Reminders per condo, with quick buttons (*Hoje, Amanhã, Em 3 dias…*).
- A full-screen reminders page with Overdue, Today, Upcoming and Done tabs.
- Cards turn red when a reminder is overdue, and a badge shows the count on the toolbar.
- Export to Google Calendar, or as a `.ics` file for Apple Calendar or Outlook (with an alarm 10 minutes before).
- Optional browser notifications.

**Map view**
- Shows all condos on a map, colored by status, stage or competitor.
- Heatmap mode.
- Visit route planner:
  - Add condos from a map point **or straight from the condo's panel** ("Adicionar à rota"), which works even with the map closed.
  - Set an optional **starting point** (*ponto de partida*): a typed address, or your current location with 📍.
  - Add **any typed address** as a stop (a supplier, a lunch stop, a prospect not registered yet).
  - Reorder stops, or sort them by proximity starting from the starting point.
  - Open the route in Google Maps, or **export** it as an Excel spreadsheet, a WhatsApp message, plain text, or a printable page / PDF with a "Visitado" column to tick on the go.
- Addresses are converted to coordinates automatically and cached in the browser.

**Team and access**
- Email and password login (Supabase Auth).
- Organizations, members and roles (*admin, editor, vendedor, leitor*) with per-person permissions: see all, create, edit, delete.
- An admin screen visible only to admins.

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
| **Unit** | The app's logic in isolation: XSS escaping, name normalization and duplicate detection, WhatsApp links, Brazilian date formats, date-range filter, reminder states (overdue / today / upcoming), calendar exports, database ↔ app conversion, legacy data migration, change history, board filters. Also static checks: HTML ↔ JS wiring, script order, duplicate ids, and that no secret key is ever shipped to the browser | Node's built-in test runner (`node:test`) | 75 |
| **End-to-end** | The real app in a real browser: board renders, create / edit / delete a condo, duplicate-name warning, drag and drop between columns (and that it's saved), search and filters, CSV export, overdue reminders turning cards red, the reminders page, XSS protection, the SULTS toggle and badge, the Visitar button and car badge, the visit route (adding from the condo panel, starting point by address and GPS, typed-address stops, sorting by proximity, the Google Maps link, and all four exports), plus regression tests for fixed layout bugs (reminder badge overflow, map legend scrolling with a mouse, no sideways scroll on phones) | Playwright (Chromium) | 43 |
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
| `visitar` | `boolean` | "Visitar" flag, the car on the card (optional, see below) |
| `sindico`, `sindico_tel`, `sindico_email`, `admin_nome`, `admin_contato`, `admin_tel`, `admin_email` | `text` | Legacy columns. The app clears them and migrates old data to `contatos` |

If the `lembretes`, `sults` or `visitar` column doesn't exist, the app still works, but that information is kept only on each person's device. A warning appears until the column is created. `database/schema.sql` adds them safely.

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

### Adding users

Logins are created in Supabase: **Authentication → Users → Add user**, with **Auto Confirm User** checked. Then add the person in the app's admin screen, and optionally in **Equipe** with the same email so their name appears correctly.

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
| Google Fonts | Bricolage Grotesque and Inter | |

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
| `quitandinha:visitar` | Visitar flags backup (only used if the database has no `visitar` column) |
| `quitandinha:colunasInvertidas` | Which columns are reversed |
| `quitandinha:geocache` | Address coordinates for the map |
| `quitandinha:rota` | The current visit route (stops in order) |
| `quitandinha:rotaExtras` | Typed addresses added to the route |
| `quitandinha:rotaInicio` | The route's starting point |

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
