# Risk Log

**Date:** 2026-02-26

| Risk | Severity | Mitigation | Status |
| --- | --- | --- | --- |
| PM2 restart loop on critical syntax error | Medium | Added `restart_delay: 5000` to prevent CPU exhaustion. | Mitigated |
| Gateway zombie process (hangs but doesn't exit) | High | Added `healthcheck.sh` to ping internal HTTP server to detect frozen event loops. | Mitigated |
| Telegram 429 Rate Limits causing missed messages | Medium | Unmitigated locally. Raised upstream priority to add `@grammyjs/auto-retry` in `openclaw-antigravity1/src/telegram/bot.ts`. | Open |