"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  Clock3,
  History,
  RefreshCw,
  Timer,
  UserRound,
} from "lucide-react";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import DashboardErrorBoundary from "../../components/DashboardErrorBoundary";
import DashboardCard from "../../components/DashboardCard";
import DashboardSection from "../../components/DashboardSection";
import DashboardStatCard from "../../components/dashboard/DashboardStatCard";
import DashboardSkeleton from "../../components/dashboard/DashboardSkeleton";
import RecentActivity from "../../components/dashboard/RecentActivity";
import WeeklyProgress from "../../components/dashboard/WeeklyProgress";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";
import { formatDateTime, formatMinutes } from "../../utils/dateTime";
import {
  calculateTotalMinutes,
  getCompletedEntries,
  getTodayEntries,
} from "../../utils/timeEntries";
import {
  formatDashboardDate,
  formatHours,
  getLastEntry,
  isAdmin,
  isManager,
} from "../../utils/dashboardHelpers";
import "./dashboard.css";

export default function DashboardPage() {
  const router = useRouter();
  const { employee, loading: authLoading } = useContext(AuthContext);

  const [clockStatus, setClockStatus] = useState(null);
  const [entries, setEntries] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const loadDashboardData = useCallback(async () => {
    try {
      setPageLoading(true);
      setError("");

      const [statusResponse, entriesResponse, weeklyResponse] =
        await Promise.all([
          api.get("/time/status"),
          api.get("/time/my-entries"),
          api.get("/time/my-weekly-summary"),
        ]);

      setClockStatus(
        statusResponse?.data &&
          typeof statusResponse.data === "object" &&
          !Array.isArray(statusResponse.data)
          ? statusResponse.data
          : null,
      );

      setEntries(
        Array.isArray(entriesResponse?.data) ? entriesResponse.data : [],
      );

      setWeeklySummary(
        weeklyResponse?.data &&
          typeof weeklyResponse.data === "object" &&
          !Array.isArray(weeklyResponse.data)
          ? weeklyResponse.data
          : null,
      );

      setCurrentTime(Date.now());
    } catch (err) {
      console.error("Dashboard load error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Could not load your dashboard data. Please try again.",
      );
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !employee) {
      router.replace("/login");
    }
  }, [authLoading, employee, router]);

  useEffect(() => {
    if (employee) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDashboardData();
    }
  }, [employee, loadDashboardData]);

  useEffect(() => {
    if (!clockStatus?.clocked_in) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [clockStatus?.clocked_in]);

  const dashboardData = useMemo(() => {
    const todayDate = new Date();
    const todaysEntries = getTodayEntries(entries, todayDate);
    const completedTodayEntries = getCompletedEntries(todaysEntries);

    const todaysMinutes = calculateTotalMinutes(completedTodayEntries);
    const totalWeeklyHours = Number(weeklySummary?.total_hours) || 0;
    const totalWeeklyShifts = Number(weeklySummary?.total_shifts) || 0;
    const overtimeHours = Number(weeklySummary?.overtime_hours) || 0;

    const completedEntries = getCompletedEntries(entries);

    return {
      today: formatDashboardDate(todayDate),
      todaysMinutes,
      todaysHours: formatHours(todaysMinutes),
      totalWeeklyHours,
      totalWeeklyShifts,
      overtimeHours,
      completedShiftCount: completedEntries.length,
      lastEntry: getLastEntry(entries),
      recentEntries: [...entries]
        .sort(
          (a, b) =>
            new Date(b.clock_in || 0).getTime() -
            new Date(a.clock_in || 0).getTime(),
        )
        .slice(0, 5),
    };
  }, [entries, weeklySummary]);

  if (authLoading || !employee) {
    return (
      <main style={styles.authLoadingPage}>
        <div style={styles.authLoadingCard}>
          <LoadingState message="Checking your session and dashboard access..." />
        </div>
      </main>
    );
  }

  const isClockedIn = Boolean(clockStatus?.clocked_in);
  const currentEntry = clockStatus?.current_entry;

  const currentShiftDuration = getCurrentShiftDuration(
    isClockedIn,
    currentEntry?.clock_in,
    currentTime,
  );

  const weeklyProgressPercentage = Math.min(
    (dashboardData.totalWeeklyHours / 40) * 100,
    100,
  );

  const showManagerTools = isManager(employee.role);
  const showAdminTools = isAdmin(employee.role);

  const currentStatusDescription = isClockedIn
    ? `Active for ${currentShiftDuration}`
    : "Ready for your next shift";

  const initialDataLoading =
    pageLoading && !clockStatus && entries.length === 0 && !weeklySummary;

  return (
    <DashboardErrorBoundary>
      <AppShell>
        <div style={styles.container}>
          <PageHeader
            eyebrow={`${formatRole(employee.role)} workspace`}
            title={`Welcome back, ${employee.first_name || "there"}`}
            description={`${dashboardData.today} · Review your shift, hours, and latest activity.`}
            actions={
              <button
                type="button"
                className="dashboard-refresh-button"
                style={{
                  ...styles.refreshButton,
                  ...(pageLoading ? styles.disabledButton : {}),
                }}
                onClick={loadDashboardData}
                disabled={pageLoading}
                aria-label="Refresh dashboard data"
                aria-busy={pageLoading}
              >
                <RefreshCw
                  size={17}
                  aria-hidden="true"
                  style={{
                    ...styles.buttonIcon,
                    ...(pageLoading ? styles.spinningIcon : {}),
                  }}
                />
                {pageLoading ? "Refreshing..." : "Refresh Dashboard"}
              </button>
            }
          />

          {error && (
            <div style={styles.errorWrapper}>
              <ErrorState
                message={error}
                onRetry={pageLoading ? undefined : loadDashboardData}
              />
            </div>
          )}

          {initialDataLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              <section style={styles.statGrid} aria-label="Shift overview">
                <DashboardStatCard
                  icon={Clock3}
                  label="Current Status"
                  value={isClockedIn ? "Clocked In" : "Clocked Out"}
                  description={currentStatusDescription}
                  badge={isClockedIn ? "Active" : "Off shift"}
                  tone={isClockedIn ? "success" : "neutral"}
                  onClick={() => router.push("/clock")}
                />

                <DashboardStatCard
                  icon={Timer}
                  label="Today's Hours"
                  value={
                    dashboardData.todaysMinutes > 0
                      ? `${dashboardData.todaysHours} hrs`
                      : "0.00 hrs"
                  }
                  description="Completed shift time recorded today"
                  badge={`${getTodayEntries(entries, new Date()).length} entries`}
                  onClick={() => router.push("/time-history")}
                />

                <DashboardStatCard
                  icon={CalendarClock}
                  label="Weekly Hours"
                  value={`${dashboardData.totalWeeklyHours.toFixed(2)} hrs`}
                  description={`${dashboardData.totalWeeklyShifts} completed ${
                    dashboardData.totalWeeklyShifts === 1 ? "shift" : "shifts"
                  } this week`}
                  badge={`${Math.round(weeklyProgressPercentage)}% of 40 hrs`}
                  onClick={() => router.push("/weekly-summary")}
                />

                <DashboardStatCard
                  icon={History}
                  label="Completed Shifts"
                  value={dashboardData.completedShiftCount}
                  description="Total completed shifts in your history"
                  badge={`${dashboardData.overtimeHours.toFixed(2)} overtime hrs`}
                  onClick={() => router.push("/time-history")}
                />
              </section>

              <section style={styles.insightGrid}>
                <WeeklyProgress
                  totalHours={dashboardData.totalWeeklyHours}
                  targetHours={40}
                  percentage={weeklyProgressPercentage}
                  totalShifts={dashboardData.totalWeeklyShifts}
                  overtimeHours={dashboardData.overtimeHours}
                  onViewDetails={() => router.push("/weekly-summary")}
                />

                <RecentActivity
                  entries={dashboardData.recentEntries}
                  onViewAll={() => router.push("/time-history")}
                />
              </section>

              <DashboardSection
                title="Quick Actions"
                headingId="quick-actions-heading"
                sectionStyle={styles.section}
                titleStyle={styles.sectionTitle}
                gridStyle={styles.cardGrid}
              >
                <DashboardCard
                  styles={styles}
                  title="Clock Center"
                  value={isClockedIn ? currentShiftDuration : "Ready"}
                  text={
                    currentEntry?.clock_in
                      ? `Shift started ${formatDateTime(currentEntry.clock_in)}.`
                      : "Clock in when you are ready to begin your next shift."
                  }
                  buttonText={isClockedIn ? "Clock Out" : "Clock In"}
                  onClick={() => router.push("/clock")}
                  highlight={isClockedIn ? "success" : "neutral"}
                />

                <DashboardCard
                  styles={styles}
                  title="Time History"
                  value={
                    dashboardData.lastEntry
                      ? formatEntryStatus(dashboardData.lastEntry)
                      : "No activity"
                  }
                  text={
                    dashboardData.lastEntry?.clock_in
                      ? `Latest event: ${formatDateTime(
                          dashboardData.lastEntry.clock_in,
                        )}`
                      : "Your clock-in and clock-out records will appear here."
                  }
                  buttonText="View History"
                  onClick={() => router.push("/time-history")}
                />

                <DashboardCard
                  styles={styles}
                  title="My Profile"
                  value={employee.email || "Account"}
                  text={getEmployeeName(employee)}
                  buttonText="Open Profile"
                  onClick={() => router.push("/profile")}
                />

                <DashboardCard
                  styles={styles}
                  title="Notifications"
                  value="Inbox"
                  text="Review system alerts, reminders, and account messages."
                  buttonText="Open Notifications"
                  onClick={() => router.push("/notifications")}
                />
              </DashboardSection>

              {showManagerTools && (
                <DashboardSection
                  title="Management Tools"
                  headingId="management-tools-heading"
                  sectionStyle={styles.section}
                  titleStyle={styles.sectionTitle}
                  gridStyle={styles.cardGrid}
                >
                  <DashboardCard
                    styles={styles}
                    title="Employees"
                    value="Team"
                    text="View employee records, roles, and account status."
                    buttonText="Manage Employees"
                    onClick={() => router.push("/employees")}
                  />

                  <DashboardCard
                    styles={styles}
                    title="Time Entries"
                    value="Review"
                    text="Review employee clock-ins, clock-outs, and shift history."
                    buttonText="View Time Entries"
                    onClick={() => router.push("/time-entries")}
                  />

                  <DashboardCard
                    styles={styles}
                    title="Reports"
                    value="Payroll"
                    text="Generate weekly reports and payroll-ready CSV exports."
                    buttonText="Open Reports"
                    onClick={() => router.push("/reports")}
                  />
                </DashboardSection>
              )}

              {showAdminTools && (
                <DashboardSection
                  title="Administration"
                  headingId="admin-tools-heading"
                  sectionStyle={styles.section}
                  titleStyle={styles.sectionTitle}
                  gridStyle={styles.cardGrid}
                >
                  <DashboardCard
                    styles={styles}
                    title="Audit Logs"
                    value="Security"
                    text="Review authentication events and system activity."
                    buttonText="View Audit Logs"
                    onClick={() => router.push("/audit-logs")}
                  />

                  <DashboardCard
                    styles={styles}
                    title="System Health"
                    value="Planned"
                    text="Monitor database, messaging, and backend availability."
                    buttonText="Coming Soon"
                    disabled
                  />

                  <DashboardCard
                    styles={styles}
                    title="Maintenance"
                    value="Planned"
                    text="Track cleanup jobs, scheduled work, and rotation history."
                    buttonText="Coming Soon"
                    disabled
                  />
                </DashboardSection>
              )}
            </>
          )}
        </div>
      </AppShell>
    </DashboardErrorBoundary>
  );
}

function getCurrentShiftDuration(
  isClockedIn,
  clockInValue,
  currentTime = Date.now(),
) {
  if (!isClockedIn || !clockInValue) {
    return "No active shift";
  }

  const startedAt = new Date(clockInValue);

  if (Number.isNaN(startedAt.getTime())) {
    return "Active shift";
  }

  const elapsedMinutes = Math.max(
    0,
    Math.floor((currentTime - startedAt.getTime()) / 60000),
  );

  return formatMinutes(elapsedMinutes);
}

function formatEntryStatus(entry) {
  return entry?.status === "open" || !entry?.clock_out
    ? "Clocked In"
    : "Clocked Out";
}

function getEmployeeName(employee) {
  const fullName = `${employee?.first_name || ""} ${
    employee?.last_name || ""
  }`.trim();

  return fullName || "Employee profile";
}

function formatRole(role) {
  if (!role) {
    return "Employee";
  }

  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

const styles = {
  authLoadingPage: {
    minHeight: "100vh",
    backgroundColor: "#EAF3FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "clamp(16px, 3vw, 32px)",
  },

  authLoadingCard: {
    width: "min(100%, 460px)",
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "clamp(24px, 4vw, 32px)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
    textAlign: "center",
  },

  container: {
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
  },

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },

  insightGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },

  section: {
    width: "100%",
  },

  sectionTitle: {
    color: "#0A4DA2",
    fontSize: "clamp(21px, 3vw, 24px)",
    fontWeight: "bold",
    margin: "32px 0 16px",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
    gap: "20px",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "clamp(18px, 2vw, 24px)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    overflow: "hidden",
  },

  cardLabel: {
    color: "#6B7280",
    fontSize: "14px",
    marginBottom: "8px",
  },

  cardValue: {
    color: "#0A4DA2",
    fontSize: "clamp(20px, 2vw, 28px)",
    fontWeight: "bold",
    margin: "8px 0",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },

  successValue: {
    color: "#16A34A",
    fontSize: "clamp(20px, 2vw, 28px)",
    fontWeight: "bold",
    margin: "8px 0",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },

  neutralValue: {
    color: "#374151",
    fontSize: "clamp(20px, 2vw, 28px)",
    fontWeight: "bold",
    margin: "8px 0",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },

  cardText: {
    color: "#6B7280",
    marginBottom: "20px",
    lineHeight: 1.6,
    minHeight: "48px",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },

  button: {
    width: "100%",
    marginTop: "auto",
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    padding: "12px 16px",
    minHeight: "44px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
  },

  refreshButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #0A4DA2",
    padding: "10px 16px",
    minHeight: "44px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  buttonIcon: {
    flex: "0 0 auto",
  },

  spinningIcon: {
    animation: "dashboard-spin 1s linear infinite",
  },

  errorWrapper: {
    marginBottom: "20px",
  },

  disabledButton: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
};
