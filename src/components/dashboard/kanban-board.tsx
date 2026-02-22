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
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Archive, Plus, GripVertical, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { AssigneeId } from "@/components/dashboard/types";

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

const STATUS_COLUMNS: Array<{ id: string; label: string }> = [
  { id: "inbox", label: "Inbox" },
  { id: "assigned", label: "Assigned" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const PRIORITIES = ["low", "normal", "high"] as const;

function statusLabel(status: string): string {
  const match = STATUS_COLUMNS.find((column) => column.id === status);
  return match?.label ?? status;
}

function formatUpdatedAt(timestamp: number): string {
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

function assigneeLabel(assignee: string | undefined, lookup: Map<string, string>): string {
  if (!assignee) return "Unassigned";
  if (lookup.has(assignee)) return lookup.get(assignee) ?? assignee;

  if (assignee === "human:forex") return "You (Telegram)";
  if (assignee === "agent:codex") return "Codex";

  return assignee;
}

type TaskCardProps = {
  task: Task;
  assigneeOptions: Array<{ value: string; label: string }>;
  assigneeLookup: Map<string, string>;
  onAssigneeChange: (taskId: Id<"tasks">, nextAssignee: AssigneeId | undefined) => void;
  onArchive: (taskId: Id<"tasks">) => void;
  dragHandle?: {
    setActivatorNodeRef?: (element: HTMLElement | null) => void;
    attributes?: DraggableAttributes;
    listeners?: DraggableSyntheticListeners;
  };
};

function TaskCard({
  task,
  assigneeOptions,
  assigneeLookup,
  onAssigneeChange,
  onArchive,
  dragHandle,
}: TaskCardProps) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-start gap-2">
        <button
          type="button"
          ref={(node) => dragHandle?.setActivatorNodeRef?.(node)}
          className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-grab active:cursor-grabbing"
          aria-label={`Drag task ${task.title}`}
          title="Drag task"
          {...(dragHandle?.attributes ?? {})}
          {...(dragHandle?.listeners ?? {})}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{task.title}</p>
          {task.description && <p className="pt-0.5 text-xs text-[var(--text-secondary)]">{task.description}</p>}
        </div>
        {task.status === "done" && (
          <button
            type="button"
            onClick={() => onArchive(task._id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            aria-label="Archive task"
            title="Archive task"
          >
            <Archive className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="rounded-md border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-1.5 py-0.5 font-semibold text-[var(--text-secondary)]">
          {task.priority.toUpperCase()}
        </span>
        {task.tags.slice(0, 2).map((tag) => (
          <span
            key={`${task._id}-${tag}`}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-1.5 py-0.5 text-[var(--text-secondary)]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-[11px] text-[var(--text-secondary)]" htmlFor={`assignee-${task._id}`}>
          Assignee
        </label>
        <div className="relative min-w-0 flex-1">
          <select
            id={`assignee-${task._id}`}
            value={task.assignee ?? ""}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onChange={(event) => {
              const value = event.target.value;
              onAssigneeChange(task._id, value.length > 0 ? value : undefined);
            }}
            className="min-h-9 w-full min-w-0 appearance-none rounded-lg border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-2 pr-8 text-xs text-[var(--text-primary)]"
          >
            {assigneeOptions.map((option) => (
              <option key={`${task._id}-${option.value || "none"}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]" />
        </div>
      </div>

      <div className="pt-2 text-[11px] text-[var(--text-secondary)]">
        {assigneeLabel(task.assignee, assigneeLookup)} · updated {formatUpdatedAt(task.updatedAt)}
      </div>
    </article>
  );
}

type SortableTaskCardProps = TaskCardProps & {
  task: Task;
};

function SortableTaskCard(props: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task._id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-60" : "opacity-100"}
    >
      <TaskCard
        {...props}
        dragHandle={{
          setActivatorNodeRef,
          attributes,
          listeners,
        }}
      />
    </div>
  );
}

type ColumnProps = {
  id: string;
  label: string;
  tasks: Task[];
  assigneeOptions: Array<{ value: string; label: string }>;
  assigneeLookup: Map<string, string>;
  onAssigneeChange: (taskId: Id<"tasks">, nextAssignee: AssigneeId | undefined) => void;
  onArchive: (taskId: Id<"tasks">) => void;
};

function Column({
  id,
  label,
  tasks,
  assigneeOptions,
  assigneeLookup,
  onAssigneeChange,
  onArchive,
}: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <section className="flex min-w-[280px] max-w-[320px] flex-1 flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)]">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{label}</h3>
        <span className="text-xs text-[var(--text-secondary)]">{tasks.length}</span>
      </header>
      <div ref={setNodeRef} className="flex min-h-[140px] flex-1 flex-col gap-2 overflow-y-auto p-2">
        <SortableContext items={tasks.map((task) => task._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task._id}
              task={task}
              assigneeOptions={assigneeOptions}
              assigneeLookup={assigneeLookup}
              onAssigneeChange={onAssigneeChange}
              onArchive={onArchive}
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

  const createTaskMutation = useMutation(api.mutations.createTask);
  const moveTaskMutation = useMutation(api.mutations.moveTask);
  const updateTaskStatusMutation = useMutation(api.mutations.updateTaskStatus);
  const archiveTaskMutation = useMutation(api.mutations.archiveTask);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("normal");
  const [assignee, setAssignee] = useState<AssigneeId | "">("");
  const [tagsInput, setTagsInput] = useState("manual");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, string>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const assigneeOptions = useMemo(() => {
    const agents = agentsQuery ?? [];
    const options = [
      { value: "", label: "Unassigned" },
      { value: "human:forex", label: "You (Telegram)" },
      { value: "agent:codex", label: "Codex" },
    ];

    const seen = new Set(options.map((option) => option.value));
    for (const agent of agents) {
      if (seen.has(agent.agentId)) continue;
      options.push({ value: agent.agentId, label: `${agent.name} (${agent.agentId})` });
      seen.add(agent.agentId);
    }

    return options;
  }, [agentsQuery]);

  const assigneeLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of assigneeOptions) {
      if (!option.value) continue;
      map.set(option.value, option.label);
    }
    return map;
  }, [assigneeOptions]);

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
    const byColumn: Record<string, Task[]> = Object.fromEntries(
      STATUS_COLUMNS.map((column) => [column.id, [] as Task[]]),
    );

    for (const task of allTasks) {
      if (!byColumn[task.status]) {
        byColumn[task.status] = [];
      }
      byColumn[task.status].push(task);
    }

    return byColumn;
  }, [allTasks]);

  const activeTask = activeTaskId ? allTasks.find((task) => task._id === activeTaskId) : null;

  const totalTasks = allTasks.length;
  const inProgressCount = (tasksByColumn.assigned?.length ?? 0) + (tasksByColumn.in_progress?.length ?? 0);
  const doneCount = tasksByColumn.done?.length ?? 0;

  async function onCreateTask() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Task title is required");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    try {
      await createTaskMutation({
        title: trimmedTitle,
        description: description.trim() || undefined,
        priority,
        tags: tags.length > 0 ? tags : ["manual"],
        assignee: assignee || undefined,
        status: assignee ? "assigned" : "inbox",
      });

      setTitle("");
      setDescription("");
      setPriority("normal");
      setAssignee("");
      setTagsInput("manual");
      setCreateOpen(false);
      toast.success("Task created");
    } catch {
      toast.error("Could not create task");
    }
  }

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

  async function onAssigneeChange(taskId: Id<"tasks">, nextAssignee: AssigneeId | undefined) {
    const task = allTasks.find((entry) => entry._id === taskId);
    if (!task) return;

    const nextStatus =
      task.status === "inbox" && nextAssignee
        ? "assigned"
        : task.status === "assigned" && !nextAssignee
          ? "inbox"
          : task.status;

    try {
      await updateTaskStatusMutation({
        taskId,
        status: nextStatus,
        assignee: nextAssignee,
      });
      toast.success("Assignee updated");
    } catch {
      toast.error("Could not update assignee");
    }
  }

  async function onArchive(taskId: Id<"tasks">) {
    try {
      await archiveTaskMutation({ taskId });
      toast.success("Task archived");
    } catch {
      toast.error("Could not archive task");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 md:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Mission Queue</span>
          <div className="ml-auto flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-md border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-2 py-1 text-[var(--text-secondary)]">
              Total {totalTasks}
            </span>
            <span className="rounded-md border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-2 py-1 text-[var(--text-secondary)]">
              In Progress {inProgressCount}
            </span>
            <span className="rounded-md border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-2 py-1 text-[var(--text-secondary)]">
              Done {doneCount}
            </span>
          </div>
        </div>

        <div className="mt-3">
          {!createOpen ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)]"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </button>
          ) : (
            <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-3 md:grid-cols-[2fr_2fr_1fr_1.2fr_1.5fr_auto]">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Task title"
                className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70"
              />
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description"
                className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70"
              />
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as (typeof PRIORITIES)[number])}
                className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
              >
                {PRIORITIES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry.toUpperCase()}
                  </option>
                ))}
              </select>
              <select
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]"
              >
                {assigneeOptions.map((option) => (
                  <option key={`create-${option.value || "none"}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="tags,comma,separated"
                className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70"
              />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onCreateTask}
                  className="inline-flex min-h-10 items-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)]"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="inline-flex min-h-10 items-center rounded-lg border border-transparent px-2 text-xs text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="min-h-0 flex-1 overflow-x-auto px-4 py-4 md:px-5">
          <div className="flex min-h-full gap-3">
            {STATUS_COLUMNS.map((column) => (
              <Column
                key={column.id}
                id={column.id}
                label={column.label}
                tasks={tasksByColumn[column.id] ?? []}
                assigneeOptions={assigneeOptions}
                assigneeLookup={assigneeLookup}
                onAssigneeChange={onAssigneeChange}
                onArchive={onArchive}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-[300px] opacity-90 shadow-xl">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-[var(--text-secondary)]" />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{activeTask.title}</p>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">Dragging to {statusLabel(optimisticStatus[activeTask._id] ?? activeTask.status)}</p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
