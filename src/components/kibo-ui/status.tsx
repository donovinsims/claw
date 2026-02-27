"use client";

import type { ComponentProps, HTMLAttributes } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusProps = ComponentProps<typeof Badge> & {
  status: "online" | "offline" | "maintenance" | "degraded";
};

export const Status = ({ className, status, ...props }: StatusProps) => (
  <Badge
    className={cn(
      "group inline-flex items-center gap-1 rounded-[999px] border border-[#d7dbe2] bg-[#f0f2f4] px-[7px] py-[3px] text-[10px] font-bold uppercase leading-none text-[#4f5661]",
      status,
      className,
    )}
    variant="secondary"
    {...props}
  />
);

export type StatusIndicatorProps = HTMLAttributes<HTMLSpanElement>;

export const StatusIndicator = ({ className, ...props }: StatusIndicatorProps) => (
  <span
    className={cn(
      "inline-flex h-[7px] w-[7px] rounded-full",
      "group-[.online]:bg-[#10b981]",
      "group-[.offline]:bg-[#ef4444]",
      "group-[.maintenance]:bg-[#f59e0b]",
      "group-[.degraded]:bg-[#64748b]",
      className,
    )}
    {...props}
  />
);

export type StatusLabelProps = HTMLAttributes<HTMLSpanElement>;

export const StatusLabel = ({ className, children, ...props }: StatusLabelProps) => (
  <span className={cn("leading-none", className)} {...props}>
    {children ?? (
      <>
        <span className="hidden group-[.online]:inline">Online</span>
        <span className="hidden group-[.offline]:inline">Offline</span>
        <span className="hidden group-[.maintenance]:inline">Maintenance</span>
        <span className="hidden group-[.degraded]:inline">Degraded</span>
      </>
    )}
  </span>
);
