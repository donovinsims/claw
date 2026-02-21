"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Bot, Shield, Sparkles, Eye, Pen, Share2, Palette, Mail, Code, BookOpen } from "lucide-react";

const iconMap: Record<string, typeof Shield> = {
  Shield, Sparkles, Eye, Bot, Pen, Share2, Palette, Mail, Code, BookOpen,
};

const levelColors: Record<string, string> = {
  LEAD: "bg-mc-orange/15 text-mc-orange",
  INT: "bg-mc-blue/15 text-mc-blue",
  SPC: "bg-text-secondary/15 text-text-secondary",
};

type AgentPanelProps = {
  onAgentClick?: (agentId: string) => void;
  layout?: "desktop" | "mobile";
};

export function AgentPanel({ onAgentClick, layout = "desktop" }: AgentPanelProps) {
  const agentsQuery = useQuery(api.queries.getAgents);
  const agents = agentsQuery ?? [];
  const isLoading = agentsQuery === undefined;
  const isMobileLayout = layout === "mobile";

  return (
    <aside
      className={`flex shrink-0 flex-col bg-background ${
        isMobileLayout ? "w-full" : "w-[240px] border-r border-mc-border"
      }`}
    >
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="h-2 w-2 rounded-full bg-mc-cyan" />
        <span className="text-sm font-semibold tracking-wide text-text-primary">AGENTS</span>
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-[calc(var(--radius-inner)-8px)] bg-surface-elevated px-1.5 font-mono text-[10px] text-text-secondary">
          {agents.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="flex flex-col gap-1.5">
          {isLoading &&
            Array.from({ length: 7 }).map((_, index) => (
              <div
                key={`agent-skeleton-${index}`}
                className="h-14 animate-pulse rounded-[var(--radius-inner)] border border-mc-border bg-surface"
              />
            ))}
          {agents.map((agent) => {
            const IconComponent = iconMap[agent.icon ?? "Bot"] ?? Bot;
            return (
              <div
                key={agent.agentId}
                onClick={() => onAgentClick?.(agent.agentId)}
                className="flex min-h-11 items-center gap-3 rounded-[var(--radius-inner)] border border-mc-border bg-surface px-3 py-2.5 transition-colors hover:bg-surface-elevated cursor-pointer"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-inner)] bg-surface-elevated text-text-secondary">
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-text-primary">{agent.name}</span>
                    {agent.level && (
                      <span className={`shrink-0 rounded-[calc(var(--radius-inner)-8px)] px-1.5 py-0.5 font-mono text-[9px] font-medium ${levelColors[agent.level] ?? ""}`}>
                        {agent.level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs text-text-secondary">{agent.role ?? agent.agentId}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${agent.status === "working" ? "bg-mc-green animate-pulse-dot" : "bg-text-secondary/40"}`} />
                  <span className={`font-mono text-[9px] font-medium ${agent.status === "working" ? "text-mc-green" : "text-text-secondary"}`}>
                    {agent.status === "working" ? "WORKING" : "IDLE"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
