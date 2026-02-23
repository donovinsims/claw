# Mission Control Reliability Runbook

## Objective

Keep Telegram → OpenClaw transcript → Convex ingest reliable, observable, and secure.

## Runtime Contract

- Bridge reads `~/.openclaw/agents/*/sessions/*.jsonl`
- Bridge posts to `POST /api/openclaw-hook`
- Each webhook payload must include:
  - `eventId`
  - `event`
  - `agentId`
  - `sourceSessionId`
  - `sourceOffset`
  - `data`
- Requests are signed with `x-openclaw-signature: sha256=<hex>`

## Required Configuration

- Bridge:
  - `CONVEX_SITE_URL`
  - `OPENCLAW_HOOK_SECRET` (required outside development)
  - Optional: `BRIDGE_STATE_PATH`
  - Optional: `BRIDGE_DEAD_LETTER_PATH`
- Convex HTTP action environment:
  - `OPENCLAW_HOOK_SECRET`
  - Optional: `OPENCLAW_HOOK_SIGNATURE_MODE` (`enforce` or `warn`)

## Reliability Features

- Durable cursor state file:
  - default `~/.openclaw/mission-control/bridge-cursors.json`
- Truncation/rotation handling:
  - inode change or file shrink resets offset to `0`
- Idempotent ingest:
  - dedupe table `bridge_ingest_dedupe` indexed by `eventId`
- Retry policy:
  - up to 5 attempts with exponential backoff + jitter
  - retry only network/timeout/429/5xx
- Dead-letter output:
  - default `~/.openclaw/mission-control/dead-letter.jsonl`

## Health Check Commands

```bash
# Bridge process state
ps aux | rg "bridge/index.ts|tsx watch index.ts"

# Recent bridge heartbeat + delivery logs
tail -n 80 /tmp/bridge.log

# Cursor state freshness
ls -lh ~/.openclaw/mission-control/bridge-cursors.json

# Dead-letter growth check
tail -n 20 ~/.openclaw/mission-control/dead-letter.jsonl
```

## Incident Triage

1. If feed is stale:
   - Validate bridge process is running.
   - Validate Convex URL and webhook path.
2. If `401` responses:
   - Compare `OPENCLAW_HOOK_SECRET` between bridge and Convex env.
   - Check `OPENCLAW_HOOK_SIGNATURE_MODE`.
3. If duplicates appear:
   - Verify `eventId` is present in webhook payload.
   - Check dedupe table index `by_eventId`.
4. If delivery failures persist:
   - Inspect dead-letter entries for `errorCode` and `httpStatus`.
   - Re-run bridge after fixing endpoint/auth/network.

## Rollout Notes

- Development rollout can use `OPENCLAW_HOOK_SIGNATURE_MODE=warn`.
- Production should use `OPENCLAW_HOOK_SIGNATURE_MODE=enforce`.

## Phase 2 (Prepared): Gateway Stream Adapter

Candidate OpenClaw event sources:
- `/Users/forex/openclaw-workspace/openclaw-antigravity1/src/infra/agent-events.ts`
- `/Users/forex/openclaw-workspace/openclaw-antigravity1/src/gateway/server-chat.ts`

Cutover checklist:
1. Add gateway-stream bridge adapter behind feature flag.
2. Dual-write transcript + gateway stream for 48h.
3. Compare event count and latency deltas.
4. Cut over only if mismatch is below 0.5%.
