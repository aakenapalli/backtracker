import { useState } from "react";
import { THEME_OPTIONS } from "../../constants/themes";
import type { PlannerPreferences } from "../../types/planner";
import { Icon, type IconName } from "../ui/Icon";

interface PreferencesFormProps {
  preferences: PlannerPreferences;
}

export function PreferencesForm({ preferences }: PreferencesFormProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="preferences-card">
      <button
        className="preferences-toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <div className="preference-summary">
          <Preference icon="clock" label="Time" value={`${preferences.days}d · ${preferences.hoursPerDay}h/day`} />
          <Preference icon="walk" label="Pace" value={titleCase(preferences.walkingTolerance)} />
          <Preference icon="ticket" label="Budget" value={titleCase(preferences.budgetSensitivity)} />
        </div>
        <span className={`toggle-chevron ${expanded ? "open" : ""}`}><Icon name="chevron" /></span>
      </button>

      {expanded ? (
        <div className="preferences-details">
          <div className="preference-block">
            <p className="input-label">Themes</p>
            <div className="chip-list">
              {THEME_OPTIONS.filter((theme) => preferences.themes.includes(theme.slug)).map((theme) => (
                <span className="theme-chip" key={theme.slug}>{theme.label}</span>
              ))}
            </div>
          </div>

          <div className="preference-block">
            <p className="input-label">Must-see</p>
            {preferences.mustSeeSlugs.map((slug) => (
              <div className="must-see" key={slug}>
                <Icon name="pin" />
                <span>{titleCase(slug.replaceAll("-", " "))}</span>
              </div>
            ))}
          </div>

          <button className="secondary-button">Adjust preferences</button>
        </div>
      ) : null}
    </section>
  );
}

function Preference({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="preference-row">
      <Icon name={icon} />
      <div><span>{label}</span><strong>{value}</strong></div>
    </div>
  );
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
