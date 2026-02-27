"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type Task = {
  _id: Id<"tasks">;
  title: string;
  description?: string;
  priority: string;
  tags: string[];
  assignee?: string;
  status: string;
  createdAt: number;
  updatedAt: number;
};

const STATUS_COLUMNS: Array<{ id: string; label: string; color: string }> = [
  { id: "inbox", label: "Inbox", color: "#6B7280" },
  { id: "assigned", label: "Assigned", color: "#94A3B8" },
  { id: "in_progress", label: "In Progress", color: "#F59E0B" },
  { id: "review", label: "Review", color: "#A855F7" },
  { id: "done", label: "Done", color: "#10B981" },
];

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function statusLabel(status: string): string {
  const match = STATUS_COLUMNS.find((column) => column.id === status);
  return match?.label ?? status;
}

function formatDateRange(task: Task): string {
  const startAt = new Date(task.createdAt);
  const endAt = new Date(Math.max(task.updatedAt, task.createdAt));
  return `${shortDateFormatter.format(startAt)} - ${dateFormatter.format(endAt)}`;
}

function formatTimeAgo(timestamp: number): string {
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function assigneeLabel(assignee: string | undefined, lookup: Map<string, string>): string {
  if (!assignee) return "Unassigned";
  if (lookup.has(assignee)) return lookup.get(assignee) ?? assignee;

  if (assignee === "human:forex") return "You";
  if (assignee === "agent:codex") return "Codex";

  return assignee;
}

function initialsFromLabel(label: string): string {
  const parts = label
    .replace(/[()]/g, "")
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function avatarTone(label: string): string {
  const palette = ["#DBEAFE", "#DCFCE7", "#FEE2E2", "#FEF3C7", "#E9D5FF", "#E2E8F0"];
  const hash = Array.from(label).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

type TaskCardProps = {
  task: Task;
  assigneeName: string;
};

function TaskCard({ task, assigneeName }: TaskCardProps) {
  const initials = initialsFromLabel(assigneeName);

  return (
    <article className="rounded-[8px] border border-[#e5e5e5] bg-white p-[13px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)]">
      <div className="flex items-start justify-between gap-2">
        <p className="max-w-[85%] text-[14px] font-medium leading-5 text-[#0a0a0a]">{task.title}</p>
        <span
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-[#0a0a0a]"
          style={{ backgroundColor: avatarTone(assigneeName) }}
          aria-label={assigneeName}
          title={assigneeName}
        >
          {initials}
        </span>
      </div>

      <p className="mt-4 text-[12px] leading-4 text-[#737373]">{formatDateRange(task)}</p>
      <p className="mt-1 text-[10px] leading-none text-[#4f5661]">
        {assigneeName} · {formatTimeAgo(task.updatedAt)}
      </p>
    </article>
  );
}

type SortableTaskCardProps = TaskCardProps & {
  task: Task;
};

function SortableTaskCard(props: SortableTaskCardProps) {
  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({
    id: props.task._id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-45" : "opacity-100"}
      {...attributes}
      {...listeners}
    >
      <TaskCard {...props} />
    </div>
  );
}

type ColumnProps = {
  id: string;
  label: string;
  color: string;
  tasks: Task[];
  assigneeLookup: Map<string, string>;
};

function Column({ id, label, color, tasks, assigneeLookup }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <section className="flex min-w-[218px] flex-col overflow-hidden rounded-[8px] border border-[#e5e5e5] bg-[#f5f5f5] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <header className="flex h-[37px] items-center gap-2 border-b border-[#e5e5e5] px-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-[14px] font-semibold leading-5 text-[rgba(10,10,10,0.9)]">{label}</h3>
        <span className="ml-auto text-[12px] font-semibold leading-4 text-[#4f5661]">{tasks.length}</span>
      </header>

      <div ref={setNodeRef} className="flex min-h-[140px] flex-1 flex-col gap-2 overflow-y-auto p-2">
        <SortableContext items={tasks.map((task) => task._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task._id}
              task={task}
              assigneeName={assigneeLabel(task.assignee, assigneeLookup)}
            />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}

export function KanbanBoard() {
  const tasksByStatusQuery = useQuery(api.queries.getTasksByStatus);
  const agentsQuery = useQuery(api.queries.getAgents);

  const moveTaskMutation = useMutation(api.mutations.moveTask);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, string>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const assigneeLookup = useMemo(() => {
    const lookup = new Map<string, string>([
      ["human:forex", "You"],
      ["agent:codex", "Codex"],
    ]);

    for (const agent of agentsQuery ?? []) {
      lookup.set(agent.agentId, agent.name || agent.agentId);
    }

    return lookup;
  }, [agentsQuery]);

  const allTasks = useMemo(() => {
    const grouped = tasksByStatusQuery ?? {};
    const rows: Task[] = [];

    for (const [status, tasks] of Object.entries(grouped)) {
      for (const task of tasks ?? []) {
        rows.push({
          ...task,
          status: optimisticStatus[task._id] ?? status,
        });
      }
    }

    return rows;
  }, [tasksByStatusQuery, optimisticStatus]);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = Object.fromEntries(
      STATUS_COLUMNS.map((column) => [column.id, [] as Task[]]),
    );

    for (const task of allTasks) {
      if (!grouped[task.status]) grouped[task.status] = [];
      grouped[task.status].push(task);
    }

    return grouped;
  }, [allTasks]);

  const activeTask = activeTaskId ? allTasks.find((task) => task._id === activeTaskId) : null;

  const totalTasks = allTasks.length;
  const inProgressCount = (tasksByColumn.assigned?.length ?? 0) + (tasksByColumn.in_progress?.length ?? 0);
  const doneCount = tasksByColumn.done?.length ?? 0;

  function onDragStart(event: DragStartEvent) {
    setActiveTaskId(event.active.id as string);
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTaskRow = allTasks.find((task) => task._id === active.id);
    if (!activeTaskRow) return;

    const targetColumn = STATUS_COLUMNS.find((column) => column.id === over.id)?.id;
    if (targetColumn && activeTaskRow.status !== targetColumn) {
      setOptimisticStatus((previous) => ({ ...previous, [active.id as string]: targetColumn }));
      return;
    }

    const targetTask = allTasks.find((task) => task._id === over.id);
    if (targetTask && targetTask.status !== activeTaskRow.status) {
      setOptimisticStatus((previous) => ({ ...previous, [active.id as string]: targetTask.status }));
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active } = event;
    const nextStatus = optimisticStatus[active.id as string];

    setActiveTaskId(null);
    setOptimisticStatus({});

    if (!nextStatus) return;

    try {
      await moveTaskMutation({ taskId: active.id as Id<"tasks">, status: nextStatus });
      toast.success(`Task moved to ${statusLabel(nextStatus)}`);
    } catch {
      toast.error("Could not move task");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-[#f8faff] to-[#f6f8fb] px-4 py-4 md:px-4">
      <section className="h-[55px] rounded-[14px] border border-[#d7dbe2] bg-white shadow-[0px_1px_2px_0px_rgba(15,23,42,0.08)]">
        <div className="flex h-full items-center justify-between px-3">
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-none text-[#171717]">Mission Queue</p>
            <p className="mt-1 truncate text-[10px] leading-none text-[#4f5661]">
              Kanban-first orchestration with context-aware assignment
            </p>
          </div>
          <div className="ml-3 flex shrink-0 flex-wrap items-center gap-2">
            <span className="rounded-[999px] border border-[#d7dbe2] bg-[#f0f2f4] px-[11px] py-[7px] text-[11px] font-semibold leading-none text-[#4f5661]">
              Total {totalTasks}
            </span>
            <span className="rounded-[999px] border border-[#d7dbe2] bg-[#f0f2f4] px-[11px] py-[7px] text-[11px] font-semibold leading-none text-[#4f5661]">
              In Progress {inProgressCount}
            </span>
            <span className="rounded-[999px] border border-[#d7dbe2] bg-[#f0f2f4] px-[11px] py-[7px] text-[11px] font-semibold leading-none text-[#4f5661]">
              Done {doneCount}
            </span>
          </div>
        </div>
      </section>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="mt-3 min-h-0 flex-1 overflow-x-auto">
          <div className="grid min-h-full min-w-[1120px] grid-cols-5 gap-[10px] pb-1">
            {STATUS_COLUMNS.map((column) => (
              <Column
                key={column.id}
                id={column.id}
                label={column.label}
                color={column.color}
                tasks={tasksByColumn[column.id] ?? []}
                assigneeLookup={assigneeLookup}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-[232px] opacity-90">
              <TaskCard
                task={activeTask}
                assigneeName={assigneeLabel(activeTask.assignee, assigneeLookup)}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
