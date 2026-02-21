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
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-mc-border bg-surface px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 md:hidden">
      <div className="grid grid-cols-5 gap-1">
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
      className={`flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-inner)] px-2 py-2 text-xs font-medium transition-colors ${
        active ? "bg-mc-cyan text-white" : "text-text-secondary"
      }`}
      aria-label={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
