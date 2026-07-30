"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";

import DashboardCard from "../../components/DashboardCard";
import DashboardSection from "../../components/DashboardSection";
import SectionHeader from "../../components/SectionHeader";

export default function ManagerDashboardPage() {
  const router = useRouter();

  const { employee, loading } = useContext(AuthContext);

  const [overview, setOverview] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const hasManagerAccess =
    employee?.role === "manager" || employee?.role === "admin";

  /*
   * Protect manager route.
   */
  useEffect(() => {
    if (loading) {
      return;
    }

    if (!employee) {
      router.replace("/login");
      return;
    }

    if (!hasManagerAccess) {
      router.replace("/dashboard");
    }
  }, [loading, employee, hasManagerAccess, router]);

  /*
   * Load manager overview.
   */
  const loadOverview = useCallback(async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/manager/overview");

      const data =
        response?.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
          ? response.data
          : {};

      setOverview(data);
    } catch (err) {
      console.error("Manager dashboard load error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not load the manager dashboard.",
      );
    } finally {
      setPageLoading(false);
    }
  }, []);

  /*
   * Load overview after manager/admin authentication succeeds.
   */
  useEffect(() => {
    if (employee && hasManagerAccess) {
      loadOverview();
    }
  }, [employee, hasManagerAccess, loadOverview]);

  /*
   * Authentication is still being resolved.
   */
  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <h1 style={styles.loadingTitle}>Loading ShiftStack...</h1>

          <p style={styles.loadingText}>
            Checking your session and management access.
          </p>
        </div>
      </main>
    );
  }

  /*
   * Redirect effects above handle unauthorized users.
   * Returning null prevents protected content from flashing.
   */
  if (!employee || !hasManagerAccess) {
    return null;
  }

  const activeEmployees = Number(overview?.employees?.active || 0);

  const workingNow = Number(overview?.attendance?.working_now || 0);

  const pendingPto = Number(overview?.pto?.pending || 0);

  const weeklyHours = Number(overview?.week?.total_hours || 0);

  const workingEmployees = Array.isArray(overview?.working_employees)
    ? overview.working_employees
    : [];

  const pendingRequests = Array.isArray(overview?.pending_pto_requests)
    ? overview.pending_pto_requests
    : [];

  const recentActivity = Array.isArray(overview?.recent_activity)
    ? overview.recent_activity
    : [];

  return (
    <AppShell>
      <div style={styles.container}>
        <PageHeader
          eyebrow="Management"
          title="Manager Dashboard"
          description={`Welcome, ${employee.first_name}. Review workforce attendance, PTO requests, weekly hours, and recent activity.`}
          actions={
            <button
              type="button"
              style={{
                ...styles.refreshButton,
                ...(pageLoading ? styles.refreshButtonDisabled : {}),
              }}
              onClick={loadOverview}
              disabled={pageLoading}
              aria-label="Refresh manager dashboard"
              aria-busy={pageLoading}
            >
              {pageLoading ? "Refreshing..." : "Refresh Dashboard"}
            </button>
          }
        />

        {error && (
          <div style={styles.error} role="alert" aria-live="assertive">
            <p style={styles.errorText}>{error}</p>

            <button
              type="button"
              style={styles.retryButton}
              onClick={loadOverview}
              disabled={pageLoading}
            >
              Try Again
            </button>
          </div>
        )}

        {pageLoading && !overview ? (
          <div
            style={styles.info}
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            Loading workforce information...
          </div>
        ) : (
          <>
            {/* Workforce Overview */}
            <DashboardSection>
              <SectionHeader
                title="Workforce Overview"
                subtitle="A quick view of employee activity and management tasks."
                styles={styles}
              />

              <div style={styles.cardGrid}>
                <DashboardCard
                  styles={styles}
                  title="Employees"
                  value={activeEmployees}
                  text="Active employee accounts."
                  buttonText="View Employees"
                  onClick={() => router.push("/employees")}
                />

                <DashboardCard
                  styles={styles}
                  title="Working Now"
                  value={workingNow}
                  text="Employees with an active shift."
                  buttonText="Live Attendance"
                  onClick={() => router.push("/manager/attendance")}
                  highlight={workingNow > 0 ? "success" : "neutral"}
                />

                <DashboardCard
                  styles={styles}
                  title="Pending PTO"
                  value={pendingPto}
                  text="PTO requests waiting for manager review."
                  buttonText="Review PTO"
                  onClick={() => router.push("/manager/pto")}
                  highlight={pendingPto > 0 ? "warning" : "neutral"}
                />

                <DashboardCard
                  styles={styles}
                  title="Hours This Week"
                  value={`${weeklyHours.toFixed(2)} hrs`}
                  text="Completed employee hours for the current week."
                  buttonText="View Reports"
                  onClick={() => router.push("/reports")}
                />
              </div>
            </DashboardSection>

            {/* Employees Working Now */}
            <DashboardSection>
              <SectionHeader
                title="Employees Working Now"
                subtitle="Employees who currently have an open shift."
                styles={styles}
              />

              {workingEmployees.length === 0 ? (
                <EmptyState
                  title="No active shifts"
                  text="No employees are currently clocked in."
                />
              ) : (
                <div style={styles.list}>
                  {workingEmployees.map((person) => (
                    <div key={person.id} style={styles.listRow}>
                      <div style={styles.listPrimary}>
                        <strong style={styles.name}>
                          {person.first_name} {person.last_name}
                        </strong>

                        <span style={styles.secondary}>
                          {person.department || "No department assigned"}
                        </span>
                      </div>

                      <div style={styles.listMeta}>
                        <span style={styles.statusBadge}>Working</span>

                        <span style={styles.rightText}>
                          Clocked in {formatTime(person.clock_in)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.sectionFooter}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => router.push("/manager/attendance")}
                >
                  View Live Attendance
                </button>
              </div>
            </DashboardSection>

            {/* Pending PTO */}
            <DashboardSection>
              <SectionHeader
                title="Pending PTO Requests"
                subtitle="Recent requests waiting for manager review."
                styles={styles}
              />

              {pendingRequests.length === 0 ? (
                <EmptyState
                  title="No pending requests"
                  text="There are currently no PTO requests waiting for review."
                />
              ) : (
                <div style={styles.list}>
                  {pendingRequests.map((request) => (
                    <div key={request.id} style={styles.listRow}>
                      <div style={styles.listPrimary}>
                        <strong style={styles.name}>
                          {request.first_name} {request.last_name}
                        </strong>

                        <span style={styles.secondary}>
                          {formatRequestType(request.request_type)}
                        </span>
                      </div>

                      <div style={styles.listMeta}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            ...styles.pendingBadge,
                          }}
                        >
                          Pending
                        </span>

                        <span style={styles.rightText}>
                          {formatDate(request.start_date)} –{" "}
                          {formatDate(request.end_date)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.sectionFooter}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => router.push("/manager/pto")}
                >
                  Review PTO Requests
                </button>
              </div>
            </DashboardSection>

            {/* Recent Clock Activity */}
            <DashboardSection>
              <SectionHeader
                title="Recent Clock Activity"
                subtitle="Latest employee clock-in and clock-out activity."
                styles={styles}
              />

              {recentActivity.length === 0 ? (
                <EmptyState
                  title="No recent activity"
                  text="Recent employee clock activity will appear here."
                />
              ) : (
                <div style={styles.list}>
                  {recentActivity.map((entry) => {
                    const isOpen = entry.status === "open" || !entry.clock_out;

                    return (
                      <div key={entry.id} style={styles.listRow}>
                        <div style={styles.listPrimary}>
                          <strong style={styles.name}>
                            {entry.first_name} {entry.last_name}
                          </strong>

                          <span style={styles.secondary}>
                            {isOpen ? "Clocked In" : "Clocked Out"}
                          </span>
                        </div>

                        <div style={styles.listMeta}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(isOpen
                                ? styles.activeBadge
                                : styles.closedBadge),
                            }}
                          >
                            {isOpen ? "Active" : "Closed"}
                          </span>

                          <span style={styles.rightText}>
                            {formatDateTime(entry.clock_out || entry.clock_in)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={styles.sectionFooter}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => router.push("/time-entries")}
                >
                  View Time Entries
                </button>
              </div>
            </DashboardSection>
          </>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState({ title, text }) {
  return (
    <div style={styles.emptyState}>
      <strong style={styles.emptyTitle}>{title}</strong>

      <p style={styles.emptyText}>{text}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRequestType(value) {
  if (!value) {
    return "PTO";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = {
  container: {
    width: "100%",
    maxWidth: "1440px",
    margin: "0 auto",
  },

  refreshButton: {
    minHeight: "44px",
    padding: "11px 18px",
    border: "1px solid #0A4DA2",
    borderRadius: "10px",
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    cursor: "pointer",
    fontWeight: "700",
  },

  refreshButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  error: {
    marginBottom: "24px",
    padding: "16px",
    border: "1px solid #FCA5A5",
    borderRadius: "12px",
    backgroundColor: "#FEF2F2",
    color: "#991B1B",
  },

  errorText: {
    margin: 0,
    lineHeight: 1.5,
  },

  retryButton: {
    marginTop: "12px",
    minHeight: "40px",
    padding: "8px 14px",
    border: "1px solid #991B1B",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    color: "#991B1B",
    cursor: "pointer",
    fontWeight: "700",
  },

  info: {
    marginBottom: "24px",
    padding: "18px",
    border: "1px solid #BAE6FD",
    borderRadius: "12px",
    backgroundColor: "#F0F9FF",
    color: "#075985",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "18px",
    marginBottom: "8px",
  },

  section: {
    marginBottom: "28px",
  },

  sectionTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "24px",
    fontWeight: "800",
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#64748B",
    lineHeight: 1.5,
  },

  card: {
    display: "flex",
    flexDirection: "column",
    minHeight: "220px",
    padding: "22px",
    border: "1px solid #DBE4EF",
    borderRadius: "18px",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
  },

  cardLabel: {
    margin: 0,
    color: "#64748B",
    fontSize: "13px",
    fontWeight: "700",
  },

  cardValue: {
    margin: "10px 0 0",
    color: "#172033",
    fontSize: "30px",
    fontWeight: "800",
  },

  successValue: {
    color: "#15803D",
  },

  neutralValue: {
    color: "#475569",
  },

  warningValue: {
    color: "#B45309",
  },

  cardText: {
    margin: "10px 0 20px",
    color: "#64748B",
    lineHeight: 1.55,
  },

  button: {
    width: "100%",
    minHeight: "44px",
    marginTop: "auto",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    cursor: "pointer",
    fontWeight: "700",
  },

  list: {
    display: "flex",
    flexDirection: "column",
  },

  listRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    padding: "16px 0",
    borderBottom: "1px solid #E2E8F0",
  },

  listPrimary: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  listMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
  },

  name: {
    color: "#172033",
    fontSize: "15px",
  },

  secondary: {
    marginTop: "4px",
    color: "#64748B",
    fontSize: "13px",
  },

  rightText: {
    color: "#475569",
    fontSize: "13px",
    textAlign: "right",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "26px",
    padding: "4px 9px",
    borderRadius: "999px",
    backgroundColor: "#DCFCE7",
    color: "#166534",
    fontSize: "11px",
    fontWeight: "800",
  },

  pendingBadge: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },

  activeBadge: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },

  closedBadge: {
    backgroundColor: "#F1F5F9",
    color: "#475569",
  },

  emptyState: {
    padding: "32px 20px",
    border: "1px dashed #CBD5E1",
    borderRadius: "14px",
    backgroundColor: "#F8FAFC",
    textAlign: "center",
  },

  emptyTitle: {
    display: "block",
    color: "#172033",
    fontSize: "16px",
  },

  emptyText: {
    margin: "7px 0 0",
    color: "#64748B",
    lineHeight: 1.5,
  },

  sectionFooter: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "16px",
  },

  secondaryButton: {
    minHeight: "42px",
    padding: "9px 15px",
    border: "1px solid #0A4DA2",
    borderRadius: "9px",
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    cursor: "pointer",
    fontWeight: "700",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    backgroundColor: "#F4F7FB",
  },

  loadingCard: {
    width: "min(100%, 460px)",
    padding: "32px",
    border: "1px solid #DBE4EF",
    borderRadius: "18px",
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
  },

  loadingTitle: {
    margin: "0 0 8px",
    color: "#172033",
  },

  loadingText: {
    margin: 0,
    color: "#64748B",
  },
};
