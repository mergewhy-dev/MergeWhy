"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EvidenceScoreBadge } from "./evidence-score-badge";
import {
  GitBranch,
  ExternalLink,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";

type DERStatus = "PENDING" | "NEEDS_REVIEW" | "CONFIRMED" | "COMPLETE" | "INCOMPLETE";

interface DERCardProps {
  id: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  repositoryName: string;
  evidenceScore: number;
  gapCount: number;
  status: DERStatus;
  createdAt: Date;
  className?: string;
}

const statusStyles: Record<DERStatus, { className: string; label: string; icon?: React.ReactNode }> = {
  PENDING: {
    className: "bg-warning/10 text-warning border-warning/30",
    label: "Pending",
  },
  NEEDS_REVIEW: {
    className: "bg-warning/10 text-warning border-warning/30",
    label: "Needs Review",
  },
  CONFIRMED: {
    className: "bg-success/10 text-success border-success/30",
    label: "Confirmed",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  COMPLETE: {
    className: "bg-success/10 text-success border-success/30",
    label: "Complete",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  INCOMPLETE: {
    className: "bg-error/10 text-error border-error/30",
    label: "Incomplete",
  },
};

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getSeverityBorderStyle(evidenceScore: number): { borderColor: string } {
  if (evidenceScore <= 40) return { borderColor: "#c45c5c" }; // error/red
  if (evidenceScore <= 70) return { borderColor: "#d4883a" }; // warning/amber
  return { borderColor: "#4a7c59" }; // success/green
}

export function DERCard({
  id,
  prNumber,
  prTitle,
  prUrl,
  repositoryName,
  evidenceScore,
  gapCount,
  status,
  createdAt,
  className,
}: DERCardProps) {
  const statusStyle = statusStyles[status];
  const severityStyle = getSeverityBorderStyle(evidenceScore);

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-200",
        "border border-border/40 rounded-xl",
        "hover:shadow-md hover:border-border/60 hover:-translate-y-0.5",
        className
      )}
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #faf9f7 100%)",
        borderLeftWidth: "4px",
        borderLeftColor: severityStyle.borderColor,
      }}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Score */}
          <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
            <EvidenceScoreBadge score={evidenceScore} size="sm" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/records/${id}`}
                  className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1 group-hover:text-primary"
                >
                  {prTitle}
                </Link>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                  <a
                    href={prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors font-medium"
                  >
                    #{prNumber}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-border hidden sm:inline">·</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {repositoryName}
                  </span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold shrink-0 flex items-center gap-1",
                  statusStyle.className
                )}
              >
                {statusStyle.icon}
                {statusStyle.label}
              </Badge>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/30">
              {gapCount > 0 && (
                <span className="text-xs text-warning flex items-center gap-1 font-semibold bg-warning/10 px-2.5 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  {gapCount} gap{gapCount !== 1 ? "s" : ""}
                </span>
              )}
              {gapCount === 0 && evidenceScore >= 75 && (
                <span className="text-xs text-success flex items-center gap-1 font-semibold bg-success/10 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  No gaps
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3" />
                {getRelativeTime(createdAt)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
