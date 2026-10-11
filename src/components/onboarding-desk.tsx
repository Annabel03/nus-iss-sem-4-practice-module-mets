"use client";

import { useMemo, useState } from "react";
import type { GradeLevel, SchoolGrade, StudentProfile } from "@/agents/_shared/types";
import {
  GRADE_LEVELS,
  SCHOOL_GRADE_META,
  SCHOOL_GRADES,
  bandForGrade,
} from "@/agents/_shared/types";
import { Button } from "@/components/ui/button";

const BAND_COPY: Record<GradeLevel, { title: string; line: string }> = {
  primary: { title: "Primary", line: "P1 to P6" },
  secondary: { title: "Secondary", line: "Sec 1 to Sec 5" },
  jc: { title: "Junior College", line: "JC 1 and JC 2" },
};

function buildProfile(options: {
  name: string;
  grade: SchoolGrade;
  notes: string[];
}): StudentProfile {
  return {
    name: options.name.trim() || "Student",
    grade: options.grade,
    gradeLevel: bandForGrade(options.grade),
    diagnostic: {},
    notes: options.notes,
  };
}

export function OnboardingDesk({
  onComplete,
}: {
  onComplete: (profile: StudentProfile) => void;
}) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<SchoolGrade>("sec3");
  const yearLabel = useMemo(() => SCHOOL_GRADE_META[grade].label, [grade]);

  function finish(notes: string[]) {
    onComplete(buildProfile({ name, grade, notes }));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16">
      <section className="w-full max-w-lg">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">
          NUS-ISS Practice Module · Team 5
        </p>
        <h1 className="mt-5 text-[2.25rem] font-semibold tracking-tight text-ink">
          Welcome to METS
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-2">
          Your tutor for Singapore Mathematics, Physics, and Chemistry. Set your
          year so the specialists pitch at the right level. You can take a short
          diagnostic later.
        </p>

        <form
          className="mt-10 space-y-8"
          onSubmit={(event) => {
            event.preventDefault();
            finish([
              `Year: ${yearLabel}. Diagnostics not taken yet. Infer prior knowledge from the conversation.`,
            ]);
          }}
        >
          <label className="block space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3">
              Your name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
              placeholder="As on your exercise book"
            />
          </label>

          <fieldset className="space-y-6">
            <legend className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3">
              Year
            </legend>
            {GRADE_LEVELS.map((band) => (
              <div key={band} className="border-t border-line pt-4">
                <p className="text-sm font-medium text-ink">
                  {BAND_COPY[band].title}
                  <span className="ml-2 font-normal text-ink-3">{BAND_COPY[band].line}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SCHOOL_GRADES.filter((id) => SCHOOL_GRADE_META[id].band === band).map(
                    (id) => {
                      const selected = grade === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setGrade(id)}
                          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                            selected
                              ? "border-ink bg-ink text-canvas"
                              : "border-line bg-surface text-ink-2 hover:border-ink-3 hover:text-ink"
                          }`}
                        >
                          {SCHOOL_GRADE_META[id].short}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            ))}
          </fieldset>

          <div className="space-y-2 pt-1">
            <Button type="submit" className="h-11 w-full text-sm font-medium">
              Start the desk
            </Button>
            <Button
              type="button"
              variant="quiet"
              className="h-10 w-full text-sm font-medium text-ink-2"
              onClick={() =>
                finish([
                  `Year: ${yearLabel}. Onboarding skipped. Infer prior knowledge from the conversation.`,
                ])
              }
            >
              Skip setup and explore
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
