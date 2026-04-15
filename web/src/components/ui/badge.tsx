import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
        secondary: "border-amber-200 bg-amber-100 text-amber-900",
        outline: "border-emerald-200 bg-white/85 text-emerald-800",
        success: "border-emerald-200 bg-emerald-100 text-emerald-800",
        warning: "border-orange-200 bg-orange-100 text-orange-900",
        destructive: "border-rose-200 bg-rose-100 text-rose-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
