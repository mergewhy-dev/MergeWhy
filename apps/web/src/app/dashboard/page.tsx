"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { DERCard } from "@/components/der-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertTriangle, TrendingUp, Calendar, Clock, Sparkles, ShieldCheck, Settings } from "lucide-react";
import { useDERStats, useNeedsAttention } from "@/hooks/use-ders";
import { useComplianceStatus } from "@/hooks/use-compliance";

function StatsSection() {
  const { data: stats, isLoading, error } = useDERStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="card-shadow">
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Records"
          value={0}
          icon={FileText}
        />
        <StatsCard
          title="Pending Review"
          value={0}
          icon={AlertTriangle}
        />
        <StatsCard
          title="Avg. Score"
          value="--"
          icon={TrendingUp}
        />
        <StatsCard
          title="This Week"
          value={0}
          icon={Calendar}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Records"
        value={stats.total}
        icon={FileText}
      />
      <StatsCard
        title="Pending Review"
        value={stats.pending + stats.needsReview}
        icon={AlertTriangle}
      />
      <StatsCard
        title="Avg. Score"
        value={stats.avgScore || "--"}
        icon={TrendingUp}
      />
      <StatsCard
        title="This Week"
        value={stats.thisWeek}
        icon={Calendar}
      />
    </div>
  );
}

function NeedsAttentionSection() {
  const { data: records, isLoading, error } = useNeedsAttention();

  if (isLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#d4883a]" />
            Needs Attention
          </CardTitle>
          <CardDescription>
            Records with evidence gaps that require action.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-gradient-to-r from-[#d4883a]/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 bg-[#d4883a]/15 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-[#d4883a]" />
          </div>
          Needs Attention
          {records && records.length > 0 && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {records.length} record{records.length !== 1 ? "s" : ""}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Records with evidence gaps that require action.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {error ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Select an organization to see records.
          </p>
        ) : records && records.length > 0 ? (
          <div className="space-y-3">
            {records.map((record) => (
              <DERCard
                key={record.id}
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
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#4a7c59]/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#4a7c59]" />
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
    <Card className="shadow-sm">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/15 rounded-lg">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          Recent Activity
        </CardTitle>
        <CardDescription>Latest updates across your organization.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Activity Feed</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[200px] mx-auto">
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
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-[#1e3a5f]/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-[#1e3a5f]/15 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-[#1e3a5f]" />
            </div>
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !complianceStatus?.frameworks.length) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-[#1e3a5f]/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-[#1e3a5f]/15 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-[#1e3a5f]" />
            </div>
            Compliance Status
          </CardTitle>
          <CardDescription>Track compliance across your enabled frameworks.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No frameworks enabled</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enable compliance frameworks in settings to track compliance.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3"
            >
              <Settings className="w-3 h-3" />
              Go to Settings
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-gradient-to-r from-[#1e3a5f]/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 bg-[#1e3a5f]/15 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-[#1e3a5f]" />
          </div>
          Compliance Status
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            Last {complianceStatus.period}
          </span>
        </CardTitle>
        <CardDescription>
          Based on {complianceStatus.totalDERs} decision records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {complianceStatus.frameworks.map((framework) => {
          const isFullyCompliant = framework.overallCompliance >= 80;
          const complianceColor = isFullyCompliant
            ? "text-[#4a7c59]"
            : framework.overallCompliance >= 50
            ? "text-[#d4a853]"
            : "text-[#c45c5c]";
          const progressColor = isFullyCompliant
            ? "bg-[#4a7c59]"
            : framework.overallCompliance >= 50
            ? "bg-[#d4a853]"
            : "bg-[#c45c5c]";

          return (
            <div
              key={framework.frameworkId}
              className="p-4 rounded-xl border border-border/50 hover:border-border transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{framework.icon || "🛡️"}</span>
                  <span className="font-medium text-sm">{framework.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-semibold tabular-nums ${complianceColor}`}>
                    {framework.overallCompliance}%
                  </span>
                  {isFullyCompliant && (
                    <Badge variant="outline" className="text-xs text-[#4a7c59] border-[#4a7c59]/30 bg-[#4a7c59]/5">
                      Compliant
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${progressColor} transition-all duration-500`}
                    style={{ width: `${framework.overallCompliance}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {framework.compliantControls} of {framework.totalControls} controls satisfied
                  </span>
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome section */}
      <div>
        <h2 className="text-2xl font-serif font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Overview of your decision evidence records and compliance status.
        </p>
      </div>

      {/* Stats overview */}
      <StatsSection />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Needs attention */}
        <div className="lg:col-span-2 space-y-6">
          <NeedsAttentionSection />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Compliance Status */}
          <ComplianceStatusSection />

          {/* Recent activity */}
          <RecentActivitySection />
        </div>
      </div>
    </div>
  );
}
