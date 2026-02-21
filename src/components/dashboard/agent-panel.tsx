"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
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
  isOpen?: boolean;
  onToggle?: () => void;
  width?: number;
  onWidthChange?: (nextWidth: number) => void;
};

const MIN_AGENT_PANEL_WIDTH = 220;
const MAX_AGENT_PANEL_WIDTH = 420;

export function AgentPanel({
  onAgentClick,
  layout = "desktop",
  isOpen = true,
  onToggle,
  width = 240,
  onWidthChange,
}: AgentPanelProps) {
  const agentsQuery = useQuery(api.queries.getAgents);
  const agents = agentsQuery ?? [];
  const isLoading = agentsQuery === undefined;
  const isMobileLayout = layout === "mobile";
  const resolvedOpen = isMobileLayout ? true : isOpen;
  const resizingRef = useRef(false);

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isMobileLayout || !resolvedOpen || !onWidthChange) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;
    resizingRef.current = true;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = Math.min(
        MAX_AGENT_PANEL_WIDTH,
        Math.max(MIN_AGENT_PANEL_WIDTH, startWidth + delta)
      );
      onWidthChange(nextWidth);
    };

    const handlePointerUp = () => {
      resizingRef.current = false;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <aside
      style={!isMobileLayout ? { width: resolvedOpen ? width : 52 } : undefined}
      className={`flex shrink-0 flex-col bg-background ${
        isMobileLayout ? "w-full" : "relative border-r border-mc-border transition-[width] duration-200"
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        {!isMobileLayout && onToggle && (
          <button
            onClick={onToggle}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-inner)] text-text-secondary hover:bg-surface hover:text-text-primary"
            aria-label={resolvedOpen ? "Collapse agents panel" : "Expand agents panel"}
          >
            {resolvedOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        )}
        {resolvedOpen && (
          <>
            <div className="h-2 w-2 rounded-full bg-mc-cyan" />
            <span className="text-sm font-semibold tracking-wide text-text-primary">AGENTS</span>
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-[calc(var(--radius-inner)-8px)] bg-surface-elevated px-1.5 font-mono text-[10px] text-text-secondary">
              {agents.length}
            </span>
          </>
        )}
      </div>
      {resolvedOpen && (
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
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-inner)] border border-mc-border bg-surface px-3 py-2.5 transition-colors hover:bg-surface-elevated"
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
      )}
      {!isMobileLayout && resolvedOpen && onWidthChange && (
        <div
          onPointerDown={startResize}
          className={`absolute inset-y-0 right-0 z-20 w-2 cursor-col-resize ${
            resizingRef.current ? "bg-mc-cyan/20" : ""
          }`}
          aria-label="Resize agents panel"
          role="separator"
        />
      )}
    </aside>
  );
}
