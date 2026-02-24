"use client";

import { X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

export function CalendarModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 backdrop-blur-sm md:items-center md:justify-center md:p-6" onClick={onClose}>
      <section
        className="relative flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl md:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Mission Calendar</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-center p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-surface-elevated)]"
          />
        </div>
        <div className="border-t border-[var(--border)] p-4 text-center">
          <p className="text-xs text-[var(--text-secondary)]">
            {date ? `Viewing missions for ${date.toLocaleDateString()}` : "Select a date to view missions"}
          </p>
        </div>
      </section>
    </div>
  );
}
