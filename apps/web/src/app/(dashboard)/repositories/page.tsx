import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Settings, GitBranch, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

// Mock data - replace with real data
const mockRepositories = [
  {
    id: "1",
    name: "acme/app",
    fullName: "acme/app",
    isActive: true,
    defaultBranch: "main",
    totalDERs: 23,
    avgScore: 78,
    pendingCount: 3,
  },
  {
    id: "2",
    name: "acme/backend",
    fullName: "acme/backend",
    isActive: true,
    defaultBranch: "main",
    totalDERs: 15,
    avgScore: 82,
    pendingCount: 1,
  },
  {
    id: "3",
    name: "acme/payments",
    fullName: "acme/payments",
    isActive: true,
    defaultBranch: "main",
    totalDERs: 8,
    avgScore: 65,
    pendingCount: 4,
  },
  {
    id: "4",
    name: "acme/api",
    fullName: "acme/api",
    isActive: false,
    defaultBranch: "master",
    totalDERs: 45,
    avgScore: 71,
    pendingCount: 0,
  },
];

function getScoreColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

export default async function RepositoriesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Repositories</h2>
          <p className="text-muted-foreground">
            Manage connected GitHub repositories.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Connect Repository
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{mockRepositories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {mockRepositories.filter((r) => r.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total DERs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {mockRepositories.reduce((acc, r) => acc + r.totalDERs, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Repositories table */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Repositories</CardTitle>
          <CardDescription>
            Repositories with MergeWhy GitHub App installed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repository</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total DERs</TableHead>
                <TableHead className="text-right">Avg Score</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRepositories.map((repo) => (
                <TableRow key={repo.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <a
                          href={`https://github.com/${repo.fullName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline flex items-center gap-1"
                        >
                          {repo.fullName}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <p className="text-xs text-muted-foreground">
                          Default: {repo.defaultBranch}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={repo.isActive ? "default" : "secondary"}>
                      {repo.isActive ? "Active" : "Paused"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{repo.totalDERs}</TableCell>
                  <TableCell className={`text-right font-medium ${getScoreColor(repo.avgScore)}`}>
                    {repo.avgScore}
                  </TableCell>
                  <TableCell className="text-right">
                    {repo.pendingCount > 0 ? (
                      <Badge variant="outline">{repo.pendingCount}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/repositories/${repo.id}/settings`}>
                        <Settings className="w-4 h-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Empty state hint */}
      {mockRepositories.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No repositories connected</h3>
            <p className="text-muted-foreground mb-4">
              Connect your GitHub repositories to start tracking decision evidence.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Connect Repository
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
