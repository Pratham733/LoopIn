
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-transform duration-150 ease-out",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Apply scaling effects only on md screens and up
    const scaleClasses = "md:hover:scale-[1.03] md:active:scale-95";

    if (asChild) {
      return (
        <Comp
          className={cn(
            buttonVariants({ variant, size, className }),
            scaleClasses 
          )}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, className }), 
          "relative overflow-hidden group",
          scaleClasses
        )}
        ref={ref}
        {...props} 
      >
        {variant !== "link" && ( 
          <span
            className={cn(
              "absolute inset-0 z-0 origin-left scale-x-0 transform transition-transform duration-300 ease-out group-hover:scale-x-100",
              { 
                "bg-primary/80": variant === "default", 
                "bg-destructive/80": variant === "destructive",
                "bg-secondary/70": variant === "secondary",
                "bg-accent/70": variant === "outline" || variant === "ghost",
              }
            )}
          />
        )}
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
