import { MissionShell } from "@/components/dashboard/mission-shell";
import { TeamScreen } from "@/components/dashboard/team-screen";

export default function TeamPage() {
  return (
    <MissionShell route="team">
      <TeamScreen />
    </MissionShell>
  );
}
