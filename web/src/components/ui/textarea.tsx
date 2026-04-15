import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[90px] w-full rounded-2xl border border-emerald-200 bg-emerald-50/55 px-4 py-3 text-sm text-slate-900 shadow-xs outline-none placeholder:text-slate-500/90 focus-visible:border-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
