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
- Reads new JSONL lines per file (tracks line offsets in-memory)
- Sends mapped events to Convex HTTP endpoint

Start command:

```bash
CONVEX_SITE_URL=https://YOUR_DEPLOYMENT.convex.site npm run bridge
```

Expected startup logs:
- `Starting OpenClaw -> Convex bridge`
- `Watching: ~/.openclaw/agents`
- `Pushing to: <your convex site url>`

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
- Remove or tighten wildcard image remote patterns in `next.config.ts` if unneeded.
- Re-enable strict build gates (`typescript`/`eslint`) before production hardening.
- Add authentication/authorization controls if exposed outside trusted network.
- Add observability for bridge POST failures and Convex mutation errors.

## Troubleshooting

### Bridge: `CONVEX_SITE_URL env var is required`

- Provide `CONVEX_SITE_URL` when starting bridge.

### Convex push failed responses

- Check target URL is `*.convex.site` and endpoint `/api/openclaw-hook` is deployed.
- Confirm payload format includes `event`, `agentId`, `data`.

### Agents panel empty

- No agents exist in Convex yet, or wrong Convex deployment URL.
- Run `upsertAgent` via UI modal save flow or upstream integration event.

### Kanban drag appears but doesn't persist

- Check browser console/network for mutation errors.
- Confirm `moveTask` mutation is available in active deployment.

### Standup modal empty

- No standup rows generated yet.
- Generate via `mutations.generateStandup` for the target date.
