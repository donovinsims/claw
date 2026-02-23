"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Moon, Sun, Users, KanbanSquare, BookText } from "lucide-react";
import { AgentPanel } from "@/components/dashboard/agent-panel";
import { LiveFeedPanel } from "@/components/dashboard/live-feed-panel";
import { AgentDetailModal } from "@/components/dashboard/agent-detail-modal";
import type { DashboardRoute } from "@/components/dashboard/types";
import { useIsMobile } from "@/hooks/use-mobile";

const ROUTES: Array<{ id: DashboardRoute; href: string; label: string; icon: ReactNode }> = [
  {
    id: "tasks",
    href: "/tasks",
    label: "Tasks",
    icon: <KanbanSquare className="h-4 w-4" />,
  },
  {
    id: "memory",
    href: "/memory",
    label: "Memory",
    icon: <BookText className="h-4 w-4" />,
  },
  {
    id: "team",
    href: "/team",
    label: "Team",
    icon: <Users className="h-4 w-4" />,
  },
];

const ROUTE_SUBTITLE: Record<DashboardRoute, string> = {
  tasks: "Realtime mission queue and execution state",
  memory: "Searchable record of what happened and why",
  team: "Agent structure, roles, and ownership",
};

type MissionShellProps = {
  route: DashboardRoute;
  children: ReactNode;
};

export function MissionShell({ route, children }: MissionShellProps) {
  const isMobile = useIsMobile();
  const [isDark, setIsDark] = useState(true);
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("mc.theme");
    const nextDark = storedTheme ? storedTheme === "dark" : true;
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
  }, []);

  const title = useMemo(() => {
    const activeRoute = ROUTES.find((candidate) => candidate.id === route);
    return activeRoute?.label ?? "Mission Control";
  }, [route]);

  const toggleTheme = () => {
    setIsDark((previous) => {
      const next = !previous;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("mc.theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <div className="flex h-dvh flex-col bg-[var(--bg-app)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1800px] items-center gap-4 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Mission Control
            </p>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>
            <p className="text-xs text-[var(--text-secondary)]">{ROUTE_SUBTITLE[route]}</p>
          </div>

          <nav className="mx-auto hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-1 md:flex">
            {ROUTES.map((entry) => {
              const isActive = route === entry.id;
              return (
                <Link
                  key={entry.id}
                  href={entry.href}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-elevated)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {entry.icon}
                  <span>{entry.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            aria-label="Toggle color mode"
            title="Toggle color mode"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1">
        {!isMobile && (
          <div
            className={`border-r border-[var(--border)] bg-[var(--bg-surface)] transition-[width] duration-200 ${
              agentPanelOpen ? "w-[300px]" : "w-[72px]"
            }`}
          >
            <AgentPanel
              isOpen={agentPanelOpen}
              onToggle={() => setAgentPanelOpen((previous) => !previous)}
              onAgentClick={(agentId) => setSelectedAgentId(agentId)}
            />
          </div>
        )}

        <main className="min-h-0 min-w-0 flex-1">{children}</main>

        {!isMobile && (
          <div
            className={`border-l border-[var(--border)] bg-[var(--bg-surface)] transition-[width] duration-200 ${
              contextOpen ? "w-[340px]" : "w-[72px]"
            }`}
          >
            <LiveFeedPanel
              isOpen={contextOpen}
              onToggle={() => setContextOpen((previous) => !previous)}
            />
          </div>
        )}
      </div>

      {isMobile && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--bg-surface)]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur-md">
          <div className="grid grid-cols-3 gap-2">
            {ROUTES.map((entry) => {
              const isActive = route === entry.id;
              return (
                <Link
                  key={entry.id}
                  href={entry.href}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]"
                      : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--bg-surface-elevated)]"
                  }`}
                >
                  {entry.icon}
                  <span>{entry.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <AgentDetailModal
        open={selectedAgentId !== null}
        agentId={selectedAgentId}
        onClose={() => setSelectedAgentId(null)}
      />
    </div>
  );
}
