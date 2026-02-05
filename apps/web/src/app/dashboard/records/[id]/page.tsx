"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  Users,
  Calendar,
  FileText,
  Link2,
  MessageSquare,
  CheckCircle,
  Download,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Bot,
  Lightbulb,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  RefreshCw,
  Lock,
  Copy,
  Check,
  XCircle,
  Circle,
} from "lucide-react";
import { useDER, useConfirmDER, useGenerateAuditSummary, useReanalyzeRisk, useRecalculateScore, useVaultSummary, useVerifyVault, useCreateVault } from "@/hooks/use-ders";
import { useDERCompliance } from "@/hooks/use-compliance";
import { getStatusColor } from "@/lib/compliance-engines";
import { useState } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function RecordDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: record, isLoading, error } = useDER(id);
  const confirmMutation = useConfirmDER();
  const generateAuditMutation = useGenerateAuditSummary();
  const reanalyzeMutation = useReanalyzeRisk();
  const recalculateMutation = useRecalculateScore();

  // Evidence Vault - only query after record is loaded
  const { data: vaultSummary, isLoading: vaultLoading, error: vaultError } = useVaultSummary(id);
  const verifyMutation = useVerifyVault();
  const createVaultMutation = useCreateVault();
  const [hashCopied, setHashCopied] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; reason?: string } | null>(null);
  const [expandedControls, setExpandedControls] = useState<Set<string>>(new Set());

  // Compliance evaluation
  const { data: complianceData, isLoading: complianceLoading } = useDERCompliance(id);

  const toggleControlExpand = (controlId: string) => {
    setExpandedControls((prev) => {
      const next = new Set(prev);
      if (next.has(controlId)) {
        next.delete(controlId);
      } else {
        next.add(controlId);
      }
      return next;
    });
  };

  // Log vault errors for debugging
  if (vaultError) {
    console.error("[RecordDetailPage] Vault error:", vaultError);
  }

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/records">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Records
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Record</h3>
            <p className="text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not found state
  if (!record) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/records">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Records
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Record Not Found</h3>
            <p className="text-muted-foreground">
              This record doesn&apos;t exist or you don&apos;t have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unresolvedGaps = record.gaps.filter((g) => !g.resolved);

  const handleConfirm = () => {
    confirmMutation.mutate({ derId: record.id });
  };

  const handleGenerateAudit = () => {
    generateAuditMutation.mutate({ derId: record.id });
  };

  const handleReanalyze = () => {
    reanalyzeMutation.mutate({ derId: record.id });
  };

  const handleRecalculate = () => {
    recalculateMutation.mutate({ derId: record.id });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/records" className="hover:text-foreground transition-colors">Records</Link>
        <span>/</span>
        <span className="text-foreground font-medium">#{record.prNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/records">
              <Button variant="outline" size="sm" className="shadow-sm hover:shadow transition-shadow">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
            </Link>
            <Badge
              variant={record.status === "CONFIRMED" || record.status === "COMPLETE" ? "default" : "secondary"}
              className="text-xs px-2.5 py-0.5"
            >
              {record.status}
            </Badge>
          </div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground leading-tight">
            {record.prTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <a
              href={record.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
            >
              #{record.prNumber}
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              {record.repository.fullName}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {record.prAuthor}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatTimeAgo(new Date(record.createdAt))}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!record.aiSummary && (
            <Button
              variant="outline"
              onClick={handleGenerateAudit}
              disabled={generateAuditMutation.isPending}
              className="shadow-sm hover:shadow transition-shadow"
            >
              <Bot className="w-4 h-4 mr-2" />
              {generateAuditMutation.isPending ? "Analyzing..." : "Generate AI Summary"}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="shadow-sm hover:shadow transition-shadow">
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="shadow-lg">
              <DropdownMenuItem className="cursor-pointer">Export as PDF</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Export as JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {record.status !== "CONFIRMED" && record.status !== "COMPLETE" && (
            <Button
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
              className="shadow-sm hover:shadow-md transition-shadow bg-[#1e3a5f] hover:bg-[#2d4a6f]"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {confirmMutation.isPending ? "Confirming..." : "Confirm Evidence"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evidence Score */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-background to-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Evidence Score
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Overall quality of decision documentation for this PR.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRecalculate}
                  disabled={recalculateMutation.isPending}
                  className="hover:bg-muted/50"
                >
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />
                  {recalculateMutation.isPending ? "Calculating..." : "Recalculate"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <EvidenceScoreBadge score={record.evidenceScore} size="lg" showLabel />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {unresolvedGaps.length > 0 && (
                      <Badge variant="outline" className="text-[#d4883a] border-[#d4883a]/30 bg-[#d4883a]/5">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {unresolvedGaps.length} unresolved gap{unresolvedGaps.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {unresolvedGaps.length === 0 && record.evidenceScore >= 75 && (
                      <Badge variant="outline" className="text-[#4a7c59] border-[#4a7c59]/30 bg-[#4a7c59]/5">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        All gaps resolved
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {record.evidenceScore >= 75
                      ? "This PR has comprehensive documentation and is ready for audit."
                      : record.evidenceScore >= 50
                      ? "Some evidence gaps need attention before this PR is audit-ready."
                      : "Significant documentation is missing. Address the gaps below to improve the score."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Documentation Analysis - Always show this section */}
          <Card className="shadow-sm overflow-hidden border-[#d4a853]/20">
            <CardHeader className="bg-gradient-to-r from-[#d4a853]/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#d4a853]/15 rounded-lg">
                    <Bot className="w-4 h-4 text-[#d4a853]" />
                  </div>
                  <CardTitle>Documentation Analysis</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReanalyze}
                  disabled={reanalyzeMutation.isPending}
                  className="hover:bg-[#d4a853]/10"
                >
                  <RefreshCw className={`w-4 h-4 mr-1.5 ${reanalyzeMutation.isPending ? "animate-spin" : ""}`} />
                  {reanalyzeMutation.isPending ? "Analyzing..." : record.aiDocQuality ? "Re-analyze" : "Analyze"}
                </Button>
              </div>
              <CardDescription className="mt-1">
                AI-powered documentation completeness analysis for audit readiness.
                {record.aiAnalyzedAt && (
                  <span className="ml-1 text-xs">
                    • Last analyzed {formatTimeAgo(new Date(record.aiAnalyzedAt))}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Not analyzed yet state */}
              {!record.aiDocQuality && (
                <div className="text-center py-6 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Not analyzed yet</p>
                  <p className="text-xs mt-1">Click &quot;Analyze&quot; to check documentation completeness</p>
                </div>
              )}

              {/* Documentation Quality and Audit Readiness Badges */}
              {record.aiDocQuality && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    record.aiDocQuality === "COMPLETE" ? "bg-green-100 text-green-800" :
                    record.aiDocQuality === "PARTIAL" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    <FileText className="w-4 h-4" />
                    <span className="font-semibold">
                      {record.aiDocQuality === "COMPLETE" ? "Documentation Complete" :
                       record.aiDocQuality === "PARTIAL" ? "Partial Documentation" :
                       "Insufficient Documentation"}
                    </span>
                  </div>
                  {record.aiIntentAlignment && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      record.aiIntentAlignment === "ALIGNED" ? "bg-green-100 text-green-800" :
                      record.aiIntentAlignment === "UNCLEAR" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-semibold">
                        {record.aiIntentAlignment === "ALIGNED" ? "Intent Aligned" :
                         record.aiIntentAlignment === "UNCLEAR" ? "Intent Unclear" :
                         "Intent Misaligned"}
                      </span>
                    </div>
                  )}
                  {record.aiAuditReadiness && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      record.aiAuditReadiness === "READY" ? "bg-green-100 text-green-800" :
                      record.aiAuditReadiness === "NEEDS_WORK" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {record.aiAuditReadiness === "READY" ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : record.aiAuditReadiness === "NOT_READY" ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <ShieldQuestion className="w-4 h-4" />
                      )}
                      <span className="font-semibold">
                        {record.aiAuditReadiness === "READY" ? "Audit Ready" :
                         record.aiAuditReadiness === "NOT_READY" ? "Not Audit Ready" :
                         "Needs Work"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Missing Context */}
              {record.aiMissingContext && record.aiMissingContext.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-yellow-800">
                    <AlertTriangle className="w-4 h-4" />
                    Missing Context
                  </h4>
                  <ul className="space-y-1.5">
                    {record.aiMissingContext.map((context, index) => (
                      <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">-</span>
                        {context}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Suggestions */}
              {record.aiSuggestions && record.aiSuggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-[#d4a853]" />
                    How to Improve
                  </h4>
                  <ul className="space-y-1.5">
                    {record.aiSuggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-[#d4a853] mt-0.5">→</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Files Changed */}
              {record.filesChanged && record.filesChanged.length > 0 && (
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium mb-2">
                    Files Changed ({record.filesChanged.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto">
                    <ul className="space-y-0.5">
                      {record.filesChanged.slice(0, 20).map((file, index) => (
                        <li key={index} className="text-xs font-mono text-muted-foreground truncate">
                          {file}
                        </li>
                      ))}
                      {record.filesChanged.length > 20 && (
                        <li className="text-xs text-muted-foreground">
                          ... and {record.filesChanged.length - 20} more files
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {record.aiSummary && (
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium mb-2">Audit Summary</h4>
                  <p className="text-sm text-muted-foreground">{record.aiSummary}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compliance Evaluation */}
          <Card className="shadow-sm overflow-hidden border-[#1e3a5f]/20">
            <CardHeader className="bg-gradient-to-r from-[#1e3a5f]/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#1e3a5f]/15 rounded-lg">
                    <ShieldCheck className="w-4 h-4 text-[#1e3a5f]" />
                  </div>
                  <CardTitle>Compliance Evaluation</CardTitle>
                </div>
                {complianceData?.enabledFrameworks && complianceData.enabledFrameworks.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {complianceData.enabledFrameworks.length} framework{complianceData.enabledFrameworks.length !== 1 ? "s" : ""} enabled
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-1">
                Framework-specific compliance status based on this PR&apos;s evidence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {complianceLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : !complianceData?.results || complianceData.results.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <ShieldQuestion className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No frameworks enabled</p>
                  <p className="text-xs mt-1">Enable compliance frameworks in settings to see evaluation results</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {complianceData.results.map((result) => {
                    const statusColors = getStatusColor(result.overallStatus);

                    return (
                      <div
                        key={result.frameworkId}
                        className={`rounded-xl border ${statusColors.border} overflow-hidden`}
                      >
                        {/* Framework Header */}
                        <div className={`px-4 py-3 ${statusColors.bg} flex items-center justify-between`}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{result.frameworkIcon}</span>
                            <span className="font-medium">{result.frameworkName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-lg font-semibold tabular-nums ${statusColors.text}`}>
                              {result.score}%
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${statusColors.text} ${statusColors.border} ${statusColors.bg}`}
                            >
                              {result.overallStatus === "COMPLIANT" ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Compliant</>
                              ) : result.overallStatus === "PARTIAL" ? (
                                <><AlertCircle className="w-3 h-3 mr-1" /> Partial</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" /> Non-Compliant</>
                              )}
                            </Badge>
                          </div>
                        </div>

                        {/* Controls List */}
                        <div className="divide-y divide-border/50">
                          {result.controlResults.map((control) => {
                            const controlColors = getStatusColor(control.status);
                            const isExpanded = expandedControls.has(`${result.frameworkId}-${control.controlId}`);
                            const controlKey = `${result.frameworkId}-${control.controlId}`;

                            return (
                              <div key={control.controlId}>
                                {/* Control Header (clickable) */}
                                <button
                                  onClick={() => toggleControlExpand(controlKey)}
                                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    <div>
                                      <span className="font-mono text-xs text-muted-foreground mr-2">
                                        {control.controlId}
                                      </span>
                                      <span className="text-sm font-medium">{control.controlName}</span>
                                    </div>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${controlColors.text} ${controlColors.border} ${controlColors.bg}`}
                                  >
                                    {control.status === "PASS" ? (
                                      <><CheckCircle className="w-3 h-3 mr-1" /> Pass</>
                                    ) : control.status === "WARNING" ? (
                                      <><AlertTriangle className="w-3 h-3 mr-1" /> Warning</>
                                    ) : (
                                      <><XCircle className="w-3 h-3 mr-1" /> Fail</>
                                    )}
                                  </Badge>
                                </button>

                                {/* Expanded Requirements */}
                                {isExpanded && (
                                  <div className="px-4 pb-4 pt-1 bg-muted/20 space-y-3">
                                    <div className="text-xs text-muted-foreground mb-2">
                                      Category: {control.category}
                                    </div>

                                    {/* Requirements Checklist */}
                                    <div className="space-y-2">
                                      {control.requirements.map((req, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-start gap-2 text-sm"
                                        >
                                          {req.met ? (
                                            <CheckCircle className="w-4 h-4 text-[#4a7c59] mt-0.5 flex-shrink-0" />
                                          ) : req.required ? (
                                            <XCircle className="w-4 h-4 text-[#c45c5c] mt-0.5 flex-shrink-0" />
                                          ) : (
                                            <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                          )}
                                          <div>
                                            <span className={req.met ? "text-foreground" : req.required ? "text-[#c45c5c]" : "text-muted-foreground"}>
                                              {req.name}
                                              {!req.required && <span className="text-xs ml-1">(optional)</span>}
                                            </span>
                                            <p className="text-xs text-muted-foreground mt-0.5">{req.detail}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Recommendation */}
                                    {control.recommendation && (
                                      <div className="mt-3 p-3 rounded-lg bg-[#d4a853]/10 border border-[#d4a853]/20">
                                        <div className="flex items-start gap-2">
                                          <Lightbulb className="w-4 h-4 text-[#d4a853] mt-0.5 flex-shrink-0" />
                                          <div>
                                            <span className="text-xs font-medium text-[#d4a853]">Recommendation</span>
                                            <p className="text-sm text-foreground mt-1">{control.recommendation}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Evidence Summary */}
                  {complianceData.evidence && (
                    <div className="pt-3 border-t">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        Evidence Summary
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground">Reviews</span>
                          <p className="font-medium text-sm">{complianceData.evidence.reviewCount}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground">Approvals</span>
                          <p className="font-medium text-sm">{complianceData.evidence.approvalCount}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground">Tickets</span>
                          <p className="font-medium text-sm">{complianceData.evidence.ticketCount}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground">Files</span>
                          <p className="font-medium text-sm">{complianceData.evidence.filesChangedCount}</p>
                        </div>
                      </div>
                      {complianceData.evidence.hasSelfApproval && (
                        <div className="mt-3 p-2 rounded-lg bg-[#c45c5c]/10 border border-[#c45c5c]/20 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#c45c5c]" />
                          <span className="text-sm text-[#c45c5c]">Self-approval detected - impacts segregation of duties controls</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evidence Gaps */}
          {record.gaps.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#d4883a]/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-[#d4883a]" />
                  </div>
                  Evidence Gaps
                  <Badge variant="outline" className="ml-auto text-xs font-normal">
                    {record.gaps.filter((g) => !g.resolved).length} of {record.gaps.length} unresolved
                  </Badge>
                </CardTitle>
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
                    suggestion={gap.suggestion || undefined}
                    severity={gap.severity}
                    resolved={gap.resolved}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* PR Description */}
          {record.description && (
            <Card className="overflow-hidden border-[#d4a853]/30 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-[#fdf8ef] to-[#faf6f0] border-b border-[#d4a853]/20">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#d4a853]" />
                  <CardTitle className="text-base">PR Description</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="bg-[#fdfbf7] pt-4">
                <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed">
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-transparent border-none p-0 m-0 overflow-visible">
                    {record.description}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evidence Items */}
          {record.evidenceItems.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#1e3a5f]/10 rounded-lg">
                    <FileText className="w-4 h-4 text-[#1e3a5f]" />
                  </div>
                  Evidence Items
                </CardTitle>
                <CardDescription>
                  Documentation captured from the PR and linked resources.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {record.evidenceItems.map((item) => {
                  const getIconAndColor = (type: string) => {
                    switch (type) {
                      case "PR_DESCRIPTION":
                        return { icon: FileText, bg: "bg-blue-50", iconColor: "text-blue-600" };
                      case "JIRA_TICKET":
                        return { icon: Link2, bg: "bg-[#0052cc]/10", iconColor: "text-[#0052cc]" };
                      case "LINEAR_TICKET":
                        return { icon: Link2, bg: "bg-purple-50", iconColor: "text-purple-600" };
                      case "GITHUB_ISSUE":
                        return { icon: Link2, bg: "bg-gray-100", iconColor: "text-gray-700" };
                      case "REVIEW_COMMENT":
                      case "PR_COMMENT":
                        return { icon: MessageSquare, bg: "bg-green-50", iconColor: "text-green-600" };
                      case "SLACK_THREAD":
                        return { icon: MessageSquare, bg: "bg-[#4a154b]/10", iconColor: "text-[#4a154b]" };
                      case "COMMIT_MESSAGE":
                        return { icon: GitBranch, bg: "bg-orange-50", iconColor: "text-orange-600" };
                      default:
                        return { icon: FileText, bg: "bg-gray-50", iconColor: "text-gray-600" };
                    }
                  };
                  const { icon: Icon, bg, iconColor } = getIconAndColor(item.type);

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 hover:border-border hover:shadow-sm transition-all duration-200 cursor-default group"
                    >
                      <div className={`p-2.5 ${bg} rounded-lg group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-4 h-4 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {item.type.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                        </p>
                        {item.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{item.content}</p>
                        )}
                        <p className="text-xs text-muted-foreground/70 mt-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Captured {formatTimeAgo(new Date(item.capturedAt))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {record.reviews.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#4a7c59]/10 rounded-lg">
                    <Users className="w-4 h-4 text-[#4a7c59]" />
                  </div>
                  Reviews
                  <Badge variant="outline" className="ml-auto text-xs font-normal">
                    {record.reviews.filter((r) => r.state === "APPROVED").length} approved
                  </Badge>
                </CardTitle>
                <CardDescription>Code reviews and approvals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {record.reviews.map((review) => (
                  <div key={review.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                      review.state === "APPROVED" ? "bg-[#4a7c59]" : "bg-[#1e3a5f]"
                    }`}>
                      {review.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{review.author}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            review.state === "APPROVED"
                              ? "text-[#4a7c59] border-[#4a7c59]/30 bg-[#4a7c59]/5"
                              : "text-muted-foreground"
                          }`}
                        >
                          {review.state}
                        </Badge>
                      </div>
                      {review.body && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{review.body}</p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1.5">
                        {formatTimeAgo(new Date(review.submittedAt))}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          {record.comments.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#1e3a5f]/10 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-[#1e3a5f]" />
                  </div>
                  Comments
                  <Badge variant="outline" className="ml-auto text-xs font-normal">
                    {record.comments.length}
                  </Badge>
                </CardTitle>
                <CardDescription>Review comments on this PR.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {record.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white font-medium text-sm">
                      {comment.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{comment.author}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{comment.body}</p>
                      {comment.path && (
                        <p className="text-xs font-mono text-muted-foreground/70 mt-1.5 bg-muted/50 px-2 py-0.5 rounded inline-block">
                          {comment.path}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* PR Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-muted-foreground" />
                PR Details
              </CardTitle>
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
              {record.ticketLinks.length > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tickets</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {record.ticketLinks.map((ticket, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {ticket}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {record.prMergedAt && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Merged</span>
                    <span className="text-xs">
                      {new Date(record.prMergedAt).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Evidence Vault */}
          <Card className="shadow-sm border-[#d4a853]/20 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#d4a853]/5 to-transparent pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#d4a853]/15 rounded-lg">
                  <Lock className="w-4 h-4 text-[#d4a853]" />
                </div>
                <CardTitle className="text-base">Evidence Vault</CardTitle>
              </div>
              <CardDescription className="text-xs mt-1">
                Cryptographically sealed evidence package
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {vaultLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : vaultError ? (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                  <p className="text-sm text-red-600">Failed to load vault</p>
                </div>
              ) : vaultSummary ? (
                <>
                  {/* Sealed Badge */}
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <Lock className="w-3 h-3 mr-1" />
                      Sealed
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {vaultSummary.sealedAt && formatTimeAgo(new Date(vaultSummary.sealedAt))}
                    </span>
                  </div>

                  {/* Hash */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Integrity Hash</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono flex-1 truncate">
                        {vaultSummary.hashShort}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(vaultSummary.hash);
                          setHashCopied(true);
                          setTimeout(() => setHashCopied(false), 2000);
                        }}
                      >
                        {hashCopied ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Reviews</span>
                      <p className="font-medium">{vaultSummary.reviewCount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Approvals</span>
                      <p className="font-medium">{vaultSummary.approvalCount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tickets</span>
                      <p className="font-medium">{vaultSummary.ticketCount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Score</span>
                      <p className="font-medium">{vaultSummary.evidenceScore}/100</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Verify Button */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={async () => {
                        const result = await verifyMutation.mutateAsync({ vaultId: vaultSummary.id });
                        setVerifyResult(result);
                      }}
                      disabled={verifyMutation.isPending}
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      {verifyMutation.isPending ? "Verifying..." : "Verify Integrity"}
                    </Button>

                    {verifyResult && (
                      <div className={`text-xs p-2 rounded ${verifyResult.valid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {verifyResult.valid ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Integrity verified - no tampering detected
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {verifyResult.reason}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : record.prState === "MERGED" ? (
                <div className="text-center py-4">
                  <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No vault found for this merged PR
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => createVaultMutation.mutate({ derId: record.id })}
                    disabled={createVaultMutation.isPending}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {createVaultMutation.isPending ? "Creating..." : "Create Vault"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Lock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    Vault will be created when this PR is merged
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confirmations */}
          {record.confirmations.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#4a7c59]" />
                  Confirmations
                  <Badge variant="outline" className="ml-auto text-xs font-normal text-[#4a7c59] border-[#4a7c59]/30 bg-[#4a7c59]/5">
                    {record.confirmations.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {record.confirmations.map((confirmation) => (
                  <div key={confirmation.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#4a7c59]/5">
                    <CheckCircle className="w-4 h-4 text-[#4a7c59]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {confirmation.user.name || confirmation.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(new Date(confirmation.confirmedAt))}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
