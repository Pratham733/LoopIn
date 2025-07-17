
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft, SidebarClose as DefaultSidebarCloseIcon } from "lucide-react" 

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

// New width constants for the super-collapsed and expanded states
const SIDEBAR_COLLAPSED_WIDTH_PX = 48; 
const SIDEBAR_EXPANDED_WIDTH_PX = 180; 

const SIDEBAR_WIDTH_MOBILE = "18rem" 

type SidebarContext = {
  open: boolean 
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean 
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true, 
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((current) => !current)
        : setOpen((current) => !current) 
    }, [isMobile, setOpen, setOpenMobile])

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
        }
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])


    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={100}>
          <div
            style={style as React.CSSProperties}
            className={cn(
              "flex min-h-svh w-full",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset" 
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar", 
      collapsible = "none", 
      className,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const { isMobile, openMobile, setOpenMobile } = useSidebar()

    if (isMobile) { 
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[var(--sidebar-width-mobile)] bg-sidebar text-sidebar-foreground p-0 [&>button]:hidden" 
            style={{ "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        data-sidebar="sidebar"
        className={cn(
          "group/main-sidebar h-full z-30", 
          "bg-sidebar text-sidebar-foreground", 
          "transition-all duration-200 ease-in-out", 
          `w-[${SIDEBAR_COLLAPSED_WIDTH_PX}px] group-hover/chatlayout-main:w-[${SIDEBAR_EXPANDED_WIDTH_PX}px]`, 
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button> & { collapsible?: "offcanvas" | "icon" | "none" }
>(({ className, onClick, children, collapsible, ...props }, ref) => {
  const { toggleSidebar, isMobile } = useSidebar();
  
  if (!isMobile) { 
      return null; 
  }

  const buttonChildren = props.asChild ? children : (
    <>
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </>
  );

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7 md:hidden", className )} 
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      {buttonChildren}
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
 return null;
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"


const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn("h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col mb-2 h-[50px] items-center justify-center group-hover/main-sidebar:items-start", className)} 
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 mt-auto", className)} 
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("my-2 bg-sidebar-border", className)} 
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn("flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-4 px-2 overflow-y-auto overflow-x-hidden", className)} 
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col", className)} 
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"
  return ( <Comp ref={ref} data-sidebar="group-label" className={cn( "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-muted-foreground outline-none ring-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", className )} {...props} /> )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return ( <Comp ref={ref} data-sidebar="group-action" className={cn( "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-foreground outline-none ring-ring transition-transform hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", "after:absolute after:-inset-2 after:md:hidden", className )} {...props} /> )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} data-sidebar="group-content" className={cn("w-full text-sm", className)} {...props} />
))
SidebarGroupContent.displayName = "SidebarGroupContent"


const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-2", className)} 
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)} 
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"


const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement, 
  React.ComponentProps<"button"> & { 
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants> 
>(
  (
    {
      asChild = false,
      isActive = false,
      variant, 
      size,
      tooltip, 
      className,
      children, 
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const { isMobile } = useSidebar(); 

    const buttonBaseClasses = `
      relative flex items-center justify-center group-hover/main-sidebar:justify-start 
      w-full h-[50px] 
      rounded-lg overflow-hidden 
      text-sidebar-foreground 
      transition-colors duration-200 ease-in 
      focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
    `;
    const activeItemClasses = isActive ? `bg-sidebar-accent` : `bg-transparent hover:bg-sidebar-accent/70`;


    const buttonContent = (
      <Comp
        ref={ref as any} 
        data-sidebar="menu-button"
        data-active={isActive}
        className={cn(buttonBaseClasses, activeItemClasses, className)}
        {...props}
      >
        {children} 
      </Comp>
    );

    if (tooltip && !isMobile) {
      const tooltipProps = typeof tooltip === "string" 
        ? { children: tooltip } 
        : tooltip;
      
      return (
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent
            side="right"
            align="start"
            sideOffset={10} 
            alignOffset={-5} 
            {...tooltipProps}
            className={cn(tooltipProps.className, "group-hover/main-sidebar:hidden")} 
          />
        </Tooltip>
      );
    }
    
    return buttonContent;
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean; showOnHover?: boolean }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return ( <Comp ref={ref} data-sidebar="menu-action" className={cn( "absolute right-1 top-1/2 -translate-y-1/2 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-foreground opacity-0 transition-opacity group-hover/main-sidebar:opacity-100 group-hover/menu-item:opacity-100 focus:opacity-100 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", "after:absolute after:-inset-2 after:md:hidden", className )} {...props} /> )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} data-sidebar="menu-badge" className={cn( "link-badge-style", 
  className )} {...props} />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"


const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { showIcon?: boolean }
>(({ className, showIcon = true, ...props }, ref) => { 
  return ( <div ref={ref} data-sidebar="menu-skeleton" className={cn("rounded-md h-[50px] flex items-center px-2 gap-3", className)} {...props} > {showIcon && (<Skeleton className="size-7 rounded-md" data-sidebar="menu-skeleton-icon" /> )} <Skeleton className="h-5 w-3/4 opacity-0 group-hover/main-sidebar:opacity-100 transition-opacity" data-sidebar="menu-skeleton-text" /> </div> )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"


const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul ref={ref} data-sidebar="menu-sub" className={cn( "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-border px-2.5 py-0.5", className )} {...props} />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & { asChild?: boolean; size?: "sm" | "md"; isActive?: boolean }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"
  return ( <Comp ref={ref} data-sidebar="menu-sub-button" data-size={size} data-active={isActive} className={cn( "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-foreground outline-none ring-ring hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-accent-foreground", "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground", size === "sm" && "text-xs", size === "md" && "text-sm", className )} {...props} /> )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

const sidebarMenuButtonVariants = cva("", { variants: {}, defaultVariants: {} }); 

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset, 
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}

