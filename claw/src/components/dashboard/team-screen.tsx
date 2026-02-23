"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { readStoredAgentStyles, resolveAgentStyle } from "@/components/dashboard/agent-visuals";
import type { AgentVisualStyle } from "@/components/dashboard/types";

const TEAM_SEED = [
  {
    agentId: "agent:codex",
    name: "Codex",
    role: "Lead Engineer",
    level: "LEAD",
    status: "working",
    icon: "Code",
    model: "google-antigravity/claude-opus-4-6-thinking",
    prompt: "Lead implementation, planning, and quality hardening across the stack.",
  },
  {
    agentId: "agent:dev-frontend",
    name: "Frontend Engineer",
    role: "UI Systems Developer",
    level: "SPC",
    status: "idle",
    icon: "Palette",
    model: "google-antigravity/gemini-3-flash",
    prompt: "Build responsive interfaces, component systems, and interaction polish.",
  },
  {
    agentId: "agent:dev-backend",
    name: "Backend Engineer",
    role: "Data and API Developer",
    level: "SPC",
    status: "idle",
    icon: "Shield",
    model: "google-antigravity/claude-opus-4-5-thinking",
    prompt: "Handle backend integration, data contracts, and service reliability.",
  },
  {
    agentId: "agent:designer-ui",
    name: "Product Designer",
    role: "UI/UX Designer",
    level: "SPC",
    status: "idle",
    icon: "Sparkles",
    model: "google-antigravity/gemini-3-flash",
    prompt: "Own visual systems, information hierarchy, and interaction design quality.",
  },
  {
    agentId: "agent:writer-content",
    name: "Content Writer",
    role: "Documentation and Narrative",
    level: "SPC",
    status: "idle",
    icon: "Pen",
    model: "google-antigravity/gemini-3-flash",
    prompt: "Produce structured content, docs, and clear communication artifacts.",
  },
  {
    agentId: "agent:qa-security",
    name: "QA + Security",
    role: "Verification and Risk Control",
    level: "SPC",
    status: "idle",
    icon: "Eye",
    model: "google-antigravity/claude-opus-4-5-thinking",
    prompt: "Run quality checks, regression reviews, and security risk assessments.",
  },
] as const;

type TeamGroup = {
  title: string;
  agents: Array<{
    agentId: string;
    name: string;
    role?: string;
    level?: string;
    status: string;
    model?: string;
    tasksCompleted?: number;
  }>;
};

function statusChip(status: string): string {
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

function statusDotClass(status: string): string {
  switch (status) {
    case "working":
      return "bg-[var(--status-success)]";
    case "error":
      return "bg-[var(--status-error)]";
    default:
      return "bg-[var(--text-secondary)]/35";
  }
}

export function TeamScreen() {
  const agents = useQuery(api.queries.getAgents);
  const upsertAgent = useMutation(api.mutations.upsertAgent);

  const [styles, setStyles] = useState<Record<string, AgentVisualStyle>>({});
  const seedTriggeredRef = useRef(false);

  useEffect(() => {
    const syncStyles = () => setStyles(readStoredAgentStyles());

    syncStyles();
    window.addEventListener("storage", syncStyles);
    window.addEventListener("agent-style-updated", syncStyles);

    return () => {
      window.removeEventListener("storage", syncStyles);
      window.removeEventListener("agent-style-updated", syncStyles);
    };
  }, []);

  useEffect(() => {
    if (!agents || seedTriggeredRef.current) return;

    seedTriggeredRef.current = true;
    const existingAgentIds = new Set(agents.map((agent) => agent.agentId));
    const missing = TEAM_SEED.filter((entry) => !existingAgentIds.has(entry.agentId));

    if (missing.length === 0) return;

    void (async () => {
      try {
        for (const seed of missing) {
          await upsertAgent(seed);
        }
        toast.success(`Seeded ${missing.length} team role${missing.length === 1 ? "" : "s"}`);
      } catch {
        toast.error("Could not seed team roles");
      }
    })();
  }, [agents, upsertAgent]);

  const groups = useMemo<TeamGroup[]>(() => {
    const rows = agents ?? [];

    const isDeveloper = (role: string) => /developer|engineer|backend|frontend|api|data/i.test(role);
    const isDesigner = (role: string) => /designer|design|ux|ui/i.test(role);
    const isWriter = (role: string) => /writer|content|documentation|copy/i.test(role);
    const isOpsQa = (role: string) => /qa|quality|ops|security|risk|verification/i.test(role);

    const grouped: Record<string, TeamGroup["agents"]> = {
      Developers: [],
      Designers: [],
      Writers: [],
      "Ops and QA": [],
      "Other Active Agents": [],
    };

    for (const agent of rows) {
      const role = agent.role ?? "";
      const id = agent.agentId;

      if (isDeveloper(role) || /dev-|codex/i.test(id)) {
        grouped.Developers.push(agent);
      } else if (isDesigner(role) || /designer/i.test(id)) {
        grouped.Designers.push(agent);
      } else if (isWriter(role) || /writer/i.test(id)) {
        grouped.Writers.push(agent);
      } else if (isOpsQa(role) || /qa-security/i.test(id)) {
        grouped["Ops and QA"].push(agent);
      } else {
        grouped["Other Active Agents"].push(agent);
      }
    }

    return Object.entries(grouped)
      .map(([title, members]) => ({ title, agents: members }))
      .filter((group) => group.agents.length > 0);
  }, [agents]);

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 md:px-5">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Team Structure</p>
        <p className="pt-1 text-xs text-[var(--text-secondary)]">
          Roles are grouped by responsibility. Seed agents are idempotent and synced through existing Convex mutations.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.title} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                {group.title}
              </h3>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {group.agents.map((agent) => {
                  const style = resolveAgentStyle(agent.agentId, styles);
                  const cardStyle = {
                    "--agent-gradient": style.gradient,
                    "--agent-accent": style.accent,
                    borderColor: "color-mix(in srgb, var(--agent-accent) 58%, rgba(255,255,255,.4))",
                    boxShadow:
                      "0 0 0 1px color-mix(in srgb, var(--agent-accent) 56%, rgba(255,255,255,.34)), 0 14px 30px color-mix(in srgb, var(--agent-accent) 38%, transparent), inset 0 0 34px color-mix(in srgb, var(--agent-accent) 20%, transparent)",
                  } as CSSProperties;

                  return (
                    <article
                      key={agent.agentId}
                      style={cardStyle}
                      className="relative overflow-hidden rounded-xl border bg-transparent p-3 shadow-[var(--shadow-card)]"
                    >
                      <span className="pointer-events-none absolute inset-0" style={{ background: "var(--agent-gradient)" }} />
                      <span
                        className="pointer-events-none absolute inset-0 opacity-65"
                        style={{
                          background:
                            "radial-gradient(120% 100% at 12% 0%, rgba(255,255,255,.34) 0%, rgba(255,255,255,0) 52%)",
                        }}
                      />
                      <span className="pointer-events-none absolute inset-0" style={{ background: "var(--agent-card-mask)" }} />

                      <div className="relative">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[var(--agent-card-fg)] [text-shadow:0_1px_2px_rgba(0,0,0,.55)]">
                              {agent.name}
                            </p>
                            <p className="text-xs text-[var(--agent-card-fg-muted)] [text-shadow:0_1px_2px_rgba(0,0,0,.45)]">
                              {agent.role ?? agent.agentId}
                            </p>
                          </div>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] text-[var(--agent-card-fg)]"
                            style={{
                              background: "var(--agent-card-chip-bg)",
                              borderColor: "var(--agent-card-chip-border)",
                            }}
                          >
                            <span className={`h-2 w-2 rounded-full ${statusDotClass(agent.status)}`} />
                            {statusChip(agent.status)}
                          </span>
                        </div>

                        <p className="pt-2 text-[11px] text-[var(--agent-card-fg-muted)]">
                          {agent.level ?? "NO LEVEL"} · {agent.model ?? "No model configured"}
                        </p>
                        <p className="pt-1 text-[11px] text-[var(--agent-card-fg-muted)]">
                          Tasks completed: {agent.tasksCompleted ?? 0}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          {!agents && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
              Loading team data...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
