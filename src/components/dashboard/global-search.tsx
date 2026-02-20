"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, X, FileText, Users, Activity, CheckSquare } from "lucide-react";

type SearchResult = {
  id: string;
  category: "Tasks" | "Documents" | "Agents" | "Activity";
  title: string;
  snippet: string;
  timestamp?: string;
};

const allResults: SearchResult[] = [
  { id: "r1", category: "Tasks", title: "Explore SiteGPT Dashboard & Document All Features", snippet: "Thoroughly explore the entire SiteGPT dashboard...", timestamp: "1 day ago" },
  { id: "r2", category: "Tasks", title: "SiteGPT vs Zendesk AI Comparison", snippet: "Create a detailed brief for Zendesk AI comparison page", timestamp: "1 day ago" },
  { id: "r3", category: "Tasks", title: "SiteGPT vs Intercom Fin Comparison", snippet: "Create detailed brief for Intercom Fin comparison page", timestamp: "2 days ago" },
  { id: "r4", category: "Tasks", title: "Shopify Blog Landing Page", snippet: "Write copy for SiteGPT integration landing page", timestamp: "1 day ago" },
  { id: "r5", category: "Tasks", title: "Best AI Chatbot for Shopify", snippet: "Write full SEO blog post: Best AI Chatbot for Shopify in 2026", timestamp: "1 day ago" },
  { id: "r6", category: "Tasks", title: "Product Demo Video Script", snippet: "Create full script for SiteGPT product demo video", timestamp: "1 day ago" },
  { id: "r7", category: "Tasks", title: "Tweet Content — Real Stories Only", snippet: "Create authentic tweets based on real SiteGPT customer data", timestamp: "8 hours ago" },
  { id: "r8", category: "Tasks", title: "Email Marketing Strategy", snippet: "Email Marketing Strategy — Userlist-Inspired Lifecycle Campaigns" },
  { id: "r9", category: "Tasks", title: "Mission Control UI", snippet: "Build real-time agent command center with React + Convex" },
  { id: "r10", category: "Documents", title: "Shopify Blog Draft v1", snippet: "Draft blog post for Shopify integration page", timestamp: "3 hours ago" },
  { id: "r11", category: "Documents", title: "API Integration Guide v2", snippet: "Updated API docs for SiteGPT integration", timestamp: "9 hours ago" },
  { id: "r12", category: "Documents", title: "Customer Interview Notes — Brent", snippet: "Notes from customer interview with Brent about usage patterns", timestamp: "12 hours ago" },
  { id: "r13", category: "Agents", title: "Jarvis", snippet: "Squad Lead — LEAD — WORKING" },
  { id: "r14", category: "Agents", title: "Vision", snippet: "SEO Analyst — SPC — WORKING" },
  { id: "r15", category: "Agents", title: "Loki", snippet: "Content Writer — SPC — WORKING" },
  { id: "r16", category: "Agents", title: "Fury", snippet: "Customer Researcher — SPC — WORKING" },
  { id: "r17", category: "Agents", title: "Quill", snippet: "Social Media — INT — WORKING" },
  { id: "r18", category: "Agents", title: "Friday", snippet: "Developer — INT — WORKING" },
  { id: "r19", category: "Activity", title: "Quill commented on 'Write Customer Case Studies'", snippet: "2 hours ago", timestamp: "2 hours ago" },
  { id: "r20", category: "Activity", title: "Vision moved 'SEO Strategy' to Review", snippet: "4 hours ago", timestamp: "4 hours ago" },
  { id: "r21", category: "Activity", title: "Friday deployed Mission Control UI update", snippet: "6 hours ago", timestamp: "6 hours ago" },
];

const categoryIcons: Record<string, typeof Search> = {
  Tasks: CheckSquare,
  Documents: FileText,
  Agents: Users,
  Activity: Activity,
};

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allResults.filter(
      (r) => r.title.toLowerCase().includes(q) || r.snippet.toLowerCase().includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const r of results) {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    }
    return groups;
  }, [results]);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-[var(--radius-outer)] border border-mc-border bg-surface-elevated overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-mc-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-text-secondary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, documents, agents..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none"
          />
          <kbd className="rounded-md border border-mc-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-secondary">ESC</kbd>
        </div>

        {query.trim() && (
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {Object.entries(grouped).length === 0 && (
              <div className="py-8 text-center text-sm text-text-secondary">No results for &ldquo;{query}&rdquo;</div>
            )}
            {Object.entries(grouped).map(([category, items]) => {
              const Icon = categoryIcons[category] || Search;
              return (
                <div key={category} className="mb-3">
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <Icon className="h-3 w-3 text-text-secondary" />
                    <span className="text-[10px] font-bold tracking-wider text-text-secondary">{category.toUpperCase()}</span>
                  </div>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      className="flex w-full items-start gap-3 rounded-[var(--radius-inner)] px-3 py-2 text-left transition-colors hover:bg-surface"
                      onClick={onClose}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-text-primary">{item.title}</div>
                        <div className="text-xs text-text-secondary line-clamp-1">{item.snippet}</div>
                      </div>
                      {item.timestamp && (
                        <span className="shrink-0 text-[10px] text-text-secondary/60">{item.timestamp}</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {!query.trim() && (
          <div className="p-6 text-center text-sm text-text-secondary/50">
            Start typing to search across all data...
          </div>
        )}
      </div>
    </div>
  );
}
