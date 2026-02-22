import { MissionShell } from "@/components/dashboard/mission-shell";
import { MemoryScreen } from "@/components/dashboard/memory-screen";

export default function MemoryPage() {
  return (
    <MissionShell route="memory">
      <MemoryScreen />
    </MissionShell>
  );
}
