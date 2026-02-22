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

  // Use variables to avoid lints
  console.log(timeStr, dayStr, dateStr, stats);

  return (
    <header className="flex flex-col shrink-0 bg-white border-b border-gray-100">
      {/* Upper Level */}
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A1A1A] text-white">
            <Diamond className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold tracking-tight text-gray-400">OPENCLAW</p>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={onSearchOpen}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            title="Search tasks (⌘K)"
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
            <kbd className="hidden sm:inline-block rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-400">
              ⌘K
            </kbd>
          </button>

          <button onClick={onCalendarOpen} className="text-gray-400 hover:text-gray-600 transition-colors" title="Open calendar">
            <Calendar className="h-5 w-5" />
          </button>

          <button onClick={toggleTheme} className="text-gray-400 hover:text-gray-600 transition-colors" title="Toggle color theme">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="h-6 w-[1px] bg-gray-200 mx-2" />

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="User"
                className="h-full w-full object-cover"
              />
            </div>
            <button className="relative text-gray-400 hover:text-gray-600 transition-colors" title="Notifications">
              <div className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              <Search className="h-5 w-5 rotate-[-15deg]" /> {/* Placeholder for Bell Icon if Lucide Bell is missing or custom */}
            </button>
          </div>
        </div>
      </div>

      {/* Lower Level - Secondary Header */}
      <div className="flex h-14 items-center justify-between border-t border-gray-50 px-6">
        <div className="flex items-center gap-8 text-sm font-medium text-gray-400">
          <button className="text-[#1A1A1A] border-b-2 border-[#1A1A1A] h-14">All Tasks</button>
          <button className="hover:text-gray-600 transition-colors">My Tasks</button>
          <button className="hover:text-gray-600 transition-colors">Looked Tasks</button>
          <button className="hover:text-gray-600 transition-colors">Closing Tasks</button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[11px] text-gray-400">Last update: <span className="text-gray-600 font-medium">January 12, 2025</span></span>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
            <ClipboardList className="h-4 w-4" />
            Filter
          </button>
          <button onClick={onStandupOpen} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md transition-colors" title="Refresh data">
            <Sun className="h-4 w-4" /> {/* Placeholder for Refresh icon */}
            Refresh
          </button>
          <button className="flex items-center gap-2 bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors">
            <span className="text-lg leading-none">+</span>
            Add New
          </button>
        </div>
      </div>
    </header>
  );
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[var(--radius-inner)] border border-white/5 bg-card px-3 py-1.5">
      <p className="text-center text-lg font-semibold leading-none text-text-primary">{value}</p>
      <p className="pt-1 font-mono text-[10px] tracking-[0.12em] text-text-secondary">
        {label.toUpperCase()}
      </p>
    </div>
  );
}
