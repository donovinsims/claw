# Telegram Bot Reliability Runbook

**Date:** 2026-02-26

## Architecture
The Telegram bot is driven by the `openclaw-gateway`. Previously managed via a fragmented macOS `launchd` plist, it is now integrated into `pm2` via `claw/ecosystem.config.js`.

## Start the Bot
From `/Users/forex/openclaw-workspace/claw`:
```bash
pm2 start ecosystem.config.js --only openclaw-gateway
```
*(Optionally run `pm2 start ecosystem.config.js` to start everything: the dashboard, bridge, and gateway).*

## View Logs
```bash
pm2 logs openclaw-gateway
# or tail directly:
tail -f /Users/forex/.openclaw/logs/gateway.log
```

## Stopping / Restarting
```bash
pm2 restart openclaw-gateway
pm2 stop openclaw-gateway
```

## Handling Outages
If the bot stops replying:
1. Run `./scripts/healthcheck.sh`.
2. Check `pm2 logs openclaw-gateway` for `429 Too Many Requests` or `socket hang up`.
3. If it is hung but still "online" in PM2, force restart with `pm2 restart openclaw-gateway`.

*(Note: The `openclaw-antigravity1` project needs to implement `@grammyjs/auto-retry` upstream to permanently fix 429 errors causing silent hangs. For now, PM2 allows easy manual and auto-restarts on crash).*