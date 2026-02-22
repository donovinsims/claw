import { MissionShell } from "@/components/dashboard/mission-shell";
import { KanbanBoard } from "@/components/dashboard/kanban-board";

export default function TasksPage() {
  return (
    <MissionShell route="tasks">
      <KanbanBoard />
    </MissionShell>
  );
}
