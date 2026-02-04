"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Save, Users, Link2, Shield } from "lucide-react";

// Note: Switch component may need to be added via shadcn
// pnpm dlx shadcn@latest add switch

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    requireTicketLink: true,
    requireDescription: true,
    minReviewers: 1,
    blockMergeOnGaps: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure evidence requirements and integrations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evidence Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
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
                  checked={settings.requireTicketLink}
                  onCheckedChange={() => handleToggle("requireTicketLink")}
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
                  checked={settings.requireDescription}
                  onCheckedChange={() => handleToggle("requireDescription")}
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
                  value={settings.minReviewers}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      minReviewers: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-20"
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
                  checked={settings.blockMergeOnGaps}
                  onCheckedChange={() => handleToggle("blockMergeOnGaps")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
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

          {/* Save button */}
          <Button className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
