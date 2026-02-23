export type DashboardRoute = "tasks" | "memory" | "team";

export type AssigneeId = "human:forex" | "agent:codex" | string;

export type AgentVisualStyle = {
  accent: string;
  gradient: string;
};

export type MemoryDocumentKind = "activity" | "task" | "standup";

export type MemoryDocument = {
  id: string;
  kind: MemoryDocumentKind;
  title: string;
  body: string;
  rawMessage?: string;
  agentId: string;
  timestamp: number;
  tags: string[];
};

