# Final Ship Pack

**Date:** 2026-02-26
**Track:** Codebase Cleanup + Telegram Bot Reliability

## 1. What Changed
- **Codebase Cleanup:** Cleaned up unused Next.js dependencies identified via `depcheck` (`framer-motion`, `zod`, etc.) and integrated a strict `typecheck` script into `package.json`.
- **Telegram Bot Reliability:** Migrated the `openclaw-gateway` (Telegram bot runner) from an isolated macOS `launchd` plist into the central `pm2` ecosystem (`ecosystem.config.js`). It now benefits from strict `autorestart` logic. A dedicated HTTP and PM2 process healthcheck was also implemented.

## 2. Files Touched
- `package.json` (removed unused deps, added `typecheck` script)
- `ecosystem.config.js` (added `openclaw-gateway` app config)
- `scripts/healthcheck.sh` (new)
- `tasks/todo.md` and Conductor artifact docs.

## 3. How to Verify Codebase Health
Run the following from `/Users/forex/openclaw-workspace/claw`:
```bash
npm run lint
npm run typecheck
```

## 4. How to Verify Telegram Bot Reliability
Execute the healthcheck script:
```bash
cd /Users/forex/openclaw-workspace/claw
./scripts/healthcheck.sh
```

## 5. Exact Restart Commands
```bash
pm2 restart openclaw-gateway
# Or to restart everything:
pm2 restart ecosystem.config.js
```

## 6. Where Logs Live & How to Tail Them
- **PM2 Context:** `pm2 logs openclaw-gateway`
- **File System (Out):** `tail -f /Users/forex/.openclaw/logs/gateway.log`
- **File System (Err):** `tail -f /Users/forex/.openclaw/logs/gateway.err.log`

## 7. Exact Healthcheck Method
```bash
# Process manager check:
pm2 jlist | grep openclaw-gateway

# Direct HTTP validation against Gateway API:
curl -s -o /dev/null -w "%{http_code}" http://localhost:18789/
# Expected Output: 200
```

## 8. Rollback Steps
```bash
# Rollback codebase changes:
cd /Users/forex/openclaw-workspace/claw
git reset --hard HEAD

# Stop PM2 from managing gateway:
pm2 delete openclaw-gateway

# Reload original launchd plist:
launchctl load ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

## 9. Single Next Best Improvement
**Upstream Auto-Retry:** Implement the `@grammyjs/auto-retry` plugin directly in the `openclaw-antigravity1/src/telegram/bot.ts` upstream repository so the bot natively survives Telegram API Rate Limits (429 errors) without crashing PM2.