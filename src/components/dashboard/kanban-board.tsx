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
import { Calendar } from "lucide-react";
import { toast } from "sonner";

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
  archivedAt?: number;
};

const columnDefs = [
  { id: "inbox", name: "To Do List" },
  { id: "assigned", name: "In Progress List" },
  { id: "in_progress", name: "In Review" },
  { id: "review", name: "Completed" },
];
const statusLabel: Record<string, string> = {
  inbox: "To Do List",
  assigned: "In Progress List",
  in_progress: "In Review",
  review: "Completed",
};

type MoveTaskHandler = (taskId: Task["_id"], status: string) => void;

function TaskCard({
  task,
  isDragging,
  _onMoveTask,
  _onArchiveTask,
}: {
  task: Task;
  isDragging?: boolean;
  _onMoveTask?: MoveTaskHandler;
  _onArchiveTask?: (taskId: Task["_id"]) => void;
}) {
  return (
    <div className={`group relative rounded-xl bg-white p-4 border border-transparent hover:border-gray-100 shadow-sm transition-all ${isDragging ? "opacity-90 shadow-xl scale-[1.02] border-gray-200" : ""}`}>
      {/* Top Header: Tags and Menu */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5">
          <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
            {task.priority === "high" ? "High" : "Normal"}
          </span>
          <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
            {task.tags[0] || "Website"}
          </span>
        </div>
        <button className="text-gray-300 hover:text-gray-500 transition-colors" title="Task options" aria-label="Task options">
          <svg width="16" height="4" viewBox="0 0 16 4" fill="currentColor"><circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" /><circle cx="14" cy="2" r="1.5" /></svg>
        </button>
      </div>

      {/* Body: Title and Description */}
      <div className="mb-4">
        <h4 className="text-[15px] font-bold leading-tight text-[#1A1A1A] mb-1">{task.title}</h4>
        <p className="text-[12px] leading-snug text-gray-400 line-clamp-2">
          {task.description || "Project description and details..."}
        </p>
      </div>

      {/* Middle: Date and Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>Start Date: <span className="text-gray-600">12/12/2024</span></span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-bold tracking-tight text-gray-400">Progress</span>
          <span className="text-[11px] font-bold tracking-tight text-gray-900">00%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-50 overflow-hidden">
          <div className="h-full w-[20%] bg-gray-100 progress-pattern" />
        </div>
      </div>

      {/* Footer: User Avatars and Icons */}
      <div className="flex items-center justify-between pt-1">
        <div className="avatar-group">
          <img className="avatar-item" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="user" />
          <img className="avatar-item" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="user" />
          <div className="avatar-item flex items-center justify-center bg-gray-900 border-none text-[9px] font-bold text-white">4+</div>
        </div>

        <div className="flex items-center gap-3 text-gray-300">
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            <span className="text-[12px] font-bold">2</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            <span className="text-[12px] font-bold">2</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableTaskCard({
  task,
  onMoveTask,
  onArchiveTask,
}: {
  task: Task;
  onMoveTask: MoveTaskHandler;
  onArchiveTask: (taskId: Task["_id"]) => void;
}) {
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
      <TaskCard task={task} onMoveTask={onMoveTask} onArchiveTask={onArchiveTask} />
    </div>
  );
}

function Column({
  id,
  name,
  tasks,
  isLoading,
  onMoveTask,
  onArchiveTask,
}: {
  id: string;
  name: string;
  tasks: Task[];
  isLoading: boolean;
  onMoveTask: MoveTaskHandler;
  onArchiveTask: (taskId: Task["_id"]) => void;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex w-[320px] shrink-0 flex-col rounded-xl border border-gray-100 bg-white/50 pb-4">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <h3 className="text-[17px] font-bold text-[#1A1A1A]">{name}</h3>
          <button className="text-gray-300 hover:text-gray-500" title="Column options" aria-label="Column options">
            <svg width="16" height="4" viewBox="0 0 16 4" fill="currentColor"><circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" /><circle cx="14" cy="2" r="1.5" /></svg>
          </button>
        </div>
      </div>
      <div ref={setNodeRef} className="flex-1 space-y-4 overflow-y-auto px-4" style={{ minHeight: 80 }}>
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task._id}
              task={task}
              onMoveTask={onMoveTask}
              onArchiveTask={onArchiveTask}
            />
          ))}
          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-[#1A1A1A] hover:bg-gray-50 transition-colors mt-2">
            <span>AddTask</span>
            <span className="text-lg leading-none">+</span>
          </button>
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
  const archiveTaskMutation = useMutation(api.mutations.archiveTask);
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
  const totalTasks = allTasks.length;
  const completedTasks = tasksByColumn.review?.length ?? 0;
  const inProgressTasks = tasksByColumn.in_progress?.length ?? 0;
  const completion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
      try {
        await moveTaskMutation({ taskId: active.id as Id<"tasks">, status: newStatus });
        toast.success(`Task moved to ${statusLabel[newStatus] ?? newStatus}`);
      } catch {
        toast.error("Could not move task");
      }
    }
  }

  async function moveTask(taskId: Task["_id"], status: string) {
    setLocalOverrides((prev) => ({ ...prev, [taskId]: status }));
    try {
      await moveTaskMutation({ taskId, status });
      toast.success(`Task moved to ${statusLabel[status] ?? status}`);
    } catch {
      toast.error("Could not move task");
    }
  }

  async function archiveTask(taskId: Task["_id"]) {
    try {
      await archiveTaskMutation({ taskId });
      toast.success("Done card archived");
    } catch {
      toast.error("Could not archive card");
    }
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-background">
      <div className="border-b border-white/5 bg-background px-4 py-4 md:px-5">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-mc-accent animate-pulse-dot" />
            <span className="text-sm font-semibold tracking-wide text-text-primary">MISSION QUEUE</span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="mc-chip">
              TOTAL {totalTasks}
            </span>
            <span className="mc-chip">
              IN PROGRESS {inProgressTasks}
            </span>
            <span className="mc-chip">
              COMPLETE {completion}%
            </span>
          </div>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Drag tasks between columns or use quick status controls on mobile.
        </p>
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
              onArchiveTask={archiveTask}
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
