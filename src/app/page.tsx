"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/dashboard/top-bar";
import { AgentPanel } from "@/components/dashboard/agent-panel";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { LiveFeedPanel } from "@/components/dashboard/live-feed-panel";
import { MissionBanner } from "@/components/dashboard/mission-banner";
import { StandupModal } from "@/components/dashboard/standup-modal";
import { CalendarView } from "@/components/dashboard/calendar-view";
import { GlobalSearch } from "@/components/dashboard/global-search";

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [standupOpen, setStandupOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setCalendarOpen(false);
        setStandupOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <MissionBanner />
      <TopBar
        isDark={isDark}
        toggleTheme={toggleTheme}
        onStandupOpen={() => setStandupOpen(true)}
        onCalendarOpen={() => setCalendarOpen(true)}
        onSearchOpen={() => setSearchOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <AgentPanel />
        <KanbanBoard />
        <LiveFeedPanel />
      </div>
      <StandupModal open={standupOpen} onClose={() => setStandupOpen(false)} />
      <CalendarView open={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
