"use client";

import type { ComponentType } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AlertTriangle, CheckCircle2, CircleDashed, Eye, NotebookPen, X } from "lucide-react";

export function StandupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const standup = useQuery(api.queries.getLatestStandup);

  if (!open) return null;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const standupData = standup ?? {
    completed: [],
    inProgress: [],
    blocked: [],
    needsReview: [],
    decisions: [],
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/55 backdrop-blur-sm md:items-center md:justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[88dvh] overflow-y-auto rounded-t-[var(--radius-outer)] border border-mc-border bg-surface-elevated p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[var(--shadow-overlay)] md:max-h-[80vh] md:max-w-lg md:rounded-[var(--radius-outer)] md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Daily Standup</h2>
            <p className="mt-0.5 text-xs text-text-secondary">{standup?.date ?? today}</p>
          </div>
          <button
            onClick={onClose}
            className="interactive-lift mc-icon-button h-9 min-h-9 w-9 min-w-9 border-transparent bg-transparent p-0 shadow-none hover:bg-surface"
            aria-label="Close standup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Section
          icon={CheckCircle2}
          title="Completed"
          iconClass="text-mc-success"
          items={standupData.completed}
        />
        <Section
          icon={CircleDashed}
          title="In Progress"
          iconClass="text-mc-accent"
          items={standupData.inProgress}
        />
        <Section
          icon={AlertTriangle}
          title="Blocked"
          iconClass="text-mc-danger"
          items={standupData.blocked}
        />
        <Section
          icon={Eye}
          title="Needs Review"
          iconClass="text-mc-warning"
          items={standupData.needsReview}
        />
        <Section
          icon={NotebookPen}
          title="Key Decisions"
          iconClass="text-text-secondary"
          items={standupData.decisions}
        />

        {!standup && (
          <div className="rounded-[var(--radius-inner)] border border-mc-border/75 bg-surface p-4 text-center text-xs text-text-secondary">
            No standup data yet. Standups are generated as agents work.
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  iconClass,
  items,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  iconClass: string;
  items: { agentId: string; task: string }[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-4">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-text-secondary">
        <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
        {title.toUpperCase()}
      </h3>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <article
            key={`${item.agentId}-${index}`}
            className="rounded-[var(--radius-inner)] border border-mc-border/75 bg-surface p-2.5"
          >
            <div className="flex gap-2">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-[9px] font-semibold text-text-secondary">
                {item.agentId[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-text-primary">{item.agentId}</span>
                <span className="text-xs text-text-secondary"> — {item.task}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
