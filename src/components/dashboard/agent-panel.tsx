"use client";

import { Bot, Shield, Sparkles, Eye, Pen, Share2, Palette, Mail, Code, BookOpen } from "lucide-react";

const agents = [
  { name: "Jarvis", role: "Squad Lead", level: "LEAD", status: "working", icon: Shield },
  { name: "Shuri", role: "Product Analyst", level: "INT", status: "working", icon: Sparkles },
  { name: "Fury", role: "Customer Researcher", level: "SPC", status: "working", icon: Eye },
  { name: "Vision", role: "SEO Analyst", level: "SPC", status: "working", icon: Bot },
  { name: "Loki", role: "Content Writer", level: "SPC", status: "working", icon: Pen },
  { name: "Quill", role: "Social Media", level: "INT", status: "working", icon: Share2 },
  { name: "Wanda", role: "Designer", level: "INT", status: "idle", icon: Palette },
  { name: "Pepper", role: "Email Marketing", level: "INT", status: "working", icon: Mail },
  { name: "Friday", role: "Developer", level: "INT", status: "working", icon: Code },
  { name: "Wong", role: "Documentation", level: "SPC", status: "idle", icon: BookOpen },
];

const levelColors: Record<string, string> = {
  LEAD: "bg-mc-orange/15 text-mc-orange",
  INT: "bg-mc-blue/15 text-mc-blue",
  SPC: "bg-text-secondary/15 text-text-secondary",
};

export function AgentPanel() {
  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-mc-border bg-background">
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="h-2 w-2 rounded-full bg-mc-cyan" />
        <span className="text-sm font-semibold tracking-wide text-text-primary">AGENTS</span>
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-elevated px-1.5 font-mono text-[10px] text-text-secondary">
          {agents.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="flex flex-col gap-1.5">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="flex items-center gap-3 rounded-[var(--radius-inner)] border border-mc-border bg-surface px-3 py-2.5 transition-colors hover:bg-surface-elevated"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-text-secondary">
                <agent.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-text-primary">{agent.name}</span>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[9px] font-medium ${levelColors[agent.level]}`}>
                    {agent.level}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs text-text-secondary">{agent.role}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${agent.status === "working" ? "bg-mc-green animate-pulse-dot" : "bg-text-secondary/40"}`} />
                <span className={`font-mono text-[9px] font-medium ${agent.status === "working" ? "text-mc-green" : "text-text-secondary"}`}>
                  {agent.status === "working" ? "WORKING" : "IDLE"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
