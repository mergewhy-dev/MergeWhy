"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DERCard } from "@/components/der-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ChevronDown, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useDERs } from "@/hooks/use-ders";
import { useRepositories } from "@/hooks/use-repositories";

type StatusFilter = "all" | "PENDING" | "NEEDS_REVIEW" | "COMPLETE";

export default function RecordsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedRepoId, setSelectedRepoId] = useState<string | undefined>(undefined);

  // Fetch repositories for the dropdown
  const { data: repositories } = useRepositories();

  // Fetch records with filters
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDERs({
    status: statusFilter === "all" ? undefined : statusFilter,
    repositoryId: selectedRepoId,
    search: search || undefined,
  });

  // Flatten pages into a single array of records
  const records = data?.pages.flatMap((page) => page.records) ?? [];

  // Get selected repo name for display
  const selectedRepoName = selectedRepoId
    ? repositories?.find((r) => r.id === selectedRepoId)?.fullName
    : "All Repositories";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold tracking-tight">Records</h2>
        <p className="text-muted-foreground mt-1">
          Browse and manage Decision Evidence Records.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or PR number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 shadow-sm"
          />
        </div>

        {/* Repository filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto justify-between min-w-[200px] shadow-sm">
              <span className="truncate">{selectedRepoName}</span>
              <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] shadow-lg">
            <DropdownMenuItem onClick={() => setSelectedRepoId(undefined)} className="cursor-pointer">
              All Repositories
            </DropdownMenuItem>
            {repositories?.map((repo) => (
              <DropdownMenuItem
                key={repo.id}
                onClick={() => setSelectedRepoId(repo.id)}
                className="cursor-pointer"
              >
                {repo.fullName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList className="shadow-sm">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="NEEDS_REVIEW">Needs Review</TabsTrigger>
          <TabsTrigger value="COMPLETE">Complete</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {error.message?.includes("Organization not found")
              ? "No organization selected"
              : "Failed to load records"}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {error.message?.includes("Organization not found")
              ? "Please select an organization from the dropdown above to view your records."
              : error.message || "Please try again later."}
          </p>
        </div>
      )}

      {/* Records list */}
      {!isLoading && !error && records.length > 0 && (
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
      )}

      {/* Empty state */}
      {!isLoading && !error && records.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No records yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Decision Evidence Records will appear here when pull requests are opened
            in your connected repositories.
          </p>
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              "Loading..."
            ) : (
              <>
                Load More
                <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Record count */}
      {!isLoading && !error && records.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {records.length} record{records.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
