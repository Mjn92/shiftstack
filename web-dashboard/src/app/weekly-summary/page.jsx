"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Gauge,
  History,
  RotateCcw,
  Timer,
  TrendingUp,
} from "lucide-react";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

import "./weekly-summary.css";

export default function WeeklySummaryPage() {
  const router = useRouter();
  const { employee, loading } = useContext(AuthContext);

  const [summary, setSummary] = useState(null);

  const [selectedWeekStart, setSelectedWeekStart] =
    useState(getCurrentMondayDate);

  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async (weekStart) => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/time/my-weekly-summary", {
        params: {
          week_start: weekStart,
        },
      });

      const data =
        response?.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
          ? response.data
          : {};

      setSummary(data);
    } catch (err) {
      console.error("Weekly summary error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not load your weekly summary. Please try again.",
      );
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !employee) {
      router.replace("/login");
    }
  }, [loading, employee, router]);

  useEffect(() => {
    if (employee) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSummary(selectedWeekStart);
    }
  }, [employee, selectedWeekStart, loadSummary]);

  if (loading || !employee) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingSessionCard} role="status" aria-live="polite">
          Loading your weekly summary...
        </div>
      </main>
    );
  }

  const totalHours = Number(summary?.total_hours) || 0;
  const regularHours = Number(summary?.regular_hours) || 0;
  const overtimeHours = Number(summary?.overtime_hours) || 0;
  const totalShifts = Number(summary?.total_shifts) || 0;

  const averageShiftHours = Number(summary?.average_shift_hours) || 0;

  const longestShiftHours = Number(summary?.longest_shift_hours) || 0;

  const dailyBreakdown = Array.isArray(summary?.daily_breakdown)
    ? summary.daily_breakdown
    : [];

  const weeklyProgress = Math.min((regularHours / 40) * 100, 100);

  const remainingHours = Math.max(40 - regularHours, 0);

  const hasWeeklyActivity = totalShifts > 0 || totalHours > 0;

  const currentWeekStart = getCurrentMondayDate();

  const isCurrentWeek = selectedWeekStart === currentWeekStart;

  const nextWeekDisabled = isCurrentWeek || pageLoading;

  const weekStart = summary?.week_start || selectedWeekStart;

  const weekEnd =
    summary?.week_end || addDaysToDateString(selectedWeekStart, 6);

  const viewPreviousWeek = () => {
    setSelectedWeekStart((current) => addDaysToDateString(current, -7));
  };

  const viewNextWeek = () => {
    setSelectedWeekStart((current) => {
      const nextWeek = addDaysToDateString(current, 7);

      return nextWeek > currentWeekStart ? current : nextWeek;
    });
  };

  const viewCurrentWeek = () => {
    setSelectedWeekStart(currentWeekStart);
  };

  return (
    <AppShell>
      <div style={styles.page}>
        <PageHeader
          eyebrow="Time Tracking"
          title="Weekly Summary"
          description={`Review your worked hours and shift activity for ${formatWeekRange(
            weekStart,
            weekEnd,
          )}.`}
          actions={
            <>
              <button
                type="button"
                className="weekly-summary-button weekly-summary-button--secondary"
                onClick={() => router.push("/time-history")}
              >
                <History size={17} aria-hidden="true" />
                Time History
              </button>

              <button
                type="button"
                className="weekly-summary-button weekly-summary-button--primary"
                onClick={() => loadSummary(selectedWeekStart)}
                disabled={pageLoading}
              >
                <RotateCcw size={17} aria-hidden="true" />

                {pageLoading ? "Refreshing..." : "Refresh"}
              </button>
            </>
          }
        />

        {error && (
          <div style={styles.error} role="alert">
            {error}
          </div>
        )}

        <section
          className="weekly-navigation"
          aria-label="Weekly summary navigation"
        >
          <button
            type="button"
            className="weekly-navigation__button"
            onClick={viewPreviousWeek}
            disabled={pageLoading}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Previous Week
          </button>

          <div className="weekly-navigation__current">
            <CalendarDays size={20} aria-hidden="true" />

            <div>
              <span>{isCurrentWeek ? "Current Week" : "Selected Week"}</span>

              <strong>{formatWeekRange(weekStart, weekEnd)}</strong>
            </div>
          </div>

          <div className="weekly-navigation__actions">
            {!isCurrentWeek && (
              <button
                type="button"
                className="weekly-navigation__today"
                onClick={viewCurrentWeek}
                disabled={pageLoading}
              >
                Current Week
              </button>
            )}

            <button
              type="button"
              className="weekly-navigation__button"
              onClick={viewNextWeek}
              disabled={nextWeekDisabled}
            >
              Next Week
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </section>

        {pageLoading && !summary ? (
          <div style={styles.loadingCard} role="status" aria-live="polite">
            Loading weekly summary...
          </div>
        ) : (
          <>
            <section
              className={`weekly-hero ${
                overtimeHours > 0 ? "weekly-hero--overtime" : ""
              }`}
            >
              <div className="weekly-hero__content">
                <p className="weekly-hero__eyebrow">
                  {isCurrentWeek ? "Current week" : "Selected week"}
                </p>

                <h2>{formatHours(totalHours)} worked</h2>

                <p>
                  {totalShifts} completed{" "}
                  {totalShifts === 1 ? "shift" : "shifts"}
                  {" · "}
                  {formatHours(overtimeHours)} overtime
                </p>
              </div>

              <div className="weekly-hero__progress">
                <div className="weekly-hero__progress-header">
                  <span>40-hour weekly target</span>

                  <strong>{Math.round(weeklyProgress)}%</strong>
                </div>

                <div
                  className="weekly-hero__progress-track"
                  role="progressbar"
                  aria-label="Weekly work hours"
                  aria-valuemin="0"
                  aria-valuemax="40"
                  aria-valuenow={Math.min(totalHours, 40)}
                >
                  <span
                    style={{
                      width: `${weeklyProgress}%`,
                    }}
                  />
                </div>

                <p>
                  {remainingHours > 0
                    ? `${formatHours(remainingHours)} remaining`
                    : overtimeHours > 0
                      ? `${formatHours(overtimeHours)} above target`
                      : "Weekly target reached"}
                </p>
              </div>
            </section>

            <section
              className="weekly-stat-grid"
              aria-label="Weekly summary statistics"
            >
              <WeeklyStatCard
                icon={Clock3}
                title="Total Hours"
                value={formatHours(totalHours)}
                description="Completed work for the selected week"
                tone="primary"
              />

              <WeeklyStatCard
                icon={CalendarDays}
                title="Completed Shifts"
                value={String(totalShifts)}
                description="Closed shifts in the selected week"
                tone="success"
              />

              <WeeklyStatCard
                icon={Gauge}
                title="Average Shift"
                value={formatHours(averageShiftHours)}
                description="Average completed shift duration"
                tone="purple"
              />

              <WeeklyStatCard
                icon={TrendingUp}
                title="Longest Shift"
                value={formatHours(longestShiftHours)}
                description="Longest completed shift this week"
                tone="warning"
              />
            </section>

            <div className="weekly-analytics-grid">
              <section
                className="weekly-panel weekly-chart"
                aria-labelledby="daily-hours-chart-heading"
              >
                <div className="weekly-panel__header">
                  <div>
                    <p className="weekly-panel__eyebrow">Daily activity</p>

                    <h2 id="daily-hours-chart-heading">Hours by day</h2>
                  </div>

                  <Timer size={22} aria-hidden="true" />
                </div>

                {dailyBreakdown.length === 0 ? (
                  <p className="weekly-panel__empty">
                    Daily hour information is unavailable.
                  </p>
                ) : (
                  <DailyHoursChart days={dailyBreakdown} />
                )}
              </section>

              <section
                className="weekly-panel weekly-breakdown"
                aria-labelledby="hour-breakdown-heading"
              >
                <div className="weekly-panel__header">
                  <div>
                    <p className="weekly-panel__eyebrow">Hour breakdown</p>

                    <h2 id="hour-breakdown-heading">Regular and overtime</h2>
                  </div>

                  <TrendingUp size={22} aria-hidden="true" />
                </div>

                <div className="weekly-breakdown__items">
                  <HourBreakdownItem
                    title="Regular Hours"
                    value={regularHours}
                    maximum={40}
                    tone="regular"
                  />

                  <HourBreakdownItem
                    title="Overtime Hours"
                    value={overtimeHours}
                    maximum={Math.max(overtimeHours, 10)}
                    tone="overtime"
                  />
                </div>

                <div className="weekly-breakdown__summary">
                  <div>
                    <span>Total worked</span>
                    <strong>{formatHours(totalHours)}</strong>
                  </div>

                  <div>
                    <span>Remaining to 40</span>

                    <strong>{formatHours(remainingHours)}</strong>
                  </div>
                </div>
              </section>
            </div>

            {!hasWeeklyActivity && (
              <section className="weekly-empty-state">
                <CalendarDays size={34} aria-hidden="true" />

                <h2>No completed shifts this week</h2>

                <p>
                  Completed shifts for this week will appear here after you
                  clock out.
                </p>

                {isCurrentWeek && (
                  <button type="button" onClick={() => router.push("/clock")}>
                    Open Clock Center
                  </button>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function WeeklyStatCard({ icon: Icon, title, value, description, tone }) {
  return (
    <article className="weekly-stat-card">
      <div
        className={`weekly-stat-card__icon weekly-stat-card__icon--${tone}`}
        aria-hidden="true"
      >
        <Icon size={21} />
      </div>

      <p className="weekly-stat-card__title">{title}</p>

      <strong className="weekly-stat-card__value">{value}</strong>

      <p className="weekly-stat-card__description">{description}</p>
    </article>
  );
}

function DailyHoursChart({ days }) {
  const largestDailyHours = Math.max(
    8,
    ...days.map((day) => Number(day.total_hours) || 0),
  );

  return (
    <div className="daily-hours-chart">
      {days.map((day) => {
        const hours = Number(day.total_hours) || 0;

        const heightPercentage =
          largestDailyHours > 0 ? (hours / largestDailyHours) * 100 : 0;

        return (
          <div className="daily-hours-chart__day" key={day.date}>
            <div className="daily-hours-chart__value">
              {hours > 0 ? hours.toFixed(2) : "0"}
            </div>

            <div className="daily-hours-chart__track">
              <div
                className="daily-hours-chart__bar"
                style={{
                  height: `${heightPercentage}%`,
                }}
                title={`${day.day_name}: ${hours.toFixed(2)} hours`}
              />
            </div>

            <strong>{day.day_name?.slice(0, 3) || "Day"}</strong>

            <span>
              {day.shift_count}{" "}
              {Number(day.shift_count) === 1 ? "shift" : "shifts"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HourBreakdownItem({ title, value, maximum, tone }) {
  const safeValue = Number(value) || 0;

  const progress = Math.min(maximum > 0 ? (safeValue / maximum) * 100 : 0, 100);

  return (
    <div className="weekly-breakdown__item">
      <div className="weekly-breakdown__item-header">
        <span>{title}</span>

        <strong>{formatHours(safeValue)}</strong>
      </div>

      <div
        className="weekly-breakdown__track"
        role="progressbar"
        aria-label={title}
        aria-valuemin="0"
        aria-valuemax={maximum}
        aria-valuenow={safeValue}
      >
        <span
          className={`weekly-breakdown__value weekly-breakdown__value--${tone}`}
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}

function getCurrentMondayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();
  const weekday = today.getDay();

  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;

  const monday = new Date(year, month, date - daysSinceMonday);

  return formatLocalDateInput(monday);
}

function addDaysToDateString(value, numberOfDays) {
  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() + numberOfDays);

  return formatLocalDateInput(date);
}

function formatLocalDateInput(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatWeekRange(startValue, endValue) {
  if (!startValue || !endValue) {
    return "Week unavailable";
  }

  const startDate = parseLocalDate(startValue);

  const endDate = parseLocalDate(endValue);

  return `${startDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${endDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatHours(value) {
  const numericValue = Number(value) || 0;

  return `${numericValue.toFixed(2)} hrs`;
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    backgroundColor: "#F4F7FB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
  },

  loadingSessionCard: {
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #DCEBFF",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    padding: "24px",
    fontWeight: "bold",
    textAlign: "center",
  },

  page: {
    width: "100%",
    maxWidth: "1440px",
    margin: "0 auto",
  },

  loadingCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "20px",
    padding: "48px",
    textAlign: "center",
    color: "#64748B",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  },

  error: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FECACA",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
};
