"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export type AuthPayload = {
  user: { id: string; email: string };
  profile: import("@/agents/_shared/types").StudentProfile | null;
  sessionId: string;
};

export function AuthDesk({
  onSignedIn,
  configured = true,
}: {
  onSignedIn: (payload: AuthPayload) => void;
  configured?: boolean;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signup = mode === "signup";

  async function submit() {
    if (!configured || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: signup ? "signup" : "login",
          email,
          password,
        }),
      });
      const payload = (await response.json()) as AuthPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not sign in.");
      if (!payload.user || !payload.sessionId) {
        throw new Error("Could not start a student session.");
      }
      onSignedIn({
        user: payload.user,
        profile: payload.profile,
        sessionId: payload.sessionId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16">
      <section className="w-full max-w-md">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">
          NUS-ISS Practice Module · Team 5
        </p>
        <h1 className="mt-5 text-[2.25rem] font-semibold tracking-tight text-ink">METS</h1>
        <p className="mt-1 text-sm text-ink-2">Multi-Agent Educational & Testing System</p>
        <p className="mt-6 text-sm leading-6 text-ink-2">
          {signup
            ? "Create an account to save your profile, progress, and chat history across sessions."
            : "Sign in to pick up your student profile and previous chats, or continue as a guest."}
        </p>

        {configured ? null : (
          <p className="mt-5 border-l-2 border-orange pl-3 text-sm leading-6 text-ink-2" role="status">
            Cloud login needs <code className="font-mono text-xs">SUPABASE_URL</code> and a
            publishable key. You can still use the desk as a guest.
          </p>
        )}

        <form
          className="mt-8 space-y-5"
          aria-busy={busy}
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label className="block space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="you@school.edu.sg"
              required
              disabled={!configured || busy}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3">
              Password
            </span>
            <input
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="At least 6 characters"
              minLength={6}
              required
              disabled={!configured || busy}
            />
          </label>

          {error ? (
            <p className="border-l-2 border-red pl-3 text-sm text-red">{error}</p>
          ) : null}

          <div className="space-y-3 pt-1">
            <Button
              type="submit"
              variant="primary"
              className="h-11 w-full gap-2 text-sm font-medium"
              disabled={busy || !configured}
              aria-busy={busy}
            >
              {busy ? <Spinner /> : <Icon icon={signup ? "createAccount" : "signIn"} size={15} />}
              {busy
                ? signup
                  ? "Creating account..."
                  : "Signing in..."
                : signup
                  ? "Create account"
                  : "Sign in"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full text-sm font-medium"
              disabled={busy}
              onClick={() => {
                setMode(signup ? "login" : "signup");
                setError(null);
              }}
            >
              {signup ? "Already have an account? Sign in" : "New to METS? Create account"}
            </Button>

            <Button
              type="button"
              variant="quiet"
              className="h-10 w-full gap-2 text-sm font-medium text-ink-2"
              disabled={busy}
              onClick={() =>
                onSignedIn({
                  user: { id: "guest", email: "" },
                  profile: null,
                  sessionId: crypto.randomUUID(),
                })
              }
            >
              <Icon icon="guest" size={15} />
              Continue as guest
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
