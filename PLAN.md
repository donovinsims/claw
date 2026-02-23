# OpenClaw Workspace — Post-Build Activation Plan

> Generated: 2026-02-21 | Based on Phase 0 Documentation Discovery

---

## Phase 0 Summary: Current State

### Working
- OpenClaw Gateway running on ws://127.0.0.1:18789 (token auth)
- Telegram bot @anticlawd_1bot polling, paired with user 5830732048
- Lead Agent active with 2 sessions, model: gemini-3-flash
- Convex deployed at tame-squirrel-223 (dev server running)
- Mission Control dashboard at localhost:3000 (all 6 core components wired to Convex)
- Cloudflare Quick Tunnels live for both services
- Antigravity OAuth authenticated (donovinsims@gmail.com)

### Critical Gaps
1. **Bridge NOT running** — Dashboard is empty (Convex tables have no data)
2. **No embedding provider** — Memory search broken
3. **Kimi K2.5 not wired** — API key available but not configured
4. **Supermemory not wired** — API key available but not configured
5. **CalendarView + GlobalSearch still mock data** — Not blocking but incomplete
6. **No seed data** — Dashboard shows all zeros until agents generate activity

### Allowed APIs (verified from source)
- Convex mutations: `upsertAgent`, `updateAgentStatus`, `createTask`, `updateTaskStatus`, `moveTask`, `logActivity`, `updateSetting`, `generateStandup`
- Convex queries: `getAgents`, `getTasksByStatus`, `getActivityFeed`, `getLatestStandup`, `getSetting`, `getDashboardStats`
- Convex HTTP: POST `/api/openclaw-hook` (events: task.created, task.status_changed, agent.status_changed, activity)
- OpenClaw CLI: `openclaw agents list`, `openclaw channels status`, `openclaw gateway run`, `openclaw doctor`, `openclaw pairing approve`
- Bridge env: `CONVEX_SITE_URL` (required, points to .convex.site URL)

### Anti-Patterns to Avoid
- Do NOT add model provider keys directly in openclaw.json `models` block (causes "Unrecognized keys" validation error — verified)
- Do NOT use `openclaw agent list` (singular) — correct command is `openclaw agents list`
- Do NOT assume Convex tables have data without running the bridge
- Do NOT use `.convex.cloud` URL for bridge — must use `.convex.site` URL for HTTP actions

---

## Phase 1: Start Bridge & Seed Dashboard Data

**Goal:** Get data flowing from OpenClaw → Convex → Dashboard so it's no longer empty.

### Tasks

1. **Start the bridge service**
   ```bash
   cd ~/openclaw-workspace/claw/bridge
   CONVEX_SITE_URL=https://tame-squirrel-223.convex.site npm run dev
   ```
   Run in background: `nohup CONVEX_SITE_URL=https://tame-squirrel-223.convex.site npx tsx index.ts > /tmp/bridge.log 2>&1 &`

2. **Seed agent registry into Convex** — The bridge only processes JSONL transcripts. Agent metadata needs to be pushed manually to populate the Agent Panel. Call the Convex mutation directly:
   ```bash
   cd ~/openclaw-workspace/claw
   npx convex run mutations:upsertAgent '{"agentId":"lead","name":"Lead Agent","role":"Squad Lead","level":"LEAD","status":"idle","icon":"Shield"}'
   npx convex run mutations:upsertAgent '{"agentId":"specialist-1","name":"Specialist 1","role":"Specialist","level":"SPC","status":"idle","icon":"Bot"}'
   npx convex run mutations:upsertAgent '{"agentId":"specialist-2","name":"Specialist 2","role":"Specialist","level":"SPC","status":"idle","icon":"Sparkles"}'
   npx convex run mutations:upsertAgent '{"agentId":"specialist-3","name":"Specialist 3","role":"Specialist","level":"SPC","status":"idle","icon":"Code"}'
   ```

3. **Seed a test task** to verify the kanban board works:
   ```bash
   npx convex run mutations:createTask '{"title":"Test Task — Verify Dashboard","description":"This is a seed task to verify the kanban board renders correctly.","priority":"normal","tags":["test"],"assignee":"lead"}'
   ```

4. **Seed a test activity event** to verify the live feed:
   ```bash
   npx convex run mutations:logActivity '{"type":"comment","agentId":"lead","message":"Dashboard activated. Bridge is running."}'
   ```

### Verification Checklist
- [ ] Bridge process running: `ps aux | grep tsx`
- [ ] Bridge logs show "Starting OpenClaw → Convex bridge": `tail /tmp/bridge.log`
- [ ] Agents visible in dashboard Agent Panel (4 agents)
- [ ] Test task visible in kanban ASSIGNED column
- [ ] Test activity visible in Live Feed panel
- [ ] TopBar shows "4" agents and "1" task in queue

---

## Phase 2: Configure Memory Search (Embedding Provider)

**Goal:** Fix the "no embedding provider configured" doctor warning so agents can use semantic memory.

### Tasks

1. **Check if Gemini API key is available via Antigravity auth:**
   ```bash
   openclaw doctor 2>&1 | grep -A5 "Memory search"
   ```

2. **Option A — Use OpenClaw's built-in Gemini embeddings** (preferred, since Antigravity auth is already configured):
   ```bash
   openclaw config set agents.defaults.memorySearch.provider google-antigravity
   ```

3. **Option B — If Option A fails, configure Supermemory** using the API key from env.txt:
   - Check OpenClaw docs: `openclaw docs memory` or `openclaw plugins --help`
   - The `memory-core` plugin is already enabled; it may need the Supermemory key via env var or plugin config

4. **Verify:**
   ```bash
   openclaw memory status --deep
   openclaw doctor 2>&1 | grep "Memory"
   ```

### Anti-Pattern Guards
- Do NOT set `OPENAI_API_KEY` or `GEMINI_API_KEY` as raw env vars if Antigravity auth already handles this
- Do NOT modify the `memory-core` plugin config without checking `openclaw plugins list` first

### Verification Checklist
- [ ] `openclaw doctor` no longer shows memory search warning
- [ ] `openclaw memory status --deep` shows embedding provider active

---

## Phase 3: Wire Kimi K2.5 as Additional Model Provider

**Goal:** Make Kimi K2.5 available as a model option for agents.

### Tasks

1. **Discover the correct OpenClaw config format for OpenAI-compatible providers:**
   ```bash
   openclaw models --help
   openclaw models list
   openclaw config --help
   ```
   Look for docs on adding custom/OpenAI-compatible model providers.

2. **Add Kimi K2.5 via CLI** (avoid editing openclaw.json directly to prevent validation errors):
   ```bash
   openclaw models add --provider openai-compatible --base-url https://api.moonshot.ai/v1 --api-key sk-JBCQPs5pL5eyQOebdxz7hPNsof0P9cP9gBwnEjw3NLpZRsXR --model kimi-k2.5
   ```
   If this exact command doesn't work, consult `openclaw models add --help` for the correct syntax.

3. **Verify model is available:**
   ```bash
   openclaw models list
   ```

### Anti-Pattern Guards
- Do NOT add Kimi config as raw JSON keys in `agents.defaults.models` — this causes validation errors (verified)
- Use CLI commands to add model providers, not manual JSON editing

### Verification Checklist
- [ ] `openclaw models list` shows kimi-k2.5
- [ ] No validation errors in `openclaw doctor`

---

## Phase 4: Start All Services (Full Startup Script)

**Goal:** Create a single startup script that launches all services reliably.

### Tasks

1. **Create `~/openclaw-workspace/start.sh`:**
   ```bash
   #!/bin/bash
   set -euo pipefail

   echo "=== Starting OpenClaw Workspace ==="

   # 1. OpenClaw Gateway
   echo "[1/5] Starting OpenClaw Gateway..."
   nohup openclaw gateway run > /tmp/openclaw_gateway.log 2>&1 &
   sleep 3

   # 2. Convex Dev Server
   echo "[2/5] Starting Convex Dev Server..."
   cd ~/openclaw-workspace/claw
   nohup npx convex dev > /tmp/convex_dev.log 2>&1 &
   sleep 5

   # 3. Mission Control
   echo "[3/5] Starting Mission Control..."
   cd ~/openclaw-workspace/claw
   nohup bun run dev > /tmp/mission_dev.log 2>&1 &
   sleep 3

   # 4. Bridge
   echo "[4/5] Starting Bridge..."
   cd ~/openclaw-workspace/claw/bridge
   nohup CONVEX_SITE_URL=https://tame-squirrel-223.convex.site npx tsx index.ts > /tmp/bridge.log 2>&1 &
   sleep 2

   # 5. Quick Tunnels
   echo "[5/5] Starting Cloudflare Quick Tunnels..."
   nohup cloudflared tunnel --url http://localhost:3000 > /tmp/mission_tunnel.log 2>&1 &
   nohup cloudflared tunnel --url http://localhost:18789 > /tmp/openclaw_tunnel.log 2>&1 &
   sleep 5

   # Extract tunnel URLs
   MISSION_URL=$(grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' /tmp/mission_tunnel.log | head -1)
   GATEWAY_URL=$(grep -oE 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' /tmp/openclaw_tunnel.log | head -1)

   echo ""
   echo "=== All Services Running ==="
   echo "Mission Control: http://localhost:3000"
   echo "Mission Control (public): ${MISSION_URL:-check /tmp/mission_tunnel.log}"
   echo "OpenClaw Gateway: ws://localhost:18789"
   echo "Gateway (public): ${GATEWAY_URL:-check /tmp/openclaw_tunnel.log}"
   echo "Convex Dashboard: https://dashboard.convex.dev"
   echo ""
   echo "Logs: /tmp/{openclaw_gateway,convex_dev,mission_dev,bridge,mission_tunnel,openclaw_tunnel}.log"
   ```

2. **Create `~/openclaw-workspace/stop.sh`:**
   ```bash
   #!/bin/bash
   echo "Stopping all OpenClaw services..."
   pkill -f "openclaw gateway" || true
   pkill -f "convex dev" || true
   pkill -f "bun run dev" || true
   pkill -f "tsx index.ts" || true
   pkill -f "cloudflared tunnel --url http://localhost:3000" || true
   pkill -f "cloudflared tunnel --url http://localhost:18789" || true
   echo "All services stopped."
   ```

3. Make both executable: `chmod +x ~/openclaw-workspace/{start,stop}.sh`

### Verification Checklist
- [ ] `./start.sh` launches all 5 services without errors
- [ ] All ports listening: 3000, 18789
- [ ] Both tunnel URLs resolve
- [ ] `./stop.sh` cleanly kills all processes

---

## Phase 5: Final Verification

**Goal:** Confirm the full data flow works end-to-end.

### Tests

1. **Config valid:**
   ```bash
   openclaw doctor
   # Exit code 0, no critical errors
   ```

2. **Agents registered:**
   ```bash
   openclaw agents list
   # Shows 4 agents
   ```

3. **Gateway responds:**
   ```bash
   curl -s http://localhost:18789/health
   # HTTP 200
   ```

4. **Dashboard loads:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
   # 200
   ```

5. **Convex has data:**
   ```bash
   cd ~/openclaw-workspace/claw
   npx convex run queries:getAgents
   # Returns 4 agents
   npx convex run queries:getDashboardStats
   # Returns non-zero counts
   ```

6. **Bridge running:**
   ```bash
   ps aux | grep "tsx index.ts" | grep -v grep
   # Shows bridge process
   ```

7. **End-to-end test:** Send a Telegram message → verify it appears in gateway log → verify bridge picks up transcript → verify activity appears in dashboard Live Feed

### Anti-Pattern Grep Checks
```bash
# No placeholder tokens remaining
grep -r "YOUR_TELEGRAM_BOT_TOKEN_HERE" ~/.openclaw/ && echo "FAIL: placeholder token" || echo "PASS"
grep -r "YOUR_TUNNEL_ID" ~/openclaw-workspace/claw/infra/ && echo "WARN: tunnel config has placeholders (OK for Quick Tunnels)" || echo "PASS"
grep -r "placeholder.convex" ~/openclaw-workspace/claw/ && echo "FAIL: placeholder Convex URL" || echo "PASS"
```

---

## Future Improvements (Not in scope)

- Wire CalendarView to Convex (currently mock data)
- Wire GlobalSearch to Convex (currently mock data)
- Configure Supermemory integration
- Upgrade to persistent Cloudflare Tunnels with custom domain
- Define specialist agent roles and SOUL.md content
- Set up agent-to-agent delegation tools
- Production Convex deployment (`npx convex deploy`)
