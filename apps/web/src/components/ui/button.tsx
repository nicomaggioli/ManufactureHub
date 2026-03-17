import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-medium ring-offset-background transition-colors transition-shadow duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white rounded-md hover:bg-primary/90 hover:shadow-[0_1px_3px_rgba(0,0,0,0.2),inset_0_0.5px_0_rgba(255,255,255,0.15)] shadow-[0_0.5px_1px_rgba(0,0,0,0.15),inset_0_0.5px_0_rgba(255,255,255,0.15)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] [text-shadow:0_0.5px_1px_rgba(0,0,0,0.15)]',
        destructive: 'bg-destructive text-white rounded-md hover:bg-destructive/90 hover:shadow-[0_1px_3px_rgba(0,0,0,0.2)] shadow-[0_0.5px_1px_rgba(0,0,0,0.15)] [text-shadow:0_0.5px_1px_rgba(0,0,0,0.15)]',
        outline: 'border border-black/[0.12] bg-white rounded-md hover:bg-black/[0.03] hover:border-black/[0.16] shadow-[0_0.5px_1px_rgba(0,0,0,0.06)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]',
        secondary: 'bg-black/[0.05] text-foreground rounded-md hover:bg-black/[0.08]',
        ghost: 'hover:bg-black/[0.04] rounded-md',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[34px] px-4 py-2',
        sm: 'h-[28px] rounded-md px-3 text-[12px]',
        lg: 'h-[38px] rounded-md px-5',
        icon: 'h-[34px] w-[34px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
