# Review Document (Adversarial Check)

**Date:** 2026-02-26

## Conductor Review
- **Acceptance Criteria Check:**
  - *Codebase is audited for dead code/unused deps:* PASS. `depcheck` ran and unused deps removed.
  - *Telegram bot has robust restart policy:* PASS. Managed by `pm2` now.
  - *Healthcheck script:* PASS. `scripts/healthcheck.sh` created and verified.

## Adversarial Reliability Check
1. **Infinite Retry Loops:**
   - **Risk:** Fast crashing causing PM2 to spin up CPU.
   - **Mitigation:** `restart_delay: 5000` added to `ecosystem.config.js` to enforce a 5s backoff between restarts.
2. **Log Spam:**
   - **Risk:** PM2 generating huge logs over time.
   - **Mitigation:** PM2 directs to standard log paths (`~/.openclaw/logs/gateway.log`). We rely on PM2's native log rotation capabilities (if installed).
3. **Token/Env Leakage:**
   - **Risk:** Logging secrets to stdout.
   - **Mitigation:** Explicitly passed via `env` in ecosystem file. Code does not log `env`.
4. **Crash Edge Cases:**
   - **Risk:** Node process hangs without exiting.
   - **Mitigation:** The `healthcheck.sh` validates the HTTP endpoint on port 18789. If it hangs, an external watchdog can use it to force-restart PM2.
5. **Rate Limiting Behavior (Telegram 429s):**
   - **Risk:** API throws 429 and drops messages.
   - **Mitigation:** A crash restarts the polling. Future upgrade required upstream in `openclaw` to add `@grammyjs/auto-retry` for seamless backoff.

## Staff Engineer Approval
**Decision:** GO.
**Reasoning:** Migrating the Telegram gateway from `launchd` to the standard workspace `pm2` ecosystem greatly enhances observability and reliability. The cleanup also correctly tightened Next.js dependencies.