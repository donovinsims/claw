# OPENCLAW WORKSPACE BUILD — MASTER ORCHESTRATION PROMPT

> **Purpose**: This document is a single prompt for Claude Code. Place it in `~/openclaw-workspace/`, then `cd ~/openclaw-workspace && claude` and paste "Execute OPENCLAW-WORKSPACE-BUILD.md" to kick off the full build. Claude Code should use sub-agents (the Task tool) to parallelize independent workstreams.

---

## 🎯 MISSION

Build a fully wired autonomous AI agent workspace with these components:

| Component | Repo / Location | Role |
|-----------|----------------|------|
| **OpenClaw Antigravity** | `~/openclaw-workspace/openclaw-antigravity1/` (cloned from `lutpd/openclaw-antigravity1`) | The brain. Agents live here, communicate through gateway WebSockets and session keys |
| **Mission Control** | `~/openclaw-workspace/claw/` (cloned from `donovinsims/claw`) | The eyes. Next.js dashboard — kanban, feed, agent status. Read-only, no orchestration |
| **Convex** | Embedded in `~/openclaw-workspace/claw/` | Real-time database powering the dashboard |
| **Telegram** | Configured in OpenClaw | User's primary input channel → Lead Agent |
| **Cloudflare Tunnel** | Configured on host | Remote access to gateway |

### Data Flow
```
User → Telegram → Lead Agent (OpenClaw Antigravity)
  → Lead Agent breaks down task
  → Delegates to specialist agents via OpenClaw gateway
  → Agents do work, log to JSONL transcripts in ~/.openclaw/agents/
  → Bridge service polls JSONL transcripts → POSTs to Convex (.convex.site)
  → Mission Control dashboard reads from Convex → real-time UI
```

### AI Models
- **Primary**: Gemini Flash (via Antigravity auth, already configured)
- **Secondary**: Kimi K2.5 (supplemental, for specific tasks — configure as additional model provider)
- **Fallback**: Claude Opus 4.5 Thinking (already in template as `google-antigravity/claude-opus-4-5-thinking`)

---

## 📋 PRE-FLIGHT CHECKLIST

Before starting workstreams, run these in order:

```bash
# 0. Create the workspace directory and cd into it
mkdir -p ~/openclaw-workspace
cd ~/openclaw-workspace

# 1. Clone repos if not present
[ ! -d ~/openclaw-workspace/openclaw-antigravity1 ] && git clone https://github.com/lutpd/openclaw-antigravity1.git ~/openclaw-workspace/openclaw-antigravity1
[ ! -d ~/openclaw-workspace/claw ] && git clone https://github.com/donovinsims/claw.git ~/openclaw-workspace/claw

# 2. Verify Node >= 22
node --version  # Must be >= 22

# 3. Install OpenClaw globally
npm install -g openclaw@latest

# 4. Verify OpenClaw installed
openclaw --version

# 5. Run onboarding wizard FIRST (creates baseline config, auth profiles, daemon)
#    ⚠️ INTERACTIVE — requires user input. STOP and let user complete this.
#    After wizard finishes, we overwrite ~/.openclaw/openclaw.json with our custom config.
openclaw onboard --install-daemon

# 6. Install Convex
cd ~/openclaw-workspace/claw && npm install convex

# 7. Install remaining deps for Mission Control
cd ~/openclaw-workspace/claw && bun install  # or npm install
```

---

## 🤖 IDENTITY

You are a build agent. Your job is to execute 6 workstreams that scaffold an autonomous AI agent workspace. You will use the Task tool to parallelize independent workstreams. You do NOT improvise or add features beyond what is specified. If something fails, report it — do not attempt creative workarounds.

---

## ⛔ ERROR HANDLING CONSTRAINTS

- If any `npm install` or `bun install` command fails: log the error, continue to the next independent step
- If any command requires interactive input (browser auth, token entry): **STOP the workstream** and report to the user that manual input is needed
- If a `git clone` fails: report the URL and stop that workstream
- If `openclaw doctor` reports errors after config write: log them verbatim, do NOT attempt to fix config speculatively
- NEVER attempt creative workarounds for dependency failures — report and move on

---

## 🔀 PARALLEL WORKSTREAMS

**CRITICAL INSTRUCTION FOR CLAUDE CODE**: Use the **Task tool** to run Workstreams 1-4 as parallel sub-agents. They are independent and do not block each other. Workstream 5 depends on 1+2+3 completing first. Workstream 6 depends on all others.

### File Boundary Rules (required for safe parallelism)
- **WS1** only writes to `~/.openclaw/` — never touches `~/openclaw-workspace/claw/`
- **WS2** only writes to `~/openclaw-workspace/claw/convex/` — never touches other dirs
- **WS3** only writes to `~/openclaw-workspace/claw/bridge/` — never touches other dirs
- **WS4** only writes to `~/openclaw-workspace/claw/infra/` — never touches other dirs
- **WS5** only modifies files in `~/openclaw-workspace/claw/src/` — never touches convex/ or bridge/
- No workstream writes to another workstream's directory

```
PARALLEL:
  ├── Workstream 1: OpenClaw Multi-Agent Config    → writes to ~/.openclaw/
  ├── Workstream 2: Convex Backend (schema + funcs) → writes to ~/openclaw-workspace/claw/convex/
  ├── Workstream 3: Transcript Bridge (JSONL→Convex)→ writes to ~/openclaw-workspace/claw/bridge/
  └── Workstream 4: Cloudflare Tunnel Config        → writes to ~/openclaw-workspace/claw/infra/

SEQUENTIAL (after 1+2+3):
  └── Workstream 5: Dashboard Rewire               → modifies ~/openclaw-workspace/claw/src/

FINAL (after all):
  └── Workstream 6: Integration Test + Validation
```

---

## WORKSTREAM 1: OPENCLAW MULTI-AGENT CONFIGURATION

**Location**: `~/openclaw-workspace/openclaw-antigravity1/`
**Goal**: Configure the gateway for multi-agent routing with a Lead Agent and placeholder specialist agents.

### 1A. Overwrite the production `openclaw.json`

After `openclaw onboard` creates the baseline config, overwrite `~/.openclaw/openclaw.json` with this custom config:

```jsonc
{
  "meta": {
    "lastTouchedVersion": "2026.1.30"
  },
  "auth": {
    "profiles": {}
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "google-antigravity/gemini-3-flash"
      },
      "models": {
        "google-antigravity/gemini-3-flash": {},
        "google-antigravity/claude-opus-4-5-thinking": {}
      },
      "workspace": "./clawd",
      "compaction": {
        "mode": "safeguard"
      }
    },
    // IMPORTANT: Agent list is a placeholder structure.
    // The user will define their actual agents later.
    // This creates the LEAD agent plus 3 template specialist slots.
    // Workspace paths are SEPARATE from agent state dirs to avoid collisions.
    "list": [
      {
        "id": "lead",
        "name": "Lead Agent",
        "workspace": "~/.openclaw/workspaces/lead"
      },
      {
        "id": "specialist-1",
        "name": "Specialist 1",
        "workspace": "~/.openclaw/workspaces/specialist-1"
      },
      {
        "id": "specialist-2",
        "name": "Specialist 2",
        "workspace": "~/.openclaw/workspaces/specialist-2"
      },
      {
        "id": "specialist-3",
        "name": "Specialist 3",
        "workspace": "~/.openclaw/workspaces/specialist-3"
      }
    ]
  },
  // All Telegram DMs route to Lead Agent by default
  "bindings": [
    {
      "match": { "channel": "telegram", "accountId": "default" },
      "agentId": "lead"
    }
  ],
  "channels": {
    "telegram": {
      "accounts": {
        "default": {
          "botToken": "YOUR_TELEGRAM_BOT_TOKEN_HERE",
          "dmPolicy": "pairing"
        }
      },
      "groupPolicy": "allowlist",
      "streamMode": "partial"
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback",  // Bind to 127.0.0.1 — Cloudflare Tunnel handles external access
    "auth": {
      "mode": "token"
    }
  },
  // NOTE: No "hooks" config here. OpenClaw hooks are INBOUND receivers,
  // not outbound event emitters. Data flows to Convex via the JSONL
  // transcript bridge (Workstream 3), not via hooks.
  "plugins": {
    "entries": {
      "google-antigravity-auth": { "enabled": true },
      "telegram": { "enabled": true },
      "memory-core": { "enabled": true }
    }
  },
  "session": {
    "dmScope": "per-peer"
  }
}
```

### ⚠️ ACTION REQUIRED: Generate a secure gateway auth token

```bash
GATEWAY_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Gateway token: $GATEWAY_TOKEN"
echo "Save this — you'll need it for Cloudflare Tunnel auth headers."
```

### ✅ CHECKPOINT: Validate config

```bash
openclaw doctor
# Must exit with no critical errors. Warnings about missing bot token are expected.
```

### 1B. Create Lead Agent SOUL.md

Create `~/.openclaw/workspaces/lead/SOUL.md`:

```markdown
# Lead Agent

## Identity
You are the Lead Agent — the single point of contact for the user.
All user messages from Telegram come to you first.

## Core Behavior
1. **Receive** — Accept the user's message/task
2. **Analyze** — Determine what type of work this requires
3. **Delegate** — Route to the appropriate specialist agent
4. **Track** — Monitor progress and report back to the user
5. **Synthesize** — Combine specialist outputs into a coherent response

## Delegation Protocol
Use OpenClaw's tools to delegate work to specialist agents.
When delegating, provide clear task descriptions with:
- What needs to be done (specific deliverable)
- Any constraints or requirements
- Expected output format
- Deadline or priority level

NOTE: The exact delegation mechanism (agent_send, sub-agents tool, etc.)
depends on which tools are enabled in the gateway config. Check available
tools before attempting delegation. If agent-to-agent tools aren't available,
break the work down and execute it yourself or report to the user.

## Communication Style
- Acknowledge receipt immediately ("On it. Delegating to [specialist]...")
- Provide progress updates proactively
- Summarize completed work concisely
- Flag blockers immediately

## What You Do NOT Do
- You do NOT do specialist work yourself (research, writing, coding, etc.)
- You do NOT make decisions the user should make — ask for clarification
- You do NOT hallucinate progress — if something failed, say so
```

### 1C. Create Specialist Template SOUL.md

Create `~/.openclaw/workspaces/specialist-1/SOUL.md` (template — user will customize later):

```markdown
# Specialist Agent (Template)

## Identity
You are a specialist agent. Your specific role will be defined by the user.

## Core Behavior
1. Receive delegated tasks from the Lead Agent
2. Execute the work within your domain expertise
3. Log your progress and outputs to your workspace
4. Report completion (or blockers) back to the Lead Agent

## Output Format
Always structure your output as:
- **Status**: completed | in-progress | blocked
- **Summary**: What you did (2-3 sentences)
- **Output**: The actual deliverable (if applicable)
- **Blockers**: What's preventing progress (if any)
```

Copy this template to `specialist-2/` and `specialist-3/` as well.

### 1D. Create workspace and agent directories

```bash
# Workspace dirs (agent working files, SOUL.md lives here)
mkdir -p ~/.openclaw/workspaces/{lead,specialist-1,specialist-2,specialist-3}

# Agent state dirs (auto-created by OpenClaw, but ensure they exist)
mkdir -p ~/.openclaw/agents/{lead,specialist-1,specialist-2,specialist-3}/sessions
```

---

## WORKSTREAM 2: CONVEX BACKEND

**Location**: `~/openclaw-workspace/claw/`
**Goal**: Add Convex as the real-time database layer powering Mission Control.

### 2A. Initialize Convex

```bash
cd ~/openclaw-workspace/claw
npx convex init
```

### 2B. Create Convex Schema

Create `~/openclaw-workspace/claw/convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Agent registry — synced from OpenClaw config
  agents: defineTable({
    agentId: v.string(),       // matches OpenClaw agent id
    name: v.string(),
    role: v.optional(v.string()),
    level: v.optional(v.string()),  // "LEAD" | "SPC" | "INT"
    status: v.string(),        // "working" | "idle" | "error" | "offline"
    lastActive: v.optional(v.number()),
    currentTask: v.optional(v.string()),
    icon: v.optional(v.string()),
    tasksCompleted: v.optional(v.number()),
  })
    .index("by_agentId", ["agentId"])
    .index("by_status", ["status"]),

  // Task queue — the kanban board data
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),        // "inbox" | "assigned" | "in_progress" | "review" | "done"
    priority: v.string(),      // "high" | "normal" | "low"
    assignee: v.optional(v.string()),  // agent ID
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    sourceMessage: v.optional(v.string()),  // original Telegram message
    sessionKey: v.optional(v.string()),     // OpenClaw session key
  })
    .index("by_status", ["status"])
    .index("by_assignee", ["assignee"])
    .index("by_priority", ["priority"])
    .index("by_updatedAt", ["updatedAt"]),

  // Activity feed — live feed panel data
  activityEvents: defineTable({
    type: v.string(),          // "task_created" | "comment" | "decision" | "document" | "status_change" | "agent_message"
    agentId: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),  // flexible payload
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_agentId", ["agentId"])
    .index("by_createdAt", ["createdAt"]),

  // Standup snapshots — daily rollup
  standups: defineTable({
    date: v.string(),          // "2026-02-21"
    completed: v.array(v.object({ agentId: v.string(), task: v.string() })),
    inProgress: v.array(v.object({ agentId: v.string(), task: v.string() })),
    blocked: v.array(v.object({ agentId: v.string(), task: v.string() })),
    needsReview: v.array(v.object({ agentId: v.string(), task: v.string() })),
    decisions: v.array(v.object({ agentId: v.string(), task: v.string() })),
    createdAt: v.number(),
  })
    .index("by_date", ["date"]),

  // Mission statement
  settings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),
});
```

### 2C. Create Convex Mutations

Create `~/openclaw-workspace/claw/convex/mutations.ts`:

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ── Agent mutations ──

export const upsertAgent = mutation({
  args: {
    agentId: v.string(),
    name: v.string(),
    role: v.optional(v.string()),
    level: v.optional(v.string()),
    status: v.string(),
    icon: v.optional(v.string()),
  },
  returns: v.id("agents"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        lastActive: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("agents", {
      ...args,
      lastActive: Date.now(),
      tasksCompleted: 0,
    });
  },
});

export const updateAgentStatus = mutation({
  args: {
    agentId: v.string(),
    status: v.string(),
    currentTask: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .unique();

    if (agent) {
      await ctx.db.patch(agent._id, {
        status: args.status,
        currentTask: args.currentTask,
        lastActive: Date.now(),
      });
    }
  },
});

// ── Task mutations ──

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.string(),
    tags: v.array(v.string()),
    assignee: v.optional(v.string()),
    sourceMessage: v.optional(v.string()),
    sessionKey: v.optional(v.string()),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      ...args,
      status: args.assignee ? "assigned" : "inbox",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.string(),
    assignee: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.assignee !== undefined) {
      updates.assignee = args.assignee;
    }

    if (args.status === "done") {
      updates.completedAt = Date.now();

      // Increment agent's completed count
      if (args.assignee) {
        const agent = await ctx.db
          .query("agents")
          .withIndex("by_agentId", (q) => q.eq("agentId", args.assignee!))
          .unique();
        if (agent) {
          await ctx.db.patch(agent._id, {
            tasksCompleted: (agent.tasksCompleted ?? 0) + 1,
          });
        }
      }
    }

    await ctx.db.patch(args.taskId, updates);
  },
});

export const moveTask = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: args.status,
      updatedAt: Date.now(),
      ...(args.status === "done" ? { completedAt: Date.now() } : {}),
    });
  },
});

// ── Activity mutations ──

export const logActivity = mutation({
  args: {
    type: v.string(),
    agentId: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  returns: v.id("activityEvents"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("activityEvents", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// ── Settings mutations ──

export const updateSetting = mutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  returns: v.id("settings"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("settings", {
      ...args,
      updatedAt: Date.now(),
    });
  },
});

// ── Standup mutations ──

export const generateStandup = mutation({
  args: { date: v.string() },
  returns: v.id("standups"),
  handler: async (ctx, args) => {
    const dayStart = new Date(args.date).getTime();
    const dayEnd = dayStart + 86400000;

    // Get tasks completed today
    const allTasks = await ctx.db.query("tasks").collect();

    const completed = allTasks
      .filter((t) => t.completedAt && t.completedAt >= dayStart && t.completedAt < dayEnd)
      .map((t) => ({ agentId: t.assignee ?? "unassigned", task: t.title }));

    const inProgress = allTasks
      .filter((t) => t.status === "in_progress")
      .map((t) => ({ agentId: t.assignee ?? "unassigned", task: t.title }));

    const needsReview = allTasks
      .filter((t) => t.status === "review")
      .map((t) => ({ agentId: t.assignee ?? "unassigned", task: t.title }));

    // Get decisions from activity feed
    const activities = await ctx.db
      .query("activityEvents")
      .withIndex("by_createdAt")
      .filter((q) =>
        q.and(q.gte(q.field("createdAt"), dayStart), q.lt(q.field("createdAt"), dayEnd))
      )
      .collect();

    const decisions = activities
      .filter((a) => a.type === "decision")
      .map((a) => ({ agentId: a.agentId, task: a.message }));

    return await ctx.db.insert("standups", {
      date: args.date,
      completed,
      inProgress,
      blocked: [],  // populated by agents reporting blockers
      needsReview,
      decisions,
      createdAt: Date.now(),
    });
  },
});
```

### 2D. Create Convex Queries

Create `~/openclaw-workspace/claw/convex/queries.ts`:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAgents = query({
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const getTasksByStatus = query({
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").order("desc").collect();
    const grouped: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      if (!grouped[task.status]) grouped[task.status] = [];
      grouped[task.status].push(task);
    }
    return grouped;
  },
});

export const getActivityFeed = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
    agentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("activityEvents").withIndex("by_createdAt").order("desc");

    const events = await q.take(args.limit ?? 50);

    return events.filter((e) => {
      if (args.type && e.type !== args.type) return false;
      if (args.agentId && e.agentId !== args.agentId) return false;
      return true;
    });
  },
});

export const getLatestStandup = query({
  handler: async (ctx) => {
    const standups = await ctx.db
      .query("standups")
      .withIndex("by_date")
      .order("desc")
      .take(1);
    return standups[0] ?? null;
  },
});

export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
  },
});

export const getDashboardStats = query({
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();
    const tasks = await ctx.db.query("tasks").collect();

    return {
      agentsActive: agents.filter((a) => a.status === "working").length,
      agentsTotal: agents.length,
      tasksInQueue: tasks.filter((t) => t.status !== "done").length,
      tasksCompleted: tasks.filter((t) => t.status === "done").length,
    };
  },
});
```

### 2E. Create Convex HTTP Endpoint (for Hook Bridge)

Create `~/openclaw-workspace/claw/convex/http.ts`:

```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// OpenClaw Hook Bridge endpoint — receives POSTs from the JSONL bridge service
http.route({
  path: "/api/openclaw-hook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { event, agentId, data } = body as {
      event: string;
      agentId: string;
      data: Record<string, unknown>;
    };

    switch (event) {
      case "task.created":
        await ctx.runMutation(api.mutations.createTask, {
          title: (data.title as string) ?? "Untitled Task",
          description: data.description as string | undefined,
          priority: (data.priority as string) ?? "normal",
          tags: (data.tags as string[]) ?? [],
          assignee: agentId,
          sessionKey: data.sessionKey as string | undefined,
        });
        break;

      case "task.status_changed":
        if (data.taskId) {
          await ctx.runMutation(api.mutations.updateTaskStatus, {
            taskId: data.taskId as any,
            status: (data.status as string) ?? "in_progress",
            assignee: agentId,
          });
        }
        break;

      case "agent.status_changed":
        await ctx.runMutation(api.mutations.updateAgentStatus, {
          agentId,
          status: (data.status as string) ?? "idle",
          currentTask: data.currentTask as string | undefined,
        });
        break;

      case "activity":
        await ctx.runMutation(api.mutations.logActivity, {
          type: (data.type as string) ?? "comment",
          agentId,
          message: (data.message as string) ?? "",
          metadata: data.metadata,
        });
        break;

      default:
        // Log unknown events as activity
        await ctx.runMutation(api.mutations.logActivity, {
          type: "system",
          agentId: agentId ?? "system",
          message: `Unknown event: ${event}`,
          metadata: data,
        });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
```

---

## WORKSTREAM 3: TRANSCRIPT BRIDGE (OpenClaw → Convex)

**Location**: `~/openclaw-workspace/claw/bridge/`
**Goal**: A lightweight Node.js service that polls OpenClaw session transcripts (JSONL files) and pushes events to Convex via the HTTP endpoint. This is the ONLY data path from OpenClaw to Convex — there are no outbound hooks.

### 3A. Create the bridge service

Create `~/openclaw-workspace/claw/bridge/index.ts`:

```typescript
import { watch } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { homedir } from "node:os";

// Configuration
const OPENCLAW_AGENTS_DIR = join(homedir(), ".openclaw", "agents");
// IMPORTANT: Convex HTTP actions are served at your deployment's .convex.site URL,
// NOT localhost. Find this in your Convex dashboard under Settings > URL & Deploy Key.
// It looks like: https://happy-animal-123.convex.site
const CONVEX_SITE_URL = process.env.CONVEX_SITE_URL;
if (!CONVEX_SITE_URL) {
  console.error("[bridge] FATAL: CONVEX_SITE_URL env var is required.");
  console.error("[bridge] Set it to your deployment URL, e.g. https://your-app-123.convex.site");
  process.exit(1);
}
const POLL_INTERVAL_MS = 2000;

// Track file positions so we only read new lines
const filePositions = new Map<string, number>();

async function pushToConvex(event: string, agentId: string, data: Record<string, unknown>) {
  try {
    const res = await fetch(`${CONVEX_SITE_URL}/api/openclaw-hook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event, agentId, data }),
    });

    if (!res.ok) {
      console.error(`[bridge] Convex push failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error(`[bridge] Convex push error:`, err);
  }
}

function parseTranscriptLine(line: string): { role: string; content: string; tool?: string } | null {
  try {
    const parsed = JSON.parse(line);
    return {
      role: parsed.role ?? "unknown",
      content: typeof parsed.content === "string"
        ? parsed.content
        : JSON.stringify(parsed.content),
      tool: parsed.tool_name ?? parsed.name,
    };
  } catch {
    return null;
  }
}

async function processNewLines(filePath: string, agentId: string) {
  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    const lastPos = filePositions.get(filePath) ?? 0;

    if (lines.length <= lastPos) return;

    const newLines = lines.slice(lastPos);
    filePositions.set(filePath, lines.length);

    for (const line of newLines) {
      const parsed = parseTranscriptLine(line);
      if (!parsed) continue;

      // Map transcript events to Convex activity events
      if (parsed.role === "assistant") {
        await pushToConvex("activity", agentId, {
          type: "comment",
          message: parsed.content.slice(0, 200),
        });

        // Detect status changes in assistant messages
        if (parsed.content.toLowerCase().includes("completed") ||
            parsed.content.toLowerCase().includes("done")) {
          await pushToConvex("agent.status_changed", agentId, {
            status: "idle",
          });
        }
      }

      if (parsed.tool === "bash" || parsed.tool === "exec") {
        await pushToConvex("activity", agentId, {
          type: "status_change",
          message: `Executed tool: ${parsed.tool}`,
        });
        await pushToConvex("agent.status_changed", agentId, {
          status: "working",
        });
      }
    }
  } catch (err) {
    // File might be mid-write, skip
  }
}

async function scanAgents() {
  try {
    const agentDirs = await readdir(OPENCLAW_AGENTS_DIR, { withFileTypes: true });

    for (const dir of agentDirs) {
      if (!dir.isDirectory()) continue;

      const agentId = dir.name;
      const sessionsDir = join(OPENCLAW_AGENTS_DIR, agentId, "sessions");

      try {
        const sessionFiles = await readdir(sessionsDir);
        const jsonlFiles = sessionFiles.filter((f) => f.endsWith(".jsonl"));

        for (const file of jsonlFiles) {
          await processNewLines(join(sessionsDir, file), agentId);
        }
      } catch {
        // No sessions dir yet, skip
      }
    }
  } catch (err) {
    console.error(`[bridge] Agent scan error:`, err);
  }
}

// Main loop
console.log(`[bridge] Starting OpenClaw → Convex bridge`);
console.log(`[bridge] Watching: ${OPENCLAW_AGENTS_DIR}`);
console.log(`[bridge] Pushing to: ${CONVEX_SITE_URL}`);

setInterval(scanAgents, POLL_INTERVAL_MS);
scanAgents(); // Initial scan
```

### 3B. Create bridge `package.json`

Create `~/openclaw-workspace/claw/bridge/package.json`:

```json
{
  "name": "openclaw-convex-bridge",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx index.ts",
    "dev": "tsx watch index.ts"
  },
  "dependencies": {
    "tsx": "^4.0.0"
  }
}
```

**IMPORTANT**: The bridge requires `CONVEX_SITE_URL` env var. Run it as:
```bash
CONVEX_SITE_URL=https://your-app-123.convex.site npm run dev
```
Find your URL in the Convex dashboard under Settings > URL & Deploy Key (the `.convex.site` one, NOT `.convex.cloud`).

### 3C. Add bridge start script to root package.json

In `~/openclaw-workspace/claw/package.json`, add to `scripts`:
```json
"bridge": "cd bridge && CONVEX_SITE_URL=$CONVEX_SITE_URL npm run dev"
```

---

## WORKSTREAM 4: CLOUDFLARE TUNNEL CONFIG

**Location**: `~/openclaw-workspace/claw/infra/`
**Goal**: Configuration files for Cloudflare Tunnel to expose the OpenClaw gateway remotely.

### 4A. Create tunnel config

Create `~/openclaw-workspace/claw/infra/cloudflared-config.yml`:

```yaml
# Cloudflare Tunnel Configuration
# Run: cloudflared tunnel --config ~/openclaw-workspace/claw/infra/cloudflared-config.yml run
tunnel: YOUR_TUNNEL_ID
credentials-file: ~/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  # OpenClaw Gateway (WebSocket + HTTP)
  - hostname: openclaw.yourdomain.com
    service: http://localhost:18789
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s

  # Mission Control Dashboard
  - hostname: mission.yourdomain.com
    service: http://localhost:3000

  # NOTE: Convex HTTP actions are cloud-hosted at your-app.convex.site
  # No tunnel entry needed for Convex.

  # Catch-all
  - service: http_status:404
```

### 4B. Create setup script

Create `~/openclaw-workspace/claw/infra/setup-tunnel.sh`:

```bash
#!/bin/bash
set -euo pipefail

echo "=== Cloudflare Tunnel Setup ==="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "Installing cloudflared..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install cloudflared
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared.deb
        rm cloudflared.deb
    fi
fi

echo ""
echo "Steps to complete manually:"
echo "1. Run: cloudflared tunnel login"
echo "2. Run: cloudflared tunnel create openclaw-gateway"
echo "3. Update YOUR_TUNNEL_ID in cloudflared-config.yml"
echo "4. Run: cloudflared tunnel route dns openclaw-gateway openclaw.yourdomain.com"
echo "5. Run: cloudflared tunnel --config ~/openclaw-workspace/claw/infra/cloudflared-config.yml run"
echo ""
echo "For persistent service:"
echo "  sudo cloudflared service install"
```

---

## WORKSTREAM 5: DASHBOARD REWIRE (depends on WS 1+2+3)

**Location**: `~/openclaw-workspace/claw/src/`
**Goal**: Replace all mock/hardcoded data in Mission Control components with live Convex queries.

### 5A. Add Convex Provider

Update `~/openclaw-workspace/claw/src/app/layout.tsx` to wrap with ConvexProvider:

```typescript
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Wrap children in <ConvexProvider client={convex}>
```

### 5B. Rewire Components

For each dashboard component, replace hardcoded arrays with Convex hooks:

**`agent-panel.tsx`**: Replace the `agents` array with:
```typescript
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const agents = useQuery(api.queries.getAgents) ?? [];
```

**`kanban-board.tsx`**: Replace `initialTasks` with:
```typescript
const tasksByStatus = useQuery(api.queries.getTasksByStatus) ?? {};
```
And replace `setTasks` drag-and-drop handlers with Convex mutations:
```typescript
import { useMutation } from "convex/react";
const moveTask = useMutation(api.mutations.moveTask);
// In handleDragEnd:
await moveTask({ taskId: active.id, status: newColumn });
```

**`live-feed-panel.tsx`**: Replace `mockEvents` with:
```typescript
const events = useQuery(api.queries.getActivityFeed, {
  limit: 50,
  type: activeTab !== "All" ? tabToType[activeTab] : undefined,
  agentId: selectedAgent ?? undefined,
}) ?? [];
```

**`top-bar.tsx`**: Replace hardcoded stats with:
```typescript
const stats = useQuery(api.queries.getDashboardStats);
// Use stats.agentsActive, stats.tasksInQueue
```

**`standup-modal.tsx`**: Replace `standupData` with:
```typescript
const standup = useQuery(api.queries.getLatestStandup);
```

**`mission-banner.tsx`**: Replace local state with:
```typescript
const missionSetting = useQuery(api.queries.getSetting, { key: "mission_statement" });
const updateSetting = useMutation(api.mutations.updateSetting);
```

### 5C. IMPORTANT: Preserve Existing UI

Do NOT modify:
- Any CSS/Tailwind classes
- Component layout or structure
- Theme toggle, keyboard shortcuts, modals
- The drag-and-drop UX

Only swap the data source. Every component should look and behave identically but read from Convex instead of hardcoded arrays.

---

## WORKSTREAM 6: INTEGRATION TEST & VALIDATION

**Run after all workstreams complete.**
**Reference the SUCCESS CRITERIA table above — every test must pass.**

### 6A. Validate OpenClaw Config

```bash
# Test config loads without errors
openclaw doctor
# ✅ Must exit 0. Warnings about missing bot token are expected.

# Verify agent list
openclaw agent list
# ✅ Must show 4 agents

# Verify SOUL.md files
ls ~/.openclaw/workspaces/*/SOUL.md
# ✅ Must show 4 files

# Verify workspace/agent directory separation
ls ~/.openclaw/workspaces/
ls ~/.openclaw/agents/
# ✅ Both exist with no overlapping content
```

### 6B. Validate Convex

```bash
cd ~/openclaw-workspace/claw
npx convex dev &
sleep 5

# Test schema deployed (look for "Convex functions ready" in output)
# ✅ No schema validation errors
```

### 6C. Validate Dashboard Builds

```bash
cd ~/openclaw-workspace/claw
bun run build  # or npm run build
# ✅ Must exit 0
```

### 6D. Validate Bridge Starts

```bash
cd ~/openclaw-workspace/claw/bridge
npm install
CONVEX_SITE_URL=https://placeholder.convex.site npm run start &
sleep 3
# ✅ Must print "[bridge] Starting OpenClaw → Convex bridge" without crashing
# (Will fail to POST since placeholder URL isn't real — that's expected)
kill %1
```

### 6E. Report Results

Print a summary table of all test results. If any tests failed, list what failed and why. Do NOT attempt to fix failures — report them for the user to handle.

---

## 📁 FINAL FILE TREE

After all workstreams complete, the workspace should look like:

```
~/openclaw-workspace/                  # Workspace root (run `claude` from here)
  OPENCLAW-WORKSPACE-BUILD.md          # This prompt file

~/.openclaw/
  openclaw.json                        # Production config (from WS1)
  workspaces/                          # Agent working files (SOUL.md etc.)
    lead/
      SOUL.md
    specialist-1/
      SOUL.md
    specialist-2/
      SOUL.md
    specialist-3/
      SOUL.md
  agents/                              # Agent state (auto-managed by OpenClaw)
    lead/
      sessions/                        # JSONL transcripts (created at runtime)
    specialist-1/
      sessions/
    specialist-2/
      sessions/
    specialist-3/
      sessions/

~/openclaw-workspace/claw/             # Mission Control Dashboard
  convex/
    schema.ts                          # Database schema (WS2)
    mutations.ts                       # Write operations (WS2)
    queries.ts                         # Read operations (WS2)
    http.ts                            # Bridge HTTP endpoint (WS2)
  bridge/
    index.ts                           # Transcript poller → Convex (WS3)
    package.json
  infra/
    cloudflared-config.yml             # Tunnel config (WS4)
    setup-tunnel.sh                    # Setup script (WS4)
  src/
    app/
      layout.tsx                       # Updated with ConvexProvider (WS5)
      page.tsx                         # Unchanged
    components/dashboard/
      agent-panel.tsx                  # Rewired to Convex (WS5)
      kanban-board.tsx                 # Rewired to Convex (WS5)
      live-feed-panel.tsx              # Rewired to Convex (WS5)
      top-bar.tsx                      # Rewired to Convex (WS5)
      standup-modal.tsx                # Rewired to Convex (WS5)
      mission-banner.tsx               # Rewired to Convex (WS5)
      calendar-view.tsx                # Unchanged (mock data OK for now)
      global-search.tsx                # Unchanged (mock data OK for now)

~/openclaw-workspace/openclaw-antigravity1/  # OpenClaw source (reference, not modified)
```

---

## ⚠️ KNOWN GOTCHAS

1. **Antigravity Auth**: Must run `openclaw models auth login --provider google-antigravity` interactively in a terminal with browser access. Cannot be automated.

2. **Telegram Bot Token**: Must create bot via @BotFather on Telegram and paste token into config. Cannot be automated.

3. **Convex deployment**: `npx convex dev` runs a local dev server. For production, run `npx convex deploy` after testing.

4. **Agent names are placeholders**: The user has not decided on agent names/roles yet. The config uses `lead`, `specialist-1`, `specialist-2`, `specialist-3` as IDs. These can be renamed in `openclaw.json` and the SOUL.md files later without breaking anything.

5. **Kimi K2.5 integration**: Not configured in this build. To add later, add Kimi as an additional model provider in `openclaw.json` under `agents.defaults.models`.

6. **Supermemory**: The `memory-core` plugin is enabled in the config. OpenClaw's native memory search handles this. If the user wants external Supermemory integration, that's a separate hook to add later.

7. **Bridge polling vs. WebSocket**: The bridge uses polling (2s interval) to watch JSONL files. For lower latency, upgrade to `fs.watch` with debouncing. A future improvement could use OpenClaw internal hook handlers to push events directly.

8. **Agent-to-agent communication**: Inter-agent delegation (Lead → Specialists) requires explicit tool enablement in `openclaw.json`. The exact config depends on which version of OpenClaw you're running — check `openclaw tools list` after gateway starts and enable `agentToAgent` or `agent_send` if available. This is deferred until the user defines their agent roster.

9. **Convex HTTP URL**: The bridge needs `CONVEX_SITE_URL` env var set to your `.convex.site` URL (NOT `.convex.cloud`). Find this in Convex dashboard > Settings > URL & Deploy Key.

---

## ✅ SUCCESS CRITERIA

After all workstreams complete, Claude Code must verify each of these. If any fail, report the failure — do NOT attempt creative workarounds.

| # | Test | Command | Pass Criteria |
|---|------|---------|---------------|
| 1 | Config valid | `openclaw doctor` | Exit code 0, no critical errors |
| 2 | Agents registered | `openclaw agent list` | Shows 4 agents (lead + 3 specialists) |
| 3 | Gateway starts | `openclaw gateway run &` then `curl -s http://localhost:18789/health` | HTTP 200 |
| 4 | Convex schema deploys | `cd ~/openclaw-workspace/claw && npx convex dev` (wait 5s) | No schema errors in output |
| 5 | Dashboard builds | `cd ~/openclaw-workspace/claw && bun run build` | Exit code 0 |
| 6 | Bridge starts | `cd ~/openclaw-workspace/claw/bridge && npm run start` (wait 3s) | No crash, logs "Starting" message |
| 7 | SOUL.md files exist | `ls ~/.openclaw/workspaces/*/SOUL.md` | 4 files found |
| 8 | Workspace dirs separate | `ls ~/.openclaw/workspaces/ && ls ~/.openclaw/agents/` | Both dirs exist, no overlap |

---

## 🚀 STARTUP SEQUENCE (after build)

```bash
# Terminal 1: OpenClaw Gateway
openclaw gateway run

# Terminal 2: Convex Dev Server
cd ~/openclaw-workspace/claw && npx convex dev

# Terminal 3: Mission Control Dashboard
cd ~/openclaw-workspace/claw && bun run dev

# Terminal 4: Bridge (OpenClaw → Convex)
# Replace the URL with your actual Convex site URL from dashboard
CONVEX_SITE_URL=https://your-app-123.convex.site cd ~/openclaw-workspace/claw/bridge && npm run dev

# Terminal 5 (optional): Cloudflare Tunnel
cloudflared tunnel --config ~/openclaw-workspace/claw/infra/cloudflared-config.yml run
```

Open `http://localhost:3000` to see Mission Control with live data.
Message your Telegram bot to see tasks flow through the system.
