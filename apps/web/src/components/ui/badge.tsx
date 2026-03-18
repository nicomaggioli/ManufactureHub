import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border-primary/15 bg-primary/8 text-primary',
        secondary: 'border-transparent bg-muted text-muted-foreground',
        destructive: 'border-destructive/15 bg-destructive/8 text-destructive',
        outline: 'text-muted-foreground border-border',
        success: 'border-success/15 bg-success/8 text-success',
        warning: 'border-warning/15 bg-warning/8 text-warning',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
