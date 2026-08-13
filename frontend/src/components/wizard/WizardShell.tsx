import type { ReactNode } from "react";

interface WizardShellProps {
  stepIndex: number;
  stepCount: number;
  question: string;
  helpText?: string;
  isValid: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
  children: ReactNode;
}

export function WizardShell({
  stepIndex,
  stepCount,
  question,
  helpText,
  isValid,
  isLastStep,
  onBack,
  onNext,
  children,
}: WizardShellProps) {
  const progressPercent = ((stepIndex + 1) / stepCount) * 100;

  return (
    <div className="wizard">
      <div className="wizard-card">
        <div className="wizard-progress-track">
          <div className="wizard-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="wizard-step-count">
          Step {stepIndex + 1} of {stepCount}
        </p>

        <h2 className="wizard-question">{question}</h2>
        {helpText ? <p className="wizard-help-text">{helpText}</p> : null}

        <div className="wizard-step-content">{children}</div>

        <div className="wizard-nav">
          <button
            type="button"
            className="wizard-back-button"
            onClick={onBack}
            disabled={stepIndex === 0}
          >
            Back
          </button>
          <button type="button" className="wizard-next-button" onClick={onNext} disabled={!isValid}>
            {isLastStep ? "Plan my trip" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
