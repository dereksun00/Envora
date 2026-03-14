# Envora — Sandbox Platform

## What This Project Is

A platform that provisions isolated demo environments (sandboxes) with AI-generated data for sales demos and QA testing. Each sandbox gets its own Postgres database and Docker container running a demo app (currently a CRM). The AI generates realistic seed data from a natural language prompt.

Teams can define reusable scenarios that control what data a sandbox contains. When a scenario runs, it produces a fresh, shareable sandbox with synthetic data, role-based access, and lifecycle controls (stop, start, reset, extend, destroy).

The **demo CRM app** (`demo-crm/`) is already built and working. It's a standalone Next.js app with full CRUD. The sandbox platform treats it as an opaque Docker image.

The **sandbox platform** (`platform/`) is the control panel that manages projects, scenarios, and sandboxes. It's split into `frontend/` and `backend/` for parallel development.

## Repo Structure

```
envora/
├── demo-crm/                    # Standalone CRM app (separate concern)
├── platform/
│   ├── shared/
│   │   └── types.ts             # SINGLE SOURCE OF TRUTH for all API shapes
│   ├── api-spec.yaml            # OpenAPI 3.0 spec for all endpoints
│   ├── backend/                 # Express + TypeScript API server
│   │   ├── prisma/schema.prisma # Platform DB (SQLite) — NOT sandbox DBs
│   │   ├── src/
│   │   │   ├── index.ts         # Express entry point (port 4000)
│   │   │   ├── routes/
│   │   │   │   ├── overview.ts  # GET /api/overview (dashboard stats)
│   │   │   │   ├── projects.ts  # CRUD projects (with counts)
│   │   │   │   ├── scenarios.ts # CRUD scenarios (create/update/delete/duplicate)
│   │   │   │   └── sandboxes.ts # Sandbox lifecycle (create/stop/start/reset/extend/destroy)
│   │   │   └── lib/
│   │   │       ├── db.ts        # Prisma client singleton
│   │   │       ├── generate.ts  # Claude API → SQL INSERT statements
│   │   │       ├── seed-with-retry.ts  # Execute SQL with AI-powered retry
│   │   │       ├── docker.ts    # Container lifecycle (launch/stop/start/destroy)
│   │   │       └── provision.ts # Orchestrator tying it all together
│   │   └── scripts/
│   │       └── test-pipeline.ts # E2E pipeline test
│   ├── frontend/                # Next.js 14 App Router (port 3001)
│   │   ├── src/app/             # 7 routes (see below)
│   │   ├── src/lib/api.ts       # Typed fetch wrapper for backend API
│   │   └── src/components/      # Reusable components
│   └── test-fixtures/           # Pre-validated demo data
│       ├── demo-crm-schema.prisma
│       ├── demo-seed.sql
│       └── demo-scenario.json
└── CLAUDE.md                    # You are here
```

## Architecture

| Layer | Tech | Port |
|-------|------|------|
| Frontend | Next.js 14 App Router + **Blueprint.js 5** (Palantir) | 3001 |
| Backend API | Express + TypeScript | 4000 |
| Platform DB | SQLite via Prisma | file |
| Sandbox DBs | Postgres 16 (Docker, one DB per sandbox) | 5432 |
| Sandbox Apps | Docker containers on `sandbox-net` bridge | random |
| AI Generation | Claude API (Sonnet) via Anthropic SDK | — |

Frontend proxies `/api/*` to `localhost:4000` via Next.js rewrites.

## Critical Rules

1. **All API shapes MUST match `platform/shared/types.ts`** — this is the contract between frontend and backend.
2. **After ANY change to `shared/types.ts`, re-feed it to your AI tool.**
3. **Backend routes use `Response.json()`, not `NextResponse.json()`** (it's Express, not Next.js).
4. **provision.ts calls generate.ts DIRECTLY as a function import, NOT via HTTP.**
5. **Prisma client from `lib/db.ts` only** — do NOT create new PrismaClient instances.
6. **Docker containers use DNS name `sandbox-postgres` in DATABASE_URL, NOT localhost.**
7. **Frontend uses Blueprint.js (`@blueprintjs/core`, `@blueprintjs/icons`) + plain CSS. NO Tailwind. NO shadcn/ui.**
8. **Blueprint dark mode: `bp5-dark` class on `<body>`. ThemeProvider manages the toggle. Components auto-adapt.**
9. **Frontend imports shared types via `@shared/types` path alias (configured in tsconfig.json).**

## Frontend UI Stack

- **Component library**: `@blueprintjs/core` v5 — Button, Card, Tag, Alert, Callout, Dialog, FormGroup, InputGroup, TextArea, HTMLSelect, HTMLTable, Spinner, NonIdealState, Icon, ButtonGroup, Menu, MenuItem, Popover
- **Icons**: `@blueprintjs/icons` v5 — Blueprint's built-in icon set
- **Dark/Light mode**: `bp5-dark` class toggle via ThemeProvider + localStorage persistence
- **Styling**: Blueprint CSS + `globals.css` (plain CSS). No Tailwind, no CSS modules.

## The 7 Frontend Routes

| Route | Purpose |
|-------|---------|
| `/` | **Overview dashboard** — stat cards, quick-launch widget, recent sandboxes table |
| `/projects` | **Projects list** — card grid with scenario/sandbox counts |
| `/projects/new` | **Create Project** — form with schema textarea, format toggle |
| `/projects/[id]` | **Project Detail** — schema, scenario cards with hover actions (launch/edit/duplicate/delete), sandbox table, create/edit scenario dialog |
| `/projects/[id]/scenarios/new` | Redirect to project detail (scenario creation uses a Dialog) |
| `/sandboxes` | **All Sandboxes** — filterable table with lifecycle actions |
| `/sandboxes/[id]` | **Sandbox Detail** — status badge, lifecycle controls, provisioning step indicator, URL display |

## Frontend Components

| Component | Purpose |
|-----------|---------|
| `sidebar.tsx` | Navigation: Overview, Projects, Sandboxes + theme toggle |
| `theme-provider.tsx` | Dark/light mode context + localStorage |
| `stat-card.tsx` | Metric card (icon, value, label) for Overview |
| `quick-launch.tsx` | Project + Scenario dropdowns + Launch button |
| `sandbox-table.tsx` | Reusable sandbox table with status badges + inline actions |
| `sandbox-actions.tsx` | Contextual action buttons per sandbox status |
| `sandbox-status-badge.tsx` | Status tag for all 6 sandbox states |
| `scenario-card.tsx` | Scenario card with hover-reveal action bar |
| `create-scenario-dialog.tsx` | Blueprint Dialog for create/edit scenario |

## The API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/overview` | Dashboard stats (counts + recent sandboxes) |
| GET | `/api/projects` | List projects with scenario/sandbox counts |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project with scenarios + sandboxes |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/scenarios` | Create scenario |
| PUT | `/api/projects/:id/scenarios/:scenarioId` | Update scenario |
| DELETE | `/api/projects/:id/scenarios/:scenarioId` | Delete scenario |
| POST | `/api/projects/:id/scenarios/:scenarioId/duplicate` | Duplicate scenario |
| GET | `/api/sandboxes` | List all sandboxes (filter by status/project) |
| POST | `/api/sandboxes` | Create sandbox + start async provisioning |
| GET | `/api/sandboxes/:id` | Get sandbox status (poll every 2s) |
| PATCH | `/api/sandboxes/:id` | Lifecycle actions (stop/start/reset/extend) |
| DELETE | `/api/sandboxes/:id` | Destroy sandbox |

## Sandbox Lifecycle

| Status | Available Actions |
|--------|------------------|
| `provisioning` | (view only) |
| `running` | Open URL, Stop, Reset, Extend, Destroy |
| `stopped` | Start, Reset, Destroy |
| `failed` | Reset, Destroy |
| `expired` | Start (re-extends), Reset, Destroy |
| `destroyed` | (no actions) |

## The Provisioning Pipeline (7 Steps)

1. Create Postgres database
2. Apply schema (Prisma db push or raw SQL)
3. Generate seed data via Claude API (or use cached SQL)
4. Seed database with retry loop
5. Launch Docker container
6. Poll for app readiness (30s timeout)
7. Set status to "running" with URL

## Known Quirks

- **Scenario prompt ellipses**: Trailing `...` in a scenario prompt caused Claude to respond conversationally instead of generating SQL. `generate.ts` now strips trailing `..+` before sending to the API.
- **sandbox-postgres host port**: If port 5432 is taken (e.g. by demo-crm-db-1), run sandbox-postgres on 5433. Update `SANDBOX_POSTGRES_PORT=5433` in `platform/backend/.env`. The container-internal port stays 5432 — only the host binding changes.
- **Backend doesn't auto-reload `.env`**: `tsx watch` reloads on code changes only. Restart the backend manually after changing `.env`.

## Dev Setup

```bash
# Backend
cd platform/backend
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, SANDBOX_POSTGRES_PORT (5433 if 5432 is taken)
npm install
npx prisma db push
npm run dev  # → localhost:4000

# Frontend
cd platform/frontend
npm install
npm run dev  # → localhost:3001 (proxies /api to :4000)

# Shared Postgres for sandboxes
docker network create sandbox-net
docker run -d --name sandbox-postgres --network sandbox-net \
  -e POSTGRES_PASSWORD=postgres -p 5433:5432 postgres:16
```
