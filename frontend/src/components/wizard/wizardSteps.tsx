import type { ReactNode } from "react";
import type { BudgetSensitivity, FamiliarityLevel, PlannerPreferences, ThemeSlug, WalkingTolerance } from "../../types/planner";
import { THEME_OPTIONS } from "../../constants/themes";
import { ChoiceStep } from "./ChoiceStep";
import { MultiChoiceStep } from "./MultiChoiceStep";
import { MustSeeStep } from "./MustSeeStep";

export type WizardDraft = Partial<PlannerPreferences>;

export interface WizardStepDefinition {
  id: string;
  question: string;
  helpText?: string;
  render: (props: { draft: WizardDraft; updateDraft: (patch: WizardDraft) => void }) => ReactNode;
  isValid: (draft: WizardDraft) => boolean;
}

const DAYS_OPTIONS: Array<{ value: 1 | 2 | 3; label: string }> = [
  { value: 1, label: "1 day" },
  { value: 2, label: "2 days" },
  { value: 3, label: "3 days" },
];

const HOURS_PER_DAY_OPTIONS: Array<{ value: number; label: string; sublabel: string }> = [
  { value: 5, label: "Relaxed", sublabel: "~5 hrs/day" },
  { value: 8, label: "Balanced", sublabel: "~8 hrs/day" },
  { value: 11, label: "Packed", sublabel: "~11 hrs/day" },
];

const WALKING_TOLERANCE_OPTIONS: Array<{ value: WalkingTolerance; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const BUDGET_SENSITIVITY_OPTIONS: Array<{ value: BudgetSensitivity; label: string }> = [
  { value: "low", label: "Flexible" },
  { value: "medium", label: "Moderate" },
  { value: "high", label: "Tight" },
];

const FAMILIARITY_OPTIONS: Array<{ value: FamiliarityLevel; label: string }> = [
  { value: "beginner", label: "First time here" },
  { value: "intermediate", label: "Been once or twice" },
  { value: "knowledgeable", label: "I know Istanbul well" },
];

/**
 * Config-driven rather than 7 hardcoded step components: adding a future
 * parameter (per the user's explicit reason for wanting a wizard over a
 * single form) means adding one entry here, not restructuring the flow.
 */
export const WIZARD_STEPS: WizardStepDefinition[] = [
  {
    id: "days",
    question: "How many days are you in Istanbul?",
    render: ({ draft, updateDraft }) => (
      <ChoiceStep options={DAYS_OPTIONS} selected={draft.days} onSelect={(value) => updateDraft({ days: value })} />
    ),
    isValid: (draft) => draft.days !== undefined,
  },
  {
    id: "hoursPerDay",
    question: "How full do you want each day to be?",
    render: ({ draft, updateDraft }) => (
      <ChoiceStep
        options={HOURS_PER_DAY_OPTIONS}
        selected={draft.hoursPerDay}
        onSelect={(value) => updateDraft({ hoursPerDay: value })}
      />
    ),
    isValid: (draft) => draft.hoursPerDay !== undefined,
  },
  {
    id: "walkingTolerance",
    question: "How much walking are you up for?",
    render: ({ draft, updateDraft }) => (
      <ChoiceStep
        options={WALKING_TOLERANCE_OPTIONS}
        selected={draft.walkingTolerance}
        onSelect={(value) => updateDraft({ walkingTolerance: value })}
      />
    ),
    isValid: (draft) => draft.walkingTolerance !== undefined,
  },
  {
    id: "budgetSensitivity",
    question: "How budget-conscious should the route be?",
    render: ({ draft, updateDraft }) => (
      <ChoiceStep
        options={BUDGET_SENSITIVITY_OPTIONS}
        selected={draft.budgetSensitivity}
        onSelect={(value) => updateDraft({ budgetSensitivity: value })}
      />
    ),
    isValid: (draft) => draft.budgetSensitivity !== undefined,
  },
  {
    id: "familiarity",
    question: "How familiar are you with Istanbul already?",
    render: ({ draft, updateDraft }) => (
      <ChoiceStep
        options={FAMILIARITY_OPTIONS}
        selected={draft.familiarity}
        onSelect={(value) => updateDraft({ familiarity: value })}
      />
    ),
    isValid: (draft) => draft.familiarity !== undefined,
  },
  {
    id: "themes",
    question: "What draws you in?",
    helpText: "Pick at least one — this is what your route gets built around.",
    render: ({ draft, updateDraft }) => (
      <MultiChoiceStep
        options={THEME_OPTIONS.map((theme) => ({ value: theme.slug, label: theme.label }))}
        selected={draft.themes ?? []}
        onToggle={(slug: ThemeSlug) => {
          const current = draft.themes ?? [];
          const next = current.includes(slug) ? current.filter((t) => t !== slug) : [...current, slug];
          updateDraft({ themes: next });
        }}
      />
    ),
    isValid: (draft) => (draft.themes?.length ?? 0) > 0,
  },
  {
    id: "mustSeeSlugs",
    question: "Any non-negotiables?",
    helpText: "Optional — pick specific sites you don't want to miss.",
    render: ({ draft, updateDraft }) => (
      <MustSeeStep
        selected={draft.mustSeeSlugs ?? []}
        onToggle={(slug) => {
          const current = draft.mustSeeSlugs ?? [];
          const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
          updateDraft({ mustSeeSlugs: next });
        }}
      />
    ),
    isValid: () => true,
  },
];
