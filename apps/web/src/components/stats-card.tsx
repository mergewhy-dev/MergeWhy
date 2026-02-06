"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    label?: string;
  };
  icon?: LucideIcon;
  className?: string;
  variant?: "default" | "primary" | "success" | "warning";
}

const variantStyles = {
  default: {
    iconBg: "bg-amber/10",
    iconColor: "text-amber",
    gradient: "from-white via-white to-amber/5",
  },
  primary: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    gradient: "from-white via-white to-primary/5",
  },
  success: {
    iconBg: "bg-success/10",
    iconColor: "text-success",
    gradient: "from-white via-white to-success/5",
  },
  warning: {
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    gradient: "from-white via-white to-warning/5",
  },
};

export function StatsCard({
  title,
  value,
  trend,
  icon: Icon,
  className,
  variant = "default",
}: StatsCardProps) {
  const trendDirection =
    trend?.value === 0 ? "neutral" : trend?.value && trend.value > 0 ? "up" : "down";
  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-border/40 rounded-xl transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5 hover:border-border/60",
        "group cursor-default h-[140px]",
        className
      )}
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #faf9f7 100%)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      {/* Subtle gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50",
        styles.gradient
      )} />

      <CardContent className="relative p-5 h-full">
        <div className="flex items-start justify-between h-full">
          <div className="flex flex-col justify-between h-full">
            <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
              {title}
            </p>
            <div>
              <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                {value}
              </p>
              {trend ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                    trendDirection === "up" && "bg-success/10 text-success",
                    trendDirection === "down" && "bg-error/10 text-error",
                    trendDirection === "neutral" && "bg-muted text-muted-foreground"
                  )}>
                    {trendDirection === "up" && (
                      <TrendingUp className="w-3 h-3" />
                    )}
                    {trendDirection === "down" && (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {trendDirection === "neutral" && (
                      <Minus className="w-3 h-3" />
                    )}
                    <span>
                      {trend.value > 0 ? "+" : ""}
                      {trend.value}%
                    </span>
                  </div>
                  {trend.label && (
                    <span className="text-xs text-muted-foreground">{trend.label}</span>
                  )}
                </div>
              ) : (
                <div className="h-6" />
              )}
            </div>
          </div>
          {Icon && (
            <div
              className={cn(
                "p-3 rounded-xl transition-all duration-200",
                "group-hover:scale-110 group-hover:shadow-md",
                styles.iconBg
              )}
            >
              <Icon className={cn("w-5 h-5", styles.iconColor)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
