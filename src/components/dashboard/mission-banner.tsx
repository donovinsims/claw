"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_MISSION = "Build an autonomous organization of AI agents that produces value 24/7";

export function MissionBanner() {
  const missionSetting = useQuery(api.queries.getSetting, { key: "mission_statement" });
  const updateSetting = useMutation(api.mutations.updateSetting);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const text = missionSetting?.value ?? DEFAULT_MISSION;

  return (
    <>
      <section className="panel-sheen relative flex min-h-11 shrink-0 items-center gap-2 border-b border-mc-border/70 bg-surface/92 px-3 md:px-4">
        <span className="mc-chip hidden md:inline-flex">Current Mission</span>
        <p className="line-clamp-1 min-w-0 flex-1 text-[13px] text-text-primary">{text}</p>
        <button
          onClick={() => {
            setDraft(text);
            setEditing(true);
          }}
          className="interactive-lift mc-icon-button h-9 min-h-9 w-9 min-w-9 border-transparent bg-transparent p-0 shadow-none hover:bg-surface-elevated hover:shadow-none"
          aria-label="Edit mission statement"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </section>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/55 backdrop-blur-sm md:items-center md:justify-center"
          onClick={() => setEditing(false)}
        >
          <div
            className="w-full rounded-t-[var(--radius-outer)] border border-mc-border bg-surface-elevated p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[var(--shadow-overlay)] md:max-w-xl md:rounded-[var(--radius-outer)] md:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Edit Mission Statement</h3>
              <button
                onClick={() => setEditing(false)}
                className="interactive-lift mc-icon-button h-9 min-h-9 w-9 min-w-9 border-transparent bg-transparent p-0 shadow-none hover:bg-surface hover:shadow-none"
                aria-label="Close mission editor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="mc-input min-h-[112px] w-full resize-y px-3 py-2.5 text-sm"
              rows={4}
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="interactive-lift mc-btn mc-btn-subtle"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await updateSetting({ key: "mission_statement", value: draft.trim() || DEFAULT_MISSION });
                    toast.success("Mission statement updated");
                    setEditing(false);
                  } catch {
                    toast.error("Could not save mission statement");
                  }
                }}
                className="interactive-lift mc-btn mc-btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
