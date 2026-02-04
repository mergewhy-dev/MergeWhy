import { cn } from "@/lib/utils";
import {
  AlertCircle,
  FileQuestion,
  Link2,
  Users,
  MessageSquare,
  TestTube,
  CheckCircle,
} from "lucide-react";

type GapType =
  | "MISSING_DESCRIPTION"
  | "MISSING_TICKET"
  | "MISSING_REVIEW"
  | "INSUFFICIENT_CONTEXT"
  | "NO_TESTING_EVIDENCE"
  | "MISSING_APPROVAL";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface GapAlertProps {
  type: GapType;
  message: string;
  suggestion?: string;
  severity: Severity;
  resolved?: boolean;
  className?: string;
}

const gapIcons: Record<GapType, typeof AlertCircle> = {
  MISSING_DESCRIPTION: FileQuestion,
  MISSING_TICKET: Link2,
  MISSING_REVIEW: Users,
  INSUFFICIENT_CONTEXT: MessageSquare,
  NO_TESTING_EVIDENCE: TestTube,
  MISSING_APPROVAL: CheckCircle,
};

const severityStyles: Record<Severity, { bg: string; border: string; icon: string; text: string }> = {
  LOW: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    icon: "text-slate-500",
    text: "text-slate-700",
  },
  MEDIUM: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: "text-yellow-600",
    text: "text-yellow-800",
  },
  HIGH: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: "text-orange-600",
    text: "text-orange-800",
  },
  CRITICAL: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-600",
    text: "text-red-800",
  },
};

export function GapAlert({
  type,
  message,
  suggestion,
  severity,
  resolved = false,
  className,
}: GapAlertProps) {
  const Icon = gapIcons[type] || AlertCircle;
  const styles = severityStyles[severity];

  if (resolved) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border bg-green-50 border-green-200",
          className
        )}
      >
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-green-800 line-through">{message}</p>
          <p className="text-xs text-green-600 mt-1">Resolved</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        styles.bg,
        styles.border,
        className
      )}
    >
      <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", styles.icon)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-medium", styles.text)}>{message}</p>
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded font-medium",
              severity === "CRITICAL" && "bg-red-100 text-red-700",
              severity === "HIGH" && "bg-orange-100 text-orange-700",
              severity === "MEDIUM" && "bg-yellow-100 text-yellow-700",
              severity === "LOW" && "bg-slate-100 text-slate-600"
            )}
          >
            {severity}
          </span>
        </div>
        {suggestion && (
          <p className="text-xs text-muted-foreground mt-1">{suggestion}</p>
        )}
      </div>
    </div>
  );
}
