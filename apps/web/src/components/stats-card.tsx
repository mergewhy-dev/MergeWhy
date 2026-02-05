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
}

export function StatsCard({
  title,
  value,
  trend,
  icon: Icon,
  className,
}: StatsCardProps) {
  const trendDirection =
    trend?.value === 0 ? "neutral" : trend?.value && trend.value > 0 ? "up" : "down";

  return (
    <Card
      className={cn(
        "bg-white border-border/50 transition-all duration-200 hover:shadow-md hover:border-border group",
        className
      )}
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
            {trend && (
              <div className="flex items-center gap-1.5 text-xs">
                {trendDirection === "up" && (
                  <TrendingUp className="w-3.5 h-3.5 text-[#4a7c59]" />
                )}
                {trendDirection === "down" && (
                  <TrendingDown className="w-3.5 h-3.5 text-[#c45c5c]" />
                )}
                {trendDirection === "neutral" && (
                  <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    "font-medium",
                    trendDirection === "up" && "text-[#4a7c59]",
                    trendDirection === "down" && "text-[#c45c5c]",
                    trendDirection === "neutral" && "text-muted-foreground"
                  )}
                >
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div
              className="p-3 rounded-xl transition-transform group-hover:scale-105"
              style={{ backgroundColor: "rgba(212, 168, 83, 0.12)" }}
            >
              <Icon className="w-6 h-6" style={{ color: "#d4a853" }} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
