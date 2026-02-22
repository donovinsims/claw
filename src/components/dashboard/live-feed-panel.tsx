"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

const typeColors: Record<string, string> = {
  task_created: "bg-mc-accent",
  comment: "bg-text-secondary",
  decision: "bg-mc-warning",
  document: "bg-mc-accent/70",
  status_change: "bg-mc-success",
};

const filterTabs = ["All", "Tasks", "Comments", "Decisions", "Docs", "Status"];
const tabToType: Record<string, string | null> = {
  All: null,
  Tasks: "task_created",
  Comments: "comment",
  Decisions: "decision",
  Docs: "document",
  Status: "status_change",
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

type LiveFeedPanelProps = {
  layout?: "desktop" | "mobile";
  isOpen?: boolean;
  onToggle?: () => void;
};

export function LiveFeedPanel({
  layout = "desktop",
  isOpen = true,
  onToggle,
}: LiveFeedPanelProps) {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const isMobileLayout = layout === "mobile";

  const typeFilter = tabToType[activeTab];
  const eventsQuery = useQuery(api.queries.getActivityFeed, {
    limit: 50,
    type: typeFilter ?? undefined,
    agentId: selectedAgent ?? undefined,
  });
  const events = useMemo(() => eventsQuery ?? [], [eventsQuery]);

  const allEventsQuery = useQuery(api.queries.getActivityFeed, { limit: 200 });
  const allEvents = useMemo(() => allEventsQuery ?? [], [allEventsQuery]);

  const agentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of allEvents) {
      counts[e.agentId] = (counts[e.agentId] ?? 0) + 1;
    }
    return counts;
  }, [allEvents]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of allEvents) {
      counts[e.type] = (counts[e.type] ?? 0) + 1;
    }
    return counts;
  }, [allEvents]);

  if (!isOpen) {
    return (
      <aside
        className={`flex h-full w-full shrink-0 flex-col bg-background ${isMobileLayout ? "" : "border-l border-mc-border/70"
          }`}
      >
        <div className="flex items-center gap-2 px-3 py-4">
          {onToggle && (
            <button
              onClick={onToggle}
              className="interactive-lift mc-icon-button"
              aria-label="Expand live feed"
            >
              <PanelRightOpen className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`flex h-full w-full shrink-0 flex-col bg-background ${isMobileLayout ? "" : "border-l border-white/5"
        }`}
    >
      <div className="border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          {onToggle && (
            <button
              onClick={onToggle}
              className="mc-icon-button hover:bg-surface/80"
              aria-label="Collapse live feed"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          )}
          <div className="h-1.5 w-1.5 rounded-full bg-mc-accent animate-pulse-dot" />
          <span className="text-[11px] font-semibold tracking-wider text-text-primary">LIVE FEED</span>
        </div>
        <p className="pt-1.5 text-[10px] text-text-secondary">Filter by event type or agent to isolate what matters now.</p>
      </div>

      <div className="flex flex-wrap gap-2 px-4 pb-2 border-b border-white/5 pt-3">
        {filterTabs.map((tab) => {
          const typeKey = tabToType[tab];
          const count = typeKey ? (typeCounts[typeKey] ?? 0) : allEvents.length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab ? "true" : "false"}
              className={`rounded-[var(--radius-pill)] border px-2.5 py-1 font-mono text-[9px] font-medium transition-colors ${activeTab === tab
                ? "border-white/10 bg-card text-text-primary"
                : "border-transparent bg-transparent text-text-secondary hover:bg-card hover:text-text-primary"
                } ${isMobileLayout ? "min-h-11 px-3" : ""}`}
            >
              {tab} <span className="ml-0.5 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-3 pt-3">
        <button
          onClick={() => setSelectedAgent(null)}
          aria-pressed={!selectedAgent ? "true" : "false"}
          className={`rounded-[var(--radius-pill)] border px-2 py-0.5 text-[10px] font-medium transition-colors ${!selectedAgent
            ? "border-white/10 bg-card text-text-primary"
            : "border-transparent bg-transparent text-text-secondary hover:bg-card hover:text-text-primary"
            } ${isMobileLayout ? "min-h-11 px-3" : ""}`}
        >
          All Agents
        </button>
        {Object.entries(agentCounts).map(([name, count]) => (
          <button
            key={name}
            onClick={() => setSelectedAgent(selectedAgent === name ? null : name)}
            aria-pressed={selectedAgent === name ? "true" : "false"}
            className={`rounded-[var(--radius-pill)] border px-2 py-0.5 text-[10px] font-medium transition-colors ${selectedAgent === name
              ? "border-white/10 bg-card text-text-primary"
              : "border-transparent bg-transparent text-text-secondary hover:bg-card hover:text-text-primary"
              } ${isMobileLayout ? "min-h-11 px-3" : ""}`}
          >
            {name} <span className="ml-0.5 opacity-50">{count}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col">
          {events.map((event) => (
            <div
              key={event._id}
              className="animate-enter flex gap-3 border-b border-white/5 py-2.5 transition-colors hover:bg-card group"
            >
              <div
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${typeColors[event.type] ?? "bg-text-secondary"
                  }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-relaxed text-text-primary">
                  <span className="font-semibold text-text-secondary">{event.agentId}</span>{" "}
                  <span className="text-text-secondary/90">{event.message}</span>
                </p>
                <span className="pt-0.5 text-[9px] font-medium text-text-secondary/50">
                  {formatTimeAgo(event.createdAt)}
                </span>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="rounded-[var(--radius-inner)] border border-white/5 bg-card p-6 text-center text-xs text-text-secondary/70">
              No activity matching filters
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
