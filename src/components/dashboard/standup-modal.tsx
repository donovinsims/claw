"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X } from "lucide-react";

export function StandupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const standup = useQuery(api.queries.getLatestStandup);

  if (!open) return null;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const standupData = standup ?? {
    completed: [],
    inProgress: [],
    blocked: [],
    needsReview: [],
    decisions: [],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-[var(--radius-outer)] border border-mc-border bg-surface-elevated p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Daily Standup</h2>
            <p className="text-xs text-text-secondary mt-0.5">{standup?.date ?? today}</p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <Section emoji="✅" title="COMPLETED TODAY" items={standupData.completed} />
        <Section emoji="🔄" title="IN PROGRESS" items={standupData.inProgress} />
        <Section emoji="🚫" title="BLOCKED" items={standupData.blocked} />
        <Section emoji="👀" title="NEEDS REVIEW" items={standupData.needsReview} />
        <Section emoji="📝" title="KEY DECISIONS" items={standupData.decisions} />

        {!standup && (
          <div className="py-4 text-center text-xs text-text-secondary/50">No standup data yet. Standups are generated as agents work.</div>
        )}
      </div>
    </div>
  );
}

function Section({ emoji, title, items }: { emoji: string; title: string; items: { agentId: string; task: string }[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-text-secondary">
        <span>{emoji}</span> {title}
      </h3>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 rounded-[var(--radius-inner)] bg-surface p-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-[9px] font-bold text-text-secondary">
              {item.agentId[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-text-primary">{item.agentId}</span>
              <span className="text-xs text-text-secondary"> — {item.task}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
