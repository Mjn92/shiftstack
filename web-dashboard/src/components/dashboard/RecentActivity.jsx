import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, History } from "lucide-react";

export default function RecentActivity({ entries = [] }) {
  const recentEntries = Array.isArray(entries) ? entries.slice(0, 5) : [];

  return (
    <section
      className="dashboard-panel dashboard-activity"
      aria-labelledby="recent-activity-heading"
    >
      <div className="dashboard-panel__header">
        <div>
          <p className="dashboard-panel__eyebrow">Time activity</p>

          <h2 id="recent-activity-heading" className="dashboard-panel__title">
            Recent shifts
          </h2>
        </div>

        <div className="dashboard-panel__header-icon" aria-hidden="true">
          <History size={22} />
        </div>
      </div>

      {recentEntries.length === 0 ? (
        <div className="dashboard-empty-state">
          <History size={30} aria-hidden="true" />

          <h3>No shift activity yet</h3>

          <p>
            Your completed and active shifts will appear here after you clock
            in.
          </p>

          <Link href="/clock" className="dashboard-empty-state__link">
            Open Clock Center
          </Link>
        </div>
      ) : (
        <ol className="dashboard-activity__list">
          {recentEntries.map((entry) => {
            const open = entry.status === "open" || !entry.clock_out;

            return (
              <li className="dashboard-activity__item" key={entry.id}>
                <div
                  className={`dashboard-activity__icon ${
                    open
                      ? "dashboard-activity__icon--open"
                      : "dashboard-activity__icon--closed"
                  }`}
                  aria-hidden="true"
                >
                  {open ? (
                    <ArrowUpRight size={18} />
                  ) : (
                    <ArrowDownLeft size={18} />
                  )}
                </div>

                <div className="dashboard-activity__details">
                  <div className="dashboard-activity__item-header">
                    <strong>{open ? "Active shift" : "Completed shift"}</strong>

                    <span
                      className={`dashboard-activity__status ${
                        open
                          ? "dashboard-activity__status--open"
                          : "dashboard-activity__status--closed"
                      }`}
                    >
                      {open ? "Open" : "Closed"}
                    </span>
                  </div>

                  <p>{formatDate(entry.clock_in)}</p>

                  <span>{formatEntryDuration(entry)}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Link href="/time-history" className="dashboard-panel__footer-link">
        View all time history
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}

function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEntryDuration(entry) {
  if (entry.status === "open" || !entry.clock_out) {
    return `Started ${formatTime(entry.clock_in)}`;
  }

  const totalMinutes = Number(entry.total_minutes);

  if (Number.isFinite(totalMinutes)) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    if (hours === 0) {
      return `${minutes} min worked`;
    }

    return `${hours} hr${hours === 1 ? "" : "s"} ${minutes} min worked`;
  }

  return `${formatTime(entry.clock_in)} – ${formatTime(entry.clock_out)}`;
}

function formatTime(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
