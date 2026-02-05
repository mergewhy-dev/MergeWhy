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
    };
  };
}

export function SafeOrganizationSwitcher({ appearance }: SafeOrganizationSwitcherProps) {
  if (!hasValidClerkKeys()) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground border rounded-lg">
        Organization
      </div>
    );
  }

  return <OrganizationSwitcher appearance={appearance} />;
}
