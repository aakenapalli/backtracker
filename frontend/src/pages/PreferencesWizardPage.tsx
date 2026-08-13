import { useState } from "react";
import { WizardShell } from "../components/wizard/WizardShell";
import { WIZARD_STEPS, type WizardDraft } from "../components/wizard/wizardSteps";
import type { PlannerPreferences } from "../types/planner";

interface PreferencesWizardPageProps {
  initialDraft?: WizardDraft;
  onComplete: (preferences: PlannerPreferences) => void;
}

export function PreferencesWizardPage({ initialDraft, onComplete }: PreferencesWizardPageProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(initialDraft ?? {});

  const step = WIZARD_STEPS[stepIndex];
  const isLastStep = stepIndex === WIZARD_STEPS.length - 1;

  function updateDraft(patch: WizardDraft) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function handleNext() {
    if (!step.isValid(draft)) {
      return;
    }

    if (!isLastStep) {
      setStepIndex((index) => index + 1);
      return;
    }

    onComplete({
      city: "istanbul",
      days: draft.days!,
      hoursPerDay: draft.hoursPerDay!,
      walkingTolerance: draft.walkingTolerance!,
      budgetSensitivity: draft.budgetSensitivity!,
      familiarity: draft.familiarity!,
      themes: draft.themes ?? [],
      mustSeeSlugs: draft.mustSeeSlugs ?? [],
    });
  }

  function handleBack() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  return (
    <WizardShell
      stepIndex={stepIndex}
      stepCount={WIZARD_STEPS.length}
      question={step.question}
      helpText={step.helpText}
      isValid={step.isValid(draft)}
      isLastStep={isLastStep}
      onBack={handleBack}
      onNext={handleNext}
    >
      {step.render({ draft, updateDraft })}
    </WizardShell>
  );
}
