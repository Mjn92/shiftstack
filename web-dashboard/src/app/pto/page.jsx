"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";

import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";

import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

const initialForm = {
  request_type: "vacation",
  start_date: "",
  end_date: "",
  reason: "",
};

export default function PtoPage() {
  const router = useRouter();

  const { employee, loading: authLoading } = useContext(AuthContext);

  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !employee) {
      router.replace("/login");
    }
  }, [authLoading, employee, router]);

  const loadRequests = useCallback(async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/pto/mine");

      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Load PTO error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not load your PTO requests.",
      );
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (employee) {
      loadRequests();
    }
  }, [employee, loadRequests]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!form.request_type || !form.start_date || !form.end_date) {
      setError("Request type, start date, and end date are required.");

      return;
    }

    if (form.start_date > form.end_date) {
      setError("End date cannot be before start date.");

      return;
    }

    if (form.reason.trim().length > 1000) {
      setError("Reason cannot exceed 1000 characters.");

      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await api.post("/pto", {
        request_type: form.request_type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason.trim(),
      });

      setForm(initialForm);

      setSuccess("Your PTO request was submitted successfully.");

      await loadRequests();
    } catch (err) {
      console.error("Submit PTO error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not submit your PTO request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setError("");
    setSuccess("");
  };

  if (authLoading || !employee) {
    return <LoadingState message="Checking your PTO access..." />;
  }

  return (
    <AppShell>
      <div className="page-container">
        <PageHeader
          eyebrow="Time Off"
          title="Paid Time Off"
          description="Request time off and review your PTO request history."
          actions={
            <button
              type="button"
              style={styles.refreshButton}
              onClick={loadRequests}
              disabled={pageLoading}
            >
              {pageLoading ? "Refreshing..." : "Refresh Requests"}
            </button>
          }
        />

        {error && (
          <div style={styles.stateSpacing}>
            <ErrorState
              message={error}
              onRetry={requests.length === 0 ? loadRequests : undefined}
            />
          </div>
        )}

        {success && (
          <div style={styles.success} role="status" aria-live="polite">
            <span>{success}</span>

            <button
              type="button"
              style={styles.messageClose}
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionEyebrow}>New Request</p>

              <h2 style={styles.sectionTitle}>Request Time Off</h2>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={styles.formCard}
            aria-busy={submitting}
          >
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
                  <option value="vacation">Vacation</option>

                  <option value="personal">Personal</option>

                  <option value="sick">Sick</option>

                  <option value="other">Other</option>
                </select>
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Start Date</span>

                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  max={form.end_date || undefined}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>End Date</span>

                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  min={form.start_date || undefined}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                  style={styles.input}
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
                rows={4}
                placeholder="Optional reason for your request"
                disabled={submitting}
                style={{
                  ...styles.input,
                  resize: "vertical",
                }}
              />

              <span style={styles.characterCount}>
                {form.reason.length} / 1000
              </span>
            </label>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                style={{
                  ...styles.secondaryButton,
                  ...(submitting ? styles.disabledButton : {}),
                }}
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...styles.primaryButton,
                  ...(submitting ? styles.disabledButton : {}),
                }}
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionEyebrow}>Request History</p>

              <h2 style={styles.sectionTitle}>My PTO Requests</h2>
            </div>

            {!pageLoading && requests.length > 0 && (
              <span style={styles.requestCount}>
                {requests.length}{" "}
                {requests.length === 1 ? "request" : "requests"}
              </span>
            )}
          </div>

          {pageLoading && requests.length === 0 ? (
            <LoadingState message="Loading PTO requests..." />
          ) : requests.length === 0 ? (
            <EmptyState
              title="No PTO requests yet"
              description="Your submitted time-off requests will appear here."
              action={
                <button
                  type="button"
                  style={styles.primaryButton}
                  onClick={() =>
                    document.querySelector('[name="request_type"]')?.focus()
                  }
                >
                  Create Your First Request
                </button>
              }
            />
          ) : (
            <div style={styles.requestList}>
              {requests.map((request) => (
                <PtoRequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function PtoRequestCard({ request }) {
  const requestedDays = calculateInclusiveDays(
    request.start_date,
    request.end_date,
  );

  return (
    <article style={styles.requestCard}>
      <div style={styles.requestHeader}>
        <div>
          <div style={styles.requestTitleRow}>
            <h3 style={styles.requestTitle}>
              {formatRequestType(request.request_type)}
            </h3>

            <span style={styles.duration}>
              {requestedDays} {requestedDays === 1 ? "day" : "days"}
            </span>
          </div>

          <p style={styles.requestDates}>
            {formatDateOnly(request.start_date)}
            {" — "}
            {formatDateOnly(request.end_date)}
          </p>
        </div>

        <StatusBadge status={request.status} />
      </div>

      {request.reason && (
        <div style={styles.reasonBox}>
          <span style={styles.reasonLabel}>Reason</span>

          <p style={styles.reason}>{request.reason}</p>
        </div>
      )}

      {request.review_note && (
        <div style={styles.reviewBox}>
          <span style={styles.reasonLabel}>Review Note</span>

          <p style={styles.reason}>{request.review_note}</p>
        </div>
      )}

      <div style={styles.requestFooter}>
        <p style={styles.requestMeta}>
          Requested {formatDateTime(request.created_at)}
        </p>

        {request.reviewed_at && (
          <p style={styles.requestMeta}>
            Reviewed {formatDateTime(request.reviewed_at)}
          </p>
        )}
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = status?.toLowerCase() || "default";

  const statusStyle = styles.status[normalizedStatus] || styles.status.default;

  return (
    <span
      style={{
        ...styles.statusBadge,
        ...statusStyle,
      }}
    >
      {formatRequestType(status)}
    </span>
  );
}

function formatRequestType(value) {
  if (!value) {
    return "Unknown";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function parseDateOnly(value) {
  if (!value) {
    return null;
  }

  const datePart = String(value).slice(0, 10);

  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateOnly(value) {
  const date = parseDateOnly(value);

  if (!date) {
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

function calculateInclusiveDays(startValue, endValue) {
  const start = parseDateOnly(startValue);
  const end = parseDateOnly(endValue);

  if (!start || !end || end < start) {
    return 0;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
}

const styles = {
  section: {
    marginBottom: "32px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "16px",
  },

  sectionEyebrow: {
    margin: "0 0 5px",
    color: "#2563EB",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  sectionTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "24px",
    fontWeight: "bold",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "18px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "18px",
  },

  label: {
    color: "#1F2937",
    fontWeight: "bold",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "15px",
    backgroundColor: "#FFFFFF",
    color: "#111827",
    fontFamily: "inherit",
  },

  characterCount: {
    color: "#6B7280",
    fontSize: "12px",
    textAlign: "right",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
  },

  primaryButton: {
    minHeight: "44px",
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "1px solid #0A4DA2",
    borderRadius: "10px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  secondaryButton: {
    minHeight: "44px",
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #0A4DA2",
    borderRadius: "10px",
    padding: "11px 18px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  refreshButton: {
    minHeight: "44px",
    padding: "10px 16px",
    border: "1px solid #0A4DA2",
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    cursor: "pointer",
    fontWeight: "bold",
  },

  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  stateSpacing: {
    marginBottom: "20px",
  },

  success: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    backgroundColor: "#DCFCE7",
    color: "#166534",
    border: "1px solid #86EFAC",
    padding: "14px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  messageClose: {
    border: "none",
    backgroundColor: "transparent",
    color: "#166534",
    cursor: "pointer",
    fontSize: "20px",
    lineHeight: 1,
  },

  requestCount: {
    padding: "5px 10px",
    borderRadius: "999px",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    fontSize: "12px",
    fontWeight: "bold",
  },

  requestList: {
    display: "grid",
    gap: "16px",
  },

  requestCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.05)",
  },

  requestHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
  },

  requestTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  requestTitle: {
    margin: 0,
    color: "#0A4DA2",
    fontSize: "20px",
  },

  duration: {
    padding: "4px 8px",
    borderRadius: "999px",
    backgroundColor: "#F1F5F9",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "bold",
  },

  requestDates: {
    margin: "6px 0 0",
    color: "#374151",
    fontWeight: "bold",
  },

  reasonBox: {
    marginTop: "16px",
    padding: "13px",
    borderRadius: "11px",
    backgroundColor: "#F8FAFC",
  },

  reviewBox: {
    marginTop: "12px",
    padding: "13px",
    border: "1px solid #BFDBFE",
    borderRadius: "11px",
    backgroundColor: "#EFF6FF",
  },

  reasonLabel: {
    color: "#64748B",
    fontSize: "11px",
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  reason: {
    margin: "5px 0 0",
    color: "#4B5563",
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },

  requestFooter: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid #E2E8F0",
  },

  requestMeta: {
    color: "#6B7280",
    fontSize: "12px",
    margin: 0,
  },

  statusBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  status: {
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
      backgroundColor: "#E5E7EB",
      color: "#374151",
    },

    default: {
      backgroundColor: "#E5E7EB",
      color: "#374151",
    },
  },
};
