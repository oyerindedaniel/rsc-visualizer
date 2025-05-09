import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-foreground-on-accent hover:bg-accent-primary-hover",
        cached:
          "border-transparent bg-success text-foreground-on-accent hover:opacity-80",
        validates:
          "border-transparent bg-warning text-foreground-default hover:opacity-80",
        noCache:
          "border-border-default bg-transparent text-foreground-muted hover:bg-surface-hover",
        unknown:
          "border-border-subtle bg-transparent text-foreground-subtle hover:bg-surface-hover",
        outline: "text-foreground-default border-border-default",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
