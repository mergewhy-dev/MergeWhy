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
    if (score >= 75)
      return {
        ring: "#4a7c59",
        bg: "bg-[#4a7c59]/10",
        text: "text-[#4a7c59]",
        label: "Excellent",
      };
    if (score >= 50)
      return {
        ring: "#d4a853",
        bg: "bg-[#d4a853]/10",
        text: "text-[#d4a853]",
        label: "Good",
      };
    if (score >= 25)
      return {
        ring: "#d4883a",
        bg: "bg-[#d4883a]/10",
        text: "text-[#d4883a]",
        label: "Fair",
      };
    if (score > 0)
      return {
        ring: "#c45c5c",
        bg: "bg-[#c45c5c]/10",
        text: "text-[#c45c5c]",
        label: "Needs Work",
      };
    // Score is 0 - use a light gray with subtle red tint
    return {
      ring: "#d4d4d4",
      bg: "bg-[#e5e5e5]",
      text: "text-[#737373]",
      label: "No Data",
    };
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

  // For 0 score, show a filled background
  const showFilledBg = score === 0;

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle fill for 0 score */}
          {showFilledBg && (
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="#f0f0f0"
            />
          )}
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#e8e4df"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={colors.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-semibold tabular-nums",
            textSizeClasses[size],
            score === 0 && "text-[#737373]"
          )}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full",
            colors.bg,
            colors.text
          )}
        >
          {colors.label}
        </span>
      )}
    </div>
  );
}
