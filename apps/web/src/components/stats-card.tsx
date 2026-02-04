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
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                {trendDirection === "up" && (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                )}
                {trendDirection === "down" && (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                {trendDirection === "neutral" && (
                  <Minus className="w-3 h-3 text-gray-400" />
                )}
                <span
                  className={cn(
                    trendDirection === "up" && "text-green-600",
                    trendDirection === "down" && "text-red-600",
                    trendDirection === "neutral" && "text-gray-500"
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
            <div className="p-3 bg-slate-100 rounded-lg">
              <Icon className="w-5 h-5 text-slate-600" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
