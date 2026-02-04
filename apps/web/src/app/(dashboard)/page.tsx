import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { DERCard } from "@/components/der-card";
import { FileText, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

// Mock data - replace with real data from database
const mockStats = {
  totalRecords: 47,
  totalTrend: 12,
  pendingReview: 8,
  pendingTrend: -5,
  avgScore: 72,
  scoreTrend: 3,
  thisWeek: 12,
  weekTrend: 25,
};

const mockNeedsAttention = [
  {
    id: "1",
    prNumber: 234,
    prTitle: "Add user authentication with OAuth2 support",
    prUrl: "https://github.com/acme/app/pull/234",
    repositoryName: "acme/app",
    evidenceScore: 35,
    gapCount: 3,
    status: "NEEDS_REVIEW" as const,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "2",
    prNumber: 156,
    prTitle: "Fix database connection pooling issues in production",
    prUrl: "https://github.com/acme/backend/pull/156",
    repositoryName: "acme/backend",
    evidenceScore: 45,
    gapCount: 2,
    status: "PENDING" as const,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: "3",
    prNumber: 89,
    prTitle: "Refactor payment processing module",
    prUrl: "https://github.com/acme/payments/pull/89",
    repositoryName: "acme/payments",
    evidenceScore: 28,
    gapCount: 4,
    status: "INCOMPLETE" as const,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

const mockRecentActivity = [
  { id: "1", action: "DER created", target: "PR #234 in acme/app", time: "2 hours ago" },
  { id: "2", action: "Evidence confirmed", target: "PR #210 in acme/app", time: "3 hours ago" },
  { id: "3", action: "Gap resolved", target: "Missing ticket in PR #189", time: "5 hours ago" },
  { id: "4", action: "Repository connected", target: "acme/backend", time: "1 day ago" },
  { id: "5", action: "DER completed", target: "PR #150 in acme/api", time: "2 days ago" },
];

export default async function DashboardPage() {
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Records"
          value={mockStats.totalRecords}
          trend={{ value: mockStats.totalTrend, label: "from last month" }}
          icon={FileText}
        />
        <StatsCard
          title="Pending Review"
          value={mockStats.pendingReview}
          trend={{ value: mockStats.pendingTrend, label: "from last week" }}
          icon={AlertTriangle}
        />
        <StatsCard
          title="Avg. Score"
          value={mockStats.avgScore}
          trend={{ value: mockStats.scoreTrend, label: "from last month" }}
          icon={TrendingUp}
        />
        <StatsCard
          title="This Week"
          value={mockStats.thisWeek}
          trend={{ value: mockStats.weekTrend, label: "from last week" }}
          icon={Calendar}
        />
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Needs attention */}
        <div className="lg:col-span-2">
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
              {mockNeedsAttention.length > 0 ? (
                <div className="space-y-3">
                  {mockNeedsAttention.map((der) => (
                    <DERCard key={der.id} {...der} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No records need attention. Great job!
                </p>
              )}
            </CardContent>
          </Card>
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
