import type { GradeLevel, Subject } from "../_shared/types";
import type { TestingTrend } from "./score-history";

export const TESTING_MODES = ["mcq", "flashcards"] as const;
export type TestingMode = (typeof TESTING_MODES)[number];

export const VISUAL_FORMATS = ["none"] as const;
export type VisualFormat = (typeof VISUAL_FORMATS)[number];

export const DIFFICULTY_LEVELS = ["easier", "standard", "harder"] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export type ScoreContext = {
  trend: TestingTrend;
  latestPercentage: number;
};

export const EASIER_MAX_PERCENTAGE = 59;
export const HARDER_MIN_PERCENTAGE = 80;

type AssessmentPlanInput = {
  request: string;
  subject?: Subject;
  gradeLevel: GradeLevel;
  requestedCount?: number;
  scoreContext?: ScoreContext;
};

export type AssessmentPlan = {
  mode: TestingMode;
  subject?: Subject;
  gradeLevel: GradeLevel;
  requestedCount?: number;
  topics: string[];
  visualFormat: VisualFormat;
  difficulty: DifficultyLevel;
  rationale: string;
};

const flashcardPattern = /\bflashcards?\b|\brevision cards?\b|\bstudy cards?\b/i;
const mcqPattern =
  /\bmcq\b|\bmcqs\b|multiple choice|\bquiz\b|\btest me\b|\bpractice questions?\b|\bassessment\b/i;

const topicStopwords = new Set([
  "a",
  "an",
  "and",
  "for",
  "give",
  "me",
  "of",
  "on",
  "please",
  "quiz",
  "questions",
  "revision",
  "test",
]);

function cleanTopic(value: string) {
  const collapsed = value.replace(/\s+/g, " ");
  let start = 0;
  let end = collapsed.length;
  while (start < end && ",;:.- ".includes(collapsed[start])) start++;
  while (end > start && ",;:.- ".includes(collapsed[end - 1])) end--;
  const cleaned = collapsed.slice(start, end).trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  while (words.length && topicStopwords.has(words[0]!.toLowerCase())) {
    words.shift();
  }
  while (words.length && topicStopwords.has(words.at(-1)!.toLowerCase())) {
    words.pop();
  }

  return words.join(" ");
}

function uniqueTopics(topics: string[]) {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const topic of topics) {
    const normalised = topic.toLowerCase();
    if (!normalised || seen.has(normalised)) continue;
    seen.add(normalised);
    results.push(topic);
  }

  return results;
}

export function extractAssessmentTopics(request: string) {
  const lower = request.toLowerCase();
  const byLeadIn = lower.match(/\b(?:on|about|for|covering)\b(.+)$/i);
  const source =
    byLeadIn?.[1] ??
    request
      .replace(/\b(?:give|make|create|quiz|test)\b/gi, " ")
      .replace(/\b(?:me|some|please)\b/gi, " ")
      .replace(/\b(?:mcq|mcqs|multiple choice|flashcard|flashcards|revision cards?|study cards?|questions?|assessment)\b/gi, " ")
      .replace(/\b(?:one|two|three|four|five|six|seven|eight|\d+)\b/gi, " ")
      .replace(/\bwith\s+(?:a\s+)?(?:diagram|visual|flowchart)\b.*$/i, " ")
      .replace(/\s+/g, " ")
      .trim();

  const candidates = source
    .split(/,|\/|\band\b/gi)
    .map((topic) => cleanTopic(topic))
    .filter(Boolean)
    .filter((topic) => {
      const words = topic.toLowerCase().split(/\s+/).filter(Boolean);
      return words.some((word) => !topicStopwords.has(word));
    });

  return uniqueTopics(candidates).slice(0, 4);
}

function inferMode(request: string): TestingMode {
  const wantsFlashcards = flashcardPattern.test(request);
  const wantsMcq = mcqPattern.test(request);

  if (wantsFlashcards && !wantsMcq) return "flashcards";
  return "mcq";
}

export function deriveDifficulty(scoreContext?: ScoreContext): DifficultyLevel {
  if (!scoreContext) return "standard";
  const { latestPercentage } = scoreContext;
  if (latestPercentage <= EASIER_MAX_PERCENTAGE) return "easier";
  if (latestPercentage >= HARDER_MIN_PERCENTAGE) return "harder";
  return "standard";
}

export function buildAssessmentPlan(input: AssessmentPlanInput): AssessmentPlan {
  const mode = inferMode(input.request);
  const topics = extractAssessmentTopics(input.request);
  const difficulty = deriveDifficulty(input.scoreContext);

  const difficultyRationale =
    difficulty === "easier"
      ? `Score context shows trend="${input.scoreContext?.trend}", latest=${input.scoreContext?.latestPercentage}% — latest score is below 60%, so generate easier items.`
      : difficulty === "harder"
        ? `Score context shows trend="${input.scoreContext?.trend}", latest=${input.scoreContext?.latestPercentage}% — latest score is 80% or above, so generate harder items.`
        : input.scoreContext
          ? `Score context shows trend="${input.scoreContext.trend}", latest=${input.scoreContext.latestPercentage}% — latest score is between 60% and 79%, so use standard difficulty.`
          : "No score context is available — using standard difficulty.";

  const rationaleParts = [
    mode === "flashcards"
      ? "Flashcard language was detected in the student request."
      : "Quiz-style language was detected or used as the safe default.",
    "Testing now uses the standard widget flow without a separate visual-generation path.",
    difficultyRationale,
  ];

  return {
    mode,
    subject: input.subject,
    gradeLevel: input.gradeLevel,
    requestedCount: input.requestedCount,
    topics,
    visualFormat: "none",
    difficulty,
    rationale: rationaleParts.join(" "),
  };
}
