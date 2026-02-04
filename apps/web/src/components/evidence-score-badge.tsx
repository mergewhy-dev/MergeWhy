"use client";

import { cn } from "@/lib/utils";

interface EvidenceScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function EvidenceScoreBadge({
  score,
  size = "md",
  showLabel = false,
  className,
}: EvidenceScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return { ring: "text-green-500", bg: "bg-green-50", text: "text-green-700" };
    if (score >= 50) return { ring: "text-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700" };
    return { ring: "text-red-500", bg: "bg-red-50", text: "text-red-700" };
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return "Good";
    if (score >= 50) return "Fair";
    return "Poor";
  };

  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200"
          />
          {/* Progress ring */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn("transition-all duration-500", colors.ring)}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", textSizeClasses[size])}>{score}</span>
        </div>
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            colors.bg,
            colors.text
          )}
        >
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}
