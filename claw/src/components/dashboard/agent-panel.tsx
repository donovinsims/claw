"use client";

import { useEffect, useState, type CSSProperties } from "react";
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
import { readStoredAgentStyles, resolveAgentStyle } from "@/components/dashboard/agent-visuals";
import type { AgentVisualStyle } from "@/components/dashboard/types";
import { Status, StatusIndicator, StatusLabel, type StatusProps } from "@/components/kibo-ui/status";

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

type AgentPanelProps = {
  onAgentClick?: (agentId: string) => void;
  layout?: "desktop" | "mobile";
  isOpen?: boolean;
  onToggle?: () => void;
};

function statusLabel(status: string): string {
  switch (status) {
    case "working":
      return "Working";
    case "error":
      return "Error";
    case "offline":
      return "Offline";
    default:
      return "Idle";
  }
}

function statusVariant(status: string): StatusProps["status"] {
  switch (status) {
    case "working":
      return "online";
    case "error":
      return "degraded";
    case "offline":
      return "offline";
    default:
      return "maintenance";
  }
}

export function AgentPanel({
  onAgentClick,
  layout = "desktop",
  isOpen = true,
  onToggle,
}: AgentPanelProps) {
  const agents = useQuery(api.queries.getAgents) ?? [];
  const isMobileLayout = layout === "mobile";
  const [storedStyles, setStoredStyles] = useState<Record<string, AgentVisualStyle>>({});

  useEffect(() => {
    const syncStyles = () => {
      setStoredStyles(readStoredAgentStyles());
    };

    syncStyles();
    window.addEventListener("storage", syncStyles);
    window.addEventListener("agent-style-updated", syncStyles);

    return () => {
      window.removeEventListener("storage", syncStyles);
      window.removeEventListener("agent-style-updated", syncStyles);
    };
  }, []);

  if (!isMobileLayout && !isOpen) {
    return (
      <aside className="flex h-full w-full shrink-0 flex-col">
        <div className="flex items-center justify-center px-2 py-4">
          {onToggle && (
            <button
              onClick={onToggle}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
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
    <aside className={`flex h-full shrink-0 flex-col ${isMobileLayout ? "w-full" : "w-full"}`}>
      <div className="border-b border-[var(--border)] px-4 py-4">
        <div className="flex items-center gap-2">
          {onToggle && !isMobileLayout && (
            <button
              onClick={onToggle}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              aria-label="Collapse agent sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Agents
          </span>
          <span className="ml-auto inline-flex min-h-6 min-w-6 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-1.5 text-xs font-semibold text-[var(--text-secondary)]">
            {agents.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-2">
          {agents.map((agent) => {
            const IconComponent = iconMap[agent.icon ?? "Bot"] ?? Bot;
            const style = resolveAgentStyle(agent.agentId, storedStyles);
            const cardStyle = {
              "--agent-gradient": style.gradient,
              "--agent-accent": style.accent,
              borderColor: "color-mix(in srgb, var(--agent-accent) 60%, rgba(255,255,255,.42))",
              boxShadow:
                "0 0 0 1px color-mix(in srgb, var(--agent-accent) 58%, rgba(255,255,255,.35)), 0 16px 34px color-mix(in srgb, var(--agent-accent) 42%, transparent), inset 0 0 36px color-mix(in srgb, var(--agent-accent) 22%, transparent)",
            } as CSSProperties;

            return (
              <button
                key={agent.agentId}
                type="button"
                onClick={() => onAgentClick?.(agent.agentId)}
                disabled={!onAgentClick}
                style={cardStyle}
                className="group relative overflow-hidden rounded-xl border bg-transparent p-3 text-left transition-all duration-200 hover:-translate-y-[1px] disabled:cursor-default"
                aria-label={`Open ${agent.name} details`}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-100"
                  style={{ background: "var(--agent-gradient)" }}
                />
                <div
                  className="pointer-events-none absolute inset-0 opacity-70"
                  style={{
                    background:
                      "radial-gradient(120% 100% at 12% 0%, rgba(255,255,255,.36) 0%, rgba(255,255,255,0) 52%)",
                  }}
                />
                <div className="pointer-events-none absolute inset-0" style={{ background: "var(--agent-card-mask)" }} />

                <div className="relative flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-[var(--agent-card-fg)]"
                    style={{
                      background: "var(--agent-card-icon-bg)",
                      borderColor: "var(--agent-card-icon-border)",
                      boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--agent-accent) 48%, transparent)",
                    }}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--agent-card-fg)] [text-shadow:0_1px_2px_rgba(0,0,0,.55)]">
                        {agent.name}
                      </span>
                      {agent.level && (
                        <span
                          className="rounded-md border px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: "var(--agent-card-chip-bg)",
                            borderColor: "var(--agent-card-chip-border)",
                            color: "var(--agent-card-fg)",
                          }}
                        >
                          {agent.level}
                        </span>
                      )}
                    </div>
                    <p className="truncate pt-0.5 text-xs text-[var(--agent-card-fg-muted)] [text-shadow:0_1px_2px_rgba(0,0,0,.45)]">
                      {agent.role ?? agent.agentId}
                    </p>
                  </div>

                  <Status status={statusVariant(agent.status)}>
                    <StatusIndicator />
                    <StatusLabel>{statusLabel(agent.status)}</StatusLabel>
                  </Status>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
