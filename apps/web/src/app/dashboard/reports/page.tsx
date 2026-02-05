import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/stats-card";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Mock data
const mockMonthlyStats = [
  { month: "Jan", ders: 12, avgScore: 68 },
  { month: "Feb", ders: 18, avgScore: 72 },
  { month: "Mar", ders: 15, avgScore: 75 },
  { month: "Apr", ders: 22, avgScore: 71 },
  { month: "May", ders: 28, avgScore: 78 },
  { month: "Jun", ders: 24, avgScore: 82 },
];

const mockTopGaps = [
  { type: "Missing Description", count: 23, percentage: 35 },
  { type: "Missing Ticket Link", count: 18, percentage: 27 },
  { type: "Insufficient Context", count: 15, percentage: 23 },
  { type: "No Testing Evidence", count: 10, percentage: 15 },
];

const mockRepoPerformance = [
  { name: "acme/app", ders: 23, avgScore: 78, trend: 5 },
  { name: "acme/backend", ders: 15, avgScore: 82, trend: 8 },
  { name: "acme/payments", ders: 8, avgScore: 65, trend: -3 },
  { name: "acme/api", ders: 45, avgScore: 71, trend: 2 },
];

export default async function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            Analytics and insights for your decision evidence.
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Overview stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total DERs (6 months)"
          value={119}
          trend={{ value: 15, label: "vs previous period" }}
          icon={FileText}
        />
        <StatsCard
          title="Avg Evidence Score"
          value="74"
          trend={{ value: 8, label: "improvement" }}
          icon={TrendingUp}
        />
        <StatsCard
          title="Gaps Resolved"
          value="89%"
          trend={{ value: 12, label: "from last month" }}
          icon={CheckCircle}
        />
        <StatsCard
          title="Active Repos"
          value="4"
          trend={{ value: 0, label: "no change" }}
          icon={BarChart3}
        />
      </div>

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly Trend
            </CardTitle>
            <CardDescription>DERs created and average scores over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockMonthlyStats.map((stat) => (
                <div key={stat.month} className="flex items-center gap-4">
                  <span className="w-8 text-sm text-muted-foreground">{stat.month}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full"
                        style={{ width: `${(stat.ders / 30) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{stat.ders}</span>
                  </div>
                  <div className="flex items-center gap-2 w-24 justify-end">
                    <span
                      className={`text-sm font-medium ${
                        stat.avgScore >= 75
                          ? "text-green-600"
                          : stat.avgScore >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {stat.avgScore}
                    </span>
                    <span className="text-xs text-muted-foreground">avg</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top gaps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Common Evidence Gaps
            </CardTitle>
            <CardDescription>Most frequent issues across all DERs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTopGaps.map((gap) => (
                <div key={gap.type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{gap.type}</span>
                    <span className="text-muted-foreground">{gap.count} occurrences</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${gap.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repository performance */}
      <Card>
        <CardHeader>
          <CardTitle>Repository Performance</CardTitle>
          <CardDescription>Evidence quality by repository.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRepoPerformance.map((repo) => (
              <div key={repo.name} className="flex items-center gap-4">
                <div className="w-40 truncate">
                  <span className="text-sm font-medium">{repo.name}</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        repo.avgScore >= 75
                          ? "bg-green-500"
                          : repo.avgScore >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${repo.avgScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8">{repo.avgScore}</span>
                </div>
                <div className="w-20 text-right">
                  <Badge variant="secondary">{repo.ders} DERs</Badge>
                </div>
                <div className="w-16 text-right">
                  <span
                    className={`text-sm ${
                      repo.trend > 0
                        ? "text-green-600"
                        : repo.trend < 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {repo.trend > 0 ? "+" : ""}
                    {repo.trend}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
