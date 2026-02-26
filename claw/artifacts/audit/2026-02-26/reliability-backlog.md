# Telegram Reliability Backlog

**Date:** 2026-02-26

## P0 (Critical Priority)
- **Migrate to PM2:** Add `openclaw-gateway` to `claw/ecosystem.config.js` with `autorestart: true` and appropriate log paths.
- **Implement Auto-Retry:** Add `@grammyjs/auto-retry` to the `grammy` instance in the OpenClaw codebase, configured with exponential backoff and a maximum retry limit.

## P1 (Medium Priority)
- **Healthcheck Implementation:** Create a small watchdog script or health endpoint that verifies the bot is actively polling/connected. If it fails, trigger a PM2 restart.
- **Structured Error Logging:** Ensure unhandled rejections trigger a fast-fail (`process.exit(1)`) so the process manager can immediately restart it, preventing zombie states.