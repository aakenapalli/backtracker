interface MultiChoiceOption<T> {
  value: T;
  label: string;
}

interface MultiChoiceStepProps<T> {
  options: MultiChoiceOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
}

export function MultiChoiceStep<T extends string>({ options, selected, onToggle }: MultiChoiceStepProps<T>) {
  return (
    <div className="wizard-chip-grid">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            className={`wizard-chip ${isSelected ? "selected" : ""}`}
            aria-pressed={isSelected}
            onClick={() => onToggle(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
