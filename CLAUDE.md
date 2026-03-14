# Envora — Sandbox Platform

## What This Project Is

A platform that provisions isolated demo environments (sandboxes) with AI-generated data. Each sandbox gets its own Postgres database and Docker container running a demo app (currently a CRM). The AI generates realistic seed data from a natural language prompt.

The **demo CRM app** (`demo-crm/`) is already built and working. It's a standalone Next.js app with full CRUD. The sandbox platform treats it as an opaque Docker image.

The **sandbox platform** (`platform/`) is the control panel that manages projects, scenarios, and sandboxes. It's split into `frontend/` and `backend/` for parallel development.

## Repo Structure

```
envora/
├── demo-crm/                    # ✅ DONE — Standalone CRM app (separate concern)
├── platform/
│   ├── shared/
│   │   └── types.ts             # ⚡ SINGLE SOURCE OF TRUTH for all API shapes
│   ├── api-spec.yaml            # OpenAPI 3.0 spec for all endpoints
│   ├── backend/                 # Express + TypeScript API server
│   │   ├── prisma/schema.prisma # Platform DB (SQLite) — NOT sandbox DBs
│   │   ├── src/
│   │   │   ├── index.ts         # Express entry point (port 4000)
│   │   │   ├── routes/          # API route handlers
│   │   │   │   ├── projects.ts
│   │   │   │   ├── scenarios.ts
│   │   │   │   └── sandboxes.ts
│   │   │   └── lib/             # Core pipeline modules
│   │   │       ├── db.ts        # Prisma client singleton
│   │   │       ├── generate.ts  # Claude API → SQL INSERT statements
│   │   │       ├── seed-with-retry.ts  # Execute SQL with AI-powered retry
│   │   │       ├── docker.ts    # Container lifecycle (dockerode)
│   │   │       └── provision.ts # Orchestrator tying it all together
│   │   └── scripts/
│   │       └── test-pipeline.ts # E2E pipeline test (run before any UI work)
│   ├── frontend/                # Next.js 14 App Router (port 3001)
│   │   ├── src/app/             # 5 pages
│   │   ├── src/lib/api.ts       # Typed fetch wrapper for backend API
│   │   └── src/components/      # ThemeProvider + Sidebar
│   └── test-fixtures/           # Pre-validated demo data
│       ├── demo-crm-schema.prisma
│       ├── demo-seed.sql
│       └── demo-scenario.json
└── CLAUDE.md                    # ← You are here
```

## Architecture

| Layer | Tech | Port |
|-------|------|------|
| Frontend | Next.js 14 App Router + **Blueprint.js** (Palantir) | 3001 |
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
8. **Blueprint dark mode: `bp5-dark` class on `<body>`. ThemeProvider in `src/components/theme-provider.tsx` manages the toggle. Components auto-adapt.**
9. **Frontend pages follow the data-fetching pattern established in `app/page.tsx` (Dashboard).**

## Frontend UI Stack

- **Component library**: `@blueprintjs/core` v5 — Button, Card, Tag, Alert, Callout, FormGroup, InputGroup, TextArea, Spinner, NonIdealState, Icon, ButtonGroup
- **Icons**: `@blueprintjs/icons` v5 — Blueprint's built-in icon set (NOT lucide-react)
- **Dark/Light mode**: `bp5-dark` class toggle via ThemeProvider + localStorage persistence
- **Styling**: Blueprint CSS + `globals.css` (plain CSS). No Tailwind, no CSS modules, no styled-components.
- **Key Blueprint patterns**:
  - `<Card interactive>` for clickable cards
  - `<Tag intent="success" minimal round>` for status badges
  - `<Alert>` for destructive action confirmations
  - `<Callout intent="...">` for success/error banners
  - `<NonIdealState>` for empty states
  - `<FormGroup>` + `<InputGroup>` for forms
  - `<ButtonGroup minimal>` for toggles (e.g., Prisma/SQL format)
  - `<Spinner>` for loading states

## The 5 Frontend Pages (Build Order)

1. **Dashboard** (`/`) — Project list, active sandbox count, "New Project" button
2. **Create Project** (`/projects/new`) — Form: name, docker image, schema textarea, format toggle, port
3. **Project Detail** (`/projects/[id]`) — Schema preview, scenario list with "Launch" buttons
4. **Create Scenario** (`/projects/[id]/scenarios/new`) — Form: name, prompt, demo users list
5. **Sandbox Status** (`/sandboxes/[id]`) — Polling step indicator, URL display, destroy button

## The 7 API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project with scenarios + sandboxes |
| POST | `/api/projects/:id/scenarios` | Create scenario |
| POST | `/api/sandboxes` | Create sandbox + start async provisioning |
| GET | `/api/sandboxes/:id` | Get sandbox status (poll every 2s) |
| DELETE | `/api/sandboxes/:id` | Destroy sandbox |

## The Provisioning Pipeline (7 Steps)

1. Create Postgres database
2. Apply schema (Prisma db push or raw SQL)
3. Generate seed data via Claude API (or use cached SQL)
4. Seed database with retry loop
5. Launch Docker container
6. Poll for app readiness (30s timeout)
7. Set status to "running" with URL

## File Ownership (for parallel work)

```
platform/backend/**           ← Backend engineer
platform/frontend/**          ← Frontend engineer
platform/shared/types.ts      ← Shared (announce changes verbally)
platform/api-spec.yaml        ← Shared (reference only)
platform/test-fixtures/**     ← Testing/integration lead
demo-crm/**                   ← Already done, don't touch
```

## Dev Setup

```bash
# Backend
cd platform/backend
cp .env.example .env
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
  -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
```
