# Operations Guide

Operational notes for running Claw and related bridge/tunnel services.

## Services and Ports

| Service | Default | Purpose |
|---|---|---|
| Next.js app | `localhost:3000` | Mission Control dashboard UI |
| Convex site | `https://<deployment>.convex.site` | HTTP actions (including `/api/openclaw-hook`) |
| OpenClaw gateway | `localhost:18789` | Optional external OpenClaw gateway endpoint |

## Bridge Operation

Bridge file: `bridge/index.ts`

Behavior:
- Polls OpenClaw transcript directories every 2 seconds
- Reads new JSONL bytes per file (durable byte-offset cursors)
- Persists cursor state to `~/.openclaw/mission-control/bridge-cursors.json` by default
- Sends signed events to Convex HTTP endpoint with `x-openclaw-signature`
- Retries transient failures with exponential backoff (up to 5 attempts)
- Writes dead-letter JSONL entries on final failure

Start command:

```bash
CONVEX_SITE_URL=https://YOUR_DEPLOYMENT.convex.site \
OPENCLAW_HOOK_SECRET=replace-with-shared-secret \
npm run bridge
```

Expected startup logs:
- `Starting OpenClaw -> Convex bridge`
- `Watching: ~/.openclaw/agents`
- `Pushing to: <your convex site url>`
- `Cursor state: ~/.openclaw/mission-control/bridge-cursors.json`
- `Dead-letter path: ~/.openclaw/mission-control/dead-letter.jsonl`

Heartbeat log (every 60s):
- scanned file count
- queue depth
- delivery success/failure counts
- last success/failure timestamps

## Cloudflare Tunnel (Optional)

Helper files:
- `infra/setup-tunnel.sh`
- `infra/cloudflared-config.yml`

### Setup

1. Install cloudflared:

```bash
brew install cloudflared
```

2. Authenticate and create tunnel:

```bash
cloudflared tunnel login
cloudflared tunnel create openclaw-gateway
```

3. Update `infra/cloudflared-config.yml`:
- Replace `YOUR_TUNNEL_ID`
- Set hostnames for your domain

4. Run tunnel:

```bash
cloudflared tunnel --config ~/openclaw-workspace/claw/infra/cloudflared-config.yml run
```

## Production Checklist

- Validate correct Convex deployment URLs for both frontend and bridge.
- Ensure bridge has stable process supervision (systemd/launchd/pm2).
- Set `OPENCLAW_HOOK_SECRET` in both bridge runtime and Convex deployment environment.
- Keep `OPENCLAW_HOOK_SIGNATURE_MODE=enforce` outside development.
- Remove or tighten wildcard image remote patterns in `next.config.ts` if unneeded.
- Re-enable strict build gates (`typescript`/`eslint`) before production hardening.
- Add authentication/authorization controls if exposed outside trusted network.
- Add observability for bridge POST failures and Convex mutation errors.

## Health Checks

Quick local checks:

```bash
# 1) Bridge process is up
ps aux | rg "bridge/index.ts|tsx watch index.ts"

# 2) Bridge heartbeat and delivery logs are current
tail -n 40 /tmp/bridge.log

# 3) Last dead-letter entries (should be empty/rare)
tail -n 20 ~/.openclaw/mission-control/dead-letter.jsonl

# 4) Cursor file is updating
ls -lh ~/.openclaw/mission-control/bridge-cursors.json
```

## Troubleshooting

### Bridge: `CONVEX_SITE_URL env var is required`

- Provide `CONVEX_SITE_URL` when starting bridge.

### Bridge: missing `OPENCLAW_HOOK_SECRET`

- In development, bridge can run unsigned (warning only).
- Outside development, bridge exits by design until secret is configured.

### Convex push failed responses

- Check target URL is `*.convex.site` and endpoint `/api/openclaw-hook` is deployed.
- Confirm payload format includes `eventId`, `event`, `agentId`, `sourceSessionId`, `sourceOffset`, `data`.
- Check signature mode and shared secret alignment.

### Agents panel empty

- No agents exist in Convex yet, or wrong Convex deployment URL.
- Run `upsertAgent` via UI modal save flow or upstream integration event.

### Kanban drag appears but doesn't persist

- Check browser console/network for mutation errors.
- Confirm `moveTask` mutation is available in active deployment.

### Standup modal empty

- No standup rows generated yet.
- Generate via `mutations.generateStandup` for the target date.
