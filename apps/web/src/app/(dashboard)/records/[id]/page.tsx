import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EvidenceScoreBadge } from "@/components/evidence-score-badge";
import { GapAlert } from "@/components/gap-alert";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  User,
  Calendar,
  FileText,
  Link2,
  MessageSquare,
  CheckCircle,
  Download,
  ChevronDown,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Mock data - replace with database query
const mockRecord = {
  id: "1",
  prNumber: 234,
  prTitle: "Add user authentication with OAuth2 support",
  prUrl: "https://github.com/acme/app/pull/234",
  prAuthor: "johndoe",
  prAuthorAvatar: "https://github.com/johndoe.png",
  prBaseBranch: "main",
  prHeadBranch: "feature/oauth2-auth",
  prState: "MERGED",
  prMergedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  repositoryName: "acme/app",
  description: `## Summary
This PR adds OAuth2 authentication support with Google and GitHub providers.

## Changes
- Added OAuth2 configuration
- Implemented login/logout flows
- Added session management
- Updated user model with provider fields

## Testing
- Manual testing with Google and GitHub accounts
- Unit tests for auth service`,
  ticketLinks: ["ACME-1234", "ACME-1235"],
  evidenceScore: 72,
  status: "CONFIRMED" as const,
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  gaps: [
    {
      id: "1",
      type: "MISSING_TICKET" as const,
      severity: "MEDIUM" as const,
      message: "PR description mentions ACME-1236 but no link found",
      suggestion: "Add a link to ACME-1236 in the PR description or comments",
      resolved: false,
    },
    {
      id: "2",
      type: "NO_TESTING_EVIDENCE" as const,
      severity: "HIGH" as const,
      message: "No CI test results found",
      suggestion: "Ensure CI pipeline runs and test results are visible",
      resolved: true,
    },
  ],
  evidenceItems: [
    {
      id: "1",
      type: "PR_DESCRIPTION",
      content: "OAuth2 implementation with detailed documentation",
      capturedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: "2",
      type: "JIRA_TICKET",
      content: "ACME-1234: Implement OAuth2 authentication",
      capturedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: "3",
      type: "REVIEW_COMMENT",
      content: "LGTM! Nice implementation of the OAuth flow.",
      capturedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  ],
  reviews: [
    {
      id: "1",
      author: "reviewer1",
      state: "APPROVED",
      body: "Great implementation! LGTM.",
      submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      id: "2",
      author: "reviewer2",
      state: "APPROVED",
      body: "Looks good to me. Nice test coverage.",
      submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  ],
  timeline: [
    { id: "1", action: "PR opened", time: "24 hours ago" },
    { id: "2", action: "DER created", time: "24 hours ago" },
    { id: "3", action: "Review requested from reviewer1", time: "23 hours ago" },
    { id: "4", action: "Review: Approved by reviewer1", time: "6 hours ago" },
    { id: "5", action: "Review: Approved by reviewer2", time: "4 hours ago" },
    { id: "6", action: "PR merged", time: "2 hours ago" },
    { id: "7", action: "Evidence confirmed", time: "1 hour ago" },
  ],
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecordDetailPage({ params }: PageProps) {
  const { id } = await params;

  // In real app, fetch from database
  if (id !== mockRecord.id) {
    notFound();
  }

  const record = mockRecord;
  const unresolvedGaps = record.gaps.filter((g) => !g.resolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/records">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{record.prTitle}</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <a
              href={record.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              #{record.prNumber}
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              {record.repositoryName}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {record.prAuthor}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {record.prMergedAt?.toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Export as PDF</DropdownMenuItem>
              <DropdownMenuItem>Export as JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Evidence
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evidence Score */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence Score</CardTitle>
              <CardDescription>
                Overall quality of decision documentation for this PR.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <EvidenceScoreBadge score={record.evidenceScore} size="lg" showLabel />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={record.status === "CONFIRMED" ? "default" : "secondary"}>
                      {record.status}
                    </Badge>
                    {unresolvedGaps.length > 0 && (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        {unresolvedGaps.length} unresolved gap{unresolvedGaps.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {record.evidenceScore >= 75
                      ? "This PR has comprehensive documentation."
                      : record.evidenceScore >= 50
                      ? "Some evidence gaps need attention."
                      : "Significant documentation is missing."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Gaps */}
          {record.gaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evidence Gaps</CardTitle>
                <CardDescription>
                  Issues that need to be addressed for complete documentation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {record.gaps.map((gap) => (
                  <GapAlert
                    key={gap.id}
                    type={gap.type}
                    message={gap.message}
                    suggestion={gap.suggestion}
                    severity={gap.severity}
                    resolved={gap.resolved}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Evidence Items */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence Items</CardTitle>
              <CardDescription>
                Documentation captured from the PR and linked resources.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {record.evidenceItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {item.type === "PR_DESCRIPTION" && <FileText className="w-4 h-4" />}
                    {item.type === "JIRA_TICKET" && <Link2 className="w-4 h-4" />}
                    {item.type === "REVIEW_COMMENT" && <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {item.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Captured {item.capturedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
              <CardDescription>Code reviews and approvals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {record.reviews.map((review) => (
                <div key={review.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {review.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{review.author}</p>
                      <Badge
                        variant={review.state === "APPROVED" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {review.state}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {review.submittedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* PR Details */}
          <Card>
            <CardHeader>
              <CardTitle>PR Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary">{record.prState}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base</span>
                <span className="font-mono text-xs">{record.prBaseBranch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Head</span>
                <span className="font-mono text-xs">{record.prHeadBranch}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tickets</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {record.ticketLinks.map((ticket) => (
                    <Badge key={ticket} variant="outline" className="text-xs">
                      {ticket}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {record.timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                      {index < record.timeline.length - 1 && (
                        <div className="w-px h-full bg-slate-200" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm">{event.action}</p>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
