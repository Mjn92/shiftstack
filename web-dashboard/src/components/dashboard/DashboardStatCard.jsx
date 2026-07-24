import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DashboardStatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  linkText,
  tone = "default",
  badge,
  progress,
}) {
  const safeProgress =
    typeof progress === "number" ? Math.min(Math.max(progress, 0), 100) : null;

  return (
    <article
      className={`dashboard-stat-card dashboard-stat-card--${tone}`}
      aria-label={title}
    >
      <div className="dashboard-stat-card__top">
        <div
          className={`dashboard-stat-card__icon dashboard-stat-card__icon--${tone}`}
          aria-hidden="true"
        >
          {Icon && <Icon size={22} />}
        </div>

        {badge && (
          <span
            className={`dashboard-stat-card__badge dashboard-stat-card__badge--${tone}`}
          >
            {badge}
          </span>
        )}
      </div>

      <p className="dashboard-stat-card__title">{title}</p>

      <p className="dashboard-stat-card__value">{value}</p>

      <p className="dashboard-stat-card__description">{description}</p>

      {safeProgress !== null && (
        <div className="dashboard-stat-card__progress">
          <div className="dashboard-stat-card__progress-header">
            <span>Weekly target</span>
            <span>{Math.round(safeProgress)}%</span>
          </div>

          <div
            className="dashboard-stat-card__progress-track"
            role="progressbar"
            aria-label={`${title} progress`}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(safeProgress)}
          >
            <span
              className="dashboard-stat-card__progress-value"
              style={{ width: `${safeProgress}%` }}
            />
          </div>
        </div>
      )}

      {href && linkText && (
        <Link href={href} className="dashboard-stat-card__link">
          <span>{linkText}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}
