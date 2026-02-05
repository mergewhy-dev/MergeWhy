"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SafeUserButton, SafeOrganizationSwitcher } from "@/components/clerk-components";
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Records", href: "/records", icon: FileText },
  { name: "Repositories", href: "/repositories", icon: GitBranch },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Navy theme */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-sidebar transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-primary font-bold text-sm">MW</span>
              </div>
              {!collapsed && (
                <span className="font-serif font-semibold text-lg text-sidebar-foreground tracking-tight">
                  MergeWhy
                </span>
              )}
            </Link>
          </div>

          {/* Organization Switcher */}
          {!collapsed && (
            <div className="px-3 py-3 border-b border-sidebar-border">
              <SafeOrganizationSwitcher
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    organizationSwitcherTrigger:
                      "w-full justify-between text-sm bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 rounded-lg",
                  },
                }}
              />
            </div>
          )}

          {/* Navigation - with bottom padding to prevent overlap with fixed bottom section */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto pb-4">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", active && "text-amber")} />
                  {!collapsed && item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section - always visible at bottom, never shrinks */}
          <div className="mt-auto shrink-0 border-t border-sidebar-border">
            {/* Collapse button */}
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
                className={cn(
                  "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors",
                  collapsed ? "px-2" : "justify-start"
                )}
              >
                {collapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Collapse
                  </>
                )}
              </Button>
            </div>

            {/* User section */}
            <div className="p-3 border-t border-sidebar-border">
            <div
              className={cn(
                "flex items-center gap-3",
                collapsed && "justify-center"
              )}
            >
              <SafeUserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 ring-2 ring-sidebar-accent",
                  },
                }}
              />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    Account
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    Manage settings
                  </p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "transition-all duration-200 min-h-screen",
          collapsed ? "pl-16" : "pl-64"
        )}
        style={{ backgroundColor: "#f8f6f2" }}
      >
        {/* Header */}
        <header
          className="sticky top-0 z-40 h-16 backdrop-blur-sm border-b border-border"
          style={{ backgroundColor: "rgba(248, 246, 242, 0.9)" }}
        >
          <div className="flex items-center justify-between h-full px-6">
            <h1 className="text-xl font-serif font-semibold text-foreground">
              {navigation.find((item) => isActive(item.href))?.name ||
                "Dashboard"}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 min-h-[calc(100vh-4rem)]">{children}</div>
      </main>
    </div>
  );
}
