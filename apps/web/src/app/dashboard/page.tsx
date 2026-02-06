"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { DERCard } from "@/components/der-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  Settings,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useDERStats, useNeedsAttention } from "@/hooks/use-ders";
import { useComplianceStatus } from "@/hooks/use-compliance";
import { cn } from "@/lib/utils";

function StatsSection() {
  const { data: stats, isLoading, error } = useDERStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="premium-card h-[140px]">
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Records"
          value={0}
          icon={FileText}
          variant="primary"
        />
        <StatsCard
          title="Pending Review"
          value={0}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatsCard
          title="Avg. Score"
          value="--"
          icon={TrendingUp}
          variant="success"
        />
        <StatsCard
          title="This Week"
          value={0}
          icon={Calendar}
          variant="default"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Records"
        value={stats.total}
        icon={FileText}
        variant="primary"
        trend={stats.total > 0 ? { value: 12, label: "vs last month" } : undefined}
        className="animate-in fade-in stagger-1"
      />
      <StatsCard
        title="Pending Review"
        value={stats.pending + stats.needsReview}
        icon={AlertTriangle}
        variant="warning"
        className="animate-in fade-in stagger-2"
      />
      <StatsCard
        title="Avg. Score"
        value={stats.avgScore || "--"}
        icon={TrendingUp}
        variant="success"
        trend={stats.avgScore ? { value: 5, label: "improvement" } : undefined}
        className="animate-in fade-in stagger-3"
      />
      <StatsCard
        title="This Week"
        value={stats.thisWeek}
        icon={Calendar}
        variant="default"
        className="animate-in fade-in stagger-4"
      />
    </div>
  );
}

function NeedsAttentionSection() {
  const { data: records, isLoading, error } = useNeedsAttention();

  if (isLoading) {
    return (
      <Card className="premium-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-warning/5 via-warning/3 to-transparent border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg">Needs Attention</CardTitle>
              <CardDescription>
                Records with evidence gaps that require action.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-warning/5 via-warning/3 to-transparent border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg">Needs Attention</CardTitle>
              <CardDescription>
                Records with evidence gaps that require action.
              </CardDescription>
            </div>
          </div>
          {records && records.length > 0 && (
            <Badge variant="secondary" className="font-semibold">
              {records.length} record{records.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {error ? (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <FileText className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No organization selected</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select an organization to see your records.
            </p>
          </div>
        ) : records && records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record, index) => (
              <div
                key={record.id}
                className={cn("animate-in fade-in", `stagger-${index + 1}`)}
              >
                <DERCard
                  id={record.id}
                  prNumber={record.prNumber}
                  prTitle={record.prTitle}
                  prUrl={record.prUrl}
                  repositoryName={record.repository.fullName}
                  evidenceScore={record.evidenceScore}
                  gapCount={record.gaps.length}
                  status={record.status}
                  createdAt={new Date(record.createdAt)}
                />
              </div>
            ))}
            {records.length > 0 && (
              <Link
                href="/dashboard/records"
                className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all records
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-success/10 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-success" />
            </div>
            <p className="text-sm font-medium text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No records need attention right now.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivitySection() {
  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest updates across your organization.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="text-center py-10 px-4">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Activity Feed</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[220px] mx-auto">
            Coming soon. Track all changes to your records in one place.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ComplianceStatusSection() {
  const { data: complianceStatus, isLoading, error } = useComplianceStatus();

  if (isLoading) {
    return (
      <Card className="premium-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-navy/5 via-navy/3 to-transparent border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy/10 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-navy" />
            </div>
            <CardTitle className="text-lg">Compliance Status</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !complianceStatus?.frameworks.length) {
    return (
      <Card className="premium-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-navy/5 via-navy/3 to-transparent border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy/10 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-navy" />
            </div>
            <div>
              <CardTitle className="text-lg">Compliance Status</CardTitle>
              <CardDescription>Track compliance across your enabled frameworks.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="text-center py-8 px-4">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No frameworks enabled</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enable compliance frameworks in settings.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 mt-4 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Go to Settings
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-navy/5 via-navy/3 to-transparent border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy/10 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-navy" />
            </div>
            <div>
              <CardTitle className="text-lg">Compliance Status</CardTitle>
              <CardDescription>
                Based on {complianceStatus.totalDERs} decision records
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="font-medium">
            {complianceStatus.period}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {complianceStatus.frameworks.map((framework, index) => {
          const isFullyCompliant = framework.overallCompliance >= 80;
          const complianceColor = isFullyCompliant
            ? "text-success"
            : framework.overallCompliance >= 50
            ? "text-amber"
            : "text-error";
          const progressColor = isFullyCompliant
            ? "bg-success"
            : framework.overallCompliance >= 50
            ? "bg-amber"
            : "bg-error";

          return (
            <div
              key={framework.frameworkId}
              className={cn(
                "p-4 rounded-xl border border-border/50 bg-gradient-to-br from-white to-muted/30",
                "hover:border-border hover:shadow-sm transition-all duration-200",
                "animate-in fade-in",
                `stagger-${index + 1}`
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{framework.icon || "🛡️"}</span>
                  <span className="font-semibold text-sm">{framework.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-2xl font-bold tabular-nums", complianceColor)}>
                    {framework.overallCompliance}%
                  </span>
                  {isFullyCompliant && (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full progress-animate", progressColor)}
                    style={{ width: `${framework.overallCompliance}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {framework.compliantControls} of {framework.totalControls} controls satisfied
                  </span>
                  {isFullyCompliant && (
                    <span className="text-success font-medium">Compliant</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome section */}
      <div className="space-y-1">
        <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground">
          Dashboard
        </h2>
        <p className="text-muted-foreground">
          Overview of your decision evidence records and compliance status.
        </p>
      </div>

      {/* Stats overview */}
      <StatsSection />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Needs attention - takes 2 columns */}
        <div className="lg:col-span-2">
          <NeedsAttentionSection />
        </div>

        {/* Sidebar cards */}
        <div className="space-y-6">
          <ComplianceStatusSection />
          <RecentActivitySection />
        </div>
      </div>
    </div>
  );
}
