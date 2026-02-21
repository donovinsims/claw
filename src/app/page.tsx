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
import { AgentDetailModal } from "@/components/dashboard/agent-detail-modal";
import { MobileTabBar, type MobileTab } from "@/components/dashboard/mobile-tab-bar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [standupOpen, setStandupOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);
  const [agentPanelWidth, setAgentPanelWidth] = useState(260);
  const [liveFeedOpen, setLiveFeedOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("queue");
  const isMobile = useIsMobile();

  useEffect(() => {
    const storedLiveFeed = window.localStorage.getItem("mc.liveFeedOpen");
    if (storedLiveFeed !== null) {
      setLiveFeedOpen(storedLiveFeed === "true");
    }
    const storedAgentPanelOpen = window.localStorage.getItem("mc.agentPanelOpen");
    if (storedAgentPanelOpen !== null) {
      setAgentPanelOpen(storedAgentPanelOpen === "true");
    }
    const storedAgentPanelWidth = window.localStorage.getItem("mc.agentPanelWidth");
    if (storedAgentPanelWidth !== null) {
      const width = Number(storedAgentPanelWidth);
      if (!Number.isNaN(width)) {
        setAgentPanelWidth(Math.min(420, Math.max(220, width)));
      }
    }
    const storedMobileTab = window.localStorage.getItem("mc.mobileTab") as MobileTab | null;
    if (storedMobileTab === "queue" || storedMobileTab === "agents" || storedMobileTab === "feed") {
      setMobileTab(storedMobileTab);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("mc.liveFeedOpen", String(liveFeedOpen));
  }, [liveFeedOpen]);

  useEffect(() => {
    window.localStorage.setItem("mc.agentPanelOpen", String(agentPanelOpen));
  }, [agentPanelOpen]);

  useEffect(() => {
    window.localStorage.setItem("mc.agentPanelWidth", String(agentPanelWidth));
  }, [agentPanelWidth]);

  useEffect(() => {
    window.localStorage.setItem("mc.mobileTab", mobileTab);
  }, [mobileTab]);

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
        setSelectedAgentId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <MissionBanner />
      <TopBar
        isDark={isDark}
        toggleTheme={toggleTheme}
        onStandupOpen={() => setStandupOpen(true)}
        onCalendarOpen={() => setCalendarOpen(true)}
        onSearchOpen={() => setSearchOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-0">
        {/* Desktop sidebars */}
        {!isMobile && (
          <AgentPanel
            onAgentClick={(id) => setSelectedAgentId(id)}
            isOpen={agentPanelOpen}
            onToggle={() => setAgentPanelOpen((prev) => !prev)}
            width={agentPanelWidth}
            onWidthChange={setAgentPanelWidth}
          />
        )}
        {(!isMobile || mobileTab === "queue") && <KanbanBoard />}
        {!isMobile && (
          <LiveFeedPanel isOpen={liveFeedOpen} onToggle={() => setLiveFeedOpen(!liveFeedOpen)} />
        )}
        {isMobile && mobileTab === "agents" && (
          <AgentPanel layout="mobile" onAgentClick={(id) => setSelectedAgentId(id)} />
        )}
        {isMobile && mobileTab === "feed" && <LiveFeedPanel layout="mobile" />}
      </div>

      {isMobile && (
        <MobileTabBar
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          onSearchOpen={() => setSearchOpen(true)}
          onCalendarOpen={() => setCalendarOpen(true)}
        />
      )}

      <StandupModal open={standupOpen} onClose={() => setStandupOpen(false)} />
      <CalendarView open={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AgentDetailModal
        open={selectedAgentId !== null}
        agentId={selectedAgentId}
        onClose={() => setSelectedAgentId(null)}
      />
    </div>
  );
}
