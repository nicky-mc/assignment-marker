import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] border-2 border-transparent text-base font-medium whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-primary-edge bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border-border bg-transparent text-foreground hover:bg-muted",
        secondary: "border-border bg-transparent text-foreground hover:bg-muted",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        destructive: "border-destructive bg-transparent text-destructive hover:bg-muted",
        link: "text-foreground underline underline-offset-4 hover:no-underline",
      },
      size: {
        default: "h-10 px-4",
        xs: "h-7 px-2 text-sm",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-5",
        icon: "size-9",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
