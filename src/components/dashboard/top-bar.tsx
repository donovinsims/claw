"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Diamond, Sun, Moon, Calendar, Search, ClipboardList } from "lucide-react";

type TopBarProps = {
  isDark: boolean;
  toggleTheme: () => void;
  onStandupOpen: () => void;
  onCalendarOpen: () => void;
  onSearchOpen: () => void;
};

export function TopBar({
  isDark,
  toggleTheme,
  onStandupOpen,
  onCalendarOpen,
  onSearchOpen,
}: TopBarProps) {
  const [time, setTime] = useState<Date | null>(null);
  const stats = useQuery(api.queries.getDashboardStats);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time
    ? time.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";
  const dayStr = time
    ? time.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
    : "---";
  const dateStr = time
    ? time.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()
    : "--- --";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-mc-border/70 bg-surface/95 px-3 shadow-[var(--shadow-panel)] backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2 md:gap-3">
        <Diamond className="hidden h-5 w-5 text-text-primary md:block" />
        <span className="font-mono text-xs font-semibold tracking-[0.22em] text-text-primary md:text-sm">
          MISSION CONTROL
        </span>
      </div>

      <div className="hidden items-center gap-10 md:flex">
        <div className="text-center">
          <div className="text-3xl font-bold tracking-tight text-text-primary">
            {stats?.agentsActive ?? 0}
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-text-secondary">
            AGENTS ACTIVE
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold tracking-tight text-text-primary">
            {stats?.tasksInQueue ?? 0}
          </div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-text-secondary">
            TASKS IN QUEUE
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-1.5 md:gap-2 md:rounded-[var(--radius-pill)] md:border md:border-mc-border/70 md:bg-surface-elevated/70 md:p-1">
          <button
            onClick={onSearchOpen}
            aria-label="Open search"
            className="hidden min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-inner)] border border-transparent bg-surface-elevated text-xs text-text-secondary shadow-[var(--shadow-elevated)] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out hover:border-mc-border hover:bg-surface hover:text-text-primary hover:shadow-[var(--shadow-panel)] active:scale-[0.98] md:flex md:h-9 md:min-h-9 md:w-auto md:min-w-0 md:justify-start md:gap-2 md:rounded-[var(--radius-pill)] md:bg-transparent md:px-3 md:shadow-none md:hover:bg-surface md:hover:shadow-none"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden rounded border border-mc-border bg-background px-1 py-0.5 font-mono text-[9px] text-text-secondary md:inline">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={onCalendarOpen}
            aria-label="Open calendar"
            className="hidden min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-inner)] border border-transparent bg-surface-elevated text-text-secondary shadow-[var(--shadow-elevated)] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out hover:border-mc-border hover:bg-surface hover:text-text-primary hover:shadow-[var(--shadow-panel)] active:scale-[0.98] md:flex md:h-9 md:min-h-9 md:w-9 md:min-w-9 md:rounded-[var(--radius-pill)] md:bg-transparent md:shadow-none md:hover:bg-surface md:hover:shadow-none"
          >
            <Calendar className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onStandupOpen}
            aria-label="Open standup report"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-inner)] border border-transparent bg-surface-elevated text-text-secondary shadow-[var(--shadow-elevated)] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out hover:border-mc-border hover:bg-surface hover:text-text-primary hover:shadow-[var(--shadow-panel)] active:scale-[0.98] md:h-9 md:min-h-9 md:w-auto md:min-w-0 md:rounded-[var(--radius-pill)] md:bg-transparent md:px-3 md:text-xs md:font-medium md:shadow-none md:hover:bg-surface md:hover:shadow-none"
          >
            <ClipboardList className="h-3.5 w-3.5 md:hidden" />
            <span className="hidden md:inline">Standup</span>
          </button>
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-inner)] border border-transparent bg-surface-elevated text-text-secondary shadow-[var(--shadow-elevated)] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out hover:border-mc-border hover:bg-surface hover:text-text-primary hover:shadow-[var(--shadow-panel)] active:scale-[0.98] md:h-9 md:min-h-9 md:w-9 md:min-w-9 md:rounded-[var(--radius-pill)] md:bg-transparent md:shadow-none md:hover:bg-surface md:hover:shadow-none"
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="hidden items-center gap-3 border-l border-mc-border/60 pl-3 md:flex">
          <div className="text-right">
            <div className="font-mono text-lg font-bold tabular-nums text-text-primary">
              {timeStr}
            </div>
            <div className="font-mono text-[10px] tracking-[0.2em] text-text-secondary">
              {dayStr}, {dateStr}
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-mc-border bg-surface-elevated px-3 py-1 shadow-[var(--shadow-elevated)]">
            <div className="h-2 w-2 rounded-full bg-text-primary animate-pulse-dot" />
            <span className="font-mono text-xs font-medium tracking-wide text-text-primary">ONLINE</span>
          </div>
        </div>
      </div>
    </header>
  );
}
