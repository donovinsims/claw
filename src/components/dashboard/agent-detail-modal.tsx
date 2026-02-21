"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Bot, Shield, Sparkles, Eye, Pen, Share2, Palette, Mail, Code, BookOpen } from "lucide-react";

const iconOptions = [
  { name: "Shield", icon: Shield },
  { name: "Bot", icon: Bot },
  { name: "Sparkles", icon: Sparkles },
  { name: "Eye", icon: Eye },
  { name: "Pen", icon: Pen },
  { name: "Share2", icon: Share2 },
  { name: "Palette", icon: Palette },
  { name: "Mail", icon: Mail },
  { name: "Code", icon: Code },
  { name: "BookOpen", icon: BookOpen },
];

const modelOptions = [
  "google-antigravity/gemini-3-flash",
  "google-antigravity/claude-opus-4-5-thinking",
  "google-antigravity/claude-opus-4-6-thinking",
];

const levelOptions = ["LEAD", "SPC", "INT"];

type AgentDetailModalProps = {
  open: boolean;
  agentId: string | null;
  onClose: () => void;
};

export function AgentDetailModal({ open, agentId, onClose }: AgentDetailModalProps) {
  const agent = useQuery(
    api.queries.getAgentByAgentId,
    agentId ? { agentId } : "skip"
  );
  const upsertAgent = useMutation(api.mutations.upsertAgent);

  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftLevel, setDraftLevel] = useState("");
  const [draftIcon, setDraftIcon] = useState("Bot");
  const [draftModel, setDraftModel] = useState("google-antigravity/gemini-3-flash");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (agent) {
      setDraftName(agent.name);
      setDraftRole(agent.role ?? "");
      setDraftLevel(agent.level ?? "");
      setDraftIcon(agent.icon ?? "Bot");
      setDraftModel(agent.model ?? "google-antigravity/gemini-3-flash");
      setDraftPrompt(agent.prompt ?? "");
      setHasChanges(false);
    }
  }, [agent]);

  if (!open || !agentId) return null;

  const handleClose = () => {
    if (hasChanges && !window.confirm("You have unsaved changes. Discard?")) return;
    onClose();
  };

  const handleSave = async () => {
    if (!agentId) return;
    await upsertAgent({
      agentId,
      name: draftName,
      role: draftRole || undefined,
      level: draftLevel || undefined,
      status: agent?.status ?? "idle",
      icon: draftIcon || undefined,
      prompt: draftPrompt || undefined,
      model: draftModel || undefined,
    });
    setHasChanges(false);
    onClose();
  };

  const set = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setHasChanges(true); };

  const ActiveIcon = iconOptions.find((i) => i.name === draftIcon)?.icon ?? Bot;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto rounded-[var(--radius-outer)] border border-mc-border bg-surface-elevated p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text-secondary">
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{agent?.name ?? agentId}</h2>
              <p className="text-xs text-text-secondary">{agentId}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Identity */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-text-secondary">NAME</label>
          <input
            value={draftName}
            onChange={(e) => set(setDraftName)(e.target.value)}
            className="w-full rounded-[var(--radius-inner)] border border-mc-border bg-surface p-2.5 text-sm text-text-primary focus:outline-none focus:border-mc-cyan"
          />
        </div>

        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-text-secondary">ROLE</label>
            <input
              value={draftRole}
              onChange={(e) => set(setDraftRole)(e.target.value)}
              placeholder="e.g. Squad Lead"
              className="w-full rounded-[var(--radius-inner)] border border-mc-border bg-surface p-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-mc-cyan"
            />
          </div>
          <div className="w-28">
            <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-text-secondary">LEVEL</label>
            <select
              value={draftLevel}
              onChange={(e) => set(setDraftLevel)(e.target.value)}
              className="w-full rounded-[var(--radius-inner)] border border-mc-border bg-surface p-2.5 text-sm text-text-primary focus:outline-none focus:border-mc-cyan"
            >
              <option value="">None</option>
              {levelOptions.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Model */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-text-secondary">MODEL</label>
          <select
            value={draftModel}
            onChange={(e) => set(setDraftModel)(e.target.value)}
            className="w-full rounded-[var(--radius-inner)] border border-mc-border bg-surface p-2.5 text-sm text-text-primary focus:outline-none focus:border-mc-cyan"
          >
            {modelOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Icon */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-text-secondary">ICON</label>
          <div className="flex flex-wrap gap-2">
            {iconOptions.map(({ name, icon: Icon }) => (
              <button
                key={name}
                onClick={() => set(setDraftIcon)(name)}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  draftIcon === name
                    ? "bg-mc-cyan text-white ring-2 ring-mc-cyan ring-offset-2 ring-offset-surface-elevated"
                    : "bg-surface text-text-secondary hover:text-text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-text-secondary">SYSTEM PROMPT (SOUL.md)</label>
          <textarea
            value={draftPrompt}
            onChange={(e) => set(setDraftPrompt)(e.target.value)}
            rows={12}
            placeholder="Enter the agent's system prompt..."
            className="w-full rounded-[var(--radius-inner)] border border-mc-border bg-surface p-3 text-sm text-text-primary font-mono placeholder:text-text-secondary/50 focus:outline-none focus:border-mc-cyan"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="rounded-full bg-surface px-4 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="rounded-full bg-mc-cyan px-4 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
