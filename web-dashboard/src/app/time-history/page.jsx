"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function TimeHistoryPage() {
  const router = useRouter();
  const { employee, loading: authLoading } = useContext(AuthContext);

  const [entries, setEntries] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadEntries = useCallback(async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/time/my-entries");

      setEntries(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Time history load error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not load your time history.",
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
      loadEntries();
    }
  }, [employee, loadEntries]);

  const stats = useMemo(() => {
    const completedEntries = entries.filter(
      (entry) => entry.status !== "open" && entry.clock_out,
    );

    const openEntries = entries.filter(
      (entry) => entry.status === "open" || !entry.clock_out,
    );

    const totalMinutes = completedEntries.reduce(
      (sum, entry) => sum + Number(entry.total_minutes || 0),
      0,
    );

    return {
      totalEntries: entries.length,
      completedEntries: completedEntries.length,
      openEntries: openEntries.length,
      totalHours: totalMinutes / 60,
    };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return entries.filter((entry) => {
      const normalizedStatus = normalizeStatus(entry);

      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableValues = [
        entry.id,
        normalizedStatus,
        formatDate(entry.clock_in),
        formatDateTime(entry.clock_in),
        formatDateTime(entry.clock_out),
        formatHours(entry.total_minutes),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableValues.includes(normalizedSearch);
    });
  }, [entries, searchTerm, statusFilter]);

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchTerm("");
  };

  const hasFilters = statusFilter !== "all" || Boolean(searchTerm.trim());

  if (authLoading || !employee) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard} role="status" aria-live="polite">
          Loading your time history...
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <div style={styles.page}>
        <PageHeader
          eyebrow="Employee Records"
          title="My Time History"
          description="Review your clock-in records, completed shifts, and total worked hours."
          actions={
            <>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => router.push("/clock")}
              >
                Clock Center
              </button>

              <button
                type="button"
                style={{
                  ...styles.secondaryButton,
                  ...(pageLoading ? styles.disabledButton : {}),
                }}
                onClick={loadEntries}
                disabled={pageLoading}
              >
                {pageLoading ? "Refreshing..." : "Refresh"}
              </button>
            </>
          }
        />

        {error && (
          <div style={styles.error} role="alert">
            <span>{error}</span>

            <button
              type="button"
              style={styles.errorButton}
              onClick={loadEntries}
              disabled={pageLoading}
            >
              Try Again
            </button>
          </div>
        )}

        <section style={styles.statsGrid} aria-label="Time history summary">
          <StatCard
            label="Total Entries"
            value={stats.totalEntries}
            helper="All recorded shifts"
          />

          <StatCard
            label="Completed"
            value={stats.completedEntries}
            helper="Closed time entries"
          />

          <StatCard
            label="Open Shifts"
            value={stats.openEntries}
            helper="Currently active"
          />

          <StatCard
            label="Total Hours"
            value={`${stats.totalHours.toFixed(2)} hrs`}
            helper="Completed shift time"
          />
        </section>

        <section style={styles.filterCard}>
          <div style={styles.filterHeader}>
            <div>
              <p style={styles.sectionEyebrow}>Find Records</p>
              <h2 style={styles.sectionTitle}>Time Entry Filters</h2>
            </div>

            {hasFilters && (
              <button
                type="button"
                style={styles.clearButton}
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>

          <div style={styles.filterGrid}>
            <label style={styles.field}>
              <span style={styles.label}>Search</span>

              <input
                style={styles.input}
                type="search"
                value={searchTerm}
                placeholder="Search by date, status, or entry ID"
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Status</span>

              <select
                style={styles.input}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>
        </section>

        <section
          style={styles.tableCard}
          aria-labelledby="time-history-table-title"
        >
          <div style={styles.tableHeader}>
            <div>
              <p style={styles.sectionEyebrow}>Shift Records</p>

              <h2 id="time-history-table-title" style={styles.tableTitle}>
                Time Entries
              </h2>

              <p style={styles.tableSubtitle}>
                Showing {filteredEntries.length} of {entries.length}{" "}
                {entries.length === 1 ? "entry" : "entries"}.
              </p>
            </div>
          </div>

          {pageLoading ? (
            <div style={styles.loadingState} role="status" aria-live="polite">
              Loading time entries...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div style={styles.emptyState}>
              <h3 style={styles.emptyTitle}>No time entries found</h3>

              <p style={styles.emptyText}>
                {hasFilters
                  ? "No records match the current search and status filters."
                  : "Your completed and active shifts will appear here."}
              </p>

              {hasFilters && (
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Clock In</th>
                    <th style={styles.th}>Clock Out</th>
                    <th style={styles.th}>Worked Time</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Entry ID</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEntries.map((entry, index) => {
                    const status = normalizeStatus(entry);

                    return (
                      <tr
                        key={entry.id || `${entry.clock_in}-${index}`}
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? "#FFFFFF" : "#F8FBFF",
                        }}
                      >
                        <td style={styles.td}>
                          <strong style={styles.dateText}>
                            {formatDate(entry.clock_in)}
                          </strong>
                        </td>

                        <td style={styles.td}>
                          {formatDateTime(entry.clock_in)}
                        </td>

                        <td style={styles.td}>
                          {entry.clock_out
                            ? formatDateTime(entry.clock_out)
                            : "Open shift"}
                        </td>

                        <td style={styles.td}>
                          <span style={styles.hoursBadge}>
                            {formatHours(entry.total_minutes)}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(status === "open"
                                ? styles.openBadge
                                : styles.closedBadge),
                            }}
                          >
                            {status}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <span style={styles.entryId}>
                            {entry.id ? `#${entry.id}` : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <article style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
      <p style={styles.statHelper}>{helper}</p>
    </article>
  );
}

function normalizeStatus(entry) {
  if (entry?.status === "open" || !entry?.clock_out) {
    return "open";
  }

  return "closed";
}

function formatDate(value) {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatHours(minutes) {
  if (minutes === null || minutes === undefined) {
    return "Pending";
  }

  const numericMinutes = Number(minutes);

  if (!Number.isFinite(numericMinutes)) {
    return "Pending";
  }

  return `${(numericMinutes / 60).toFixed(2)} hrs`;
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

  loadingCard: {
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

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  statCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  },

  statLabel: {
    color: "#64748B",
    fontSize: "14px",
    margin: "0 0 8px",
  },

  statValue: {
    color: "#0A4DA2",
    fontSize: "30px",
    fontWeight: "800",
    margin: 0,
    overflowWrap: "anywhere",
  },

  statHelper: {
    color: "#94A3B8",
    fontSize: "12px",
    margin: "8px 0 0",
  },

  filterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #DCEBFF",
  },

  filterHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },

  sectionEyebrow: {
    color: "#2563EB",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: "0 0 5px",
  },

  sectionTitle: {
    color: "#172033",
    fontSize: "22px",
    margin: 0,
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 2fr) minmax(180px, 1fr)",
    gap: "14px",
  },

  field: {
    display: "grid",
    gap: "8px",
  },

  label: {
    color: "#374151",
    fontWeight: "700",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    minHeight: "46px",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "14px",
    backgroundColor: "#FFFFFF",
  },

  secondaryButton: {
    minHeight: "44px",
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #0A4DA2",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },

  clearButton: {
    minHeight: "40px",
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #0A4DA2",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  disabledButton: {
    cursor: "not-allowed",
    opacity: 0.65,
  },

  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #DCEBFF",
  },

  tableHeader: {
    padding: "20px",
    borderBottom: "1px solid #E5E7EB",
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

  th: {
    textAlign: "left",
    padding: "16px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "16px",
    borderBottom: "1px solid #E5E7EB",
    color: "#374151",
    verticalAlign: "middle",
  },

  dateText: {
    color: "#172033",
    whiteSpace: "nowrap",
  },

  hoursBadge: {
    display: "inline-block",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  statusBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "700",
    textTransform: "capitalize",
  },

  openBadge: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },

  closedBadge: {
    backgroundColor: "#E5E7EB",
    color: "#374151",
  },

  entryId: {
    color: "#64748B",
    fontFamily: "monospace",
    fontSize: "13px",
  },

  loadingState: {
    padding: "48px",
    textAlign: "center",
    color: "#64748B",
  },

  emptyState: {
    padding: "48px 24px",
    textAlign: "center",
  },

  emptyTitle: {
    color: "#172033",
    fontSize: "20px",
    margin: "0 0 8px",
  },

  emptyText: {
    color: "#64748B",
    lineHeight: 1.6,
    margin: "0 0 18px",
  },

  error: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FCA5A5",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },

  errorButton: {
    minHeight: "38px",
    backgroundColor: "#991B1B",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "9px",
    padding: "9px 13px",
    cursor: "pointer",
    fontWeight: "700",
  },
};
