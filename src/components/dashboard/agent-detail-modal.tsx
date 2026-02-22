"use client";

import { useState, useEffect, useCallback, useId, type FocusEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
  ChevronDown,
  Check,
} from "lucide-react";

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

const levelOptions = [
  { value: "LEAD", label: "LEAD - Leadership" },
  { value: "SPC", label: "SPC - Specialist" },
  { value: "INT", label: "INT - Intermediate" },
];
const statusOptions = [
  { value: "idle", label: "IDLE" },
  { value: "working", label: "WORKING" },
  { value: "error", label: "ERROR" },
  { value: "offline", label: "OFFLINE" },
];

const AGENT_STYLE_KEY = "mc.agentStyles.v4";

type AgentStyle = {
  accent: string;
  gradient: string;
};

const stylePresets: Array<AgentStyle & { id: string; name: string }> = [
  {
    id: "graphite",
    name: "Graphite",
    accent: "#4A4A4A",
    gradient:
      "linear-gradient(135deg, rgba(74, 74, 74, 0.28) 0%, rgba(74, 74, 74, 0.14) 52%, rgba(255, 255, 255, 0) 86%)",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    accent: "#2F2F2F",
    gradient:
      "linear-gradient(135deg, rgba(47, 47, 47, 0.28) 0%, rgba(47, 47, 47, 0.14) 52%, rgba(255, 255, 255, 0) 86%)",
  },
  {
    id: "silver",
    name: "Silver",
    accent: "#6A6A6A",
    gradient:
      "linear-gradient(135deg, rgba(106, 106, 106, 0.28) 0%, rgba(106, 106, 106, 0.14) 52%, rgba(255, 255, 255, 0) 86%)",
  },
  {
    id: "charcoal",
    name: "Charcoal",
    accent: "#404040",
    gradient:
      "linear-gradient(135deg, rgba(64, 64, 64, 0.3) 0%, rgba(64, 64, 64, 0.14) 52%, rgba(255, 255, 255, 0) 86%)",
  },
  {
    id: "smoke",
    name: "Smoke",
    accent: "#7B7B7B",
    gradient:
      "linear-gradient(135deg, rgba(123, 123, 123, 0.3) 0%, rgba(123, 123, 123, 0.14) 52%, rgba(255, 255, 255, 0) 86%)",
  },
];

function formatLastActive(lastActive?: number): string {
  if (!lastActive) return "Unknown";
  return new Date(lastActive).toLocaleString();
}

type AgentDetailModalProps = {
  open: boolean;
  agentId: string | null;
  onClose: () => void;
};

function InfoHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex items-center">
      <span
        tabIndex={0}
        aria-label={text}
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-[10px] font-bold leading-none text-gray-400 transition-all hover:border-gray-200 hover:text-gray-600"
      >
        <span aria-hidden="true" className="translate-y-[-0.5px]">i</span>
      </span>
      <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-20 w-64 -translate-x-1/2 rounded-lg border border-gray-100 bg-white p-2.5 text-[11px] leading-relaxed text-gray-500 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}

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
  const [draftAgentStyle, setDraftAgentStyle] = useState<AgentStyle | null>(null);
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

      // Load specific style for this agent from local storage
      const rawStyle = window.localStorage.getItem(AGENT_STYLE_KEY);
      if (rawStyle) {
        try {
          const parsed = JSON.parse(rawStyle) as Record<string, AgentStyle>;
          if (agentId && parsed[agentId]) {
            setDraftAgentStyle(parsed[agentId]);
          } else {
            setDraftAgentStyle(null);
          }
        } catch {
          setDraftAgentStyle(null);
        }
      } else {
        setDraftAgentStyle(null);
      }

      setHasChanges(false);
      setShowUnsavedPrompt(false);
    }
  }, [agent, agentId]);

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

      // Save agent style to local storage alongside the convex mutation
      const rawStyle = window.localStorage.getItem(AGENT_STYLE_KEY);
      let parsedStyle: Record<string, AgentStyle> = {};
      if (rawStyle) {
        try {
          parsedStyle = JSON.parse(rawStyle) as Record<string, AgentStyle>;
        } catch {
          // ignore parsing error, start fresh
        }
      }

      if (draftAgentStyle) {
        parsedStyle[agentId] = draftAgentStyle;
      } else {
        delete parsedStyle[agentId];
      }

      window.localStorage.setItem(AGENT_STYLE_KEY, JSON.stringify(parsedStyle));
      // Dispatch an event so the agent panel updates immediately
      window.dispatchEvent(new Event("agent-style-updated"));

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
  const fieldLabelClass = "mb-1.5 block text-[11px] font-bold tracking-tight text-gray-400";
  const labelRowClass = "mb-1.5 flex min-h-5 items-center gap-1.5";
  const controlClass =
    "w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-[14px] font-medium text-[#1A1A1A] placeholder:text-gray-300 transition-all focus:border-gray-200 focus:bg-white focus:outline-none focus:ring-0";
  const selectClass = `${controlClass} appearance-none pr-10`;
  const buttonSubtleClass = "rounded-xl border border-gray-100 bg-white px-6 py-3 text-[14px] font-bold text-[#1A1A1A] hover:bg-gray-50 transition-colors";
  const buttonPrimaryClass = "rounded-xl bg-gray-900 px-6 py-3 text-[14px] font-bold text-white hover:bg-black transition-colors disabled:opacity-40";

  if (!open || !agentId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/10 backdrop-blur-sm md:items-center md:justify-center md:p-4"
      onClick={requestClose}
    >
      <div
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:h-[min(88dvh,820px)] md:max-w-2xl md:rounded-3xl border border-gray-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescriptionId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-[calc(env(safe-area-inset-top)+8px)] md:hidden">
          <div className="h-1.5 w-12 rounded-full bg-gray-100" />
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+128px)] pt-[calc(env(safe-area-inset-top)+20px)] md:px-8 md:pb-10 md:pt-0">
          <div className="sticky top-0 z-10 -mx-4 mb-6 flex items-center justify-between border-b border-gray-50 bg-white/95 px-4 py-6 backdrop-blur-sm md:-mx-8 md:mb-8 md:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-gray-400">
                <ActiveIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 id={dialogTitleId} className="text-xl font-bold tracking-tight text-[#1A1A1A]">{activeName}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] font-bold tracking-tight text-gray-400 uppercase">{agentId}</p>
                  <span className="h-1 w-1 rounded-full bg-gray-200" />
                  <span className="text-[11px] font-bold text-green-500 uppercase tracking-tight">Active Connection</span>
                </div>
                <p id={dialogDescriptionId} className="sr-only">
                  Edit this agent&apos;s metadata, model, icon, and system prompt.
                </p>
              </div>
            </div>
            <button
              onClick={requestClose}
              type="button"
              className="text-gray-300 hover:text-gray-500 transition-colors"
              aria-label="Close agent details"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
            <p className="mb-4 text-[11px] font-bold tracking-tight text-gray-400 uppercase">Agent Context</p>
            <div className="grid gap-4 text-[13px] md:grid-cols-2">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-bold text-[#1A1A1A]/60">Current Task</span>
                <span className="font-bold text-[#1A1A1A]">{agent?.currentTask ?? "No active task"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-bold text-[#1A1A1A]/60">Tasks Completed</span>
                <span className="font-bold text-[#1A1A1A]">{agent?.tasksCompleted ?? 0}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-bold text-[#1A1A1A]/60">Last Active</span>
                <span className="font-bold text-[#1A1A1A]">{formatLastActive(agent?.lastActive)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-bold text-[#1A1A1A]/60">Runtime ID</span>
                <span className="font-bold text-[#1A1A1A] truncate max-w-[120px]">{agentId}</span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="agent-name" className={fieldLabelClass}>NAME</label>
            <input
              id="agent-name"
              value={draftName}
              onChange={(e) => set(setDraftName)(e.target.value)}
              onFocus={keepFieldVisible}
              className={controlClass}
            />
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(190px,220px)_minmax(170px,190px)]">
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
              <div className={labelRowClass}>
                <label htmlFor="agent-level" className={`${fieldLabelClass} mb-0`}>LEVEL</label>
                <InfoHint text="Level shows seniority and scope. Pick how advanced and ownership-heavy this agent's work should be." />
              </div>
              <div className="relative">
                <select
                  id="agent-level"
                  value={draftLevel}
                  onChange={(e) => set(setDraftLevel)(e.target.value)}
                  onFocus={keepFieldVisible}
                  className={selectClass}
                  aria-label="Select Agent Level"
                >
                  <option value="">None</option>
                  {levelOptions.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/70" />
              </div>
            </div>
            <div>
              <div className={labelRowClass}>
                <label htmlFor="agent-status" className={`${fieldLabelClass} mb-0`}>STATUS</label>
                <InfoHint text="Status shows availability: IDLE means free, WORKING means busy, ERROR means blocked, OFFLINE means paused." />
              </div>
              <div className="relative">
                <select
                  id="agent-status"
                  value={draftStatus}
                  onChange={(e) => set(setDraftStatus)(e.target.value)}
                  onFocus={keepFieldVisible}
                  className={selectClass}
                  aria-label="Select Agent Status"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/70" />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className={labelRowClass}>
              <label htmlFor="agent-model" className={`${fieldLabelClass} mb-0`}>MODEL</label>
              <InfoHint text="Model is the AI engine. Stronger models can handle harder work, but may run slower or cost more." />
            </div>
            <div className="relative">
              <select
                id="agent-model"
                value={draftModel}
                onChange={(e) => set(setDraftModel)(e.target.value)}
                onFocus={keepFieldVisible}
                className={selectClass}
                aria-label="Select AI Model"
              >
                {modelOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary/70" />
            </div>
          </div>

          <div className="mb-6">
            <label className={fieldLabelClass}>ICON</label>
            <div className="grid grid-cols-5 gap-3 md:grid-cols-10">
              {iconOptions.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => set(setDraftIcon)(name)}
                  aria-label={`Set icon to ${name}`}
                  aria-pressed={draftIcon === name ? "true" : "false"}
                  title={name}
                  className={`flex h-11 items-center justify-center rounded-xl border transition-all ${draftIcon === name
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className={labelRowClass}>
              <label className={`${fieldLabelClass} mb-0`}>AGENT STYLE & THEME</label>
              <InfoHint text="Customize the visual appearance of this agent card and modal." />
            </div>
            <div className="rounded-[var(--radius-inner)] border border-mc-border/60 bg-background/50 p-3">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
                {stylePresets.map((preset) => {
                  const isSelected =
                    draftAgentStyle?.accent === preset.accent &&
                    draftAgentStyle?.gradient === preset.gradient;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => set(setDraftAgentStyle)(preset)}
                      className={`interactive-lift relative flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] border text-[11px] font-medium transition-all ${isSelected
                        ? "border-mc-border text-text-primary shadow-[var(--shadow-panel)]"
                        : "border-mc-border/40 text-text-secondary hover:border-mc-border hover:shadow-[var(--shadow-elevated)]"
                        }`}
                      aria-label={`Use ${preset.name} theme`}
                    >
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{ background: preset.gradient }}
                      />
                      <span className="relative flex items-center">
                        {isSelected ? <Check className="mr-1.5 h-3.5 w-3.5" /> : null}
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => set(setDraftAgentStyle)(null)}
                  disabled={!draftAgentStyle}
                  className="interactive-lift text-[11px] font-medium text-text-secondary hover:text-text-primary disabled:opacity-50"
                >
                  Clear Style
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className={labelRowClass}>
              <label htmlFor="agent-prompt" className={fieldLabelClass}>SYSTEM PROMPT (SOUL.md)</label>
              <InfoHint text="This is the agent's always-on instruction. It defines behavior, tone, and boundaries for every task." />
            </div>
            <textarea
              id="agent-prompt"
              value={draftPrompt}
              onChange={(e) => set(setDraftPrompt)(e.target.value)}
              onFocus={keepFieldVisible}
              rows={12}
              placeholder="Enter the agent's system prompt..."
              title="System Prompt"
              className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-[13px] font-mono leading-relaxed text-[#1A1A1A] transition-all focus:border-gray-200 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex gap-3 border-t border-gray-50 bg-white px-8 pb-8 pt-6">
          <button
            onClick={requestClose}
            type="button"
            className="flex-1 rounded-xl border border-gray-100 bg-white py-4 text-[14px] font-bold text-[#1A1A1A] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            type="button"
            disabled={!hasChanges || isSaving}
            className="flex-1 rounded-xl bg-gray-900 py-4 text-[14px] font-bold text-white hover:bg-black transition-colors disabled:opacity-40"
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
