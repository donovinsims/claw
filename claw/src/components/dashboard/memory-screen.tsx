"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { MemoryDocument } from "@/components/dashboard/types";
import { formatActivityEvent } from "@/lib/activity-language";

function statusLabel(status: string): string {
  switch (status) {
    case "inbox":
      return "Inbox";
    case "assigned":
      return "Assigned";
    case "in_progress":
      return "In Progress";
    case "review":
      return "Review";
    case "done":
      return "Done";
    default:
      return status;
  }
}

function dateLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function MemoryScreen() {
  const [query, setQuery] = useState("");

  const activitiesQuery = useQuery(api.queries.getActivityFeed, { limit: 300 });
  const tasksByStatusQuery = useQuery(api.queries.getTasksByStatus);
  const standup = useQuery(api.queries.getLatestStandup);
  const agentsQuery = useQuery(api.queries.getAgents);

  const isLoading =
    activitiesQuery === undefined || tasksByStatusQuery === undefined || standup === undefined || agentsQuery === undefined;

  const agentNameById = useMemo(() => {
    const map: Record<string, string> = {};
    if (agentsQuery) {
      for (const agent of agentsQuery) {
        map[agent.agentId] = agent.name || agent.agentId;
      }
    }
    return map;
  }, [agentsQuery]);

  const documents = useMemo<MemoryDocument[]>(() => {
    const activities = activitiesQuery ?? [];
    const tasksByStatus = tasksByStatusQuery ?? {};
    const docs: MemoryDocument[] = [];

    for (const activity of activities) {
      const formatted = formatActivityEvent(activity, agentNameById);
      docs.push({
        id: `activity-${activity._id}`,
        kind: "activity",
        title: `${formatted.agentLabel} · ${formatted.categoryLabel}`,
        body: formatted.plainText,
        rawMessage: activity.message,
        agentId: activity.agentId,
        timestamp: activity.createdAt,
        tags: ["activity", activity.type],
      });
    }

    for (const [status, tasks] of Object.entries(tasksByStatus)) {
      for (const task of tasks ?? []) {
        docs.push({
          id: `task-${task._id}`,
          kind: "task",
          title: task.title,
          body: `${task.description ?? "No description"}\nStatus: ${statusLabel(status)}\nAssignee: ${task.assignee ?? "Unassigned"}`,
          agentId: task.assignee ?? "unassigned",
          timestamp: task.updatedAt,
          tags: ["task", status, ...(task.tags ?? [])],
        });
      }
    }

    if (standup) {
      const sections = [
        `Completed: ${standup.completed.length}`,
        `In Progress: ${standup.inProgress.length}`,
        `Needs Review: ${standup.needsReview.length}`,
        `Decisions: ${standup.decisions.length}`,
      ];

      docs.push({
        id: `standup-${standup._id}`,
        kind: "standup",
        title: `Daily Standup ${standup.date}`,
        body: sections.join(" · "),
        agentId: "system",
        timestamp: standup.createdAt,
        tags: ["standup", standup.date],
      });
    }

    return docs.sort((left, right) => right.timestamp - left.timestamp);
  }, [activitiesQuery, tasksByStatusQuery, standup, agentNameById]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return documents;

    return documents.filter((document) => {
      const haystack = `${document.title}\n${document.body}\n${document.agentId}\n${document.tags.join(" ")}\n${document.rawMessage || ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [documents, query]);

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 md:px-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search memories by title, text, agent, or tags"
              className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70"
            />
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            {filtered.length} documents
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
        <div className="flex flex-col gap-2">
          {filtered.map((document) => (
            <article
              key={document.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{document.title}</p>
                  <p className="pt-1 text-xs text-[var(--text-secondary)] whitespace-pre-line">{document.body}</p>
                </div>
                <div className="text-right text-[11px] text-[var(--text-secondary)]">
                  <p>{document.kind.toUpperCase()}</p>
                  <p>{dateLabel(document.timestamp)}</p>
                </div>
              </div>
              <div className="pt-2 text-[11px] text-[var(--text-secondary)]">
                Agent: {document.agentId} · Tags: {document.tags.join(", ")}
              </div>
            </article>
          ))}

          {isLoading && filtered.length === 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-4 text-center text-sm text-[var(--text-secondary)]">
              Loading memory documents...
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-4 text-center text-sm text-[var(--text-secondary)]">
              No memory documents matched your search.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
