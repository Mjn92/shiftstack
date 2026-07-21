"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar.jsx";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";
import DashboardCard from "../../components/DashboardCard";
import DashboardSection from "../../components/DashboardSection";
import "./dashboard.css";
import DashboardErrorBoundary from "../../components/DashboardErrorBoundary";
import {
  formatDashboardDate,
  getTodayEntries,
  calculateTotalMinutes,
  formatHours,
  getLastEntry,
  isManager,
  isAdmin,
} from "../../utils/dashboardHelpers";

export default function DashboardPage() {
  const router = useRouter();
  const { employee, loading } = useContext(AuthContext);

  const [clockStatus, setClockStatus] = useState(null);
  const [entries, setEntries] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !employee) {
      router.push("/login");
    }
  }, [loading, employee, router]);

  useEffect(() => {
    if (employee) {
      // eslint-disable-next-line react-hooks/immutability
      loadDashboardData();
    }
  }, [employee]);

  const loadDashboardData = async () => {
    try {
      setPageLoading(true);
      setError("");

      const [statusResponse, entriesResponse, weeklyResponse] =
        await Promise.all([
          api.get("/time/status"),
          api.get("/time/my-entries"),
          api.get("/time/my-weekly-summary"),
        ]);

      const statusData =
        statusResponse?.data && typeof statusResponse.data === "object"
          ? statusResponse.data
          : null;

      const entriesData = Array.isArray(entriesResponse?.data)
        ? entriesResponse.data
        : [];

      const weeklyData =
        weeklyResponse?.data &&
        typeof weeklyResponse.data === "object" &&
        !Array.isArray(weeklyResponse.data)
          ? weeklyResponse.data
          : null;

      setClockStatus(statusData);
      setEntries(entriesData);
      setWeeklySummary(weeklyData);
    } catch (err) {
      console.error("Dashboard load error:", err);

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Could not load your dashboard data. Please try again.";

      setError(errorMessage);
    } finally {
      setPageLoading(false);
    }
  };

  if (loading || !employee) {
    return (
      <main style={styles.loadingPage}>
        <div
          style={styles.loadingCard}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <h1 style={styles.loadingTitle}>Loading ShiftStack...</h1>

          <p style={styles.loadingText}>
            Checking your session and dashboard access.
          </p>
        </div>
      </main>
    );
  }

  const todayDate = new Date();

  const today = formatDashboardDate(todayDate);
  const todaysEntries = getTodayEntries(entries, todayDate);
  const todaysMinutes = calculateTotalMinutes(todaysEntries);
  const todaysHours = formatHours(todaysMinutes);
  const lastEntry = getLastEntry(entries);

  const hasEntries = entries.length > 0;

  const totalWeeklyHours = Number(weeklySummary?.total_hours) || 0;

  const totalWeeklyShifts = Number(weeklySummary?.total_shifts) || 0;

  const overtimeHours = Number(weeklySummary?.overtime_hours) || 0;

  const showManagerTools = isManager(employee.role);
  const showAdminTools = isAdmin(employee.role);
  const isClockedIn = clockStatus?.clocked_in;
  const currentEntry = clockStatus?.current_entry;

  return (
    <DashboardErrorBoundary>
      <>
        <Navbar />

        <main style={styles.page}>
          <div style={styles.container}>
            <section style={styles.header}>
              <div style={styles.headerContent}>
                <div style={styles.headerText}>
                  <h1 style={styles.pageTitle}>
                    Welcome back, {employee.first_name}
                  </h1>

                  <p style={styles.pageSubtitle}>
                    {today} · {employee.role} dashboard
                  </p>
                </div>

                <button
                  type="button"
                  className="dashboard-refresh-button"
                  style={{
                    ...styles.refreshButton,
                    ...(pageLoading ? styles.refreshButtonDisabled : {}),
                  }}
                  onClick={loadDashboardData}
                  disabled={pageLoading}
                  aria-label="Refresh dashboard data"
                  aria-busy={pageLoading}
                >
                  {pageLoading ? "Refreshing..." : "Refresh Dashboard"}
                </button>
              </div>
            </section>

            {error && (
              <div style={styles.error} role="alert">
                <p style={styles.errorText}>{error}</p>

                <button
                  type="button"
                  className="dashboard-button"
                  style={styles.errorRetryButton}
                  onClick={loadDashboardData}
                  disabled={pageLoading}
                >
                  Try Again
                </button>
              </div>
            )}
            {pageLoading && (
              <div
                style={styles.info}
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                Loading your latest shift, weekly summary, and activity data...
              </div>
            )}

            <DashboardSection
              title="My Shift Overview"
              headingId="shift-overview-heading"
              sectionStyle={styles.section}
              titleStyle={styles.sectionTitle}
              gridStyle={styles.cardGrid}
            >
              <DashboardCard
                styles={styles}
                title="Current Status"
                value={isClockedIn ? "Clocked In" : "Clocked Out"}
                text={
                  isClockedIn
                    ? "You currently have an active shift."
                    : "You are not currently clocked in."
                }
                buttonText={isClockedIn ? "Clock Out" : "Clock In"}
                onClick={() => router.push("/clock")}
                highlight={isClockedIn ? "success" : "neutral"}
              />

              <DashboardCard
                styles={styles}
                title="Today's Hours"
                value={
                  todaysMinutes > 0 ? `${todaysHours} hrs` : "No hours today"
                }
                text={
                  hasEntries
                    ? "Total closed shift hours recorded for today."
                    : "Your worked hours will appear after your first completed shift."
                }
                buttonText="View Time History"
                onClick={() => router.push("/time-history")}
              />

              <DashboardCard
                styles={styles}
                title="Weekly Hours"
                value={
                  totalWeeklyHours > 0
                    ? `${totalWeeklyHours} hrs`
                    : "No hours this week"
                }
                text={
                  totalWeeklyShifts > 0
                    ? `${totalWeeklyShifts} closed ${
                        totalWeeklyShifts === 1 ? "shift" : "shifts"
                      } this week.`
                    : "No completed shifts have been recorded this week."
                }
                buttonText="Weekly Summary"
                onClick={() => router.push("/weekly-summary")}
              />

              <DashboardCard
                styles={styles}
                title="Overtime"
                value={`${overtimeHours} hrs`}
                text={
                  totalWeeklyHours > 40
                    ? "Estimated overtime above 40 hours."
                    : "No overtime has been recorded this week."
                }
                buttonText="View Weekly Summary"
                onClick={() => router.push("/weekly-summary")}
              />
            </DashboardSection>

            <DashboardSection
              title="Shift Details"
              headingId="shift-details-heading"
              sectionStyle={styles.section}
              titleStyle={styles.sectionTitle}
              gridStyle={styles.cardGrid}
            >
              <DashboardCard
                styles={styles}
                title="Current Shift"
                value={isClockedIn ? "Clocked In" : "No active shift"}
                text={
                  currentEntry?.clock_in
                    ? `Started ${new Date(
                        currentEntry.clock_in,
                      ).toLocaleString()}`
                    : "Clock in to begin a new shift."
                }
                buttonText="Open Clock Center"
                onClick={() => router.push("/clock")}
                highlight={isClockedIn ? "success" : "neutral"}
              />

              <DashboardCard
                styles={styles}
                title="Last Clock Event"
                value={
                  lastEntry
                    ? lastEntry.status === "open"
                      ? "Clocked In"
                      : "Clocked Out"
                    : "No activity yet"
                }
                text={
                  lastEntry?.clock_in
                    ? new Date(lastEntry.clock_in).toLocaleString()
                    : "Your most recent clock activity will appear here."
                }
                buttonText="View History"
                onClick={() => router.push("/time-history")}
              />

              <DashboardCard
                styles={styles}
                title="My Profile"
                value={employee.email}
                text={`${employee.first_name} ${employee.last_name}`}
                buttonText="Open Profile"
                onClick={() => router.push("/profile")}
              />

              <DashboardCard
                styles={styles}
                title="Notifications"
                value="Inbox"
                text="View system alerts, reminders, and messages."
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
                  text="Review clock-ins, clock-outs, and shift history."
                  buttonText="View Time Entries"
                  onClick={() => router.push("/time-entries")}
                />

                <DashboardCard
                  styles={styles}
                  title="Reports"
                  value="Reports"
                  text="Generate weekly reports and payroll exports."
                  buttonText="Open Reports"
                  onClick={() => router.push("/reports")}
                />
              </DashboardSection>
            )}

            {showAdminTools && (
              <DashboardSection
                title="Admin Tools"
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
                  text="Monitor database, RabbitMQ, and backend health."
                  buttonText="Coming Soon"
                  disabled
                />

                <DashboardCard
                  styles={styles}
                  title="Maintenance"
                  value="Planned"
                  text="Track cron jobs, cleanup tasks, and rotation history."
                  buttonText="Coming Soon"
                  disabled
                />
              </DashboardSection>
            )}
          </div>
        </main>
      </>
    </DashboardErrorBoundary>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#EAF3FF",
    padding: "clamp(16px, 3vw, 32px)",
  },

  container: {
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "32px",
  },

  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },

  headerText: {
    minWidth: 0,
    flex: "1 1 280px",
  },

  pageTitle: {
    color: "#0A4DA2",
    fontSize: "clamp(28px, 4vw, 36px)",
    fontWeight: "bold",
    margin: "0 0 8px",
    overflowWrap: "anywhere",
  },

  pageSubtitle: {
    color: "#6B7280",
    fontSize: "16px",
    margin: 0,
    overflowWrap: "anywhere",
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

  error: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
    overflowWrap: "anywhere",
  },

  loadingPage: {
    minHeight: "100vh",
    backgroundColor: "#EAF3FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "clamp(16px, 3vw, 32px)",
  },

  loadingCard: {
    width: "min(100%, 460px)",
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "clamp(24px, 4vw, 32px)",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
    textAlign: "center",
  },

  loadingTitle: {
    color: "#0A4DA2",
    fontSize: "clamp(24px, 4vw, 28px)",
    fontWeight: "bold",
    marginBottom: "8px",
  },

  loadingText: {
    color: "#6B7280",
  },

  info: {
    backgroundColor: "#DBEAFE",
    color: "#1E40AF",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
    overflowWrap: "anywhere",
  },

  refreshButton: {
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #0A4DA2",
    padding: "10px 16px",
    minHeight: "44px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "normal",
  },

  refreshButtonDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
  errorText: {
    margin: 0,
    lineHeight: 1.5,
  },

  errorRetryButton: {
    marginTop: "12px",
    backgroundColor: "#991B1B",
    color: "#FFFFFF",
    border: "none",
    padding: "10px 16px",
    minHeight: "44px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
