"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CircleHelp, X } from "lucide-react";

const STORAGE_KEY = "mc.onboarding.v1";

const STEPS = [
  {
    title: "Welcome to Mission Control",
    body: "This dashboard is split into three zones: agents on the left, mission queue in the center, and live updates on the right.",
  },
  {
    title: "Quick Actions",
    body: "Use Quick Search (Cmd/Ctrl + K), Calendar, and Daily Summary in the top bar to find work fast.",
  },
  {
    title: "Move Work Easily",
    body: "Drag tasks between columns. On mobile, use the status dropdown on each card to move tasks quickly.",
  },
  {
    title: "Personalize Your Workspace",
    body: "Each agent card can have its own color theme. Use the palette button on an agent card to set it.",
  },
];

export function OnboardingCoachmarks() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const hasSeen = window.localStorage.getItem(STORAGE_KEY) === "seen";
    if (!hasSeen) {
      setOpen(true);
    }
  }, []);

  const total = STEPS.length;
  const step = useMemo(() => STEPS[stepIndex], [stepIndex]);

  const close = () => {
    window.localStorage.setItem(STORAGE_KEY, "seen");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-3 md:items-end md:justify-end md:p-5">
      <section className="pointer-events-auto w-full max-w-sm rounded-[var(--radius-outer)] border border-mc-border bg-surface-elevated p-4 shadow-[var(--shadow-overlay)]">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 rounded-[var(--radius-pill)] bg-mc-accent-soft p-2 text-mc-accent">
            <CircleHelp className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide text-text-secondary">
              QUICK TOUR {stepIndex + 1}/{total}
            </p>
            <h3 className="pt-1 text-sm font-semibold text-text-primary">{step.title}</h3>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close onboarding"
            className="interactive-lift mc-icon-slot -mr-1 -mt-1 min-h-9 min-w-9 rounded-[var(--radius-inner)] border border-transparent text-text-secondary hover:border-mc-border hover:bg-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="pt-2 text-sm leading-relaxed text-text-secondary">{step.body}</p>

        <div className="pt-3">
          <div className="flex items-center gap-1">
            {STEPS.map((_, index) => (
              <span
                key={`coachmark-dot-${index}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === stepIndex ? "w-6 bg-mc-accent" : "w-2 bg-text-secondary/35"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={close}
            className="interactive-lift mc-btn mc-btn-subtle min-h-10"
          >
            Skip
          </button>
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex((prev) => prev - 1)}
              className="interactive-lift mc-btn mc-btn-subtle min-h-10"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (stepIndex >= total - 1) {
                close();
                return;
              }
              setStepIndex((prev) => prev + 1);
            }}
            className="interactive-lift ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-pill)] border border-mc-border bg-surface px-3 text-xs font-semibold text-text-primary shadow-[var(--shadow-elevated)] hover:bg-surface-elevated"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            {stepIndex >= total - 1 ? "Done" : "Next Tip"}
          </button>
        </div>
      </section>
    </div>
  );
}
