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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">MW</span>
              </div>
              {!collapsed && (
                <span className="font-semibold text-lg">MergeWhy</span>
              )}
            </Link>
          </div>

          {/* Organization Switcher */}
          {!collapsed && (
            <div className="px-3 py-3 border-b border-gray-200">
              <SafeOrganizationSwitcher
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    organizationSwitcherTrigger:
                      "w-full justify-between text-sm",
                  },
                }}
              />
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-slate-100 text-slate-900"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && item.name}
                </Link>
              );
            })}
          </nav>

          {/* Collapse button */}
          <div className="px-3 py-2 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={cn("w-full", collapsed ? "px-2" : "justify-start")}
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
          <div className="p-3 border-t border-gray-200">
            <div
              className={cn(
                "flex items-center gap-3",
                collapsed && "justify-center"
              )}
            >
              <SafeUserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Account
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Manage settings
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "transition-all duration-200",
          collapsed ? "pl-16" : "pl-64"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-full px-6">
            <h1 className="text-lg font-semibold text-gray-900">
              {navigation.find((item) => isActive(item.href))?.name ||
                "Dashboard"}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
