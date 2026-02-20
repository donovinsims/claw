"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowUp, ChevronRight } from "lucide-react";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "normal";
  tags: string[];
  assignee: string;
  timeAgo?: string;
  status: string;
};

const tagColors: Record<string, string> = {
  research: "bg-[#00C7BE]/15 text-[#00C7BE]",
  seo: "bg-[#34C759]/15 text-[#34C759]",
  content: "bg-[#007AFF]/15 text-[#007AFF]",
  social: "bg-[#AF52DE]/15 text-[#AF52DE]",
  email: "bg-[#FF9500]/15 text-[#FF9500]",
  competitor: "bg-[#FF3B30]/15 text-[#FF3B30]",
  documentation: "bg-[#8C8C8C]/15 text-[#8C8C8C]",
  video: "bg-[#FF2D55]/15 text-[#FF2D55]",
  "landing-page": "bg-[#1EBEF1]/15 text-[#1EBEF1]",
  copy: "bg-[#FFCC00]/15 text-[#FFCC00]",
  blog: "bg-[#007AFF]/15 text-[#007AFF]",
  development: "bg-[#AF52DE]/15 text-[#AF52DE]",
};

const agentIcons: Record<string, string> = {
  Jarvis: "J", Shuri: "S", Fury: "F", Vision: "V",
  Loki: "L", Quill: "Q", Wanda: "W", Pepper: "P",
  Friday: "Fr", Wong: "Wo",
};

const initialTasks: Task[] = [
  { id: "t1", title: "Explore SiteGPT Dashboard & Document All Features", description: "Thoroughly explore the entire SiteGPT dashboard...", priority: "high", tags: ["research", "documentation"], assignee: "Fury", status: "inbox" },
  { id: "t2", title: "Design Expansion Revenue Mechanics", description: "Implement Rob Walling's principles for expansion revenue...", priority: "high", tags: ["research", "content"], assignee: "Loki", status: "inbox" },
  { id: "t3", title: "Product Demo Video Script", description: "Create full script for SiteGPT product demo video with...", priority: "normal", tags: ["video", "content"], assignee: "Loki", timeAgo: "1 day ago", status: "assigned" },
  { id: "t4", title: "Tweet Content — Real Stories Only", description: "Create authentic tweets based on real SiteGPT customer data", priority: "normal", tags: ["social", "content"], assignee: "Quill", timeAgo: "8 hours ago", status: "assigned" },
  { id: "t5", title: "Customer Research — Tweet Material", description: "Pull real customer data and stories from Slack for tweet...", priority: "normal", tags: ["research", "social"], assignee: "Fury", timeAgo: "8 hours ago", status: "assigned" },
  { id: "t6", title: "SiteGPT vs Zendesk AI Comparison", description: "Create a detailed brief for Zendesk AI comparison page", priority: "high", tags: ["competitor", "seo"], assignee: "Vision", timeAgo: "1 day ago", status: "in_progress" },
  { id: "t7", title: "Mission Control UI", description: "Build real-time agent command center with React + Convex", priority: "high", tags: ["development"], assignee: "Friday", status: "in_progress" },
  { id: "t8", title: "SiteGPT vs Intercom Fin Comparison", description: "Create detailed brief for Intercom Fin comparison page", priority: "normal", tags: ["competitor", "seo"], assignee: "Vision", timeAgo: "2 days ago", status: "in_progress" },
  { id: "t9", title: "Shopify Blog Landing Page", description: "Write copy for SiteGPT integration landing page — how SiteGPT help...", priority: "normal", tags: ["copy", "landing-page"], assignee: "Loki", timeAgo: "1 day ago", status: "review" },
  { id: "t10", title: "Best AI Chatbot for Shopify", description: "Write full SEO blog post: Best AI Chatbot for Shopify in 2026...", priority: "normal", tags: ["blog", "seo"], assignee: "Loki", timeAgo: "1 day ago", status: "review" },
  { id: "t11", title: "Email Marketing Strategy", description: "Email Marketing Strategy — Userlist-Inspired Lifecycle Campaigns", priority: "normal", tags: ["email"], assignee: "Pepper", status: "review" },
];

const columnDefs = [
  { id: "inbox", name: "INBOX" },
  { id: "assigned", name: "ASSIGNED" },
  { id: "in_progress", name: "IN PROGRESS" },
  { id: "review", name: "REVIEW" },
  { id: "done", name: "DONE" },
];

function TaskCard({ task, isDragging }: { task: Task; isDragging?: boolean }) {
  return (
    <div className={`rounded-[var(--radius-inner)] border border-mc-border bg-surface p-3 transition-shadow ${isDragging ? "opacity-90 shadow-lg scale-[1.02]" : ""}`}>
      <div className="flex items-start gap-2">
        {task.priority === "high" && (
          <ArrowUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mc-orange" />
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold leading-snug text-text-primary">{task.title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary line-clamp-2">{task.description}</p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1">
        {task.tags.map((tag) => (
          <span
            key={tag}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tagColors[tag] || "bg-text-secondary/10 text-text-secondary"}`}
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-elevated text-[9px] font-bold text-text-secondary">
            {agentIcons[task.assignee] || task.assignee[0]}
          </div>
          <span className="text-[11px] font-medium text-text-secondary">{task.assignee}</span>
        </div>
        {task.timeAgo && (
          <span className="text-[10px] text-text-secondary">{task.timeAgo}</span>
        )}
      </div>
    </div>
  );
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  );
}

function Column({ id, name, tasks }: { id: string; name: string; tasks: Task[] }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex w-[240px] shrink-0 flex-col rounded-[var(--radius-outer)] border border-mc-border bg-surface">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="h-1.5 w-1.5 rounded-full bg-text-secondary/40" />
        <span className="font-mono text-xs font-medium tracking-wider text-text-secondary">{name}</span>
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-elevated px-1.5 font-mono text-[10px] text-text-secondary">
          {tasks.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex-1 space-y-2 overflow-y-auto px-2 pb-2" style={{ minHeight: 80 }}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const col of columnDefs) {
      map[col.id] = tasks.filter((t) => t.status === col.id);
    }
    return map;
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTaskObj = tasks.find((t) => t.id === active.id);
    if (!activeTaskObj) return;

    // Check if over a column directly
    const overColumnId = columnDefs.find((c) => c.id === over.id)?.id;
    if (overColumnId && activeTaskObj.status !== overColumnId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === active.id ? { ...t, status: overColumnId } : t))
      );
      return;
    }

    // Check if over another task
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask && activeTaskObj.status !== overTask.status) {
      setTasks((prev) =>
        prev.map((t) => (t.id === active.id ? { ...t, status: overTask.status } : t))
      );
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-background">
      <div className="flex items-center gap-2 border-b border-mc-border px-5 py-4">
        <div className="h-2 w-2 rounded-full bg-mc-orange" />
        <span className="text-sm font-semibold tracking-wide text-text-primary">MISSION QUEUE</span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-3 overflow-x-auto p-4">
          {columnDefs.map((col) => (
            <Column key={col.id} id={col.id} name={col.name} tasks={tasksByColumn[col.id]} />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}
