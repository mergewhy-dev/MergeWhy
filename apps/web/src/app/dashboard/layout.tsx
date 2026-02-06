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
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Records", href: "/dashboard/records", icon: FileText },
  { name: "Repositories", href: "/dashboard/repositories", icon: GitBranch },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  // Generate breadcrumb
  const getBreadcrumb = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 1) return null;

    return segments.slice(1).map((segment, index) => {
      const isLast = index === segments.length - 2;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      return (
        <span key={segment} className="flex items-center">
          <span className="text-muted-foreground/50 mx-2">/</span>
          <span className={cn(isLast ? "text-foreground font-medium" : "text-muted-foreground")}>
            {label}
          </span>
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Premium Navy theme */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-sidebar transition-all duration-300 ease-out",
          collapsed ? "w-[72px]" : "w-64"
        )}
        style={{
          boxShadow: "4px 0 24px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-sidebar-border/50">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-amber to-amber-light rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover:scale-105">
                <span className="text-sidebar font-bold text-sm">MW</span>
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
            <div className="px-3 py-3 mb-2 border-b border-sidebar-border/50">
              <SafeOrganizationSwitcher
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    organizationSwitcherTrigger:
                      "w-full flex items-center justify-between gap-2 text-sm bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent rounded-lg border border-sidebar-border/50 transition-colors px-3 py-2.5 min-h-[44px]",
                    organizationPreview: "flex items-center gap-2 truncate flex-1",
                    organizationPreviewTextContainer: "truncate",
                  },
                }}
              />
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    "nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                    active
                      ? "nav-item-active bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-colors",
                      active ? "text-amber" : "text-sidebar-foreground/60"
                    )}
                  />
                  {!collapsed && item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="mt-auto shrink-0 border-t border-sidebar-border/50">
            {/* Collapse button */}
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
                className={cn(
                  "w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl transition-all",
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
            <div className="p-3 border-t border-sidebar-border/50">
              <div
                className={cn(
                  "flex items-center gap-3",
                  collapsed && "justify-center"
                )}
              >
                <div className="relative">
                  <SafeUserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 ring-2 ring-amber/30 ring-offset-2 ring-offset-sidebar",
                      },
                    }}
                  />
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      Account
                    </p>
                    <p className="text-xs text-sidebar-foreground/50 truncate">
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
          "transition-all duration-300 ease-out min-h-screen",
          collapsed ? "pl-[72px]" : "pl-64"
        )}
        style={{ backgroundColor: "#f8f7f4" }}
      >
        {/* Header */}
        <header
          className="sticky top-0 z-40 h-16 backdrop-blur-md border-b border-border/50"
          style={{ backgroundColor: "rgba(248, 247, 244, 0.85)" }}
        >
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center">
              <div className="flex items-center text-sm">
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>
                {getBreadcrumb()}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-8 min-h-[calc(100vh-4rem)]">{children}</div>
      </main>
    </div>
  );
}
