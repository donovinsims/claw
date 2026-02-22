import { query } from "./_generated/server";
import { v } from "convex/values";

export const getAgents = query({
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const getAgentByAgentId = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .unique();
  },
});

export const getTasksByStatus = query({
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").order("desc").collect();
    const grouped: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      if (task.archivedAt !== undefined) continue;
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
    const q = ctx.db.query("activityEvents").withIndex("by_createdAt").order("desc");

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
    const tasks = (await ctx.db.query("tasks").collect())
      .filter((task) => task.archivedAt === undefined);

    return {
      agentsActive: agents.filter((a) => a.status === "working").length,
      agentsTotal: agents.length,
      tasksInQueue: tasks.filter((t) => t.status !== "done").length,
      tasksCompleted: tasks.filter((t) => t.status === "done").length,
    };
  },
});
