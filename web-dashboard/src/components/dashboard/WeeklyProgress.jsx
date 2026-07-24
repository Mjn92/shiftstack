import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

export default function WeeklyProgress({
  totalHours,
  overtimeHours,
  totalShifts,
  targetHours = 40,
}) {
  const safeTotalHours = Number(totalHours) || 0;
  const safeOvertimeHours = Number(overtimeHours) || 0;
  const safeShiftCount = Number(totalShifts) || 0;

  const regularHours = Math.min(safeTotalHours, targetHours);

  const progress =
    targetHours > 0 ? Math.min((regularHours / targetHours) * 100, 100) : 0;

  const remainingHours = Math.max(targetHours - regularHours, 0);

  return (
    <section
      className="dashboard-panel dashboard-weekly-progress"
      aria-labelledby="weekly-progress-heading"
    >
      <div className="dashboard-panel__header">
        <div>
          <p className="dashboard-panel__eyebrow">This week</p>

          <h2 id="weekly-progress-heading" className="dashboard-panel__title">
            Weekly progress
          </h2>
        </div>

        <div className="dashboard-panel__header-icon" aria-hidden="true">
          <CalendarDays size={22} />
        </div>
      </div>

      <div className="dashboard-weekly-progress__hours">
        <strong>{formatHours(safeTotalHours)}</strong>
        <span>of {targetHours.toFixed(1)} hours</span>
      </div>

      <div
        className="dashboard-weekly-progress__track"
        role="progressbar"
        aria-label="Weekly work-hour progress"
        aria-valuemin="0"
        aria-valuemax={targetHours}
        aria-valuenow={Math.min(safeTotalHours, targetHours)}
      >
        <span
          className="dashboard-weekly-progress__value"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="dashboard-weekly-progress__summary">
        <ProgressItem
          label="Regular"
          value={`${formatHours(regularHours)} hrs`}
        />

        <ProgressItem
          label="Overtime"
          value={`${formatHours(safeOvertimeHours)} hrs`}
        />

        <ProgressItem label="Shifts" value={String(safeShiftCount)} />

        <ProgressItem
          label="Remaining"
          value={`${formatHours(remainingHours)} hrs`}
        />
      </div>

      <Link href="/weekly-summary" className="dashboard-panel__footer-link">
        View weekly summary
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}

function ProgressItem({ label, value }) {
  return (
    <div className="dashboard-weekly-progress__item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatHours(value) {
  const number = Number(value) || 0;

  return number.toFixed(2);
}
