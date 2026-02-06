"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface EvidenceScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  animate?: boolean;
}

export function EvidenceScoreBadge({
  score,
  size = "md",
  showLabel = false,
  className,
  animate = true,
}: EvidenceScoreBadgeProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const [isAnimating, setIsAnimating] = useState(animate);

  useEffect(() => {
    if (!animate) return;

    setIsAnimating(true);
    const duration = 800;
    const steps = 30;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        setIsAnimating(false);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, animate]);

  const getScoreColor = (s: number) => {
    if (s >= 71)
      return {
        ring: "#4a7c59",
        bg: "bg-success/10",
        text: "text-success",
        label: "Excellent",
        glow: "rgba(74, 124, 89, 0.2)",
      };
    if (s >= 41)
      return {
        ring: "#d4a853",
        bg: "bg-amber/10",
        text: "text-amber",
        label: "Good",
        glow: "rgba(212, 168, 83, 0.2)",
      };
    if (s > 0)
      return {
        ring: "#c45c5c",
        bg: "bg-error/10",
        text: "text-error",
        label: "Needs Work",
        glow: "rgba(196, 92, 92, 0.2)",
      };
    return {
      ring: "#d4d4d4",
      bg: "bg-muted",
      text: "text-muted-foreground",
      label: "No Data",
      glow: "transparent",
    };
  };

  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const textSizeClasses = {
    sm: "text-sm font-bold",
    md: "text-xl font-bold",
    lg: "text-3xl font-bold",
  };

  const showFilledBg = score === 0;

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div
        className={cn("relative", sizeClasses[size])}
        style={{
          filter: score > 0 ? `drop-shadow(0 0 8px ${colors.glow})` : undefined,
        }}
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle fill for 0 score */}
          {showFilledBg && (
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="#f5f5f5"
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
            className={cn(
              "transition-all duration-500 ease-out",
              isAnimating && "animate-pulse"
            )}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "tabular-nums",
            textSizeClasses[size],
            score === 0 ? "text-muted-foreground" : "text-foreground"
          )}>
            {displayScore}
          </span>
        </div>
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full",
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
