"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type ScheduledBlock = {
  id: string;
  title: string;
  agent: string;
  agentColor: string;
  day: number; // 0=Mon, 6=Sun
  startHour: number;
  duration: number; // hours
};

const agentColors: Record<string, string> = {
  Jarvis: "#FF9500",
  Shuri: "#AF52DE",
  Fury: "#FF3B30",
  Vision: "#34C759",
  Loki: "#007AFF",
  Quill: "#1EBEF1",
  Wanda: "#FF2D55",
  Pepper: "#FF9500",
  Friday: "#AF52DE",
  Wong: "#00C7BE",
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function generateMockBlocks(): ScheduledBlock[] {
  return [
    { id: "s1", title: "System Heartbeat Check", agent: "Friday", agentColor: agentColors.Friday, day: 0, startHour: 6, duration: 0.5 },
    { id: "s2", title: "SEO Research Block", agent: "Vision", agentColor: agentColors.Vision, day: 0, startHour: 9, duration: 3 },
    { id: "s3", title: "Content Publishing Window", agent: "Loki", agentColor: agentColors.Loki, day: 0, startHour: 14, duration: 2 },
    { id: "s4", title: "Social Media Scheduling", agent: "Quill", agentColor: agentColors.Quill, day: 1, startHour: 8, duration: 2 },
    { id: "s5", title: "Customer Research", agent: "Fury", agentColor: agentColors.Fury, day: 1, startHour: 10, duration: 3 },
    { id: "s6", title: "Review Session", agent: "Jarvis", agentColor: agentColors.Jarvis, day: 1, startHour: 15, duration: 1.5 },
    { id: "s7", title: "Design Sprint", agent: "Wanda", agentColor: agentColors.Wanda, day: 2, startHour: 9, duration: 4 },
    { id: "s8", title: "Email Campaign Draft", agent: "Pepper", agentColor: agentColors.Pepper, day: 2, startHour: 14, duration: 2 },
    { id: "s9", title: "Documentation Update", agent: "Wong", agentColor: agentColors.Wong, day: 3, startHour: 8, duration: 3 },
    { id: "s10", title: "Product Analysis", agent: "Shuri", agentColor: agentColors.Shuri, day: 3, startHour: 13, duration: 2 },
    { id: "s11", title: "System Heartbeat Check", agent: "Friday", agentColor: agentColors.Friday, day: 3, startHour: 6, duration: 0.5 },
    { id: "s12", title: "Sprint Review", agent: "Jarvis", agentColor: agentColors.Jarvis, day: 4, startHour: 10, duration: 2 },
    { id: "s13", title: "Content Publishing Window", agent: "Loki", agentColor: agentColors.Loki, day: 4, startHour: 14, duration: 2 },
    { id: "s14", title: "SEO Audit", agent: "Vision", agentColor: agentColors.Vision, day: 5, startHour: 9, duration: 3 },
    { id: "s15", title: "Social Engagement", agent: "Quill", agentColor: agentColors.Quill, day: 6, startHour: 10, duration: 2 },
  ];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_HOUR = 6;
const END_HOUR = 24;
const HOUR_HEIGHT = 48;

export function CalendarView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [now, setNow] = useState(new Date());
  const blocks = useMemo(() => generateMockBlocks(), []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!open) return null;

  const today = new Date();
  const baseWeekStart = getWeekStart(today);
  const weekStart = new Date(baseWeekStart);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);

  const weekDates = DAYS.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const currentDay = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const nowLineTop = (currentHour - START_HOUR) * HOUR_HEIGHT;
  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" onClick={onClose}>
      <div className="flex items-center justify-between border-b border-mc-border bg-surface px-6 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold text-text-primary">CALENDAR</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setWeekOffset(weekOffset - 1)} className="rounded-full p-1 text-text-secondary hover:text-text-primary">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-medium text-text-secondary"
            >
              Today
            </button>
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="rounded-full p-1 text-text-secondary hover:text-text-primary">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="text-xs text-text-secondary">
            {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Time axis */}
        <div className="w-16 shrink-0 border-r border-mc-border pt-10">
          {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
            <div key={i} className="relative" style={{ height: HOUR_HEIGHT }}>
              <span className="absolute -top-2 right-3 font-mono text-[10px] text-text-secondary">
                {(START_HOUR + i).toString().padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex flex-1 overflow-auto">
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="relative flex-1 border-r border-mc-divider last:border-r-0">
              {/* Day header */}
              <div className={`sticky top-0 z-10 flex flex-col items-center border-b border-mc-border bg-surface py-2 ${isCurrentWeek && dayIdx === currentDay ? "bg-mc-cyan/10" : ""}`}>
                <span className="font-mono text-[10px] text-text-secondary">{day.toUpperCase()}</span>
                <span className={`text-sm font-bold ${isCurrentWeek && dayIdx === currentDay ? "text-mc-cyan" : "text-text-primary"}`}>
                  {weekDates[dayIdx].getDate()}
                </span>
              </div>

              {/* Hour lines */}
              <div className="relative">
                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                  <div key={i} className="border-b border-mc-divider" style={{ height: HOUR_HEIGHT }} />
                ))}

                {/* Now line */}
                {isCurrentWeek && dayIdx === currentDay && currentHour >= START_HOUR && currentHour < END_HOUR && (
                  <div className="absolute left-0 right-0 z-20" style={{ top: nowLineTop }}>
                    <div className="h-0.5 bg-mc-red" />
                    <div className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-mc-red" />
                  </div>
                )}

                {/* Task blocks */}
                {blocks
                  .filter((b) => b.day === dayIdx)
                  .map((block) => (
                    <div
                      key={block.id}
                      className="absolute left-1 right-1 rounded-lg border px-2 py-1 text-white"
                      style={{
                        top: (block.startHour - START_HOUR) * HOUR_HEIGHT,
                        height: block.duration * HOUR_HEIGHT - 2,
                        backgroundColor: block.agentColor + "33",
                        borderColor: block.agentColor + "55",
                      }}
                    >
                      <div className="truncate text-[10px] font-semibold" style={{ color: block.agentColor }}>{block.title}</div>
                      <div className="truncate text-[9px] opacity-70" style={{ color: block.agentColor }}>{block.agent} &middot; {block.duration}h</div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
