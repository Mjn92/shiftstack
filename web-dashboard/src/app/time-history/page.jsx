"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FilterX,
  History,
  RefreshCw,
  Search,
  Timer,
} from "lucide-react";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";
import {
  formatDate,
  formatDateTime,
  formatMinutes,
} from "../../utils/dateTime";
import "./time-history.css";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function TimeHistoryPage() {
  const router = useRouter();
  const { employee, loading: authLoading } = useContext(AuthContext);

  const [entries, setEntries] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const loadEntries = useCallback(async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/time/my-entries");

      setEntries(Array.isArray(response?.data) ? response.data : []);
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

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const result = entries.filter((entry) => {
      const normalizedStatus = normalizeStatus(entry);
      const entryDate = getDateOnly(entry.clock_in);

      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;

      const matchesStartDate =
        !startDate || (entryDate && entryDate >= startDate);

      const matchesEndDate = !endDate || (entryDate && entryDate <= endDate);

      if (!matchesStatus || !matchesStartDate || !matchesEndDate) {
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
        formatMinutes(entry.total_minutes),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableValues.includes(normalizedSearch);
    });

    return result.sort((first, second) => {
      const firstTime = new Date(first.clock_in || 0).getTime();
      const secondTime = new Date(second.clock_in || 0).getTime();

      return sortOrder === "oldest"
        ? firstTime - secondTime
        : secondTime - firstTime;
    });
  }, [endDate, entries, searchTerm, sortOrder, startDate, statusFilter]);

  const stats = useMemo(() => {
    const completedEntries = filteredEntries.filter(
      (entry) => normalizeStatus(entry) === "closed",
    );

    const openEntries = filteredEntries.filter(
      (entry) => normalizeStatus(entry) === "open",
    );

    const totalMinutes = completedEntries.reduce(
      (sum, entry) => sum + safeNonNegativeNumber(entry.total_minutes),
      0,
    );

    return {
      totalEntries: filteredEntries.length,
      completedEntries: completedEntries.length,
      openEntries: openEntries.length,
      totalHours: totalMinutes / 60,
    };
  }, [filteredEntries]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;

    return filteredEntries.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredEntries, pageSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchTerm, statusFilter, startDate, endDate, sortOrder, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const hasFilters =
    statusFilter !== "all" ||
    Boolean(searchTerm.trim()) ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    sortOrder !== "newest";

  const initialPageLoading = pageLoading && entries.length === 0;

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const exportCsv = async () => {
    if (filteredEntries.length === 0) {
      setError("There are no matching time entries to export.");
      return;
    }

    try {
      setExporting(true);
      setError("");

      const rows = filteredEntries.map((entry) => ({
        entry_id: entry.id || "",
        date: formatDate(entry.clock_in),
        clock_in: formatDateTime(entry.clock_in),
        clock_out: entry.clock_out
          ? formatDateTime(entry.clock_out)
          : "Open shift",
        total_minutes:
          entry.total_minutes === null || entry.total_minutes === undefined
            ? ""
            : safeNonNegativeNumber(entry.total_minutes),
        total_hours:
          entry.total_minutes === null || entry.total_minutes === undefined
            ? ""
            : (safeNonNegativeNumber(entry.total_minutes) / 60).toFixed(2),
        status: normalizeStatus(entry),
      }));

      const csv = createCsv(rows);
      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8",
      });

      const fileUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = fileUrl;
      anchor.download = buildExportFileName(startDate, endDate);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error("Time history export error:", err);
      setError("Could not export your time history.");
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || !employee) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <LoadingState message="Loading your time history..." />
        </div>
      </main>
    );
  }

  const firstVisibleEntry =
    filteredEntries.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const lastVisibleEntry = Math.min(
    currentPage * pageSize,
    filteredEntries.length,
  );

  return (
    <AppShell>
      <div style={styles.page}>
        <PageHeader
          eyebrow="Employee Records"
          title="My Time History"
          description="Review, filter, and export your clock-in and clock-out records."
          actions={
            <>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => router.push("/clock")}
              >
                <Clock3 size={17} aria-hidden="true" />
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
                <RefreshCw size={17} aria-hidden="true" />
                {pageLoading ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                style={{
                  ...styles.exportButton,
                  ...(exporting || pageLoading ? styles.disabledButton : {}),
                }}
                onClick={exportCsv}
                disabled={exporting || pageLoading}
              >
                <Download size={17} aria-hidden="true" />
                {exporting ? "Exporting..." : "Export CSV"}
              </button>
            </>
          }
        />

        {error && (
          <div style={styles.messageWrapper}>
            <ErrorState
              message={error}
              onRetry={pageLoading ? undefined : loadEntries}
            />
          </div>
        )}

        <section style={styles.statsGrid} aria-label="Time history summary">
          <StatCard
            icon={History}
            label="Matching Entries"
            value={stats.totalEntries}
            helper="Entries in the current view"
          />

          <StatCard
            icon={CalendarDays}
            label="Completed"
            value={stats.completedEntries}
            helper="Closed time entries"
          />

          <StatCard
            icon={Clock3}
            label="Open Shifts"
            value={stats.openEntries}
            helper="Currently active"
          />

          <StatCard
            icon={Timer}
            label="Filtered Hours"
            value={`${stats.totalHours.toFixed(2)} hrs`}
            helper="Completed time in this view"
          />
        </section>

        <section style={styles.filterCard}>
          <div style={styles.filterHeader}>
            <div>
              <p style={styles.sectionEyebrow}>History Controls</p>
              <h2 style={styles.sectionTitle}>Filter Time Entries</h2>
              <p style={styles.sectionSubtitle}>
                Search records, select a date range, and control the sort order.
              </p>
            </div>

            {hasFilters && (
              <button
                type="button"
                style={styles.clearButton}
                onClick={clearFilters}
              >
                <FilterX size={16} aria-hidden="true" />
                Clear Filters
              </button>
            )}
          </div>

          <div style={styles.filterGrid}>
            <label style={styles.field}>
              <span style={styles.label}>Search</span>

              <div style={styles.searchWrapper}>
                <Search
                  size={17}
                  aria-hidden="true"
                  style={styles.searchIcon}
                />

                <input
                  style={styles.searchInput}
                  type="search"
                  value={searchTerm}
                  placeholder="Date, status, or entry ID"
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
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

            <label style={styles.field}>
              <span style={styles.label}>Start Date</span>

              <input
                style={styles.input}
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>End Date</span>

              <input
                style={styles.input}
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Sort Order</span>

              <select
                style={styles.input}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Rows Per Page</span>

              <select
                style={styles.input}
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} rows
                  </option>
                ))}
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
                Showing {firstVisibleEntry}–{lastVisibleEntry} of{" "}
                {filteredEntries.length} matching{" "}
                {filteredEntries.length === 1 ? "entry" : "entries"}.
              </p>
            </div>

            <span style={styles.rangeBadge}>
              {formatDateRange(startDate, endDate)}
            </span>
          </div>

          {initialPageLoading ? (
            <LoadingState message="Loading time entries..." />
          ) : filteredEntries.length === 0 ? (
            <div style={styles.emptyStateWrapper}>
              <EmptyState
                title="No time entries found"
                description={
                  hasFilters
                    ? "No records match the selected filters."
                    : "Your completed and active shifts will appear here."
                }
                action={
                  hasFilters ? (
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={clearFilters}
                    >
                      <FilterX size={16} aria-hidden="true" />
                      Clear Filters
                    </button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <>
              <div
                className="time-history-desktop-table"
                style={styles.tableWrapper}
              >
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
                    {paginatedEntries.map((entry, index) => {
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
                              {formatEntryDuration(entry)}
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

              <div
                className="time-history-mobile-list"
                style={styles.mobileList}
              >
                {paginatedEntries.map((entry) => {
                  const status = normalizeStatus(entry);

                  return (
                    <div key={entry.id} style={styles.mobileCard}>
                      <div style={styles.mobileHeader}>
                        <strong>{formatDate(entry.clock_in)}</strong>

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
                      </div>

                      <div style={styles.mobileRow}>
                        <span>Clock In</span>
                        <strong>{formatDateTime(entry.clock_in)}</strong>
                      </div>

                      <div style={styles.mobileRow}>
                        <span>Clock Out</span>
                        <strong>
                          {entry.clock_out
                            ? formatDateTime(entry.clock_out)
                            : "Open shift"}
                        </strong>
                      </div>

                      <div style={styles.mobileRow}>
                        <span>Worked Time</span>

                        <span style={styles.hoursBadge}>
                          {formatEntryDuration(entry)}
                        </span>
                      </div>

                      <div style={styles.mobileRow}>
                        <span>Entry ID</span>
                        <code style={styles.entryId}>
                          {entry.id ? `#${entry.id}` : "—"}
                        </code>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={styles.pagination}>
                <p style={styles.paginationText}>
                  Page {currentPage} of {totalPages}
                </p>

                <div style={styles.paginationActions}>
                  <button
                    type="button"
                    style={{
                      ...styles.paginationButton,
                      ...(currentPage === 1 ? styles.disabledButton : {}),
                    }}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={17} aria-hidden="true" />
                    Previous
                  </button>

                  <button
                    type="button"
                    style={{
                      ...styles.paginationButton,
                      ...(currentPage === totalPages
                        ? styles.disabledButton
                        : {}),
                    }}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <article style={styles.statCard}>
      <div style={styles.statIcon} aria-hidden="true">
        <Icon size={20} />
      </div>

      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
      <p style={styles.statHelper}>{helper}</p>
    </article>
  );
}

function normalizeStatus(entry) {
  const status =
    typeof entry?.status === "string" ? entry.status.trim().toLowerCase() : "";

  if (status === "open") {
    return "open";
  }

  if (status === "closed") {
    return "closed";
  }

  if (!entry?.clock_out) {
    return "open";
  }

  return "closed";
}

function getDateOnly(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function safeNonNegativeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
}

function formatEntryDuration(entry) {
  if (entry?.total_minutes === null || entry?.total_minutes === undefined) {
    return normalizeStatus(entry) === "open" ? "In progress" : "—";
  }

  return formatMinutes(safeNonNegativeNumber(entry.total_minutes));
}

function formatDateRange(startDate, endDate) {
  if (startDate && endDate) {
    return `${formatDate(`${startDate}T00:00:00`)} – ${formatDate(
      `${endDate}T00:00:00`,
    )}`;
  }

  if (startDate) {
    return `From ${formatDate(`${startDate}T00:00:00`)}`;
  }

  if (endDate) {
    return `Through ${formatDate(`${endDate}T00:00:00`)}`;
  }

  return "All dates";
}

function createCsv(rows) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);

  const escapeCell = (value) => {
    const text = String(value ?? "");

    return `"${text.replace(/"/g, '""')}"`;
  };

  return [
    headers.map(escapeCell).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCell(row[header])).join(","),
    ),
  ].join("\n");
}

function buildExportFileName(startDate, endDate) {
  const range =
    startDate || endDate
      ? `${startDate || "start"}_to_${endDate || "current"}`
      : "all_dates";

  return `shiftstack_time_history_${range}.csv`;
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
    position: "relative",
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },

  statIcon: {
    width: "40px",
    height: "40px",
    display: "grid",
    placeItems: "center",
    borderRadius: "12px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    marginBottom: "14px",
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

  sectionSubtitle: {
    color: "#64748B",
    fontSize: "14px",
    margin: "6px 0 0",
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
    boxSizing: "border-box",
    minHeight: "46px",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "14px",
    backgroundColor: "#FFFFFF",
  },

  searchWrapper: {
    position: "relative",
  },

  searchIcon: {
    position: "absolute",
    left: "13px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748B",
    pointerEvents: "none",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "46px",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    padding: "12px 14px 12px 40px",
    fontSize: "14px",
    backgroundColor: "#FFFFFF",
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "44px",
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #0A4DA2",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },

  exportButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "44px",
    backgroundColor: "#16A34A",
    color: "#FFFFFF",
    border: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },

  clearButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
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

  rangeBadge: {
    display: "inline-block",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    border: "1px solid #BFDBFE",
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: "700",
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

  messageWrapper: {
    marginBottom: "20px",
  },

  emptyStateWrapper: {
    padding: "20px",
  },

  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    padding: "16px 20px",
    borderTop: "1px solid #E5E7EB",
  },

  paginationText: {
    color: "#64748B",
    fontSize: "14px",
    margin: 0,
  },

  paginationActions: {
    display: "flex",
    gap: "10px",
  },

  paginationButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    minHeight: "40px",
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #BFDBFE",
    borderRadius: "9px",
    padding: "9px 13px",
    cursor: "pointer",
    fontWeight: "700",
  },

  mobileList: {
    gap: "14px",
  },

  mobileCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  },

  mobileHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },

  mobileRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #EEF2F7",
  },
};
