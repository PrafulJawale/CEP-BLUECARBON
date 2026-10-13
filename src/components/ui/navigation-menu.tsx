import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn("relative z-10 flex max-w-max flex-1 items-center justify-center", className)}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn("group flex flex-1 list-none items-center justify-center space-x-1", className)}
    {...props}
  />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
);

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto",
      className,
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className,
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName;

// Role-aware application navigation that mirrors routes in src/App.tsx
const AppNavigation: React.FC<{ className?: string }> = ({ className }) => {
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  // Map available routes according to role & auth (keeps in sync with src/App.tsx)
  const items: { to: string; label: string; show: boolean }[] = [
    { to: "/", label: "Home", show: true },
    { to: "/community", label: "Community", show: true },
    { to: "/gis-mapping", label: "GIS Mapping", show: true },
    { to: "/iot-simulation", label: "IoT Simulation", show: true },
    // Authenticated routes
    { to: "/dashboard", label: "Dashboard", show: !!isAuthenticated },
    { to: "/upload", label: "Upload Data", show: !!isAuthenticated },
    { to: "/registry", label: "Registry", show: !!isAuthenticated },
    { to: "/marketplace", label: "Marketplace", show: !!isAuthenticated },
    // Role-restricted
    { to: "/admin", label: "Admin Panel", show: !!isAuthenticated && user?.role === "admin" },
    {
      to: "/verification-workflow",
      label: "Verification",
      show:
        !!isAuthenticated &&
        (user?.role === "admin" || user?.role === "government_officer"),
    },
    // Authentication actions
    { to: "/login", label: "Login", show: !isAuthenticated },
    { to: "/register", label: "Register", show: !isAuthenticated },
  ];

  // Mobile-first: show a slide-over drawer with blur backdrop
  if (isMobile) {
    return (
      <div className={cn("flex items-center", className)}>
        <button
          aria-label="Open navigation"
          onClick={() => setOpen((s) => !s)}
          className="p-2 rounded-md hover:bg-accent/10 text-gray-900"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div
          className={`fixed inset-0 z-[60] transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        >
          {/* backdrop */}
          <div onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* slide-over panel (slides from right; sits on top of sidebar via CSS vars) */}
          <aside
            className={`absolute right-0 top-0 h-full w-4/5 max-w-sm transform bg-white border-l shadow-xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
            role="dialog"
            aria-modal="true"
            style={{ 
              zIndex: 70, 
              right: "var(--sidebar-width, 0px)", // Offset by sidebar width if present; fallback to 0 for no sidebar
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-ocean flex items-center justify-center text-white font-semibold">BC</div>
                <div className="text-sm font-semibold text-gray-900">Navigation</div>
              </div>
              <button aria-label="Close" onClick={() => setOpen(false)} className="p-2 rounded-md hover:bg-accent/10 text-gray-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-auto h-[calc(100%-72px)]">
              <nav>
                <ul className="flex flex-col gap-2">
                  {items.filter(i => i.show).map((item) => (
                    <li key={item.to}>
                      <Link to={item.to} onClick={() => setOpen(false)} className="block px-4 py-2 rounded-md hover:bg-accent/10">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Desktop: original top navigation (radix) for larger screens
  return (
    <NavigationMenu className={className}>
      <NavigationMenuList>
        {items.filter(i => i.show).map((item) => (
          <NavigationMenuItem key={item.to}>
            <NavigationMenuLink asChild>
              <Link to={item.to} className="px-4 py-2 text-sm rounded-md hover:bg-accent/10">
                {item.label}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export { AppNavigation };

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  // AppNavigation is the role-aware menu to use
};
