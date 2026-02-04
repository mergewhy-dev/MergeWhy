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

const statusStyles: Record<DERStatus, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
  PENDING: { variant: "secondary", label: "Pending" },
  NEEDS_REVIEW: { variant: "outline", label: "Needs Review" },
  CONFIRMED: { variant: "default", label: "Confirmed" },
  COMPLETE: { variant: "default", label: "Complete" },
  INCOMPLETE: { variant: "destructive", label: "Incomplete" },
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
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Score */}
          <div className="flex-shrink-0">
            <EvidenceScoreBadge score={evidenceScore} size="sm" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/records/${id}`}
                  className="font-medium text-sm hover:underline line-clamp-1"
                >
                  {prTitle}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <a
                    href={prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    #{prNumber}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {repositoryName}
                  </span>
                </div>
              </div>
              <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 mt-3">
              {gapCount > 0 && (
                <span className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {gapCount} gap{gapCount !== 1 ? "s" : ""}
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
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
