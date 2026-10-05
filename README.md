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

**Reminders (Lembretes)**
- Reminders per condo, with quick buttons (*Hoje, Amanhã, Em 3 dias…*).
- A full-screen reminders page with Overdue, Today, Upcoming and Done tabs.
- Cards turn red when a reminder is overdue, and a badge shows the count on the toolbar.
- Export to Google Calendar, or as a `.ics` file for Apple Calendar or Outlook (with an alarm 10 minutes before).
- Optional browser notifications.

**Map view**
- Shows all condos on a map, colored by status, stage or competitor.
- Heatmap mode.
- Visit route planner: add stops, reorder them, sort by proximity, then open the route in Google Maps.
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
├── favicon.png           Browser tab icon
├── apple-touch-icon.png  iPhone home-screen icon
├── logo-header.png       Logo in the top bar
├── logo-login.png        Logo on the login screen
└── README.md
```

> **All files must stay in the same folder as `index.html`.** The page finds its CSS, scripts and images by file name, so if one of them is missing or in a different folder, that part won't load.

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
| `sindico`, `sindico_tel`, `sindico_email`, `admin_nome`, `admin_contato`, `admin_tel`, `admin_email` | `text` | Legacy columns. The app clears them and migrates old data to `contatos` |

If the `lembretes` column doesn't exist, the app still works, but reminders are kept only on each person's device. A warning appears until the column is created.

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

1. Put all the files at the top level of the GitHub repository, next to `index.html` (not inside a subfolder).
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
| `quitandinha:colunasInvertidas` | Which columns are reversed |
| `quitandinha:geocache` | Address coordinates for the map |
| `quitandinha:rota` | The current visit route |

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
