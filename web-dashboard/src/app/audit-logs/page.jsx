"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { canAccessAdmin } from "../../utils/roleAccess";

export default function AuditLogsPage() {
  const router = useRouter();
  const { employee, loading: authLoading } = useContext(AuthContext);

  const [auditLogs, setAuditLogs] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const hasAccess = canAccessAdmin(employee?.role);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/admin/audit-logs");

      setAuditLogs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);

      setError(
        err.response?.data?.error ||
          "Failed to load audit logs. Please try again.",
      );
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !employee) {
      router.replace("/login");
      return;
    }

    if (!authLoading && employee && !hasAccess) {
      router.replace("/dashboard");
    }
  }, [authLoading, employee, hasAccess, router]);

  useEffect(() => {
    if (!authLoading && employee && hasAccess) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAuditLogs();
    }
  }, [authLoading, employee, hasAccess, fetchAuditLogs]);

  const availableActions = useMemo(() => {
    return Array.from(
      new Set(auditLogs.map((log) => log.action).filter(Boolean)),
    ).sort();
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return auditLogs.filter((log) => {
      const searchableText = [
        log.id,
        log.action,
        log.first_name,
        log.last_name,
        log.email,
        log.employee_id,
        log.details,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch === "" || searchableText.includes(normalizedSearch);

      const matchesAction =
        actionFilter === "all" || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [auditLogs, search, actionFilter]);

  const stats = useMemo(() => {
    const failedLogins = auditLogs.filter(
      (log) => log.action === "FAILED_LOGIN",
    ).length;

    const loginEvents = auditLogs.filter(
      (log) => log.action === "LOGIN",
    ).length;

    const clockEvents = auditLogs.filter(
      (log) => log.action === "CLOCK_IN" || log.action === "CLOCK_OUT",
    ).length;

    return {
      total: auditLogs.length,
      loginEvents,
      failedLogins,
      clockEvents,
    };
  }, [auditLogs]);

  if (authLoading) {
    return (
      <main style={styles.permissionPage}>
        <div style={styles.permissionCard} role="status" aria-live="polite">
          Checking permissions...
        </div>
      </main>
    );
  }

  if (!employee || !hasAccess) {
    return null;
  }

  return (
    <AppShell>
      <div style={styles.page}>
        <PageHeader
          eyebrow="Administration"
          title="Audit Logs"
          description="Review system activity, authentication events, and security-sensitive actions."
          actions={
            <button
              type="button"
              style={{
                ...styles.primaryButton,
                ...(pageLoading ? styles.disabledButton : {}),
              }}
              onClick={fetchAuditLogs}
              disabled={pageLoading}
            >
              {pageLoading ? "Refreshing..." : "Refresh Logs"}
            </button>
          }
        />

        <section style={styles.statsGrid} aria-label="Audit log statistics">
          <StatCard label="Total Events" value={stats.total} />
          <StatCard label="Successful Logins" value={stats.loginEvents} />
          <StatCard label="Failed Logins" value={stats.failedLogins} />
          <StatCard label="Clock Events" value={stats.clockEvents} />
        </section>

        {error && (
          <div style={styles.errorState} role="alert">
            {error}
          </div>
        )}

        <section
          style={styles.tableCard}
          aria-labelledby="audit-log-table-title"
        >
          <div style={styles.tableToolbar}>
            <div>
              <p style={styles.tableEyebrow}>Security Activity</p>

              <h2 id="audit-log-table-title" style={styles.tableTitle}>
                System Event History
              </h2>

              <p style={styles.tableSubtitle}>
                Showing {filteredLogs.length} of {auditLogs.length} events.
              </p>
            </div>

            <div style={styles.filters}>
              <input
                type="search"
                aria-label="Search audit logs"
                placeholder="Search action, employee, email, or details"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={styles.searchInput}
              />

              <select
                aria-label="Filter audit logs by action"
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Actions</option>

                {availableActions.map((action) => (
                  <option key={action} value={action}>
                    {formatActionLabel(action)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {pageLoading ? (
            <div style={styles.loadingState} role="status" aria-live="polite">
              Loading audit logs...
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.headerCell}>Action</th>
                    <th style={styles.headerCell}>Employee</th>
                    <th style={styles.headerCell}>Details</th>
                    <th style={styles.headerCell}>Created At</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td style={styles.emptyState} colSpan={4}>
                        No audit logs match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <tr
                        key={log.id}
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? "#FFFFFF" : "#F8FBFF",
                        }}
                      >
                        <td style={styles.cell}>
                          <span
                            style={{
                              ...styles.actionBadge,
                              backgroundColor: getActionColor(log.action),
                            }}
                          >
                            {formatActionLabel(log.action || "UNKNOWN")}
                          </span>
                        </td>

                        <td style={styles.cell}>
                          <EmployeeCell log={log} />
                        </td>

                        <td style={styles.cell}>
                          <span style={styles.detailsText}>
                            {log.details || "No additional details"}
                          </span>
                        </td>

                        <td style={styles.cell}>
                          <div style={styles.dateCell}>
                            <span style={styles.datePrimary}>
                              {formatDate(log.created_at)}
                            </span>

                            <span style={styles.dateSecondary}>
                              {formatTime(log.created_at)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }) {
  return (
    <article style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
    </article>
  );
}

function EmployeeCell({ log }) {
  const fullName = `${log.first_name || ""} ${log.last_name || ""}`.trim();
  const displayName = fullName || "System / Unknown";

  return (
    <div style={styles.employeeCell}>
      <span style={styles.employeeAvatar} aria-hidden="true">
        {getInitials(log)}
      </span>

      <div style={styles.employeeDetails}>
        <span style={styles.employeeName}>{displayName}</span>

        <span style={styles.employeeMeta}>
          {log.email ||
            (log.employee_id
              ? `Employee ID: ${log.employee_id}`
              : "System event")}
        </span>
      </div>
    </div>
  );
}

function getInitials(log) {
  const first = log.first_name?.charAt(0) || "";
  const last = log.last_name?.charAt(0) || "";

  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }

  return "SS";
}

function formatActionLabel(action) {
  return String(action || "UNKNOWN")
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString();
}

function formatTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString();
}

function getActionColor(action) {
  switch (action) {
    case "LOGIN":
      return "#16A34A";

    case "FAILED_LOGIN":
      return "#DC2626";

    case "REGISTER":
      return "#2563EB";

    case "CLOCK_IN":
      return "#0A4DA2";

    case "CLOCK_OUT":
      return "#7C3AED";

    case "EMPLOYEE_CREATED":
      return "#0891B2";

    case "EMPLOYEE_UPDATED":
      return "#D97706";

    case "EMPLOYEE_DEACTIVATED":
      return "#B91C1C";

    case "EMPLOYEE_ACTIVATED":
      return "#15803D";

    default:
      return "#64748B";
  }
}

const styles = {
  permissionPage: {
    minHeight: "100vh",
    backgroundColor: "#F4F7FB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
  },

  permissionCard: {
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

  primaryButton: {
    minHeight: "44px",
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  disabledButton: {
    cursor: "not-allowed",
    opacity: 0.65,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #DCEBFF",
  },

  statLabel: {
    color: "#64748B",
    fontSize: "14px",
    margin: "0 0 8px",
  },

  statValue: {
    color: "#0A4DA2",
    fontSize: "30px",
    fontWeight: "bold",
    margin: 0,
  },

  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #DCEBFF",
  },

  tableToolbar: {
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    borderBottom: "1px solid #E5E7EB",
    flexWrap: "wrap",
  },

  tableEyebrow: {
    color: "#2563EB",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: "0 0 4px",
  },

  tableTitle: {
    color: "#172033",
    fontSize: "22px",
    margin: 0,
  },

  tableSubtitle: {
    color: "#64748B",
    fontSize: "14px",
    margin: "6px 0 0",
  },

  filters: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  searchInput: {
    width: "min(100%, 360px)",
    minWidth: "260px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    font: "inherit",
  },

  filterSelect: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    font: "inherit",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "940px",
    borderCollapse: "collapse",
  },

  tableHeaderRow: {
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
  },

  headerCell: {
    padding: "16px",
    textAlign: "left",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  cell: {
    padding: "16px",
    borderBottom: "1px solid #E5E7EB",
    color: "#111827",
    verticalAlign: "middle",
  },

  actionBadge: {
    color: "#FFFFFF",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    display: "inline-block",
    whiteSpace: "nowrap",
  },

  employeeCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  employeeAvatar: {
    display: "grid",
    placeItems: "center",
    width: "36px",
    height: "36px",
    flex: "0 0 auto",
    borderRadius: "50%",
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    fontSize: "12px",
    fontWeight: "bold",
  },

  employeeDetails: {
    display: "grid",
    gap: "3px",
    minWidth: 0,
  },

  employeeName: {
    color: "#172033",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  employeeMeta: {
    color: "#64748B",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },

  detailsText: {
    display: "block",
    maxWidth: "520px",
    lineHeight: 1.5,
    color: "#334155",
    overflowWrap: "anywhere",
  },

  dateCell: {
    display: "grid",
    gap: "3px",
    whiteSpace: "nowrap",
  },

  datePrimary: {
    color: "#172033",
    fontWeight: "bold",
  },

  dateSecondary: {
    color: "#64748B",
    fontSize: "12px",
  },

  loadingState: {
    padding: "48px",
    textAlign: "center",
    color: "#64748B",
  },

  emptyState: {
    padding: "48px",
    textAlign: "center",
    color: "#64748B",
  },

  errorState: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FCA5A5",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
};
