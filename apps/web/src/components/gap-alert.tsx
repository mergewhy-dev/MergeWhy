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

// Using brand colors with left accent border
const severityStyles: Record<Severity, { bg: string; border: string; leftBorder: string; icon: string; text: string; badge: string }> = {
  LOW: {
    bg: "bg-muted/30",
    border: "border-border/50",
    leftBorder: "border-l-[3px] border-l-muted-foreground/40",
    icon: "text-muted-foreground",
    text: "text-foreground",
    badge: "bg-muted text-muted-foreground",
  },
  MEDIUM: {
    bg: "bg-[#d4a853]/5",
    border: "border-[#d4a853]/15",
    leftBorder: "border-l-[3px] border-l-[#d4a853]",
    icon: "text-[#d4a853]",
    text: "text-foreground",
    badge: "bg-[#d4a853]/10 text-[#d4a853]",
  },
  HIGH: {
    bg: "bg-[#d4883a]/5",
    border: "border-[#d4883a]/15",
    leftBorder: "border-l-[3px] border-l-[#d4883a]",
    icon: "text-[#d4883a]",
    text: "text-foreground",
    badge: "bg-[#d4883a]/10 text-[#d4883a]",
  },
  CRITICAL: {
    bg: "bg-[#c45c5c]/5",
    border: "border-[#c45c5c]/15",
    leftBorder: "border-l-[3px] border-l-[#c45c5c]",
    icon: "text-[#c45c5c]",
    text: "text-foreground",
    badge: "bg-[#c45c5c]/10 text-[#c45c5c]",
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
          "flex items-start gap-3 p-3.5 rounded-lg border border-l-[3px] border-l-[#4a7c59] bg-[#4a7c59]/5 border-[#4a7c59]/20 transition-all",
          className
        )}
      >
        <CheckCircle className="w-5 h-5 text-[#4a7c59] mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground line-through">{message}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#4a7c59]/10 text-[#4a7c59]">
              Resolved
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-lg border transition-all hover:shadow-sm",
        styles.bg,
        styles.border,
        styles.leftBorder,
        className
      )}
    >
      <div className={cn("p-1.5 rounded-lg", styles.bg)}>
        <Icon className={cn("w-4 h-4", styles.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium leading-snug", styles.text)}>{message}</p>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
              styles.badge
            )}
          >
            {severity}
          </span>
        </div>
        {suggestion && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{suggestion}</p>
        )}
      </div>
    </div>
  );
}
