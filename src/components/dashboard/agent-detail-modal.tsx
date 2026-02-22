"use client";

import { useState, useEffect, useCallback, useId, type FocusEvent } from "react";
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
const statusOptions = ["idle", "working", "error", "offline"];

function formatLastActive(lastActive?: number): string {
  if (!lastActive) return "Unknown";
  return new Date(lastActive).toLocaleString();
}

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
  const [draftStatus, setDraftStatus] = useState("idle");
  const [draftIcon, setDraftIcon] = useState("Bot");
  const [draftModel, setDraftModel] = useState("google-antigravity/gemini-3-flash");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  useEffect(() => {
    if (agent) {
      setDraftName(agent.name);
      setDraftRole(agent.role ?? "");
      setDraftLevel(agent.level ?? "");
      setDraftStatus(agent.status ?? "idle");
      setDraftIcon(agent.icon ?? "Bot");
      setDraftModel(agent.model ?? "google-antigravity/gemini-3-flash");
      setDraftPrompt(agent.prompt ?? "");
      setHasChanges(false);
      setShowUnsavedPrompt(false);
    }
  }, [agent]);

  const requestClose = useCallback(() => {
    if (isSaving) return;
    if (hasChanges) {
      setShowUnsavedPrompt(true);
      return;
    }
    onClose();
  }, [hasChanges, isSaving, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      if (showUnsavedPrompt) {
        setShowUnsavedPrompt(false);
        return;
      }
      requestClose();
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, requestClose, showUnsavedPrompt]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  const persistChanges = async () => {
    if (!agentId) return;
    setIsSaving(true);
    try {
      await upsertAgent({
        agentId,
        name: draftName,
        role: draftRole || undefined,
        level: draftLevel || undefined,
        status: draftStatus,
        icon: draftIcon || undefined,
        prompt: draftPrompt || undefined,
        model: draftModel || undefined,
      });
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    await persistChanges();
    onClose();
  };

  const handleDiscardAndClose = () => {
    setShowUnsavedPrompt(false);
    onClose();
  };

  const handleSaveAndClose = async () => {
    await persistChanges();
    setShowUnsavedPrompt(false);
    onClose();
  };

  const set = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setHasChanges(true);
  };

  const keepFieldVisible = (
    event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = event.currentTarget;
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  };

  const ActiveIcon = iconOptions.find((i) => i.name === draftIcon)?.icon ?? Bot;
  const activeName = draftName.trim() || agent?.name || agentId;
  const fieldLabelClass = "mb-1.5 block text-[11px] font-semibold tracking-[0.15em] text-text-secondary";
  const controlClass =
    "min-h-11 w-full rounded-[var(--radius-inner)] border border-mc-border/70 bg-surface px-3 py-2.5 text-sm text-text-primary shadow-[var(--shadow-elevated)] transition-[border-color,box-shadow,background-color] duration-200 ease-out placeholder:text-text-secondary/60 focus-visible:border-text-primary/35 focus-visible:shadow-[var(--shadow-panel)]";
  const buttonSubtleClass =
    "min-h-11 rounded-[var(--radius-inner)] border border-transparent bg-surface px-4 py-1.5 text-sm font-medium text-text-secondary shadow-[var(--shadow-elevated)] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out hover:border-mc-border hover:bg-surface-elevated hover:text-text-primary hover:shadow-[var(--shadow-panel)] active:scale-[0.98] md:text-xs";
  const buttonPrimaryClass =
    "min-h-11 rounded-[var(--radius-inner)] border border-transparent bg-text-primary px-4 py-1.5 text-sm font-semibold text-background shadow-[var(--shadow-elevated)] transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-200 ease-out hover:bg-text-primary/88 hover:shadow-[var(--shadow-panel)] active:scale-[0.98] disabled:opacity-40 md:text-xs";

  if (!open || !agentId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm md:items-center md:justify-center md:p-4"
      onClick={requestClose}
    >
      <div
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden rounded-t-[var(--radius-outer)] bg-surface-elevated shadow-[var(--shadow-overlay)] md:h-[min(88dvh,780px)] md:max-w-2xl md:rounded-[var(--radius-outer)] md:border md:border-mc-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescriptionId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-[calc(env(safe-area-inset-top)+6px)] md:hidden">
          <div className="h-1 w-10 rounded-full bg-text-secondary/35" />
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+128px)] pt-[calc(env(safe-area-inset-top)+18px)] md:px-6 md:pb-8 md:pt-0">
          <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between border-b border-mc-border/60 bg-surface-elevated/92 px-4 py-3 backdrop-blur-sm md:-mx-6 md:mb-5 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-inner)] border border-mc-border bg-surface text-text-secondary shadow-[var(--shadow-elevated)]">
                <ActiveIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 id={dialogTitleId} className="text-lg font-bold text-text-primary">{activeName}</h2>
                <p className="text-xs font-medium tracking-wide text-text-secondary">{agentId}</p>
                <p id={dialogDescriptionId} className="sr-only">
                  Edit this agent&apos;s metadata, model, icon, and system prompt.
                </p>
              </div>
            </div>
            <button
              onClick={requestClose}
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-inner)] border border-transparent bg-surface text-text-secondary shadow-[var(--shadow-elevated)] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out hover:border-mc-border hover:bg-surface-elevated hover:text-text-primary hover:shadow-[var(--shadow-panel)] active:scale-[0.98]"
              aria-label="Close agent details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-5 rounded-[var(--radius-inner)] border border-mc-border/80 bg-surface p-3.5 shadow-[var(--shadow-elevated)] md:p-4">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-text-secondary">AGENT CONTEXT</p>
            <div className="grid gap-2.5 text-xs text-text-secondary md:grid-cols-2">
              <p>
                <span className="text-text-primary">Current Task:</span>{" "}
                {agent?.currentTask ?? "No active task"}
              </p>
              <p>
                <span className="text-text-primary">Tasks Completed:</span>{" "}
                {agent?.tasksCompleted ?? 0}
              </p>
              <p>
                <span className="text-text-primary">Last Active:</span>{" "}
                {formatLastActive(agent?.lastActive)}
              </p>
              <p>
                <span className="text-text-primary">Runtime ID:</span> {agentId}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className={fieldLabelClass}>NAME</label>
            <input
              value={draftName}
              onChange={(e) => set(setDraftName)(e.target.value)}
              onFocus={keepFieldVisible}
              className={controlClass}
            />
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_112px_140px]">
            <div className="flex-1">
              <label className={fieldLabelClass}>ROLE</label>
              <input
                value={draftRole}
                onChange={(e) => set(setDraftRole)(e.target.value)}
                onFocus={keepFieldVisible}
                placeholder="e.g. Squad Lead"
                className={controlClass}
              />
            </div>
            <div>
              <label className={fieldLabelClass}>LEVEL</label>
              <select
                value={draftLevel}
                onChange={(e) => set(setDraftLevel)(e.target.value)}
                onFocus={keepFieldVisible}
                className={controlClass}
              >
                <option value="">None</option>
                {levelOptions.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabelClass}>STATUS</label>
              <select
                value={draftStatus}
                onChange={(e) => set(setDraftStatus)(e.target.value)}
                onFocus={keepFieldVisible}
                className={controlClass}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className={fieldLabelClass}>MODEL</label>
            <select
              value={draftModel}
              onChange={(e) => set(setDraftModel)(e.target.value)}
              onFocus={keepFieldVisible}
              className={controlClass}
            >
              {modelOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className={fieldLabelClass}>ICON</label>
            <div className="flex flex-wrap gap-2.5">
              {iconOptions.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => set(setDraftIcon)(name)}
                  aria-label={`Set icon to ${name}`}
                  aria-pressed={draftIcon === name}
                  className={`flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-inner)] border shadow-[var(--shadow-elevated)] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] ${
                    draftIcon === name
                      ? "border-mc-border bg-text-primary text-background"
                      : "border-transparent bg-surface text-text-secondary hover:border-mc-border hover:bg-surface-elevated hover:text-text-primary hover:shadow-[var(--shadow-panel)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className={fieldLabelClass}>SYSTEM PROMPT (SOUL.md)</label>
            <textarea
              value={draftPrompt}
              onChange={(e) => set(setDraftPrompt)(e.target.value)}
              onFocus={keepFieldVisible}
              rows={12}
              placeholder="Enter the agent's system prompt..."
              className="w-full rounded-[var(--radius-inner)] border border-mc-border/70 bg-surface p-3 text-sm font-mono text-text-primary shadow-[var(--shadow-elevated)] transition-[border-color,box-shadow,background-color] duration-200 ease-out placeholder:text-text-secondary/60 focus-visible:border-text-primary/35 focus-visible:shadow-[var(--shadow-panel)]"
            />
            <p className="mt-1 text-[11px] leading-relaxed text-text-secondary/80">
              Saved as the agent&apos;s persistent instruction baseline.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 grid grid-cols-2 gap-2 border-t border-mc-border/70 bg-surface-elevated/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-sm md:flex md:justify-end md:px-6 md:pb-4">
          <button
            onClick={requestClose}
            type="button"
            className={`w-full md:w-auto ${buttonSubtleClass}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            type="button"
            disabled={!hasChanges || isSaving}
            className={`w-full md:w-auto ${buttonPrimaryClass}`}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {showUnsavedPrompt && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-4">
            <div className="w-full max-w-md rounded-[var(--radius-outer)] border border-mc-border bg-surface-elevated p-4 shadow-[var(--shadow-overlay)]" role="alertdialog" aria-modal="true" aria-label="Unsaved agent changes">
              <h3 className="text-sm font-semibold text-text-primary">Save your changes?</h3>
              <p className="mt-1 text-xs text-text-secondary">
                You changed this agent. Save before closing the popup?
              </p>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => setShowUnsavedPrompt(false)}
                  type="button"
                  className={buttonSubtleClass}
                >
                  Keep Editing
                </button>
                <button
                  onClick={handleDiscardAndClose}
                  type="button"
                  className={buttonSubtleClass}
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveAndClose}
                  type="button"
                  disabled={isSaving}
                  className={buttonPrimaryClass}
                >
                  {isSaving ? "Saving..." : "Save & Close"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
