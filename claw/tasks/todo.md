# Codebase Cleanup + Telegram Bot Reliability

## PHASE 0 — REPO READY
- [x] Ensure repo is present inside ~/openclaw-workspace
- [x] Create tasks/ directory
- [x] Create tasks/todo.md and tasks/lessons.md
- [x] Post hcom update: "repo ready" + absolute path

## PHASE 1 — READ REPO RULES
- [x] Read repo guiding docs (README, SOUL.md, docs/)
- [x] Write artifacts/audit/2026-02-26/repo-rules.md

## PHASE 2 — CONDUCTOR SETUP + TRACK
- [x] Run Conductor setup if missing
- [x] Create Conductor track "Codebase Cleanup + Telegram Bot Reliability"
- [x] Conductor must generate SPEC + PLAN artifacts
- [x] Post hcom update: "plan complete" with track id + artifact paths

**PLAN VERIFICATION GATE:**
- [x] Run test/lint/typecheck locally.
- [x] Verify logs display correctly.
- [x] Execute healthcheck and confirm pass state.

## PHASE 3 — AUDIT ONLY
- [x] Post hcom update: "audit start"
- [x] Produce artifacts/audit/2026-02-26/codebase-audit.md
- [x] Produce artifacts/audit/2026-02-26/cleanup-backlog.md
- [x] Produce artifacts/audit/2026-02-26/telegram-reliability-audit.md
- [x] Produce artifacts/audit/2026-02-26/reliability-backlog.md
- [x] Post hcom update: "audit complete" with paths

## PHASE 4 — IMPLEMENTATION
- [x] Post hcom update: "implementation start"
- [x] STEP A: Safe Cleanup Baseline
- [x] STEP B: Telegram Bot Reliability Hardening
- [x] Write artifacts/ship/2026-02-26/cleanup-telegram-reliability/diff.patch
- [x] Write artifacts/ship/2026-02-26/cleanup-telegram-reliability/test-report.md
- [x] Write artifacts/ship/2026-02-26/cleanup-telegram-reliability/telegram-runbook.md
- [x] Write artifacts/ship/2026-02-26/cleanup-telegram-reliability/healthcheck.md
- [x] Post hcom update: "tests complete" with status + paths

## PHASE 5 — REVIEW
- [x] Run Conductor review step
- [x] Adversarial reliability check
- [x] Write artifacts/ship/2026-02-26/cleanup-telegram-reliability/review.md
- [x] Write artifacts/ship/2026-02-26/cleanup-telegram-reliability/risk-log.md
- [x] Post hcom update: "review complete" with go/no-go

## PHASE 6 — FINAL SHIP PACK
- [x] Create artifacts/ship/2026-02-26/cleanup-telegram-reliability/ship-pack.md
- [x] Post hcom update: "final ship-pack ready" + path
