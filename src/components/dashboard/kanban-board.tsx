"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
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
import { ArrowUp } from "lucide-react";

export type Task = {
  _id: Id<"tasks">;
  title: string;
  description?: string;
  priority: string;
  tags: string[];
  assignee?: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
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

const columnDefs = [
  { id: "inbox", name: "INBOX" },
  { id: "assigned", name: "ASSIGNED" },
  { id: "in_progress", name: "IN PROGRESS" },
  { id: "review", name: "REVIEW" },
  { id: "done", name: "DONE" },
];

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

type MoveTaskHandler = (taskId: Task["_id"], status: string) => void;

function TaskCard({
  task,
  isDragging,
  onMoveTask,
}: {
  task: Task;
  isDragging?: boolean;
  onMoveTask?: MoveTaskHandler;
}) {
  return (
    <div className={`rounded-[var(--radius-inner)] border border-mc-border bg-surface p-3 transition-shadow ${isDragging ? "opacity-90 shadow-lg scale-[1.02]" : ""}`}>
      <div className="flex items-start gap-2">
        {task.priority === "high" && (
          <ArrowUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mc-orange" />
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold leading-snug text-text-primary">{task.title}</h4>
          {task.description && (
            <p className="mt-1 text-xs leading-relaxed text-text-secondary line-clamp-2">{task.description}</p>
          )}
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
          {task.assignee && (
            <>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-elevated text-[9px] font-bold text-text-secondary">
                {task.assignee[0]?.toUpperCase()}
              </div>
              <span className="text-[11px] font-medium text-text-secondary">{task.assignee}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onMoveTask && (
            <label className="block md:hidden">
              <span className="sr-only">Move task to status</span>
              <select
                value={task.status}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => onMoveTask(task._id, event.target.value)}
                className="min-h-11 rounded-[var(--radius-inner)] border border-mc-border bg-surface-elevated px-2 text-[10px] font-medium text-text-secondary"
              >
                {columnDefs.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className="text-[10px] text-text-secondary">{formatTimeAgo(task.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function SortableTaskCard({ task, onMoveTask }: { task: Task; onMoveTask: MoveTaskHandler }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onMoveTask={onMoveTask} />
    </div>
  );
}

function Column({
  id,
  name,
  tasks,
  isLoading,
  onMoveTask,
}: {
  id: string;
  name: string;
  tasks: Task[];
  isLoading: boolean;
  onMoveTask: MoveTaskHandler;
}) {
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
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {isLoading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`${id}-skeleton-${index}`}
                className="h-[116px] animate-pulse rounded-[var(--radius-inner)] border border-mc-border bg-background"
              />
            ))}
          {tasks.map((task) => (
            <SortableTaskCard key={task._id} task={task} onMoveTask={onMoveTask} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const tasksByStatusQuery = useQuery(api.queries.getTasksByStatus);
  const tasksByStatus = useMemo(() => tasksByStatusQuery ?? {}, [tasksByStatusQuery]);
  const isLoading = tasksByStatusQuery === undefined;
  const moveTaskMutation = useMutation(api.mutations.moveTask);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localOverrides, setLocalOverrides] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Merge Convex data with local drag overrides
  const allTasks = useMemo(() => {
    const tasks: Task[] = [];
    for (const status of Object.keys(tasksByStatus)) {
      for (const task of tasksByStatus[status] ?? []) {
        tasks.push({
          ...task,
          status: localOverrides[task._id] ?? task.status,
        });
      }
    }
    return tasks;
  }, [tasksByStatus, localOverrides]);

  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const col of columnDefs) {
      map[col.id] = allTasks.filter((t) => t.status === col.id);
    }
    return map;
  }, [allTasks]);

  const activeTask = activeId ? allTasks.find((t) => t._id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTaskObj = allTasks.find((t) => t._id === active.id);
    if (!activeTaskObj) return;

    const overColumnId = columnDefs.find((c) => c.id === over.id)?.id;
    if (overColumnId && activeTaskObj.status !== overColumnId) {
      setLocalOverrides((prev) => ({ ...prev, [active.id as string]: overColumnId }));
      return;
    }

    const overTask = allTasks.find((t) => t._id === over.id);
    if (overTask && activeTaskObj.status !== overTask.status) {
      setLocalOverrides((prev) => ({ ...prev, [active.id as string]: overTask.status }));
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active } = event;
    const newStatus = localOverrides[active.id as string];
    setActiveId(null);
    setLocalOverrides({});

    if (newStatus) {
      await moveTaskMutation({ taskId: active.id as Id<"tasks">, status: newStatus });
    }
  }

  async function moveTask(taskId: Task["_id"], status: string) {
    setLocalOverrides((prev) => ({ ...prev, [taskId]: status }));
    await moveTaskMutation({ taskId, status });
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
            <Column
              key={col.id}
              id={col.id}
              name={col.name}
              tasks={tasksByColumn[col.id]}
              isLoading={isLoading}
              onMoveTask={moveTask}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}
