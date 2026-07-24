"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { canAccessManagement } from "../../utils/roleAccess";

export default function TimeEntriesPage() {
  const router = useRouter();
  const { employee, loading: authLoading } = useContext(AuthContext);

  const [entries, setEntries] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const hasAccess = canAccessManagement(employee?.role);

  const loadEntries = useCallback(async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/admin/time-entries");

      setEntries(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error loading time entries:", err);

      setError(
        err.response?.data?.error ||
          "Failed to load time entries. Please try again.",
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
      loadEntries();
    }
  }, [authLoading, employee, hasAccess, loadEntries]);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const searchableText = [
        entry.id,
        entry.employee_id,
        entry.first_name,
        entry.last_name,
        entry.email,
        entry.status,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch === "" || searchableText.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" || entry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [entries, search, statusFilter]);

  const stats = useMemo(() => {
    const openEntries = entries.filter((entry) => entry.status === "open");
    const closedEntries = entries.filter((entry) => entry.status !== "open");

    const totalMinutes = closedEntries.reduce((total, entry) => {
      return total + Number(entry.total_minutes || 0);
    }, 0);

    return {
      total: entries.length,
      open: openEntries.length,
      closed: closedEntries.length,
      totalHours: totalMinutes / 60,
    };
  }, [entries]);

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
          eyebrow="Management"
          title="Time Entries"
          description="Review employee clock-in, clock-out, and worked-time activity."
          actions={
            <button
              type="button"
              style={{
                ...styles.primaryButton,
                ...(pageLoading ? styles.disabledButton : {}),
              }}
              onClick={loadEntries}
              disabled={pageLoading}
            >
              {pageLoading ? "Refreshing..." : "Refresh Entries"}
            </button>
          }
        />

        <section style={styles.statsGrid} aria-label="Time entry statistics">
          <StatCard label="Total Entries" value={stats.total} />
          <StatCard label="Open Shifts" value={stats.open} />
          <StatCard label="Closed Shifts" value={stats.closed} />
          <StatCard
            label="Recorded Hours"
            value={`${stats.totalHours.toFixed(2)} hrs`}
          />
        </section>

        {error && (
          <div style={styles.errorState} role="alert">
            {error}
          </div>
        )}

        <section
          style={styles.tableCard}
          aria-labelledby="time-entries-table-title"
        >
          <div style={styles.tableToolbar}>
            <div>
              <p style={styles.tableEyebrow}>Activity Log</p>

              <h2 id="time-entries-table-title" style={styles.tableTitle}>
                Employee Time Records
              </h2>

              <p style={styles.tableSubtitle}>
                Showing {filteredEntries.length} of {entries.length} entries.
              </p>
            </div>

            <div style={styles.filters}>
              <input
                type="search"
                aria-label="Search time entries"
                placeholder="Search employee, ID, email, or status"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={styles.searchInput}
              />

              <select
                aria-label="Filter time entries by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {pageLoading ? (
            <div style={styles.loadingState} role="status" aria-live="polite">
              Loading time entries...
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.headerCell}>Entry ID</th>
                    <th style={styles.headerCell}>Employee</th>
                    <th style={styles.headerCell}>Clock In</th>
                    <th style={styles.headerCell}>Clock Out</th>
                    <th style={styles.headerCell}>Worked Time</th>
                    <th style={styles.headerCell}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td style={styles.emptyState} colSpan={6}>
                        No time entries match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry, index) => (
                      <tr
                        key={entry.id}
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? "#FFFFFF" : "#F8FBFF",
                        }}
                      >
                        <td style={styles.cell}>
                          <span style={styles.entryId}>#{entry.id}</span>
                        </td>

                        <td style={styles.cell}>
                          <EmployeeCell entry={entry} />
                        </td>

                        <td style={styles.cell}>
                          {formatDateTime(entry.clock_in)}
                        </td>

                        <td style={styles.cell}>
                          {entry.clock_out ? (
                            formatDateTime(entry.clock_out)
                          ) : (
                            <span style={styles.openText}>Still open</span>
                          )}
                        </td>

                        <td style={styles.cell}>
                          {entry.total_minutes === null ||
                          entry.total_minutes === undefined ? (
                            "—"
                          ) : (
                            <div>
                              <strong>
                                {formatMinutes(entry.total_minutes)}
                              </strong>

                              <div style={styles.minutesText}>
                                {Number(entry.total_minutes).toLocaleString()}{" "}
                                min
                              </div>
                            </div>
                          )}
                        </td>

                        <td style={styles.cell}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              backgroundColor:
                                entry.status === "open" ? "#16A34A" : "#2563EB",
                            }}
                          >
                            {entry.status || "unknown"}
                          </span>
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

function EmployeeCell({ entry }) {
  const hasEmployeeName = entry.first_name || entry.last_name;

  const displayName = hasEmployeeName
    ? `${entry.first_name || ""} ${entry.last_name || ""}`.trim()
    : `Employee #${entry.employee_id}`;

  return (
    <div style={styles.employeeCell}>
      <span style={styles.employeeAvatar} aria-hidden="true">
        {getInitials(entry)}
      </span>

      <div style={styles.employeeDetails}>
        <span style={styles.employeeName}>{displayName}</span>

        <span style={styles.employeeMeta}>
          {entry.email || `ID: ${entry.employee_id}`}
        </span>
      </div>
    </div>
  );
}

function getInitials(entry) {
  const first = entry.first_name?.charAt(0) || "";
  const last = entry.last_name?.charAt(0) || "";

  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }

  return String(entry.employee_id || "SS")
    .slice(-2)
    .toUpperCase();
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString();
}

function formatMinutes(value) {
  const totalMinutes = Number(value || 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr${hours === 1 ? "" : "s"}`;
  }

  return `${hours} hr${hours === 1 ? "" : "s"} ${minutes} min`;
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
    width: "min(100%, 340px)",
    minWidth: "250px",
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
    minWidth: "980px",
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

  entryId: {
    color: "#475569",
    fontWeight: "bold",
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

  minutesText: {
    color: "#64748B",
    fontSize: "12px",
    marginTop: "3px",
  },

  openText: {
    color: "#15803D",
    fontWeight: "bold",
  },

  statusBadge: {
    color: "#FFFFFF",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
    display: "inline-block",
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
