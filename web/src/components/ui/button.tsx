import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-emerald-300",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white shadow-[0_12px_26px_-14px_rgba(20,184,166,0.9)] hover:from-emerald-400 hover:via-teal-400 hover:to-sky-400",
        destructive:
          "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-[0_12px_26px_-14px_rgba(251,113,133,0.85)] hover:from-rose-400 hover:to-orange-400",
        outline:
          "border border-emerald-200 bg-white/85 text-emerald-900 hover:bg-emerald-50",
        secondary:
          "border border-amber-200 bg-amber-100 text-amber-900 hover:bg-amber-200",
        ghost: "text-emerald-900 hover:bg-white/70",
        link: "text-emerald-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-11 px-7",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
