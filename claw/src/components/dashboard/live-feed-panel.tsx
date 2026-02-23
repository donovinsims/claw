"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { formatActivityEvent } from "@/lib/activity-language";

const tabs = ["All", "Comments", "Status", "Decisions"] as const;
type FeedTab = (typeof tabs)[number];

function toFeedType(tab: FeedTab): string | undefined {
  switch (tab) {
    case "Comments":
      return "comment";
    case "Status":
      return "status_change";
    case "Decisions":
      return "decision";
    default:
      return undefined;
  }
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Removed raw eventDotClass logic, using formatter severity.

type LiveFeedPanelProps = {
  isOpen?: boolean;
  onToggle?: () => void;
};

export function LiveFeedPanel({ isOpen = true, onToggle }: LiveFeedPanelProps) {
  const [tab, setTab] = useState<FeedTab>("All");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const type = toFeedType(tab);
  const feedQuery = useQuery(api.queries.getActivityFeed, {
    limit: 100,
    type,
    agentId: selectedAgent ?? undefined,
  });

  const allFeedQuery = useQuery(api.queries.getActivityFeed, { limit: 250 });
  const events = feedQuery ?? [];

  const agentsQuery = useQuery(api.queries.getAgents);
  const agentNameById = useMemo(() => {
    const map: Record<string, string> = {};
    if (agentsQuery) {
      for (const agent of agentsQuery) {
        map[agent.agentId] = agent.name || agent.agentId;
      }
    }
    return map;
  }, [agentsQuery]);

  const agentCounts = useMemo(() => {
    const allFeed = allFeedQuery ?? [];
    const counts: Record<string, number> = {};
    for (const event of allFeed) {
      counts[event.agentId] = (counts[event.agentId] ?? 0) + 1;
    }
    return counts;
  }, [allFeedQuery]);

  if (!isOpen) {
    return (
      <aside className="flex h-full w-full flex-col">
        <div className="flex justify-center px-2 py-4">
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              aria-label="Expand context rail"
            >
              <PanelRightOpen className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-full flex-col">
      <div className="border-b border-[var(--border)] px-4 py-4">
        <div className="flex items-center gap-2">
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              aria-label="Collapse context rail"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          )}
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Context Rail
          </span>
        </div>
        <p className="pt-1 text-xs text-[var(--text-secondary)]">
          Realtime activity updates from throughout the workspace.
        </p>
      </div>

      <div className="border-b border-[var(--border)] px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((entry) => {
            const active = tab === entry;
            return (
              <button
                key={entry}
                type="button"
                onClick={() => setTab(entry)}
                className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${active
                    ? "border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]"
                    : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border)]"
                  }`}
              >
                {entry}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedAgent(null)}
            className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${selectedAgent === null
                ? "border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]"
                : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border)]"
              }`}
          >
            All Agents
          </button>
          {Object.entries(agentCounts)
            .slice(0, 8)
            .map(([agentId, count]) => {
              const active = selectedAgent === agentId;
              return (
                <button
                  key={agentId}
                  type="button"
                  onClick={() => setSelectedAgent(active ? null : agentId)}
                  className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${active
                      ? "border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]"
                      : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border)]"
                    }`}
                >
                  {agentId} <span className="opacity-65">{count}</span>
                </button>
              );
            })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
        <div className="flex flex-col">
          {events.map((event) => {
            const formatted = formatActivityEvent(event, agentNameById);
            const dotColor = formatted.severity === "error" ? "bg-[var(--status-error)]" : formatted.severity === "success" ? "bg-[var(--status-success)]" : "bg-[var(--text-secondary)]/40";

            return (
              <article key={event._id} className="border-b border-[var(--divider)] py-2.5">
                <div className="flex gap-2.5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                      <span className="font-semibold">{formatted.agentLabel}</span> {formatted.plainText}
                    </p>
                    <p className="pt-0.5 text-[11px] text-[var(--text-secondary)]">{formatTimeAgo(event.createdAt)}</p>
                    <details className="mt-1.5 group">
                      <summary className="cursor-pointer list-none text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-block font-medium">
                        <span className="group-open:hidden">▶ Show details</span>
                        <span className="hidden group-open:inline">▼ Hide details</span>
                      </summary>
                      <div className="mt-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-2 text-[10px] text-[var(--text-secondary)] font-mono whitespace-pre-wrap break-words">
                        Agent ID: {event.agentId}
                        {"\n"}
                        Message: {formatted.detailText}
                      </div>
                    </details>
                  </div>
                </div>
              </article>
            );
          })}

          {events.length === 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-4 text-center text-xs text-[var(--text-secondary)]">
              No activity for this filter.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
