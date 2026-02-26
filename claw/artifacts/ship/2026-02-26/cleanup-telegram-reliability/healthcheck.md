# Telegram Bot Healthcheck

**Date:** 2026-02-26

## Execution
Run the following script to verify the bot's health:
```bash
cd /Users/forex/openclaw-workspace/claw
./scripts/healthcheck.sh
```

## What it does
1. **Process Level:** Uses `pm2 jlist` to ensure `openclaw-gateway` is registered and `status == online`.
2. **HTTP Level:** Hits the `openclaw` admin HTTP server on `http://localhost:18789/` to ensure the Node.js event loop is not completely frozen.

## Integration
This script can be executed as a cron job or used via a monitoring agent. If it returns exit code `1`, the monitoring agent can invoke `pm2 restart openclaw-gateway` automatically.