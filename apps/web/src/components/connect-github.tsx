"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectGitHubProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function ConnectGitHub({
  variant = "default",
  size = "default",
  className,
  showIcon = true,
  children,
}: ConnectGitHubProps) {
  const [isLoading, setIsLoading] = useState(false);

  const githubAppSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "mergewhy-dev";
  const installUrl = `https://github.com/apps/${githubAppSlug}/installations/new`;

  const handleConnect = () => {
    setIsLoading(true);
    // Open in new tab
    window.open(installUrl, "_blank", "noopener,noreferrer");
    // Reset loading state after a short delay
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleConnect}
      disabled={isLoading}
      className={cn(
        variant === "default" && "bg-[#24292f] hover:bg-[#24292f]/90 text-white",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : showIcon ? (
        <Github className="w-4 h-4 mr-2" />
      ) : null}
      {children || "Connect GitHub"}
      {!isLoading && <ExternalLink className="w-3 h-3 ml-2 opacity-60" />}
    </Button>
  );
}

interface GitHubConnectionStatusProps {
  isConnected: boolean;
  username?: string;
  installationCount?: number;
  onManage?: () => void;
  onConnect?: () => void;
}

export function GitHubConnectionStatus({
  isConnected,
  username,
  installationCount = 0,
  onManage,
  onConnect,
}: GitHubConnectionStatusProps) {
  const githubAppSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "mergewhy-dev";

  if (isConnected) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-xl bg-gradient-to-r from-green-50 to-transparent border-green-200">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#24292f] rounded-lg flex items-center justify-center">
            <Github className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">GitHub</p>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              {username ? `Connected as @${username}` : "Connected"}
              {installationCount > 0 && ` · ${installationCount} ${installationCount === 1 ? "repository" : "repositories"}`}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onManage}
          asChild={!onManage}
        >
          {onManage ? (
            "Manage"
          ) : (
            <a
              href={`https://github.com/apps/${githubAppSlug}/installations/new`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Manage
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-xl">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#24292f] rounded-lg flex items-center justify-center">
          <Github className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-medium">GitHub</p>
          <p className="text-sm text-muted-foreground">
            Pull requests and code reviews
          </p>
        </div>
      </div>
      <ConnectGitHub variant="default" size="sm" />
    </div>
  );
}

interface EmptyStateGitHubProps {
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyStateGitHub({
  title = "Connect Your GitHub",
  description = "Install the MergeWhy GitHub App to start capturing decision evidence from your pull requests.",
  className,
}: EmptyStateGitHubProps) {
  return (
    <div className={cn("text-center py-12 px-6", className)}>
      <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#24292f] to-[#40464e] rounded-2xl flex items-center justify-center shadow-lg">
        <Github className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        {description}
      </p>
      <ConnectGitHub size="lg" className="px-8" />
      <p className="text-xs text-muted-foreground mt-4">
        Takes less than 2 minutes
      </p>
    </div>
  );
}
