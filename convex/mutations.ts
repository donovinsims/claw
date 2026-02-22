import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

type TaskCreateInput = {
  title: string;
  description?: string;
  priority: string;
  tags: string[];
  assignee?: string;
  sourceMessage?: string;
  sessionKey?: string;
  sourceOffset?: number;
  status?: string;
};

type TaskStatusInput = {
  taskId: Id<"tasks">;
  status: string;
  assignee?: string;
};

type AgentStatusInput = {
  agentId: string;
  status: string;
  currentTask?: string;
};

type ActivityInput = {
  type: string;
  agentId: string;
  message: string;
  metadata?: unknown;
};

const COMPLETION_SIGNAL_PATTERN = /\b(done|completed|complete|finished)\b/i;
const TELEGRAM_ENVELOPE_PATTERN = /^\[\s*telegram\b/i;
const AUTO_TASK_TITLE_MAX = 96;

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stripActivityRolePrefix(text: string): string {
  return text.replace(/^[A-Za-z][A-Za-z ]*:\s+/, "");
}

function extractEnvelopeBody(text: string): string {
  const trimmed = normalizeWhitespace(text);
  const match = trimmed.match(/^\[[^\]]+\]\s*(.*)$/);
  if (!match) return trimmed;
  return normalizeWhitespace(match[1] ?? "");
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function buildTaskTitleFromText(text: string): string {
  const cleaned = normalizeWhitespace(extractEnvelopeBody(stripActivityRolePrefix(text)));
  if (cleaned.length === 0) return "Telegram instruction";
  return truncate(cleaned, AUTO_TASK_TITLE_MAX);
}

async function createTelegramInstructionTask(
  ctx: MutationCtx,
  args: { agentId: string; sourceSessionId: string; sourceOffset: number },
  instructionText: string,
) {
  const existingSessionTasks = await ctx.db
    .query("tasks")
    .withIndex("by_sessionKey", (q) => q.eq("sessionKey", args.sourceSessionId))
    .collect();

  const duplicate = existingSessionTasks.some((task) =>
    task.assignee === args.agentId &&
    task.sourceOffset === args.sourceOffset &&
    task.tags.includes("telegram")
  );
  if (duplicate) return;

  const cleanedInstruction = normalizeWhitespace(
    extractEnvelopeBody(stripActivityRolePrefix(instructionText)),
  );
  if (cleanedInstruction.length === 0) return;

  const now = Date.now();
  await ctx.db.insert("tasks", {
    title: buildTaskTitleFromText(cleanedInstruction),
    description: cleanedInstruction,
    status: "in_progress",
    priority: "normal",
    tags: ["telegram", "instruction", "auto-tracked"],
    assignee: args.agentId,
    sourceMessage: cleanedInstruction,
    sessionKey: args.sourceSessionId,
    sourceOffset: args.sourceOffset,
    createdAt: now,
    updatedAt: now,
  });
}

async function completeLatestTelegramInstructionTask(
  ctx: MutationCtx,
  args: { agentId: string; sourceSessionId: string; sourceOffset: number },
  completionText: string,
) {
  const sessionTasks = await ctx.db
    .query("tasks")
    .withIndex("by_sessionKey", (q) => q.eq("sessionKey", args.sourceSessionId))
    .collect();

  const candidate = sessionTasks
    .filter((task) =>
      task.assignee === args.agentId &&
      task.status !== "done" &&
      task.archivedAt === undefined &&
      task.tags.includes("telegram")
    )
    .sort((left, right) => right.updatedAt - left.updatedAt)[0];

  if (candidate) {
    await updateTaskStatusRecord(ctx, {
      taskId: candidate._id,
      status: "done",
      assignee: candidate.assignee ?? args.agentId,
    });
    return;
  }

  const fallbackText = normalizeWhitespace(
    extractEnvelopeBody(stripActivityRolePrefix(completionText)),
  );
  if (fallbackText.length === 0) return;

  const now = Date.now();
  await ctx.db.insert("tasks", {
    title: buildTaskTitleFromText(fallbackText),
    description: fallbackText,
    status: "done",
    priority: "normal",
    tags: ["telegram", "instruction", "auto-complete"],
    assignee: args.agentId,
    sourceMessage: fallbackText,
    sessionKey: args.sourceSessionId,
    sourceOffset: args.sourceOffset,
    createdAt: now,
    updatedAt: now,
    completedAt: now,
  });
}

async function createTaskRecord(ctx: MutationCtx, args: TaskCreateInput) {
  const now = Date.now();
  return await ctx.db.insert("tasks", {
    ...args,
    status: args.status ?? (args.assignee ? "assigned" : "inbox"),
    createdAt: now,
    updatedAt: now,
  });
}

async function updateAgentStatusRecord(ctx: MutationCtx, args: AgentStatusInput) {
  const agent = await ctx.db
    .query("agents")
    .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
    .unique();

  if (!agent) return;

  await ctx.db.patch(agent._id, {
    status: args.status,
    currentTask: args.currentTask,
    lastActive: Date.now(),
  });
}

async function updateTaskStatusRecord(ctx: MutationCtx, args: TaskStatusInput) {
  const updates: Record<string, unknown> = {
    status: args.status,
    updatedAt: Date.now(),
  };

  if (args.assignee !== undefined) {
    updates.assignee = args.assignee;
  }

  if (args.status === "done") {
    updates.completedAt = Date.now();

    const assignee = args.assignee;
    if (assignee) {
      const agent = await ctx.db
        .query("agents")
        .withIndex("by_agentId", (q) => q.eq("agentId", assignee))
        .unique();
      if (agent) {
        await ctx.db.patch(agent._id, {
          tasksCompleted: (agent.tasksCompleted ?? 0) + 1,
        });
      }
    }
  }

  await ctx.db.patch(args.taskId, updates);
}

async function logActivityRecord(ctx: MutationCtx, args: ActivityInput) {
  return await ctx.db.insert("activityEvents", {
    ...args,
    createdAt: Date.now(),
  });
}

// ── Agent mutations ──

export const upsertAgent = mutation({
  args: {
    agentId: v.string(),
    name: v.string(),
    role: v.optional(v.string()),
    level: v.optional(v.string()),
    status: v.string(),
    icon: v.optional(v.string()),
    prompt: v.optional(v.string()),
    model: v.optional(v.string()),
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
    await updateAgentStatusRecord(ctx, args);
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
    sourceOffset: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    return await createTaskRecord(ctx, args);
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
    await updateTaskStatusRecord(ctx, args);
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

export const archiveTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      archivedAt: Date.now(),
      updatedAt: Date.now(),
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
    return await logActivityRecord(ctx, args);
  },
});

export const ingestBridgeEvent = mutation({
  args: {
    eventId: v.string(),
    event: v.string(),
    agentId: v.string(),
    sourceSessionId: v.string(),
    sourceOffset: v.number(),
    data: v.record(v.string(), v.any()),
  },
  returns: v.object({
    ok: v.boolean(),
    duplicated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bridge_ingest_dedupe")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .unique();

    if (existing) {
      return {
        ok: true,
        duplicated: true,
      };
    }

    await ctx.db.insert("bridge_ingest_dedupe", {
      eventId: args.eventId,
      event: args.event,
      agentId: args.agentId,
      sourceSessionId: args.sourceSessionId,
      sourceOffset: args.sourceOffset,
      receivedAt: Date.now(),
    });

    const data = asRecord(args.data);

    switch (args.event) {
      case "task.created":
        await createTaskRecord(ctx, {
          title: asString(data.title, "Untitled Task"),
          description: asOptionalString(data.description),
          priority: asString(data.priority, "normal"),
          tags: asStringArray(data.tags),
          assignee: asOptionalString(data.assignee) ?? args.agentId,
          sourceMessage: asOptionalString(data.sourceMessage),
          sessionKey: asOptionalString(data.sessionKey),
          sourceOffset: asOptionalNumber(data.sourceOffset),
        });
        break;

      case "task.status_changed":
        if (typeof data.taskId === "string") {
          await updateTaskStatusRecord(ctx, {
            taskId: data.taskId as Id<"tasks">,
            status: asString(data.status, "in_progress"),
            assignee: asOptionalString(data.assignee) ?? args.agentId,
          });
        } else {
          await logActivityRecord(ctx, {
            type: "system",
            agentId: args.agentId,
            message: "Ignored task.status_changed without taskId",
            metadata: data,
          });
        }
        break;

      case "agent.status_changed":
        await updateAgentStatusRecord(ctx, {
          agentId: args.agentId,
          status: asString(data.status, "idle"),
          currentTask: asOptionalString(data.currentTask),
        });
        break;

      case "activity":
        await logActivityRecord(ctx, {
          type: asString(data.type, "comment"),
          agentId: args.agentId,
          message: asString(data.message, ""),
          metadata: data.metadata,
        });

        {
          const metadata = asRecord(data.metadata);
          const role = asString(metadata.role, "").toLowerCase();
          const rawText = asOptionalString(metadata.rawText) ?? "";
          const instructionText = asOptionalString(metadata.instructionText) ?? "";
          const channel = asOptionalString(metadata.channel)?.toLowerCase() ?? "";
          const fallbackText = stripActivityRolePrefix(asString(data.message, ""));

          const isTelegramInstruction = typeof metadata.isTelegramInstruction === "boolean"
            ? metadata.isTelegramInstruction
            : role === "user" &&
                (channel === "telegram" ||
                  TELEGRAM_ENVELOPE_PATTERN.test(rawText) ||
                  TELEGRAM_ENVELOPE_PATTERN.test(fallbackText));

          const hasCompletionSignal = typeof metadata.hasCompletionSignal === "boolean"
            ? metadata.hasCompletionSignal
            : role === "assistant" &&
                COMPLETION_SIGNAL_PATTERN.test(rawText.length > 0 ? rawText : fallbackText);

          if (isTelegramInstruction) {
            await createTelegramInstructionTask(
              ctx,
              {
                agentId: args.agentId,
                sourceSessionId: args.sourceSessionId,
                sourceOffset: args.sourceOffset,
              },
              instructionText || rawText || fallbackText,
            );
          }

          if (hasCompletionSignal) {
            await completeLatestTelegramInstructionTask(
              ctx,
              {
                agentId: args.agentId,
                sourceSessionId: args.sourceSessionId,
                sourceOffset: args.sourceOffset,
              },
              rawText || fallbackText,
            );
          }
        }
        break;

      default:
        await logActivityRecord(ctx, {
          type: "system",
          agentId: args.agentId,
          message: `Unknown event: ${args.event}`,
          metadata: data,
        });
        break;
    }

    return {
      ok: true,
      duplicated: false,
    };
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
