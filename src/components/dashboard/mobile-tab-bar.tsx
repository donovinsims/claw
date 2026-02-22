"use client";

import type { ReactNode } from "react";
import { Activity, Bot, Calendar, KanbanSquare, Search } from "lucide-react";

export type MobileTab = "queue" | "agents" | "feed";

type MobileTabBarProps = {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  onSearchOpen: () => void;
  onCalendarOpen: () => void;
};

export function MobileTabBar({
  activeTab,
  onTabChange,
  onSearchOpen,
  onCalendarOpen,
}: MobileTabBarProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-mc-border/70 bg-surface/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.14)] backdrop-blur-sm md:hidden">
      <div className="grid grid-cols-5 gap-2">
        <TabButton
          label="Queue"
          active={activeTab === "queue"}
          onClick={() => onTabChange("queue")}
          icon={<KanbanSquare className="h-4 w-4" />}
        />
        <TabButton
          label="Agents"
          active={activeTab === "agents"}
          onClick={() => onTabChange("agents")}
          icon={<Bot className="h-4 w-4" />}
        />
        <TabButton
          label="Feed"
          active={activeTab === "feed"}
          onClick={() => onTabChange("feed")}
          icon={<Activity className="h-4 w-4" />}
        />
        <TabButton
          label="Search"
          active={false}
          onClick={onSearchOpen}
          icon={<Search className="h-4 w-4" />}
        />
        <TabButton
          label="Calendar"
          active={false}
          onClick={onCalendarOpen}
          icon={<Calendar className="h-4 w-4" />}
        />
      </div>
    </nav>
  );
}

function TabButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-inner)] border px-2 py-2 text-xs font-medium shadow-[var(--shadow-elevated)] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] ${
        active
          ? "border-mc-border bg-surface text-text-primary"
          : "border-transparent bg-surface-elevated text-text-secondary hover:border-mc-border hover:bg-surface hover:text-text-primary hover:shadow-[var(--shadow-panel)]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
