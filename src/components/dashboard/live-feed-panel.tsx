"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

type ActivityEvent = {
  _id: string;
  type: string;
  agentId: string;
  message: string;
  createdAt: number;
};

const typeColors: Record<string, string> = {
  task_created: "bg-mc-orange",
  comment: "bg-mc-cyan",
  decision: "bg-mc-purple",
  document: "bg-mc-green",
  status_change: "bg-mc-blue",
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
  isOpen?: boolean;
  onToggle?: () => void;
  layout?: "desktop" | "mobile";
};

export function LiveFeedPanel({
  isOpen = true,
  onToggle,
  layout = "desktop",
}: LiveFeedPanelProps) {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const isMobileLayout = layout === "mobile";
  const resolvedOpen = isMobileLayout ? true : isOpen;

  const typeFilter = tabToType[activeTab];
  const events = useQuery(api.queries.getActivityFeed, {
    limit: 50,
    type: typeFilter ?? undefined,
    agentId: selectedAgent ?? undefined,
  }) ?? [];

  const allEvents = useQuery(api.queries.getActivityFeed, { limit: 200 }) ?? [];

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

  return (
    <aside
      className={`flex shrink-0 flex-col bg-background transition-all duration-300 ${
        isMobileLayout
          ? "w-full"
          : resolvedOpen
            ? "w-[320px] border-l border-mc-border"
            : "w-12 border-l border-mc-border"
      }`}
    >
      {/* Header with toggle */}
      <div className="flex items-center gap-2 px-3 py-4">
        {onToggle && !isMobileLayout && (
          <button onClick={onToggle} className="shrink-0 text-text-secondary hover:text-text-primary">
            {resolvedOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </button>
        )}
        {resolvedOpen && (
          <>
            <div className="h-2 w-2 rounded-full bg-mc-green animate-pulse-dot" />
            <span className="text-sm font-semibold tracking-wide text-text-primary">LIVE FEED</span>
          </>
        )}
      </div>

      {resolvedOpen && (
        <>
          {/* Type filter tabs */}
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {filterTabs.map((tab) => {
              const typeKey = tabToType[tab];
              const count = typeKey ? (typeCounts[typeKey] ?? 0) : allEvents.length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-mc-cyan text-white"
                      : "bg-surface-elevated text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab} <span className="ml-0.5 opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Agent filter pills */}
          <div className="flex flex-wrap gap-1.5 px-4 pb-3">
            <button
              onClick={() => setSelectedAgent(null)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                !selectedAgent
                  ? "bg-mc-cyan text-white"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              All Agents
            </button>
            {Object.entries(agentCounts).map(([name, count]) => (
              <button
                key={name}
                onClick={() => setSelectedAgent(selectedAgent === name ? null : name)}
                className={`rounded-full px-2 py-1 text-[10px] font-medium transition-colors ${
                  selectedAgent === name
                    ? "bg-mc-cyan text-white"
                    : "bg-surface text-text-secondary hover:text-text-primary"
                }`}
              >
                {name} <span className="ml-0.5 opacity-60">{count}</span>
              </button>
            ))}
          </div>

          {/* Activity feed */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-1">
              {events.map((event) => (
                <div
                  key={event._id}
                  className="flex gap-3 rounded-[var(--radius-inner)] p-2.5 transition-colors hover:bg-surface"
                  style={{ animation: "fadeIn 0.3s ease-out" }}
                >
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${typeColors[event.type] ?? "bg-text-secondary"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed text-text-primary">
                      <span className="font-semibold">{event.agentId}</span>{" "}
                      <span className="text-text-secondary">{event.message}</span>
                    </p>
                    <span className="text-[10px] text-text-secondary/60">{event.agentId} {formatTimeAgo(event.createdAt)}</span>
                  </div>
                  <ChevronRight className="mt-1 h-3 w-3 shrink-0 text-text-secondary/30" />
                </div>
              ))}
              {events.length === 0 && (
                <div className="py-8 text-center text-xs text-text-secondary/50">No activity matching filters</div>
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
