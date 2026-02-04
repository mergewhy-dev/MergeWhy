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
import { Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type StatusFilter = "all" | "pending" | "needs_review" | "complete";

// Mock data - replace with real data
const mockRecords = [
  {
    id: "1",
    prNumber: 234,
    prTitle: "Add user authentication with OAuth2 support",
    prUrl: "https://github.com/acme/app/pull/234",
    repositoryName: "acme/app",
    evidenceScore: 85,
    gapCount: 0,
    status: "COMPLETE" as const,
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
    status: "NEEDS_REVIEW" as const,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: "3",
    prNumber: 89,
    prTitle: "Refactor payment processing module for better performance",
    prUrl: "https://github.com/acme/payments/pull/89",
    repositoryName: "acme/payments",
    evidenceScore: 72,
    gapCount: 1,
    status: "CONFIRMED" as const,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "4",
    prNumber: 445,
    prTitle: "Update dependencies and security patches",
    prUrl: "https://github.com/acme/app/pull/445",
    repositoryName: "acme/app",
    evidenceScore: 35,
    gapCount: 3,
    status: "PENDING" as const,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
  {
    id: "5",
    prNumber: 201,
    prTitle: "Add comprehensive logging for API endpoints",
    prUrl: "https://github.com/acme/api/pull/201",
    repositoryName: "acme/api",
    evidenceScore: 92,
    gapCount: 0,
    status: "COMPLETE" as const,
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
  },
  {
    id: "6",
    prNumber: 88,
    prTitle: "Implement rate limiting for public endpoints",
    prUrl: "https://github.com/acme/api/pull/88",
    repositoryName: "acme/api",
    evidenceScore: 28,
    gapCount: 4,
    status: "INCOMPLETE" as const,
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
  },
];

const repositories = ["All Repositories", "acme/app", "acme/backend", "acme/payments", "acme/api"];

export default function RecordsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedRepo, setSelectedRepo] = useState("All Repositories");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filteredRecords = mockRecords.filter((record) => {
    const matchesSearch =
      record.prTitle.toLowerCase().includes(search.toLowerCase()) ||
      record.prNumber.toString().includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && record.status === "PENDING") ||
      (statusFilter === "needs_review" && record.status === "NEEDS_REVIEW") ||
      (statusFilter === "complete" && (record.status === "COMPLETE" || record.status === "CONFIRMED"));

    const matchesRepo =
      selectedRepo === "All Repositories" || record.repositoryName === selectedRepo;

    return matchesSearch && matchesStatus && matchesRepo;
  });

  const totalPages = Math.ceil(filteredRecords.length / perPage);
  const paginatedRecords = filteredRecords.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Records</h2>
        <p className="text-muted-foreground">
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
            className="pl-9"
          />
        </div>

        {/* Repository filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto justify-between">
              {selectedRepo}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {repositories.map((repo) => (
              <DropdownMenuItem
                key={repo}
                onClick={() => setSelectedRepo(repo)}
              >
                {repo}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="needs_review">Needs Review</TabsTrigger>
          <TabsTrigger value="complete">Complete</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Records list */}
      {paginatedRecords.length > 0 ? (
        <div className="space-y-3">
          {paginatedRecords.map((record) => (
            <DERCard key={record.id} {...record} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No records found matching your filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1} to{" "}
            {Math.min(page * perPage, filteredRecords.length)} of {filteredRecords.length} records
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
