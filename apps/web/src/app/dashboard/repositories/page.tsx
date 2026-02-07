"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings, GitBranch, ExternalLink, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useRepositories, useRepositoryStats } from "@/hooks/use-repositories";
import { ConnectGitHub, EmptyStateGitHub } from "@/components/connect-github";
import { cn } from "@/lib/utils";

function getScoreColor(score: number): string {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-amber";
  return "text-error";
}

function getScoreBadgeColor(score: number): string {
  if (score >= 75) return "bg-success/10 text-success border-success/30";
  if (score >= 50) return "bg-amber/10 text-amber border-amber/30";
  return "bg-error/10 text-error border-error/30";
}

function StatsCards() {
  const { data: stats, isLoading } = useRepositoryStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="premium-card">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Repositories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats?.total || 0}</p>
        </CardContent>
      </Card>
      <Card className="premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold">{stats?.active || 0}</p>
            {stats?.active && stats.active > 0 && (
              <CheckCircle2 className="w-5 h-5 text-success" />
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="premium-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Decision Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats?.totalDERs || 0}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function RepositoriesTable() {
  const { data: repositories, isLoading, error } = useRepositories();

  if (isLoading) {
    return (
      <Card className="premium-card">
        <CardHeader>
          <CardTitle>Connected Repositories</CardTitle>
          <CardDescription>
            Repositories with MergeWhy GitHub App installed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    // Check if it's an organization not found error (user needs to select org)
    const isOrgError = error.message?.includes("Organization not found");
    return (
      <Card className="premium-card">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {isOrgError ? "No organization selected" : "Failed to load repositories"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isOrgError
                ? "Please select an organization from the dropdown above."
                : error.message || "Please try again later."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!repositories || repositories.length === 0) {
    return (
      <Card className="premium-card">
        <CardContent className="py-12">
          <EmptyStateGitHub />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="premium-card overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <GitBranch className="w-4 h-4 text-primary" />
              </div>
              Connected Repositories
            </CardTitle>
            <CardDescription className="mt-1">
              Repositories with MergeWhy GitHub App installed.
            </CardDescription>
          </div>
          <ConnectGitHub variant="outline" size="sm">
            Add Repository
          </ConnectGitHub>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Repository</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Records</TableHead>
              <TableHead className="text-right">Avg Score</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repositories.map((repo) => (
              <TableRow key={repo.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                      <GitBranch className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <a
                        href={`https://github.com/${repo.fullName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {repo.fullName}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      <p className="text-xs text-muted-foreground">
                        Default: {repo.defaultBranch}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      repo.isActive
                        ? "bg-success/10 text-success border-success/30"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {repo.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Paused
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {repo.totalDERs}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={getScoreBadgeColor(repo.avgScore)}>
                    {repo.avgScore}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {repo.pendingCount > 0 ? (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {repo.pendingCount}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">0</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/repositories/${repo.id}/settings`}>
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
  );
}

export default function RepositoriesPage() {
  const { data: repositories } = useRepositories();
  const hasRepositories = repositories && repositories.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold tracking-tight">Repositories</h2>
          <p className="text-muted-foreground mt-1">
            Manage connected GitHub repositories.
          </p>
        </div>
        {hasRepositories && (
          <ConnectGitHub>
            Add Repository
          </ConnectGitHub>
        )}
      </div>

      {/* Stats - only show if we have repos */}
      {hasRepositories && <StatsCards />}

      {/* Repositories table or empty state */}
      <RepositoriesTable />
    </div>
  );
}
