"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { DERCard } from "@/components/der-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { useDERStats, useNeedsAttention } from "@/hooks/use-ders";

// Mock data for recent activity (will be replaced with real activity feed later)
const mockRecentActivity = [
  { id: "1", action: "DER created", target: "PR #234 in acme/app", time: "2 hours ago" },
  { id: "2", action: "Evidence confirmed", target: "PR #210 in acme/app", time: "3 hours ago" },
  { id: "3", action: "Gap resolved", target: "Missing ticket in PR #189", time: "5 hours ago" },
  { id: "4", action: "Repository connected", target: "acme/backend", time: "1 day ago" },
  { id: "5", action: "DER completed", target: "PR #150 in acme/api", time: "2 days ago" },
];

function StatsSection() {
  const { data: stats, isLoading, error } = useDERStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
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
    // Return mock data on error (e.g., no org selected)
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Needs Attention
          </CardTitle>
          <CardDescription>
            Records with evidence gaps that require action.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Needs Attention
        </CardTitle>
        <CardDescription>
          Records with evidence gaps that require action.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          <p className="text-sm text-muted-foreground text-center py-8">
            No records need attention. Great job!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your decision evidence records.
        </p>
      </div>

      {/* Stats overview */}
      <StatsSection />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Needs attention */}
        <div className="lg:col-span-2">
          <NeedsAttentionSection />
        </div>

        {/* Recent activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across your organization.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentActivity.map((activity) => (
                  <div key={activity.id} className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.target}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
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
