"use client";

import { useRef, useState, useEffect } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { TopBar } from "@/components/dashboard/top-bar";
import { AgentPanel } from "@/components/dashboard/agent-panel";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { MissionBanner } from "@/components/dashboard/mission-banner";
import { OnboardingCoachmarks } from "@/components/dashboard/onboarding-coachmarks";
import { StandupModal } from "@/components/dashboard/standup-modal";
import { CalendarView } from "@/components/dashboard/calendar-view";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { AgentDetailModal } from "@/components/dashboard/agent-detail-modal";
import { MobileTabBar, type MobileTab } from "@/components/dashboard/mobile-tab-bar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [standupOpen, setStandupOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("queue");
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);
  const agentPanelRef = useRef<ImperativePanelHandle>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("mc.theme");
    const useDarkTheme = storedTheme ? storedTheme === "dark" : true;
    setIsDark(useDarkTheme);
    document.documentElement.classList.toggle("dark", useDarkTheme);
  }, []);

  useEffect(() => {
    const storedMobileTab = window.localStorage.getItem("mc.mobileTab") as MobileTab | null;
    if (storedMobileTab === "queue" || storedMobileTab === "agents") {
      setMobileTab(storedMobileTab);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("mc.mobileTab", mobileTab);
  }, [mobileTab]);

  const toggleTheme = () => {
    setIsDark((previous) => {
      const next = !previous;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("mc.theme", next ? "dark" : "light");
      return next;
    });
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

  const toggleAgentPanel = () => {
    if (agentPanelOpen) {
      agentPanelRef.current?.collapse();
      return;
    }
    agentPanelRef.current?.expand();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TopBar
        isDark={isDark}
        toggleTheme={toggleTheme}
        onStandupOpen={() => setStandupOpen(true)}
        onCalendarOpen={() => setCalendarOpen(true)}
        onSearchOpen={() => setSearchOpen(true)}
      />
      <MissionBanner />
      <div className={`flex flex-1 overflow-hidden ${isMobile ? "pb-[calc(env(safe-area-inset-bottom)+72px)]" : ""}`}>
        {!isMobile && (
          <ResizablePanelGroup direction="horizontal" className="flex-1 animate-enter" autoSaveId="mc.desktopLayout">
            <ResizablePanel
              ref={agentPanelRef}
              defaultSize={20}
              minSize={14}
              maxSize={34}
              collapsible
              collapsedSize={6}
              onCollapse={() => setAgentPanelOpen(false)}
              onExpand={() => setAgentPanelOpen(true)}
            >
              <AgentPanel
                onAgentClick={(id) => setSelectedAgentId(id)}
                isOpen={agentPanelOpen}
                onToggle={toggleAgentPanel}
              />
            </ResizablePanel>

            <ResizableHandle className="w-1 cursor-col-resize bg-mc-border/60 transition-colors duration-200 hover:bg-text-primary/20 data-[resize-handle-state=drag]:bg-text-primary/35" />

            <ResizablePanel defaultSize={75} minSize={28}>
              <KanbanBoard />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
        {isMobile && mobileTab === "queue" && <KanbanBoard />}
        {isMobile && mobileTab === "agents" && (
          <AgentPanel layout="mobile" onAgentClick={(id) => setSelectedAgentId(id)} />
        )}
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
      <OnboardingCoachmarks />
    </div>
  );
}
