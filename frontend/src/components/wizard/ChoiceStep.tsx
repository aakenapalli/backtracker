interface ChoiceOption<T> {
  value: T;
  label: string;
  sublabel?: string;
}

interface ChoiceStepProps<T> {
  options: ChoiceOption<T>[];
  selected: T | undefined;
  onSelect: (value: T) => void;
}

export function ChoiceStep<T extends string | number>({ options, selected, onSelect }: ChoiceStepProps<T>) {
  return (
    <div className="wizard-choice-grid">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={`wizard-choice ${selected === option.value ? "selected" : ""}`}
          onClick={() => onSelect(option.value)}
        >
          <span>{option.label}</span>
          {option.sublabel ? <small>{option.sublabel}</small> : null}
        </button>
      ))}
    </div>
  );
}
