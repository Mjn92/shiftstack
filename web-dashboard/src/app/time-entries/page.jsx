"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { formatDateTime, formatMinutes } from "../../utils/dateTime";
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

      setEntries(Array.isArray(response?.data) ? response.data : []);
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

      const normalizedStatus = normalizeEntryStatus(entry.status);

      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [entries, search, statusFilter]);

  const stats = useMemo(() => {
    const openEntries = entries.filter(
      (entry) => normalizeEntryStatus(entry.status) === "open",
    );

    const closedEntries = entries.filter(
      (entry) => normalizeEntryStatus(entry.status) === "closed",
    );

    const totalMinutes = closedEntries.reduce((total, entry) => {
      return total + safeNonNegativeNumber(entry.total_minutes);
    }, 0);

    return {
      total: entries.length,
      open: openEntries.length,
      closed: closedEntries.length,
      totalHours: totalMinutes / 60,
    };
  }, [entries]);

  const initialPageLoading = pageLoading && entries.length === 0;

  if (authLoading) {
    return (
      <main style={styles.permissionPage}>
        <div style={styles.permissionCard}>
          <LoadingState message="Checking permissions..." />
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
          <div style={styles.messageWrapper}>
            <ErrorState
              message={error}
              onRetry={pageLoading ? undefined : loadEntries}
            />
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

          {initialPageLoading ? (
            <LoadingState message="Loading time entries..." />
          ) : entries.length === 0 ? (
            <div style={styles.emptyStateWrapper}>
              <EmptyState
                title="No time entries yet"
                description="Employee clock-in and clock-out activity will appear here."
              />
            </div>
          ) : (
            <>
              <div
                className="time-entries-desktop-table"
                style={styles.tableWrapper}
              >
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
                                  {safeNonNegativeNumber(
                                    entry.total_minutes,
                                  ).toLocaleString()}{" "}
                                  min
                                </div>
                              </div>
                            )}
                          </td>

                          <td style={styles.cell}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                backgroundColor: getStatusColor(entry.status),
                              }}
                            >
                              {normalizeEntryStatus(entry.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div
                className="time-entries-mobile-list"
                style={styles.mobileList}
              >
                {filteredEntries.length === 0 ? (
                  <EmptyState
                    title="No matching time entries"
                    description="Adjust the search or status filter and try again."
                  />
                ) : (
                  filteredEntries.map((entry) => (
                    <article
                      key={`mobile-entry-${entry.id}`}
                      style={styles.mobileCard}
                    >
                      <div style={styles.mobileCardHeader}>
                        <EmployeeCell entry={entry} />

                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: getStatusColor(entry.status),
                          }}
                        >
                          {normalizeEntryStatus(entry.status)}
                        </span>
                      </div>

                      <div style={styles.mobileDetails}>
                        <MobileDetail
                          label="Entry ID"
                          value={entry.id ? `#${entry.id}` : "—"}
                        />

                        <MobileDetail
                          label="Clock In"
                          value={formatDateTime(entry.clock_in)}
                        />

                        <MobileDetail
                          label="Clock Out"
                          value={
                            entry.clock_out
                              ? formatDateTime(entry.clock_out)
                              : "Still open"
                          }
                        />

                        <MobileDetail
                          label="Worked Time"
                          value={
                            entry.total_minutes === null ||
                            entry.total_minutes === undefined
                              ? "—"
                              : formatMinutes(entry.total_minutes)
                          }
                        />
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          )}
        </section>

        <style jsx>{`
          .time-entries-mobile-list {
            display: none !important;
          }

          @media (max-width: 820px) {
            .time-entries-desktop-table {
              display: none !important;
            }

            .time-entries-mobile-list {
              display: grid !important;
            }
          }
        `}</style>
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

  const fallback = entry.employee_id ?? "SS";

  return String(fallback).slice(-2).toUpperCase();
}

function MobileDetail({ label, value }) {
  return (
    <div style={styles.mobileDetail}>
      <span style={styles.mobileDetailLabel}>{label}</span>
      <strong style={styles.mobileDetailValue}>{value}</strong>
    </div>
  );
}

function normalizeEntryStatus(status) {
  if (typeof status !== "string" || !status.trim()) {
    return "unknown";
  }

  const normalized = status.trim().toLowerCase();

  if (normalized === "open" || normalized === "closed") {
    return normalized;
  }

  return "unknown";
}

function getStatusColor(status) {
  const normalized = normalizeEntryStatus(status);

  if (normalized === "open") {
    return "#16A34A";
  }

  if (normalized === "closed") {
    return "#2563EB";
  }

  return "#64748B";
}

function safeNonNegativeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
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
    boxSizing: "border-box",
    minWidth: "250px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    font: "inherit",
  },

  filterSelect: {
    boxSizing: "border-box",
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

  messageWrapper: {
    marginBottom: "20px",
  },

  emptyStateWrapper: {
    padding: "20px",
  },

  mobileList: {
    display: "grid",
    gap: "14px",
    padding: "16px",
  },

  mobileCard: {
    padding: "18px",
    border: "1px solid #DCEBFF",
    borderRadius: "16px",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.05)",
  },

  mobileCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    paddingBottom: "14px",
    borderBottom: "1px solid #E2E8F0",
  },

  mobileDetails: {
    display: "grid",
    gap: "10px",
    paddingTop: "14px",
  },

  mobileDetail: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
  },

  mobileDetailLabel: {
    color: "#64748B",
    fontSize: "13px",
  },

  mobileDetailValue: {
    color: "#172033",
    fontSize: "13px",
    textAlign: "right",
    overflowWrap: "anywhere",
  },

  emptyState: {
    padding: "48px",
    textAlign: "center",
    color: "#64748B",
  },
};
