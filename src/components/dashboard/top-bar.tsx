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
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-mc-border bg-surface px-3 md:px-6">
      <div className="flex items-center gap-2 md:gap-3">
        <Diamond className="hidden h-5 w-5 text-text-primary md:block" />
        <span className="font-mono text-xs font-bold tracking-widest text-text-primary md:text-sm">
          MISSION CONTROL
        </span>
      </div>

      <div className="hidden items-center gap-10 md:flex">
        <div className="text-center">
          <div className="text-3xl font-bold tracking-tight text-text-primary">
            {stats?.agentsActive ?? 0}
          </div>
          <div className="font-mono text-[10px] tracking-widest text-text-secondary">
            AGENTS ACTIVE
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold tracking-tight text-text-primary">
            {stats?.tasksInQueue ?? 0}
          </div>
          <div className="font-mono text-[10px] tracking-widest text-text-secondary">
            TASKS IN QUEUE
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2.5">
        <button
          onClick={onSearchOpen}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-inner)] bg-surface-elevated text-xs text-text-secondary transition-colors hover:text-text-primary md:h-8 md:w-auto md:justify-start md:gap-2 md:rounded-full md:px-3"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden rounded border border-mc-border bg-surface px-1 py-0.5 font-mono text-[9px] md:inline">
            ⌘K
          </kbd>
        </button>
        <button
          onClick={onCalendarOpen}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-inner)] bg-surface-elevated text-text-secondary transition-colors hover:text-text-primary md:h-8 md:w-8 md:rounded-full"
        >
          <Calendar className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onStandupOpen}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-inner)] bg-surface-elevated text-text-secondary transition-colors hover:text-text-primary md:h-auto md:w-auto md:rounded-full md:px-3 md:py-1.5 md:text-xs md:font-medium"
        >
          <ClipboardList className="h-3.5 w-3.5 md:hidden" />
          <span className="hidden md:inline">Standup</span>
        </button>
        <button
          onClick={toggleTheme}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-inner)] bg-surface-elevated text-text-secondary transition-colors hover:text-text-primary md:h-8 md:w-8 md:rounded-full"
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
        <div className="ml-1 hidden text-right md:block">
          <div className="font-mono text-lg font-bold tabular-nums text-text-primary">
            {timeStr}
          </div>
          <div className="font-mono text-[10px] tracking-widest text-text-secondary">
            {dayStr}, {dateStr}
          </div>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full bg-[#34C759]/15 px-3 py-1 md:flex">
          <div className="h-2 w-2 rounded-full bg-mc-green animate-pulse-dot" />
          <span className="font-mono text-xs font-medium text-mc-green">ONLINE</span>
        </div>
      </div>
    </header>
  );
}
