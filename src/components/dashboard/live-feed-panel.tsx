"use client";

import { useState, useMemo } from "react";

type ActivityEvent = {
  id: string;
  type: "task_created" | "comment" | "decision" | "document" | "status_change";
  agent: string;
  message: string;
  timeAgo: string;
};

const typeColors: Record<string, string> = {
  task_created: "bg-mc-orange",
  comment: "bg-mc-cyan",
  decision: "bg-mc-purple",
  document: "bg-mc-green",
  status_change: "bg-mc-blue",
};

const typeLabels: Record<string, string> = {
  task_created: "Tasks",
  comment: "Comments",
  decision: "Decisions",
  document: "Docs",
  status_change: "Status",
};

const agentCounts: Record<string, number> = {
  Jarvis: 17, Quill: 22, Loki: 26, Vision: 22, Fury: 30,
  Shuri: 20, Wanda: 1, Pepper: 12, Friday: 9, Wong: 5,
};

const mockEvents: ActivityEvent[] = [
  { id: "e1", type: "comment", agent: "Quill", message: "commented on 'Write Customer Case Studies (Brent + Will)'", timeAgo: "2 hours ago" },
  { id: "e2", type: "comment", agent: "Quill", message: "commented on 'Twitter Content Blitz — 10 Tweets This Week'", timeAgo: "2 hours ago" },
  { id: "e3", type: "comment", agent: "Quill", message: "commented on 'Twitter Content Blitz — 10 Tweets This Week'", timeAgo: "2 hours ago" },
  { id: "e4", type: "document", agent: "Loki", message: "created document 'Shopify Blog Draft v1'", timeAgo: "3 hours ago" },
  { id: "e5", type: "status_change", agent: "Vision", message: "moved 'SEO Strategy' to Review", timeAgo: "4 hours ago" },
  { id: "e6", type: "task_created", agent: "Fury", message: "added research to 'Competitor Pricing Audit'", timeAgo: "5 hours ago" },
  { id: "e7", type: "task_created", agent: "Jarvis", message: "created task 'Customer Research — Tweet Material'", timeAgo: "6 hours ago" },
  { id: "e8", type: "status_change", agent: "Friday", message: "deployed Mission Control UI update", timeAgo: "6 hours ago" },
  { id: "e9", type: "status_change", agent: "Pepper", message: "updated 'Trial Onboarding Sequence' status to In Progress", timeAgo: "7 hours ago" },
  { id: "e10", type: "decision", agent: "Jarvis", message: "decided to prioritize SEO content over social this sprint", timeAgo: "8 hours ago" },
  { id: "e11", type: "comment", agent: "Vision", message: "commented on 'SiteGPT vs Zendesk AI Comparison'", timeAgo: "8 hours ago" },
  { id: "e12", type: "document", agent: "Wong", message: "created document 'API Integration Guide v2'", timeAgo: "9 hours ago" },
  { id: "e13", type: "task_created", agent: "Shuri", message: "created task 'Product Analytics Deep Dive'", timeAgo: "10 hours ago" },
  { id: "e14", type: "comment", agent: "Loki", message: "commented on 'Shopify Blog Landing Page'", timeAgo: "10 hours ago" },
  { id: "e15", type: "status_change", agent: "Wanda", message: "updated 'Brand Assets Refresh' to Done", timeAgo: "11 hours ago" },
  { id: "e16", type: "document", agent: "Fury", message: "created document 'Customer Interview Notes — Brent'", timeAgo: "12 hours ago" },
  { id: "e17", type: "task_created", agent: "Pepper", message: "created task 'Onboarding Email Sequence A/B Test'", timeAgo: "13 hours ago" },
  { id: "e18", type: "decision", agent: "Jarvis", message: "approved Shopify blog landing page copy", timeAgo: "14 hours ago" },
];

const filterTabs = ["All", "Tasks", "Comments", "Decisions", "Docs", "Status"];
const tabToType: Record<string, string | null> = {
  All: null,
  Tasks: "task_created",
  Comments: "comment",
  Decisions: "decision",
  Docs: "document",
  Status: "status_change",
};

export function LiveFeedPanel() {
  const [activeTab, setActiveTab] = useState("All");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    let events = mockEvents;
    const typeFilter = tabToType[activeTab];
    if (typeFilter) {
      events = events.filter((e) => e.type === typeFilter);
    }
    if (selectedAgent) {
      events = events.filter((e) => e.agent === selectedAgent);
    }
    return events;
  }, [activeTab, selectedAgent]);

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-mc-border bg-background">
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="h-2 w-2 rounded-full bg-mc-green animate-pulse-dot" />
        <span className="text-sm font-semibold tracking-wide text-text-primary">LIVE FEED</span>
      </div>

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-1.5 px-4 pb-2">
        {filterTabs.map((tab) => {
          const typeKey = tabToType[tab];
          const count = typeKey ? mockEvents.filter((e) => e.type === typeKey).length : mockEvents.length;
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
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="flex gap-3 rounded-[var(--radius-inner)] p-2.5 transition-colors hover:bg-surface"
              style={{ animation: "fadeIn 0.3s ease-out" }}
            >
              <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${typeColors[event.type]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-relaxed text-text-primary">
                  <span className="font-semibold">{event.agent}</span>{" "}
                  <span className="text-text-secondary">{event.message}</span>
                </p>
                <span className="text-[10px] text-text-secondary/60">{event.agent} {event.timeAgo}</span>
              </div>
              <ChevronRight className="mt-1 h-3 w-3 shrink-0 text-text-secondary/30" />
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <div className="py-8 text-center text-xs text-text-secondary/50">No activity matching filters</div>
          )}
        </div>
      </div>
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
