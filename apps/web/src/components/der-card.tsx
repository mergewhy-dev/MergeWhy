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

const statusStyles: Record<DERStatus, { className: string; label: string }> = {
  PENDING: {
    className: "bg-[#fef3c7] text-[#92400e] border-[#fcd34d]",
    label: "Pending",
  },
  NEEDS_REVIEW: {
    className: "bg-[#d4883a]/10 text-[#d4883a] border-[#d4883a]/20",
    label: "Needs Review",
  },
  CONFIRMED: {
    className: "bg-[#4a7c59]/10 text-[#4a7c59] border-[#4a7c59]/20",
    label: "Confirmed",
  },
  COMPLETE: {
    className: "bg-primary/10 text-primary border-primary/20",
    label: "Complete",
  },
  INCOMPLETE: {
    className: "bg-[#c45c5c]/10 text-[#c45c5c] border-[#c45c5c]/20",
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

  return (
    <Card className={cn(
      "group shadow-sm hover:shadow-md transition-all duration-200 border-border/50 hover:border-border",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Score */}
          <div className="flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
            <EvidenceScoreBadge score={evidenceScore} size="sm" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/records/${id}`}
                  className="font-medium text-sm hover:text-primary transition-colors line-clamp-1 group-hover:text-primary"
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
                className={cn("text-xs font-medium shrink-0 shadow-sm", statusStyle.className)}
              >
                {statusStyle.label}
              </Badge>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/30">
              {gapCount > 0 && (
                <span className="text-xs text-[#d4883a] flex items-center gap-1 font-medium bg-[#d4883a]/5 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  {gapCount} gap{gapCount !== 1 ? "s" : ""}
                </span>
              )}
              {gapCount === 0 && evidenceScore >= 75 && (
                <span className="text-xs text-[#4a7c59] flex items-center gap-1 font-medium bg-[#4a7c59]/5 px-2 py-0.5 rounded-full">
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
