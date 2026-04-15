import * as React from "react";
import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="checkbox"
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-emerald-300 bg-emerald-50 text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-200",
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };
