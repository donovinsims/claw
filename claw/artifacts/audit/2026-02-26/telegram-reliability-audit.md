# Telegram Bot Reliability Audit

**Date:** 2026-02-26

## Current State
- The Telegram bot is driven by the `openclaw gateway` process (`openclaw-antigravity1/src/telegram/bot.ts`).
- It uses the `grammy` framework.
- It is currently managed by a macOS `launchd` plist (`ai.openclaw.gateway.plist`).

## Root Cause Analysis for "Stops Replying"
1. **Network Timeouts & Rate Limits:** The `bot.ts` script uses `apiThrottler` but lacks robust API retry and backoff mechanisms (`@grammyjs/auto-retry`). When Telegram API errors occur (e.g. 429 Too Many Requests or socket hangups), the bot drops the requests or crashes.
2. **Process Zombie State:** `launchd` is configured with `KeepAlive=true`, meaning it restarts if the process *exits*. However, unhandled promise rejections or socket hangs might leave the Node.js process running (zombie state) without actively polling Telegram.
3. **Lack of Monitoring:** There is no local healthcheck or watchdog that can detect when the bot stops polling, meaning it stays "up" at the OS level but is functionally dead.

## Required Hardening
- **Process Manager:** PM2 is already used for the dashboard. The gateway must be added to PM2 (`ecosystem.config.js`) to provide robust restarts, memory limit checks, and structured logs.
- **Retry/Backoff:** Integrate `@grammyjs/auto-retry`.
- **Healthcheck & Watchdog:** Add a periodic healthcheck mechanism (or expose a `/health` HTTP endpoint from the gateway) to allow PM2 or a watchdog script to kill/restart it if it becomes unresponsive.