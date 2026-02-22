"use client";

import { useRef, useState, useEffect } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
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
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [standupOpen, setStandupOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [mobileFeedOpen, setMobileFeedOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("queue");
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);
  const [liveFeedOpen, setLiveFeedOpen] = useState(true);
  const agentPanelRef = useRef<ImperativePanelHandle>(null);
  const liveFeedPanelRef = useRef<ImperativePanelHandle>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const storedMobileFeedOpen = window.localStorage.getItem("mc.mobileFeedOpen");
    if (storedMobileFeedOpen !== null) {
      setMobileFeedOpen(storedMobileFeedOpen === "true");
    }
    const storedMobileTab = window.localStorage.getItem("mc.mobileTab") as MobileTab | null;
    if (storedMobileTab === "queue" || storedMobileTab === "agents" || storedMobileTab === "feed") {
      setMobileTab(storedMobileTab);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("mc.mobileFeedOpen", String(mobileFeedOpen));
  }, [mobileFeedOpen]);

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

  const toggleLiveFeedPanel = () => {
    if (liveFeedOpen) {
      liveFeedPanelRef.current?.collapse();
      return;
    }
    liveFeedPanelRef.current?.expand();
  };

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
      <div className={`flex flex-1 overflow-hidden ${isMobile ? "pb-[calc(env(safe-area-inset-bottom)+72px)]" : ""}`}>
        {!isMobile && (
          <ResizablePanelGroup direction="horizontal" className="flex-1" autoSaveId="mc.desktopLayout">
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

            <ResizablePanel defaultSize={55} minSize={28}>
              <KanbanBoard />
            </ResizablePanel>

            <ResizableHandle className="w-1 cursor-col-resize bg-mc-border/60 transition-colors duration-200 hover:bg-text-primary/20 data-[resize-handle-state=drag]:bg-text-primary/35" />

            <ResizablePanel
              ref={liveFeedPanelRef}
              defaultSize={25}
              minSize={16}
              maxSize={42}
              collapsible
              collapsedSize={6}
              onCollapse={() => setLiveFeedOpen(false)}
              onExpand={() => setLiveFeedOpen(true)}
            >
              <LiveFeedPanel isOpen={liveFeedOpen} onToggle={toggleLiveFeedPanel} />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
        {isMobile && mobileTab === "queue" && <KanbanBoard />}
        {isMobile && mobileTab === "agents" && (
          <AgentPanel layout="mobile" onAgentClick={(id) => setSelectedAgentId(id)} />
        )}
        {isMobile && mobileTab === "feed" && (
          <LiveFeedPanel
            layout="mobile"
            isOpen={mobileFeedOpen}
            onToggle={() => setMobileFeedOpen((prev) => !prev)}
          />
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
    </div>
  );
}
