"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

const initialForm = {
  request_type: "vacation",
  start_date: "",
  end_date: "",
  reason: "",
};

const REQUEST_TYPES = [
  {
    value: "vacation",
    label: "Vacation",
  },
  {
    value: "personal",
    label: "Personal",
  },
  {
    value: "sick",
    label: "Sick",
  },
  {
    value: "other",
    label: "Other",
  },
];

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All Statuses",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "denied",
    label: "Denied",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

export default function PtoPage() {
  const router = useRouter();

  const { employee, loading: authLoading } = useContext(AuthContext);

  const [requests, setRequests] = useState([]);
  const [balance, setBalance] = useState(null);
  const [pagination, setPagination] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");

  const [typeFilter, setTypeFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState(initialForm);

  const [pageLoading, setPageLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [cancellingId, setCancellingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Redirect unauthenticated users.
   */
  useEffect(() => {
    if (!authLoading && !employee) {
      router.replace("/login");
    }
  }, [authLoading, employee, router]);

  /*
   * Load PTO request history.
   *
   * Day 37:
   * Supports filtering and pagination.
   */
  const loadRequests = useCallback(async () => {
    if (!employee) {
      return;
    }

    try {
      setPageLoading(true);
      setError("");

      const params = {
        page: currentPage,
        limit: 10,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (typeFilter) {
        params.type = typeFilter;
      }

      const response = await api.get("/pto/mine", {
        params,
      });

      setRequests(
        Array.isArray(response.data?.requests) ? response.data.requests : [],
      );

      setPagination(response.data?.pagination || null);
    } catch (err) {
      console.error("Load PTO requests error:", err);

      setRequests([]);
      setPagination(null);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not load your PTO requests.",
      );
    } finally {
      setPageLoading(false);
    }
  }, [employee, currentPage, statusFilter, typeFilter]);

  /*
   * Load employee PTO balances.
   */
  const loadBalance = useCallback(async () => {
    if (!employee) {
      return;
    }

    try {
      const response = await api.get("/pto/balance");

      setBalance(response.data);
    } catch (err) {
      console.error("Load PTO balance error:", err);

      setBalance(null);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not load your PTO balance.",
      );
    }
  }, [employee]);

  /*
   * Load PTO information when employee,
   * page, or filters change.
   */
  useEffect(() => {
    if (!employee) {
      return;
    }

    loadRequests();
  }, [employee, loadRequests]);

  /*
   * Balance does not need to reload when
   * filters or pagination change.
   */
  useEffect(() => {
    if (!employee) {
      return;
    }

    loadBalance();
  }, [employee, loadBalance]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
  };

  /*
   * Submit new PTO request.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = {
        request_type: form.request_type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason.trim(),
      };

      await api.post("/pto", payload);

      setSuccess("Your PTO request was submitted successfully.");

      resetForm();

      /*
       * Return to page 1 so the newly
       * submitted request is visible.
       */
      setCurrentPage(1);

      await loadRequests();
    } catch (err) {
      console.error("Submit PTO request error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not submit your PTO request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * Cancel pending PTO request.
   */
  const handleCancel = async (requestId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this PTO request?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(requestId);
      setError("");
      setSuccess("");

      await api.patch(`/pto/${requestId}/cancel`);

      setSuccess("Your PTO request was cancelled successfully.");

      await loadRequests();
    } catch (err) {
      console.error("Cancel PTO request error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not cancel your PTO request.",
      );
    } finally {
      setCancellingId(null);
    }
  };

  /*
   * Refresh all PTO data.
   */
  const handleRefresh = async () => {
    setError("");
    setSuccess("");

    await Promise.all([loadRequests(), loadBalance()]);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
    setCurrentPage(1);
  };

  if (authLoading || !employee) {
    return <div style={styles.loadingPage}>Loading...</div>;
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Employee"
        title="Paid Time Off"
        description="Request time off, review your PTO balance, and track the status of your requests."
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            style={styles.secondaryButton}
            disabled={pageLoading}
          >
            {pageLoading ? "Refreshing..." : "Refresh PTO"}
          </button>
        }
      />

      {error && (
        <div role="alert" style={styles.errorMessage}>
          {error}
        </div>
      )}

      {success && (
        <div role="status" style={styles.successMessage}>
          {success}
        </div>
      )}

      {/* PTO BALANCE */}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.sectionEyebrow}>PTO Balance</p>

            <h2 style={styles.sectionTitle}>Available Time Off</h2>

            <p style={styles.sectionDescription}>
              Review your currently available vacation, sick, and personal time.
            </p>
          </div>
        </div>

        <div style={styles.balanceGrid}>
          <PtoBalanceCard
            title="Vacation"
            hours={balance?.vacation_hours ?? 0}
            description="Available vacation time"
          />

          <PtoBalanceCard
            title="Sick Time"
            hours={balance?.sick_hours ?? 0}
            description="Available sick time"
          />

          <PtoBalanceCard
            title="Personal"
            hours={balance?.personal_hours ?? 0}
            description="Available personal time"
          />
        </div>

        {balance?.updated_at && (
          <p style={styles.balanceUpdated}>
            Balance last updated {formatDateTime(balance.updated_at)}
          </p>
        )}
      </section>

      {/* REQUEST PTO */}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.sectionEyebrow}>Request</p>

            <h2 style={styles.sectionTitle}>Request Time Off</h2>

            <p style={styles.sectionDescription}>
              Submit a new PTO request for manager review.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.formCard}>
          <div style={styles.formGrid}>
            <label style={styles.field}>
              <span style={styles.label}>Request Type</span>

              <select
                name="request_type"
                value={form.request_type}
                onChange={handleChange}
                style={styles.input}
                disabled={submitting}
              >
                {REQUEST_TYPES.map((requestType) => (
                  <option key={requestType.value} value={requestType.value}>
                    {requestType.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Start Date</span>

              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                style={styles.input}
                required
                disabled={submitting}
              />
            </label>

            <label style={styles.field}>
              <span style={styles.label}>End Date</span>

              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                style={styles.input}
                required
                disabled={submitting}
              />
            </label>
          </div>

          <label style={styles.field}>
            <span style={styles.label}>Reason</span>

            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              maxLength={1000}
              rows={5}
              placeholder="Optional reason for your request..."
              style={{
                ...styles.input,
                ...styles.textarea,
              }}
              disabled={submitting}
            />

            <span style={styles.characterCount}>
              {form.reason.length} / 1000
            </span>
          </label>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={resetForm}
              style={styles.secondaryButton}
              disabled={submitting}
            >
              Clear
            </button>

            <button
              type="submit"
              style={{
                ...styles.primaryButton,
                ...(submitting ? styles.disabledButton : {}),
              }}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </section>

      {/* PTO REQUEST HISTORY */}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.sectionEyebrow}>History</p>

            <h2 style={styles.sectionTitle}>My PTO Requests</h2>

            <p style={styles.sectionDescription}>
              Review pending, approved, denied, and cancelled PTO requests.
            </p>
          </div>

          <div style={styles.requestCount}>
            {pagination?.total ?? requests.length}{" "}
            {(pagination?.total ?? requests.length) === 1
              ? "Request"
              : "Requests"}
          </div>
        </div>

        {/* FILTERS */}

        <div style={styles.filterCard}>
          <div style={styles.filterGrid}>
            <label style={styles.field}>
              <span style={styles.label}>Status</span>

              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                style={styles.input}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Type</span>

              <select
                value={typeFilter}
                onChange={handleTypeFilterChange}
                style={styles.input}
              >
                <option value="">All Types</option>

                {REQUEST_TYPES.map((requestType) => (
                  <option key={requestType.value} value={requestType.value}>
                    {requestType.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {(statusFilter || typeFilter) && (
            <div style={styles.filterActions}>
              <button
                type="button"
                onClick={clearFilters}
                style={styles.secondaryButton}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {pageLoading ? (
          <div style={styles.emptyState}>Loading PTO requests...</div>
        ) : requests.length === 0 ? (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyStateTitle}>No PTO requests found</h3>

            <p style={styles.emptyStateText}>
              {statusFilter || typeFilter
                ? "No requests match the selected filters."
                : "Your submitted PTO requests will appear here."}
            </p>

            {(statusFilter || typeFilter) && (
              <button
                type="button"
                onClick={clearFilters}
                style={styles.secondaryButton}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={styles.requestList}>
            {requests.map((request) => (
              <PtoRequestCard
                key={request.id}
                request={request}
                onCancel={handleCancel}
                cancelling={cancellingId === request.id}
              />
            ))}
          </div>
        )}

        {/* PAGINATION */}

        {pagination && pagination.total_pages > 1 && (
          <div style={styles.pagination}>
            <button
              type="button"
              style={{
                ...styles.secondaryButton,
                ...(!pagination.has_previous_page ? styles.disabledButton : {}),
              }}
              disabled={!pagination.has_previous_page}
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            >
              Previous
            </button>

            <span style={styles.paginationText}>
              Page {pagination.page} of {pagination.total_pages}
            </span>

            <button
              type="button"
              style={{
                ...styles.secondaryButton,
                ...(!pagination.has_next_page ? styles.disabledButton : {}),
              }}
              disabled={!pagination.has_next_page}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function PtoBalanceCard({ title, hours, description }) {
  return (
    <div style={styles.balanceCard}>
      <span style={styles.balanceLabel}>{title}</span>

      <strong style={styles.balanceValue}>{formatHours(hours)} hrs</strong>

      <span style={styles.balanceDescription}>{description}</span>
    </div>
  );
}

function PtoRequestCard({ request, onCancel, cancelling }) {
  const status = request.status?.toLowerCase() || "pending";

  return (
    <article style={styles.requestCard}>
      <div style={styles.requestTop}>
        <div>
          <div style={styles.requestTitleRow}>
            <h3 style={styles.requestTitle}>
              {formatRequestType(request.request_type)}
            </h3>

            <StatusBadge status={status} />
          </div>

          <p style={styles.requestDates}>
            {formatDate(request.start_date)}
            {" – "}
            {formatDate(request.end_date)}
          </p>
        </div>
      </div>

      {request.reason && (
        <div style={styles.detailBlock}>
          <span style={styles.detailLabel}>Reason</span>

          <p style={styles.detailText}>{request.reason}</p>
        </div>
      )}

      {request.review_note && (
        <div style={styles.detailBlock}>
          <span style={styles.detailLabel}>Review Note</span>

          <p style={styles.detailText}>{request.review_note}</p>
        </div>
      )}

      <div style={styles.requestFooter}>
        <div style={styles.requestMeta}>
          <span>Requested {formatDateTime(request.created_at)}</span>

          {request.reviewed_at && (
            <span>Reviewed {formatDateTime(request.reviewed_at)}</span>
          )}
        </div>

        {status === "pending" && (
          <button
            type="button"
            onClick={() => onCancel(request.id)}
            disabled={cancelling}
            style={{
              ...styles.cancelButton,
              ...(cancelling ? styles.disabledButton : {}),
            }}
          >
            {cancelling ? "Cancelling..." : "Cancel Request"}
          </button>
        )}
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const badgeStyles = {
    pending: {
      backgroundColor: "#FEF3C7",
      color: "#92400E",
    },

    approved: {
      backgroundColor: "#DCFCE7",
      color: "#166534",
    },

    denied: {
      backgroundColor: "#FEE2E2",
      color: "#991B1B",
    },

    cancelled: {
      backgroundColor: "#E2E8F0",
      color: "#475569",
    },
  };

  const selected = badgeStyles[status] || badgeStyles.pending;

  return (
    <span
      style={{
        ...styles.statusBadge,
        ...selected,
      }}
    >
      {capitalize(status)}
    </span>
  );
}

function formatRequestType(value) {
  if (!value) {
    return "PTO";
  }

  return value.split("_").map(capitalize).join(" ");
}

function capitalize(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
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

function formatHours(value) {
  const hours = Number(value);

  if (!Number.isFinite(hours)) {
    return "0";
  }

  if (Number.isInteger(hours)) {
    return hours.toString();
  }

  return hours.toFixed(2);
}

const styles = {
  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748B",
    fontSize: "16px",
  },

  section: {
    marginBottom: "28px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },

  sectionEyebrow: {
    margin: 0,
    marginBottom: "4px",
    color: "#2563EB",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  sectionTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "22px",
    fontWeight: "bold",
  },

  sectionDescription: {
    margin: "6px 0 0",
    color: "#64748B",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  errorMessage: {
    marginBottom: "20px",
    padding: "14px 16px",
    backgroundColor: "#FEF2F2",
    border: "1px solid #FCA5A5",
    borderRadius: "10px",
    color: "#991B1B",
  },

  successMessage: {
    marginBottom: "20px",
    padding: "14px 16px",
    backgroundColor: "#F0FDF4",
    border: "1px solid #86EFAC",
    borderRadius: "10px",
    color: "#166534",
  },

  balanceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },

  balanceCard: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "20px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "16px",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.05)",
  },

  balanceLabel: {
    color: "#64748B",
    fontSize: "13px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  balanceValue: {
    color: "#0A4DA2",
    fontSize: "30px",
    lineHeight: 1.2,
  },

  balanceDescription: {
    color: "#6B7280",
    fontSize: "13px",
  },

  balanceUpdated: {
    margin: "12px 0 0",
    color: "#94A3B8",
    fontSize: "12px",
  },

  formCard: {
    padding: "22px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "16px",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.05)",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "16px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    color: "#374151",
    fontSize: "14px",
    fontWeight: "600",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "9px",
    color: "#172033",
    fontSize: "14px",
    outline: "none",
  },

  textarea: {
    resize: "vertical",
    minHeight: "110px",
    fontFamily: "inherit",
  },

  characterCount: {
    alignSelf: "flex-end",
    color: "#94A3B8",
    fontSize: "12px",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "18px",
  },

  primaryButton: {
    minHeight: "40px",
    padding: "9px 16px",
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "1px solid #0A4DA2",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  secondaryButton: {
    minHeight: "40px",
    padding: "9px 16px",
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #93C5FD",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  disabledButton: {
    opacity: 0.55,
    cursor: "not-allowed",
  },

  requestCount: {
    padding: "7px 12px",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "bold",
  },

  filterCard: {
    marginBottom: "20px",
    padding: "18px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "16px",
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },

  filterActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "14px",
  },

  requestList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  requestCard: {
    padding: "20px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "16px",
    boxShadow: "0 5px 16px rgba(15, 23, 42, 0.04)",
  },

  requestTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },

  requestTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  requestTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "18px",
  },

  requestDates: {
    margin: "6px 0 0",
    color: "#64748B",
    fontSize: "14px",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "bold",
  },

  detailBlock: {
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid #E2E8F0",
  },

  detailLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#64748B",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  detailText: {
    margin: 0,
    color: "#334155",
    fontSize: "14px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },

  requestFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "16px",
    flexWrap: "wrap",
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid #E2E8F0",
  },

  requestMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#94A3B8",
    fontSize: "12px",
  },

  cancelButton: {
    minHeight: "36px",
    padding: "7px 12px",
    backgroundColor: "#FFFFFF",
    color: "#DC2626",
    border: "1px solid #DC2626",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
  },

  emptyState: {
    padding: "32px 24px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "16px",
    color: "#64748B",
    textAlign: "center",
  },

  emptyStateTitle: {
    margin: "0 0 8px",
    color: "#172033",
    fontSize: "18px",
  },

  emptyStateText: {
    margin: "0 0 16px",
    color: "#64748B",
    fontSize: "14px",
  },

  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginTop: "20px",
  },

  paginationText: {
    color: "#475569",
    fontSize: "14px",
    fontWeight: "bold",
  },
};
