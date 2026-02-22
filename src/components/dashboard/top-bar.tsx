"use client";

import { Calendar, Moon, Search, Sun } from "lucide-react";

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
  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">Mission Control</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Realtime Dashboard</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSearchOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onCalendarOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
            aria-label="Open calendar"
          >
            <Calendar className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onStandupOpen}
            className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-xs text-[var(--text-primary)]"
          >
            Standup
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
