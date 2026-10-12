"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { StudentProfile } from "@/agents/_shared/types";
import { schoolGradeLabel } from "@/agents/_shared/types";
import { cn } from "@/lib/cn";
import { TestingProgressPanel } from "./testing-progress-panel";

function gradeLabel(profile: StudentProfile) {
  return schoolGradeLabel(profile.grade, profile.gradeLevel);
}

export function StudentSidebar({
  profile,
  email,
  signedIn,
  children,
}: {
  profile: StudentProfile;
  email?: string;
  signedIn?: boolean;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  const diagnosticsActive = pathname === "/diagnostics" || pathname.startsWith("/diagnostics/");

  return (
    <>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">
          Student
        </p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-ink">{profile.name}</h1>
        <p className="mt-1 text-sm text-ink-2">{gradeLabel(profile)}</p>
        {email ? (
          <p className="mt-1 truncate text-xs text-ink-3">{email}</p>
        ) : null}
        <p className="mt-3 text-xs text-ink-3">{signedIn ? "Signed in" : "Guest desk"}</p>
      </div>

      <Link
        href="/diagnostics"
        className={cn(
          "mt-6 block border-t border-line pt-4 text-sm no-underline transition-colors",
          diagnosticsActive ? "font-medium text-ink" : "text-ink-2 hover:text-ink",
        )}
      >
        Diagnostics
      </Link>

      <div className="mt-6 border-t border-line pt-4">
        <TestingProgressPanel signedIn={signedIn} />
      </div>

      {children}
    </>
  );
}
