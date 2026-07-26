"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import { AuthContext } from "../../context/AuthContext";
import { canAccessManagement } from "../../utils/roleAccess";
import api from "../../api/api";

export default function ReportsPage() {
  const router = useRouter();
  const { employee, loading: authLoading } = useContext(AuthContext);

  const [reports, setReports] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");

  const [pageLoading, setPageLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hasAccess = canAccessManagement(employee?.role);

  const buildQueryParams = useCallback((start, end) => {
    const params = new URLSearchParams();

    if (start) {
      params.set("start_date", start);
    }

    if (end) {
      params.set("end_date", end);
    }

    return params;
  }, []);

  const validateDateRange = useCallback((start, end) => {
    if (start && end && start > end) {
      setError("Start date cannot be later than end date.");
      return false;
    }

    return true;
  }, []);

  const loadReports = useCallback(async () => {
    if (!validateDateRange(appliedStartDate, appliedEndDate)) {
      return;
    }

    try {
      setPageLoading(true);
      setMessage("");
      setError("");

      const params = buildQueryParams(appliedStartDate, appliedEndDate);

      const response = await api.get("/reports/weekly", {
        params,
      });

      setReports(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error("Error loading reports:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load weekly reports.",
      );
    } finally {
      setPageLoading(false);
    }
  }, [appliedStartDate, appliedEndDate, buildQueryParams, validateDateRange]);

  const exportCsv = async () => {
    if (!validateDateRange(appliedStartDate, appliedEndDate)) {
      return;
    }

    try {
      setExporting(true);
      setMessage("");
      setError("");

      const params = buildQueryParams(appliedStartDate, appliedEndDate);

      const response = await api.get("/reports/weekly/export", {
        params,
        responseType: "blob",
      });

      const contentDisposition = response.headers?.["content-disposition"];
      const fileName =
        getFileNameFromDisposition(contentDisposition) ||
        buildReportFileName(appliedStartDate, appliedEndDate);

      const blob = new Blob([response.data], {
        type: response.headers?.["content-type"] || "text/csv;charset=utf-8",
      });

      const fileUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = fileUrl;
      anchor.download = fileName;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(fileUrl);

      setMessage("Weekly report exported successfully.");
    } catch (err) {
      console.error("Error exporting CSV:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to export the weekly report.",
      );
    } finally {
      setExporting(false);
    }
  };

  const applyFilters = () => {
    setMessage("");
    setError("");

    if (!validateDateRange(startDate, endDate)) {
      return;
    }

    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setMessage("");
    setError("");
  };

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
      loadReports();
    }
  }, [authLoading, employee, hasAccess, loadReports]);

  const reportStats = useMemo(() => {
    const totalEmployees = reports.length;

    const totalShifts = reports.reduce(
      (sum, row) => sum + safeNonNegativeNumber(row.total_shifts),
      0,
    );

    const totalMinutes = reports.reduce(
      (sum, row) => sum + safeNonNegativeNumber(row.total_minutes),
      0,
    );

    const totalHours = reports.reduce(
      (sum, row) => sum + safeNonNegativeNumber(row.total_hours),
      0,
    );

    return {
      totalEmployees,
      totalShifts,
      totalMinutes,
      totalHours,
    };
  }, [reports]);

  const hasFilters = Boolean(startDate || endDate);
  const filtersChanged =
    startDate !== appliedStartDate || endDate !== appliedEndDate;

  if (authLoading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <LoadingState message="Checking report access..." />
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
          title="Weekly Reports"
          description="Review employee hours, shift totals, and payroll-ready summaries."
          actions={
            <button
              type="button"
              style={{
                ...styles.exportButton,
                ...(exporting || pageLoading ? styles.disabledButton : {}),
              }}
              onClick={exportCsv}
              disabled={exporting || pageLoading}
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          }
        />

        {message && (
          <div style={styles.success} role="status" aria-live="polite">
            {message}
          </div>
        )}

        {error && (
          <div style={styles.messageWrapper}>
            <ErrorState
              message={error}
              onRetry={pageLoading ? undefined : loadReports}
            />
          </div>
        )}

        <section style={styles.statsGrid} aria-label="Weekly report summary">
          <StatCard
            label="Employees"
            value={reportStats.totalEmployees}
            helper="Included in this report"
          />

          <StatCard
            label="Total Shifts"
            value={reportStats.totalShifts}
            helper="Completed shifts"
          />

          <StatCard
            label="Total Minutes"
            value={formatNumber(reportStats.totalMinutes)}
            helper="Recorded work time"
          />

          <StatCard
            label="Total Hours"
            value={formatHours(reportStats.totalHours)}
            helper="Payroll-ready total"
          />
        </section>

        <section style={styles.filterCard}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionEyebrow}>Date Range</p>
              <h2 style={styles.sectionTitle}>Report Filters</h2>

              <p style={styles.sectionSubtitle}>
                Choose a start date, end date, or both to narrow the report.
              </p>
            </div>

            {hasFilters && (
              <button
                type="button"
                style={styles.clearButton}
                onClick={clearFilters}
                disabled={pageLoading}
              >
                Clear Filters
              </button>
            )}
          </div>

          <div style={styles.filterGrid}>
            <label style={styles.field}>
              <span style={styles.label}>Start Date</span>

              <input
                type="date"
                style={styles.input}
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
                disabled={pageLoading}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>End Date</span>

              <input
                type="date"
                style={styles.input}
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                disabled={pageLoading}
              />
            </label>

            <button
              type="button"
              onClick={applyFilters}
              style={{
                ...styles.filterButton,
                ...(pageLoading ? styles.disabledButton : {}),
              }}
              disabled={pageLoading || !filtersChanged}
            >
              {pageLoading ? "Loading..." : "Apply Filters"}
            </button>
          </div>
        </section>

        <section
          style={styles.tableCard}
          aria-labelledby="weekly-report-table-title"
        >
          <div style={styles.tableHeader}>
            <div>
              <p style={styles.sectionEyebrow}>Payroll Summary</p>

              <h2 id="weekly-report-table-title" style={styles.tableTitle}>
                Employee Hours
              </h2>

              <p style={styles.tableSubtitle}>
                {reports.length}{" "}
                {reports.length === 1 ? "employee" : "employees"} in the current
                report.
              </p>
            </div>

            <span style={styles.rangeBadge}>
              {formatDateRange(appliedStartDate, appliedEndDate)}
            </span>
          </div>

          {pageLoading && reports.length === 0 ? (
            <LoadingState message="Loading reports..." />
          ) : reports.length === 0 ? (
            <div style={styles.emptyStateWrapper}>
              <EmptyState
                title="No weekly report data"
                description="No report data was found for the selected date range."
              />
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.headerCell}>Employee</th>
                    <th style={styles.headerCell}>Email</th>
                    <th style={styles.headerCell}>Shifts</th>
                    <th style={styles.headerCell}>Minutes</th>
                    <th style={styles.headerCell}>Hours</th>
                  </tr>
                </thead>

                <tbody>
                  {reports.map((row, index) => (
                    <tr
                      key={row.employee_id || row.email || index}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#FFFFFF" : "#F8FBFF",
                      }}
                    >
                      <td style={styles.cell}>
                        <EmployeeCell row={row} />
                      </td>

                      <td style={styles.cell}>
                        <span style={styles.emailText}>
                          {row.email || "No email"}
                        </span>
                      </td>

                      <td style={styles.cell}>
                        <span style={styles.countBadge}>
                          {safeNonNegativeNumber(row.total_shifts)}
                        </span>
                      </td>

                      <td style={styles.cell}>
                        {formatNumber(row.total_minutes)}
                      </td>

                      <td style={styles.cell}>
                        <span style={styles.hoursBadge}>
                          {formatHours(row.total_hours)}
                        </span>
                      </td>
                    </tr>
                  ))}
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

function EmployeeCell({ row }) {
  const fullName = `${row.first_name || ""} ${row.last_name || ""}`.trim();

  return (
    <div style={styles.employeeCell}>
      <span style={styles.avatar} aria-hidden="true">
        {getInitials(row)}
      </span>

      <div style={styles.employeeDetails}>
        <span style={styles.employeeName}>
          {fullName || "Unknown Employee"}
        </span>

        <span style={styles.employeeId}>
          {row.employee_id ? `Employee ID: ${row.employee_id}` : "No ID"}
        </span>
      </div>
    </div>
  );
}

function getInitials(row) {
  const first = row.first_name?.charAt(0) || "";
  const last = row.last_name?.charAt(0) || "";

  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }

  return "SS";
}

function safeNonNegativeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
}

function formatNumber(value) {
  return safeNonNegativeNumber(value).toLocaleString();
}

function formatHours(value) {
  return `${safeNonNegativeNumber(value).toFixed(2)} hrs`;
}

function formatDateRange(startDate, endDate) {
  if (startDate && endDate) {
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  }

  if (startDate) {
    return `From ${formatDate(startDate)}`;
  }

  if (endDate) {
    return `Through ${formatDate(endDate)}`;
  }

  return "Current report period";
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function getFileNameFromDisposition(value) {
  if (!value) {
    return "";
  }

  const match = value.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);

  if (!match?.[1]) {
    return "";
  }

  const rawFileName = match[1].replace(/"/g, "").trim();

  try {
    return decodeURIComponent(rawFileName);
  } catch {
    return rawFileName;
  }
}

function buildReportFileName(startDate, endDate) {
  const range =
    startDate || endDate
      ? `${startDate || "start"}_to_${endDate || "current"}`
      : "current_period";

  return `shiftstack_weekly_report_${range}.csv`;
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

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
    flexWrap: "wrap",
    marginBottom: "20px",
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
    gridTemplateColumns: "repeat(2, minmax(220px, 1fr)) minmax(180px, auto)",
    gap: "14px",
    alignItems: "end",
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

  filterButton: {
    minHeight: "46px",
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    padding: "13px 18px",
    fontWeight: "700",
    cursor: "pointer",
  },

  exportButton: {
    minHeight: "44px",
    backgroundColor: "#16A34A",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: "700",
    cursor: "pointer",
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "18px",
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
    minWidth: "860px",
    borderCollapse: "collapse",
  },

  tableHeaderRow: {
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
  },

  headerCell: {
    padding: "16px",
    textAlign: "left",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  cell: {
    padding: "16px",
    borderBottom: "1px solid #E5E7EB",
    color: "#111827",
    verticalAlign: "middle",
  },

  employeeCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  avatar: {
    width: "38px",
    height: "38px",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    borderRadius: "50%",
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    fontSize: "12px",
    fontWeight: "800",
  },

  employeeDetails: {
    display: "grid",
    gap: "3px",
    minWidth: 0,
  },

  employeeName: {
    color: "#172033",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  employeeId: {
    color: "#64748B",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },

  emailText: {
    color: "#475569",
    overflowWrap: "anywhere",
  },

  countBadge: {
    display: "inline-block",
    minWidth: "38px",
    textAlign: "center",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "700",
  },

  hoursBadge: {
    display: "inline-block",
    backgroundColor: "#DCFCE7",
    color: "#166534",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  messageWrapper: {
    marginBottom: "20px",
  },

  emptyStateWrapper: {
    padding: "20px",
  },

  success: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    border: "1px solid #BBF7D0",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
};
