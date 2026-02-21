"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Pencil, X } from "lucide-react";

const DEFAULT_MISSION = "Build an autonomous organization of AI agents that produces value 24/7";

export function MissionBanner() {
  const missionSetting = useQuery(api.queries.getSetting, { key: "mission_statement" });
  const updateSetting = useMutation(api.mutations.updateSetting);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const text = missionSetting?.value ?? DEFAULT_MISSION;

  return (
    <>
      <div className="relative flex h-10 shrink-0 items-center justify-center px-12" style={{ background: "linear-gradient(90deg, rgba(30,190,241,0.08) 0%, transparent 100%)" }}>
        <p className="text-center font-serif text-sm italic text-text-primary/80">&ldquo;{text}&rdquo;</p>
        <button
          onClick={() => { setDraft(text); setEditing(true); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-text-secondary/40 transition-colors hover:text-text-primary"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditing(false)}>
          <div
            className="w-full max-w-md rounded-[var(--radius-outer)] border border-mc-border bg-surface-elevated p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Edit Mission Statement</h3>
              <button onClick={() => setEditing(false)} className="text-text-secondary hover:text-text-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-[var(--radius-inner)] border border-mc-border bg-surface p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-mc-cyan"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-full bg-surface px-4 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await updateSetting({ key: "mission_statement", value: draft });
                  setEditing(false);
                }}
                className="rounded-full bg-mc-cyan px-4 py-1.5 text-xs font-medium text-white"
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
