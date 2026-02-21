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
    prompt: v.optional(v.string()),
    model: v.optional(v.string()),
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
