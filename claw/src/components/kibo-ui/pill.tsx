"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PillProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

export const Pill = ({ className, children, ...props }: PillProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border border-[#d7dbe2] bg-[#f0f2f4] px-[7px] py-[3px] text-[10px] font-bold uppercase leading-none text-[#4f5661]",
      className,
    )}
    {...props}
  >
    {children}
  </span>
);

export type PillIndicatorProps = {
  variant?: "success" | "error" | "warning" | "info";
  pulse?: boolean;
};

function indicatorColor(variant: PillIndicatorProps["variant"]) {
  switch (variant) {
    case "error":
      return "bg-[#ef4444]";
    case "warning":
      return "bg-[#f59e0b]";
    case "info":
      return "bg-[#64748b]";
    default:
      return "bg-[#10b981]";
  }
}

export const PillIndicator = ({ variant = "success", pulse = false }: PillIndicatorProps) => {
  const colorClass = indicatorColor(variant);

  return (
    <span className="relative flex size-[7px]">
      {pulse ? <span className={cn("absolute inline-flex size-[7px] animate-ping rounded-full opacity-75", colorClass)} /> : null}
      <span className={cn("relative inline-flex size-[7px] rounded-full", colorClass)} />
    </span>
  );
};
