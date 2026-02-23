"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Search, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { formatActivityEvent } from "@/lib/activity-language";

type SearchRow = {
  id: string;
  kind: "task" | "agent" | "activity";
  title: string;
  snippet: string;
  timestamp?: number;
  rawMessage?: string;
};

function formatTimestamp(value?: number): string {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");

  const tasksByStatusQuery = useQuery(api.queries.getTasksByStatus);
  const agentsQuery = useQuery(api.queries.getAgents);
  const activityQuery = useQuery(api.queries.getActivityFeed, { limit: 120 });

  const rows = useMemo<SearchRow[]>(() => {
    const tasksByStatus = tasksByStatusQuery ?? {};
    const agents = agentsQuery ?? [];
    const activity = activityQuery ?? [];

    const output: SearchRow[] = [];

    for (const [status, tasks] of Object.entries(tasksByStatus)) {
      for (const task of tasks ?? []) {
        output.push({
          id: `task-${task._id}`,
          kind: "task",
          title: task.title,
          snippet: `${task.description ?? "No description"} · ${status}`,
          timestamp: task.updatedAt,
        });
      }
    }

    for (const agent of agents) {
      output.push({
        id: `agent-${agent.agentId}`,
        kind: "agent",
        title: agent.name,
        snippet: `${agent.role ?? agent.agentId} · ${agent.status}`,
        timestamp: agent.lastActive,
      });
    }

    const agentNameById: Record<string, string> = {};
    for (const agent of agents) {
      agentNameById[agent.agentId] = agent.name || agent.agentId;
    }

    for (const event of activity) {
      const formatted = formatActivityEvent(event, agentNameById);
      output.push({
        id: `activity-${event._id}`,
        kind: "activity",
        title: `${formatted.agentLabel} · ${formatted.categoryLabel}`,
        snippet: formatted.plainText,
        rawMessage: event.message,
        timestamp: event.createdAt,
      });
    }

    return output.sort((left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0));
  }, [tasksByStatusQuery, agentsQuery, activityQuery]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];

    return rows.filter((row) => {
      const content = `${row.title}\n${row.snippet}\n${row.kind}\n${row.rawMessage || ""}`.toLowerCase();
      return content.includes(needle);
    });
  }, [query, rows]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 backdrop-blur-sm md:items-start md:justify-center md:pt-[12vh]" onClick={onClose}>
      <section
        className="flex h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-overlay)] md:h-auto md:max-h-[74vh] md:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--text-secondary)]" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks, agents, and activity"
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {query.trim().length === 0 && (
            <div className="p-4 text-sm text-[var(--text-secondary)]">Start typing to search live dashboard data.</div>
          )}

          {query.trim().length > 0 && results.length === 0 && (
            <div className="p-4 text-sm text-[var(--text-secondary)]">
              No results for &ldquo;{query}&rdquo;.
            </div>
          )}

          {results.map((row) => (
            <article key={row.id} className="rounded-xl border border-transparent px-3 py-2 hover:border-[var(--border)] hover:bg-[var(--bg-surface-elevated)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{row.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{row.snippet}</p>
                </div>
                <div className="text-right text-[11px] text-[var(--text-secondary)]">
                  <p>{row.kind.toUpperCase()}</p>
                  <p>{formatTimestamp(row.timestamp)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
