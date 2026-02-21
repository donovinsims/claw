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
      blocked: [],
      needsReview,
      decisions,
      createdAt: Date.now(),
    });
  },
});
