# Claw Mission Control

Real-time mission control dashboard for OpenClaw agents, backed by Convex.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy and edit the example:

```bash
cp .env.local.example .env.local
```

Then set your values:

```bash
NEXT_PUBLIC_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://YOUR_DEPLOYMENT.convex.site
```

`NEXT_PUBLIC_CONVEX_URL` is required by the frontend.

### 3. Start Convex backend

```bash
npx convex dev
```

### 4. Start the dashboard

```bash
npm run dev
```

## Unified Stack Management

The workspace includes a unified management layer to handle the OpenClaw Gateway, Mission Control Dashboard, Convex backend, and Cloudflare Tunnels.

### Start All Services

```bash
./start.sh
```

This command:
1. Restarts the **OpenClaw Gateway** via `launchd`.
2. Starts the **Convex Dev Server**, **Bridge**, and **Dashboard** via PM2.
3. Initiates **Cloudflare Quick Tunnels** for public access.
4. Generates temporary public URLs (found in `/tmp/*-tunnel.log`).

### Stop All Services

```bash
./stop.sh
```

### Process Monitoring (Watchdog)

A high-availability watchdog runs every 5 minutes to ensure all services remain online. If any PM2 process or the Gateway fails, it will be automatically healed.

- **Logs**: `/Users/forex/.openclaw/logs/watchdog.log`
- **Manual Check**: `pm2 list`

## Features

- Live mission queue with drag-and-drop Kanban stages (`inbox` -> `done`) and done-card archiving
- Agent roster and editable agent profiles (name, role, level, status, model, icon, prompt)
- Activity feed with event-type and agent filtering
- Automatic Telegram instruction tracking (ingest metadata can auto-create in-progress cards and auto-complete them on completion signals)
- Dashboard health stats (active agents, queued/completed tasks)
- Editable mission statement banner
- Standup report modal based on persisted standup snapshots
- Responsive mobile mode with bottom tab navigation
- Keyboard search shortcut (`Cmd/Ctrl + K`)

Current prototype areas:
- Calendar currently renders mock scheduled blocks (not persisted backend data).
- Global search currently uses seeded in-memory results.

## Architecture

Claw is composed of three runtime parts:

- Next.js 15 frontend (`src/`)
- Convex backend (`convex/`)
- Optional bridge process (`bridge/`) that translates OpenClaw transcript JSONL activity into Convex events

See full architecture docs:
- [Architecture](./docs/architecture.md)
- [Data Model](./docs/data-model.md)

## Configuration

| Variable | Required | Used By | Description |
|---|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Frontend | Convex deployment URL (`*.convex.cloud`) for React client. |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | No | Local config | Convex site URL (`*.convex.site`), kept for local environment consistency. |
| `CONVEX_SITE_URL` | Yes (bridge only) | Bridge | Target Convex site host for POST `/api/openclaw-hook`. |
| `OPENCLAW_HOOK_SECRET` | Yes (prod bridge + webhook) | Bridge + Convex HTTP | Shared HMAC secret used by `x-openclaw-signature`. |
| `OPENCLAW_HOOK_SIGNATURE_MODE` | No | Convex HTTP | `enforce` (default outside dev) or `warn` (development rollout mode). |
| `BRIDGE_STATE_PATH` | No | Bridge | Cursor state file (default `~/.openclaw/mission-control/bridge-cursors.json`). |
| `BRIDGE_DEAD_LETTER_PATH` | No | Bridge | Dead-letter JSONL path (default `~/.openclaw/mission-control/dead-letter.jsonl`). |
| `CONVEX_DEPLOYMENT` | Optional | Convex CLI | Deployment alias set by `npx convex dev`. |

## API Reference

- [Backend API (Convex queries, mutations, HTTP route)](./docs/api.md)

## Development

- App dev server: `npm run dev`
- Production build: `npm run build`
- Start production build: `npm run start`
- Lint: `npm run lint`
- Bridge watcher: `npm run bridge`

Detailed workflow:
- [Development Guide](./docs/development.md)
- [Operations Guide](./docs/operations.md)

## Documentation Index

- [Docs Home](./docs/index.md)
- [Architecture](./docs/architecture.md)
- [API](./docs/api.md)
- [Data Model](./docs/data-model.md)
- [Development](./docs/development.md)
- [Operations](./docs/operations.md)
- [Changelog](./CHANGELOG.md)

## Contributing

1. Create a branch from `main`.
2. Make focused changes.
3. Run `npm run lint`.
4. Validate core user flows in the dashboard.
5. Open a pull request with context and screenshots for UI changes.

## License

This repository currently has no `LICENSE` file. Treat code as proprietary until a license is added.
