"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  X,
  Bot,
  Shield,
  Sparkles,
  Eye,
  Pen,
  Share2,
  Palette,
  Mail,
  Code,
  BookOpen,
  Check,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import {
  AGENT_STYLE_PRESETS,
  readStoredAgentStyles,
  resolveAgentStyle,
  writeStoredAgentStyles,
} from "@/components/dashboard/agent-visuals";
import type { AgentVisualStyle } from "@/components/dashboard/types";

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

const levelOptions = [
  { value: "LEAD", label: "LEAD" },
  { value: "SPC", label: "SPC" },
  { value: "INT", label: "INT" },
];

const statusOptions = [
  { value: "idle", label: "IDLE" },
  { value: "working", label: "WORKING" },
  { value: "error", label: "ERROR" },
  { value: "offline", label: "OFFLINE" },
];

const modelOptions = [
  "google-antigravity/gemini-3-flash",
  "google-antigravity/claude-opus-4-5-thinking",
  "google-antigravity/claude-opus-4-6-thinking",
];

type AgentDetailModalProps = {
  open: boolean;
  agentId: string | null;
  onClose: () => void;
};

function formatLastActive(lastActive?: number): string {
  if (!lastActive) return "Unknown";
  return new Date(lastActive).toLocaleString();
}

export function AgentDetailModal({ open, agentId, onClose }: AgentDetailModalProps) {
  const agent = useQuery(api.queries.getAgentByAgentId, agentId ? { agentId } : "skip");
  const upsertAgent = useMutation(api.mutations.upsertAgent);

  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftLevel, setDraftLevel] = useState("");
  const [draftStatus, setDraftStatus] = useState("idle");
  const [draftIcon, setDraftIcon] = useState("Bot");
  const [draftModel, setDraftModel] = useState(modelOptions[0]);
  const [draftModelBackup, setDraftModelBackup] = useState("");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftStyle, setDraftStyle] = useState<AgentVisualStyle | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!agent || !agentId) return;

    setDraftName(agent.name);
    setDraftRole(agent.role ?? "");
    setDraftLevel(agent.level ?? "");
    setDraftStatus(agent.status ?? "idle");
    setDraftIcon(agent.icon ?? "Bot");
    setDraftModel(agent.model ?? modelOptions[0]);
    setDraftModelBackup(agent.modelBackup ?? "");
    setDraftPrompt(agent.prompt ?? "");

    const saved = readStoredAgentStyles();
    setDraftStyle(resolveAgentStyle(agentId, saved));
    setHasChanges(false);
  }, [agent, agentId]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const activeIcon = useMemo(
    () => iconOptions.find((entry) => entry.name === draftIcon)?.icon ?? Bot,
    [draftIcon],
  );

  const ActiveIcon = activeIcon;

  const heroStyle = draftStyle ?? (agentId ? resolveAgentStyle(agentId, readStoredAgentStyles()) : null);

  if (!open || !agentId || !agent) return null;

  async function onSave() {
    setSaving(true);
    try {
      await upsertAgent({
        agentId,
        name: draftName.trim() || agent.name,
        role: draftRole.trim() || undefined,
        level: draftLevel || undefined,
        status: draftStatus,
        icon: draftIcon || undefined,
        model: draftModel || undefined,
        modelBackup: draftModelBackup || undefined,
        prompt: draftPrompt.trim() || undefined,
      });

      const styles = readStoredAgentStyles();
      if (draftStyle) {
        styles[agentId] = draftStyle;
      } else {
        delete styles[agentId];
      }
      writeStoredAgentStyles(styles);

      setHasChanges(false);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function markDirty<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setHasChanges(true);
    };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-6" onClick={onClose}>
      <section
        className="relative flex h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl md:h-[88dvh] md:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Agent details"
      >
        <div className="relative border-b border-[var(--border)] p-5">
          {heroStyle && (
            <div className="pointer-events-none absolute inset-0 opacity-95" style={{ background: heroStyle.gradient }} />
          )}
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)]"
                style={{ boxShadow: heroStyle ? `inset 0 0 0 1px ${heroStyle.accent}55` : undefined }}
              >
                <ActiveIcon className="h-6 w-6 text-[var(--text-primary)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{draftName || agent.name}</h2>
                <p className="text-xs text-[var(--text-secondary)]">{agentId}</p>
                <p className="pt-1 text-xs text-[var(--text-secondary)]">Last active: {formatLastActive(agent.lastActive)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
              aria-label="Close agent details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <section className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
              Name
              <input
                value={draftName}
                onChange={(event) => markDirty(setDraftName)(event.target.value)}
                className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 text-sm text-[var(--text-primary)]"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
              Role
              <input
                value={draftRole}
                onChange={(event) => markDirty(setDraftRole)(event.target.value)}
                className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 text-sm text-[var(--text-primary)]"
                placeholder="Squad Lead"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
              Level
              <select
                value={draftLevel}
                onChange={(event) => markDirty(setDraftLevel)(event.target.value)}
                className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="">None</option>
                {levelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
              Status
              <select
                value={draftStatus}
                onChange={(event) => markDirty(setDraftStatus)(event.target.value)}
                className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 text-sm text-[var(--text-primary)]"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="md:col-span-2 flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
              Model
              <select
                value={draftModel}
                onChange={(event) => markDirty(setDraftModel)(event.target.value)}
                className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 text-sm text-[var(--text-primary)]"
              >
                {modelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="md:col-span-2 flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
              Model Backup
              <select
                value={draftModelBackup}
                onChange={(event) => markDirty(setDraftModelBackup)(event.target.value)}
                className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="">None</option>
                {modelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Icon</p>
            <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
              {iconOptions.map((entry) => {
                const Icon = entry.icon;
                const selected = draftIcon === entry.name;
                return (
                  <button
                    key={entry.name}
                    type="button"
                    onClick={() => markDirty(setDraftIcon)(entry.name)}
                    className={`inline-flex h-10 items-center justify-center rounded-lg border transition-colors ${
                      selected
                        ? "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                        : "border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
                    }`}
                    aria-label={`Use ${entry.name} icon`}
                    aria-pressed={selected}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">Agent Signature Gradient</p>
            <div className="grid gap-2 md:grid-cols-3">
              {AGENT_STYLE_PRESETS.map((preset) => {
                const selected = draftStyle?.accent === preset.accent && draftStyle?.gradient === preset.gradient;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => markDirty(setDraftStyle)(preset)}
                    className={`relative overflow-hidden rounded-xl border p-2 text-left ${
                      selected
                        ? "border-[var(--border)] bg-[var(--bg-surface)]"
                        : "border-[var(--border)] bg-[var(--bg-surface-elevated)]"
                    }`}
                  >
                    <span className="pointer-events-none absolute inset-0" style={{ background: preset.gradient }} />
                    <span className="relative flex items-center justify-between text-xs font-medium text-[var(--text-primary)]">
                      {preset.name}
                      {selected ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
              System Prompt
              <textarea
                rows={8}
                value={draftPrompt}
                onChange={(event) => markDirty(setDraftPrompt)(event.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] p-3 font-mono text-xs text-[var(--text-primary)]"
              />
            </label>
          </section>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-[var(--border)] p-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface-elevated)] px-4 text-sm text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !hasChanges}
            className="inline-flex min-h-10 items-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 text-sm font-medium text-[var(--text-primary)] disabled:opacity-45"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </footer>
      </section>
    </div>
  );
}
