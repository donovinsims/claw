import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

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
        if (typeof data.taskId === "string") {
          await ctx.runMutation(api.mutations.updateTaskStatus, {
            taskId: data.taskId as Id<"tasks">,
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
