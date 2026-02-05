"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Link2, Shield, ShieldCheck, CheckCircle2, Terminal } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { useFrameworks, useOrganizationFrameworks, useEnableFramework, useDisableFramework } from "@/hooks/use-compliance";
import { toast } from "sonner";

function ComplianceFrameworksSection() {
  const { data: frameworks, isLoading: frameworksLoading } = useFrameworks();
  const { data: orgFrameworks, isLoading: orgFrameworksLoading } = useOrganizationFrameworks();
  const enableFramework = useEnableFramework();
  const disableFramework = useDisableFramework();

  // Confirmation dialog state
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [frameworkToDisable, setFrameworkToDisable] = useState<{ id: string; name: string } | null>(null);

  const isLoading = frameworksLoading || orgFrameworksLoading;
  const enabledFrameworkIds = new Set(orgFrameworks?.map((of) => of.frameworkId) ?? []);

  const handleToggleFramework = async (frameworkId: string, frameworkName: string, enabled: boolean) => {
    if (!enabled) {
      // Show confirmation dialog before disabling
      setFrameworkToDisable({ id: frameworkId, name: frameworkName });
      setDisableDialogOpen(true);
      return;
    }

    try {
      await enableFramework.mutateAsync({ frameworkId });
      toast.success(`${frameworkName} enabled`, {
        description: "Compliance tracking is now active for this framework.",
      });
    } catch {
      toast.error("Failed to enable framework");
    }
  };

  const handleConfirmDisable = async () => {
    if (!frameworkToDisable) return;

    try {
      await disableFramework.mutateAsync({ frameworkId: frameworkToDisable.id });
      toast.success(`${frameworkToDisable.name} disabled`, {
        description: "Compliance tracking has been removed for this framework.",
      });
    } catch {
      toast.error("Failed to disable framework");
    } finally {
      setDisableDialogOpen(false);
      setFrameworkToDisable(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-[#1e3a5f]/5 to-transparent">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const isPending = enableFramework.isPending || disableFramework.isPending;

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-[#1e3a5f]/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-[#1e3a5f]/10 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-[#1e3a5f]" />
            </div>
            Compliance Frameworks
          </CardTitle>
          <CardDescription>
            Select the compliance frameworks your organization needs to adhere to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {frameworks?.map((framework) => {
            const isEnabled = enabledFrameworkIds.has(framework.id);

            return (
              <div
                key={framework.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isEnabled
                    ? "border-[#4a7c59]/30 bg-[#4a7c59]/5"
                    : "border-border/50 hover:border-border hover:bg-muted/30"
                }`}
              >
                {/* Framework Icon (Emoji) */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                  isEnabled ? "bg-[#4a7c59]/10" : "bg-muted"
                }`}>
                  {framework.icon || "🛡️"}
                </div>

                {/* Framework Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm">{framework.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {framework.controlCount} controls
                    </Badge>
                    {isEnabled && (
                      <Badge variant="outline" className="text-xs text-[#4a7c59] border-[#4a7c59]/30 bg-[#4a7c59]/5">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                    {framework.description}
                  </p>
                </div>

                {/* Toggle Switch */}
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) =>
                    handleToggleFramework(framework.id, framework.name, checked)
                  }
                  disabled={isPending}
                  className="flex-shrink-0"
                />
              </div>
            );
          })}

          {/* Empty State */}
          {frameworks?.length === 0 && (
            <div className="text-center py-8 border border-dashed rounded-xl">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm font-medium text-foreground">No frameworks found</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Run the seed script to add compliance frameworks.
              </p>
              <div className="bg-muted/50 rounded-lg p-3 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Terminal className="w-3 h-3" />
                  <span>Terminal</span>
                </div>
                <code className="text-xs font-mono text-foreground">
                  cd packages/database && pnpm seed:frameworks
                </code>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable {frameworkToDisable?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove compliance tracking for this framework. Your organization will no longer be evaluated against its controls. You can re-enable it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDisable}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disable Framework
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SettingsForm() {
  const { data: settings, isLoading, error } = useSettings();
  const updateSettings = useUpdateSettings();

  const handleToggle = async (
    key: "requireTicketLink" | "requireDescription" | "blockMergeOnGaps",
    value: boolean
  ) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
      toast.success("Settings updated");
    } catch {
      toast.error("Failed to update settings");
    }
  };

  const handleMinReviewersChange = async (value: number) => {
    try {
      await updateSettings.mutateAsync({ minReviewers: value });
      toast.success("Settings updated");
    } catch {
      toast.error("Failed to update settings");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-11" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Evidence Requirements
          </CardTitle>
          <CardDescription>
            Select an organization to configure evidence requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Please select an organization from the sidebar.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 bg-[#d4a853]/10 rounded-lg">
            <Shield className="w-4 h-4 text-[#d4a853]" />
          </div>
          Evidence Requirements
        </CardTitle>
        <CardDescription>
          Configure what evidence is required for PRs in your organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require Ticket Link</Label>
            <p className="text-sm text-muted-foreground">
              PRs must have a linked Jira, Linear, or GitHub issue.
            </p>
          </div>
          <Switch
            checked={settings?.requireTicketLink ?? true}
            onCheckedChange={(checked) => handleToggle("requireTicketLink", checked)}
            disabled={updateSettings.isPending}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require Description</Label>
            <p className="text-sm text-muted-foreground">
              PRs must have a non-empty description.
            </p>
          </div>
          <Switch
            checked={settings?.requireDescription ?? true}
            onCheckedChange={(checked) => handleToggle("requireDescription", checked)}
            disabled={updateSettings.isPending}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Minimum Reviewers</Label>
            <p className="text-sm text-muted-foreground">
              Minimum number of approving reviews required.
            </p>
          </div>
          <Input
            type="number"
            min={0}
            max={5}
            value={settings?.minReviewers ?? 1}
            onChange={(e) => handleMinReviewersChange(parseInt(e.target.value) || 0)}
            className="w-20"
            disabled={updateSettings.isPending}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Block Merge on Gaps</Label>
            <p className="text-sm text-muted-foreground">
              Prevent merging PRs that have unresolved evidence gaps.
            </p>
          </div>
          <Switch
            checked={settings?.blockMergeOnGaps ?? false}
            onCheckedChange={(checked) => handleToggle("blockMergeOnGaps", checked)}
            disabled={updateSettings.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Configure compliance frameworks, evidence requirements, and integrations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compliance Frameworks */}
          <ComplianceFrameworksSection />

          {/* Requirements */}
          <SettingsForm />

          {/* Integrations */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Link2 className="w-4 h-4 text-primary" />
                </div>
                Integrations
              </CardTitle>
              <CardDescription>
                Connect external services for enhanced evidence collection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">GitHub</p>
                    <p className="text-sm text-muted-foreground">Pull requests and reviews</p>
                  </div>
                </div>
                <Badge variant="default">Connected</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">J</span>
                  </div>
                  <div>
                    <p className="font-medium">Jira</p>
                    <p className="text-sm text-muted-foreground">Issue tracking</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">L</span>
                  </div>
                  <div>
                    <p className="font-medium">Linear</p>
                    <p className="text-sm text-muted-foreground">Issue tracking</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#4A154B] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div>
                    <p className="font-medium">Slack</p>
                    <p className="text-sm text-muted-foreground">Linked thread context</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team
              </CardTitle>
              <CardDescription>Manage organization members.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Team management is handled through Clerk Organizations.
              </p>
              <Button variant="outline" className="w-full">
                Manage Team
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
