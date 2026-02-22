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
  LEAD: "border border-gray-100 bg-gray-50 text-gray-500",
  INT: "border border-gray-100 bg-gray-50 text-gray-400",
  SPC: "border border-gray-100 bg-gray-50 text-gray-400",
};
const AGENT_STYLE_KEY = "mc.agentStyles.v4";

type AgentStyle = {
  accent: string;
  gradient: string;
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
  const [agentStyles, setAgentStyles] = useState<Record<string, AgentStyle>>({});

  useEffect(() => {
    const handleStorageChange = () => {
      const raw = window.localStorage.getItem(AGENT_STYLE_KEY);
      if (!raw) {
        setAgentStyles({});
        return;
      }
      try {
        const parsed = JSON.parse(raw) as Record<string, AgentStyle>;
        const sanitized = Object.fromEntries(
          Object.entries(parsed).filter(
            ([, style]) =>
              typeof style === "object" &&
              style !== null &&
              typeof style.accent === "string" &&
              typeof style.gradient === "string"
          )
        );
        setAgentStyles(sanitized);
      } catch {
        window.localStorage.removeItem(AGENT_STYLE_KEY);
      }
    };

    handleStorageChange();

    window.addEventListener("storage", handleStorageChange);
    // Custom event to sync up across components in the same window
    window.addEventListener("agent-style-updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("agent-style-updated", handleStorageChange);
    };
  }, []);

  if (!isMobileLayout && !isOpen) {
    return (
      <aside className="flex h-full w-full shrink-0 flex-col border-r border-mc-border/70 bg-background">
        <div className="flex items-center justify-center px-2 py-4">
          {onToggle && (
            <button
              onClick={onToggle}
              className="interactive-lift mc-icon-button"
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
      className={`flex h-full shrink-0 flex-col bg-white ${isMobileLayout ? "w-full" : "w-full border-r border-gray-100"
        }`}
    >
      <div className="border-b border-gray-50 px-6 py-5">
        <div className="flex items-center gap-2">
          {onToggle && !isMobileLayout && (
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-600 transition-colors mr-2"
              aria-label="Collapse agent sidebar"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          )}
          <div className="h-2 w-2 rounded-full bg-gray-900" />
          <span className="text-sm font-bold tracking-tight text-[#1A1A1A]">AGENTS</span>
          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-gray-100 bg-gray-50 px-1.5 text-[11px] font-bold text-gray-500">
            {agents.length}
          </span>
        </div>
        <p className="pt-1.5 text-[11px] leading-snug text-gray-400 font-medium tracking-tight">Access agent detailed context and autonomous activity logs.</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="flex flex-col gap-2">
          {agents.map((agent) => {
            const IconComponent = iconMap[agent.icon ?? "Bot"] ?? Bot;
            const agentStyle = agentStyles[agent.agentId];
            const accentStyle = agentStyle
              ? ({
                "--agent-gradient": agentStyle.gradient,
                "--agent-accent": agentStyle.accent,
              } as CSSProperties)
              : undefined;
            return (
              <article
                key={agent.agentId}
                className="space-y-1.5"
              >
                <button
                  type="button"
                  onClick={() => onAgentClick?.(agent.agentId)}
                  disabled={!onAgentClick}
                  style={accentStyle}
                  className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-white p-3 text-left hover:border-gray-100 hover:shadow-sm transition-all disabled:cursor-default"
                  aria-label={`Open ${agent.name} details`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-400 transition-colors group-hover:text-gray-600">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-[#1A1A1A]">
                        {agent.name}
                      </span>
                      {agent.level && (
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-tight ${levelColors[agent.level] ?? ""}`}
                        >
                          {agent.level}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="truncate text-[11px] font-medium text-gray-400">
                        {agent.role ?? agent.agentId}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md border border-gray-100 bg-gray-50 px-2 py-1">
                    <div
                      className={`h-2 w-2 rounded-full ${agent.status === "working"
                        ? "bg-green-500 animate-pulse"
                        : "bg-gray-300"
                        }`}
                    />
                    <span
                      className={`text-[10px] font-bold tracking-tight ${agent.status === "working" ? "text-green-600" : "text-gray-400"
                        }`}
                    >
                      {agent.status === "working" ? "WORKING" : "IDLE"}
                    </span>
                  </div>
                </button>

                <div className="flex items-center justify-end gap-1">
                </div>

              </article>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
