"use client";

import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { User } from "lucide-react";

function hasValidClerkKeys(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(publishableKey && !publishableKey.includes("YOUR_KEY_HERE"));
}

interface SafeUserButtonProps {
  appearance?: {
    elements?: {
      avatarBox?: string;
    };
  };
  afterSignOutUrl?: string;
}

export function SafeUserButton({ appearance, afterSignOutUrl = "/" }: SafeUserButtonProps) {
  if (!hasValidClerkKeys()) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
        <User className="w-4 h-4 text-slate-500" />
      </div>
    );
  }

  return (
    <UserButton
      appearance={appearance}
      afterSignOutUrl={afterSignOutUrl}
    />
  );
}

interface SafeOrganizationSwitcherProps {
  appearance?: {
    elements?: {
      rootBox?: string;
      organizationSwitcherTrigger?: string;
      organizationPreview?: string;
      organizationPreviewTextContainer?: string;
      organizationSwitcherTriggerIcon?: string;
    };
  };
}

export function SafeOrganizationSwitcher({ appearance }: SafeOrganizationSwitcherProps) {
  if (!hasValidClerkKeys()) {
    return (
      <div className="w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-sm bg-sidebar-accent/50 text-sidebar-foreground rounded-lg border border-sidebar-border/50">
        <div className="w-6 h-6 rounded bg-amber/80 flex items-center justify-center text-xs font-bold text-sidebar">
          O
        </div>
        <span className="truncate flex-1">Organization</span>
      </div>
    );
  }

  return <OrganizationSwitcher appearance={appearance} />;
}
