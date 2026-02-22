"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Bot,
  Shield,
  Sparkles,
  Eye,
  Pen,
  Share2,
  Palette,
  Mail,
  Code,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const iconMap: Record<string, typeof Shield> = {
  Shield,
  Sparkles,
  Eye,
  Bot,
  Pen,
  Share2,
  Palette,
  Mail,
  Code,
  BookOpen,
};

const levelColors: Record<string, string> = {
  LEAD: "border border-mc-border bg-surface-elevated text-text-primary",
  INT: "border border-mc-border bg-surface-elevated text-text-secondary",
  SPC: "border border-mc-border bg-background text-text-secondary",
};

type AgentPanelProps = {
  onAgentClick?: (agentId: string) => void;
  layout?: "desktop" | "mobile";
  isOpen?: boolean;
  onToggle?: () => void;
};

export function AgentPanel({
  onAgentClick,
  layout = "desktop",
  isOpen = true,
  onToggle,
}: AgentPanelProps) {
  const agents = useQuery(api.queries.getAgents) ?? [];
  const isMobileLayout = layout === "mobile";

  if (!isMobileLayout && !isOpen) {
    return (
      <aside className="flex h-full w-full shrink-0 flex-col border-r border-mc-border/70 bg-background">
        <div className="flex items-center justify-center px-2 py-4">
          {onToggle && (
            <button
              onClick={onToggle}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-inner)] border border-transparent bg-surface-elevated text-text-secondary shadow-[var(--shadow-elevated)] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out hover:border-mc-border hover:bg-surface hover:text-text-primary hover:shadow-[var(--shadow-panel)] active:scale-[0.98]"
              aria-label="Expand agent sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`flex h-full shrink-0 flex-col bg-background ${
        isMobileLayout ? "w-full" : "w-full border-r border-mc-border/70"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        {onToggle && !isMobileLayout && (
          <button
            onClick={onToggle}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-inner)] border border-transparent bg-surface-elevated text-text-secondary shadow-[var(--shadow-elevated)] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out hover:border-mc-border hover:bg-surface hover:text-text-primary hover:shadow-[var(--shadow-panel)] active:scale-[0.98]"
            aria-label="Collapse agent sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
        <div className="h-2 w-2 rounded-full bg-text-primary" />
        <span className="text-sm font-semibold tracking-wide text-text-primary">AGENTS</span>
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-[var(--radius-pill)] border border-mc-border bg-surface-elevated px-1.5 font-mono text-[10px] text-text-secondary">
          {agents.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="flex flex-col gap-2">
          {agents.map((agent) => {
            const IconComponent = iconMap[agent.icon ?? "Bot"] ?? Bot;
            return (
              <button
                key={agent.agentId}
                type="button"
                onClick={() => onAgentClick?.(agent.agentId)}
                disabled={!onAgentClick}
                className="group flex w-full items-center gap-3 rounded-[var(--radius-inner)] border border-mc-border/80 bg-surface px-3 py-3 text-left shadow-[var(--shadow-elevated)] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out hover:border-mc-border hover:bg-surface-elevated hover:shadow-[var(--shadow-panel)] active:scale-[0.995] disabled:cursor-default"
                aria-label={`Open ${agent.name} details`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-pill)] border border-mc-border bg-surface-elevated text-text-secondary transition-colors group-hover:text-text-primary">
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="truncate text-sm font-semibold text-text-primary">
                      {agent.name}
                    </span>
                    {agent.level && (
                      <span
                        className={`shrink-0 rounded-[var(--radius-pill)] px-2 py-0.5 font-mono text-[9px] font-medium tracking-wide ${levelColors[agent.level] ?? ""}`}
                      >
                        {agent.level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="truncate text-xs leading-relaxed text-text-secondary">
                      {agent.role ?? agent.agentId}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-mc-border/60 bg-background px-2 py-1">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      agent.status === "working"
                        ? "bg-mc-green animate-pulse-dot"
                        : "bg-text-secondary/40"
                    }`}
                  />
                  <span
                    className={`font-mono text-[9px] font-medium ${
                      agent.status === "working" ? "text-mc-green" : "text-text-secondary"
                    }`}
                  >
                    {agent.status === "working" ? "WORKING" : "IDLE"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
