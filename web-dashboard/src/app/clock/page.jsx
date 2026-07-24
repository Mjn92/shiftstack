"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function ClockPage() {
  const router = useRouter();
  const { employee, loading: authLoading } = useContext(AuthContext);

  const [clockStatus, setClockStatus] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadClockStatus = useCallback(async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/time/status");
      setClockStatus(response.data || {});
    } catch (err) {
      console.error("Clock status error:", err);

      setError(
        err.response?.data?.error ||
          "Could not load your clock status. Please try again.",
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
      loadClockStatus();
    }
  }, [employee, loadClockStatus]);

  const handleClockIn = async () => {
    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      const response = await api.post("/time/clock-in");

      setMessage(response.data?.message || "Clock-in request accepted.");

      await loadClockStatus();
    } catch (err) {
      console.error("Clock-in error:", err);

      setError(err.response?.data?.error || "Clock-in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      const response = await api.post("/time/clock-out");

      setMessage(response.data?.message || "Clock-out request accepted.");

      await loadClockStatus();
    } catch (err) {
      console.error("Clock-out error:", err);

      setError(err.response?.data?.error || "Clock-out failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const isClockedIn = Boolean(clockStatus?.clocked_in);
  const currentEntry = clockStatus?.current_entry;

  const currentShiftDuration = useMemo(() => {
    if (!isClockedIn || !currentEntry?.clock_in) {
      return "No active shift";
    }

    const startedAt = new Date(currentEntry.clock_in);

    if (Number.isNaN(startedAt.getTime())) {
      return "Active shift";
    }

    const elapsedMinutes = Math.max(
      0,
      // eslint-disable-next-line react-hooks/purity
      Math.floor((Date.now() - startedAt.getTime()) / 60000),
    );

    return formatMinutes(elapsedMinutes);
  }, [isClockedIn, currentEntry]);

  if (authLoading || !employee) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard} role="status" aria-live="polite">
          Loading clock center...
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <div style={styles.page}>
        <PageHeader
          eyebrow="Time Tracking"
          title="Clock Center"
          description="Clock in, clock out, and review your current shift status."
          actions={
            <>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => router.push("/time-history")}
              >
                Time History
              </button>

              <button
                type="button"
                style={{
                  ...styles.secondaryButton,
                  ...(pageLoading ? styles.disabledButton : {}),
                }}
                onClick={loadClockStatus}
                disabled={pageLoading || submitting}
              >
                {pageLoading ? "Refreshing..." : "Refresh Status"}
              </button>
            </>
          }
        />

        {message && (
          <div style={styles.success} role="status" aria-live="polite">
            {message}
          </div>
        )}

        {error && (
          <div style={styles.error} role="alert">
            {error}
          </div>
        )}

        {pageLoading ? (
          <section style={styles.statusCard}>
            <div style={styles.statusLoading} role="status" aria-live="polite">
              Loading your current clock status...
            </div>
          </section>
        ) : (
          <div style={styles.contentGrid}>
            <section style={styles.statusCard}>
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.cardEyebrow}>Current Status</p>
                  <h2 style={styles.cardTitle}>
                    {isClockedIn ? "You are clocked in" : "You are clocked out"}
                  </h2>
                </div>

                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: isClockedIn ? "#DCFCE7" : "#E5E7EB",
                    color: isClockedIn ? "#166534" : "#374151",
                  }}
                >
                  {isClockedIn ? "Clocked In" : "Clocked Out"}
                </span>
              </div>

              <div style={styles.shiftDetails}>
                <DetailRow label="Employee" value={getEmployeeName(employee)} />

                <DetailRow
                  label="Shift Started"
                  value={
                    currentEntry?.clock_in
                      ? formatDateTime(currentEntry.clock_in)
                      : "No active shift"
                  }
                />

                <DetailRow
                  label="Current Duration"
                  value={currentShiftDuration}
                />

                <DetailRow
                  label="Entry ID"
                  value={currentEntry?.id ? `#${currentEntry.id}` : "—"}
                />
              </div>

              <div style={styles.buttonGrid}>
                <button
                  type="button"
                  style={{
                    ...styles.clockButton,
                    backgroundColor: isClockedIn ? "#94A3B8" : "#0A4DA2",
                    ...(isClockedIn || submitting ? styles.disabledButton : {}),
                  }}
                  onClick={handleClockIn}
                  disabled={isClockedIn || submitting}
                >
                  {submitting && !isClockedIn ? "Clocking In..." : "Clock In"}
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.clockButton,
                    backgroundColor: !isClockedIn ? "#94A3B8" : "#DC2626",
                    ...(!isClockedIn || submitting
                      ? styles.disabledButton
                      : {}),
                  }}
                  onClick={handleClockOut}
                  disabled={!isClockedIn || submitting}
                >
                  {submitting && isClockedIn ? "Clocking Out..." : "Clock Out"}
                </button>
              </div>
            </section>

            <aside style={styles.helpCard}>
              <p style={styles.cardEyebrow}>Shift Guidance</p>
              <h2 style={styles.helpTitle}>Before you clock</h2>

              <ul style={styles.helpList}>
                <li>Clock in only when your scheduled shift begins.</li>
                <li>Keep the app open until your clock request completes.</li>
                <li>Clock out before leaving at the end of your shift.</li>
                <li>Use Time History to review completed entries.</li>
              </ul>

              <div style={styles.helpNote}>
                {isClockedIn
                  ? "You currently have an active shift. Clock out when your work is complete."
                  : "You do not currently have an active shift."}
              </div>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <strong style={styles.detailValue}>{value}</strong>
    </div>
  );
}

function getEmployeeName(employee) {
  const fullName = `${employee?.first_name || ""} ${
    employee?.last_name || ""
  }`.trim();

  return fullName || employee?.email || "Current employee";
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

function formatMinutes(totalMinutes) {
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

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
    gap: "24px",
    alignItems: "start",
  },

  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #DCEBFF",
  },

  statusLoading: {
    padding: "32px",
    textAlign: "center",
    color: "#64748B",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },

  cardEyebrow: {
    color: "#2563EB",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: "0 0 6px",
  },

  cardTitle: {
    color: "#172033",
    fontSize: "28px",
    margin: 0,
  },

  statusBadge: {
    display: "inline-block",
    padding: "10px 18px",
    borderRadius: "999px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  shiftDetails: {
    display: "grid",
    gap: "0",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    overflow: "hidden",
    marginBottom: "24px",
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    padding: "16px",
    borderBottom: "1px solid #E2E8F0",
  },

  detailLabel: {
    color: "#64748B",
  },

  detailValue: {
    color: "#172033",
    textAlign: "right",
  },

  buttonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },

  clockButton: {
    minHeight: "48px",
    color: "#FFFFFF",
    border: "none",
    padding: "14px 20px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  secondaryButton: {
    minHeight: "44px",
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #0A4DA2",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  disabledButton: {
    cursor: "not-allowed",
    opacity: 0.65,
  },

  helpCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #DCEBFF",
  },

  helpTitle: {
    color: "#172033",
    fontSize: "22px",
    margin: "0 0 16px",
  },

  helpList: {
    color: "#475569",
    lineHeight: 1.7,
    margin: "0 0 20px",
    paddingLeft: "20px",
  },

  helpNote: {
    backgroundColor: "#EFF6FF",
    color: "#1E3A8A",
    border: "1px solid #BFDBFE",
    borderRadius: "12px",
    padding: "14px",
    lineHeight: 1.5,
  },

  success: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    border: "1px solid #BBF7D0",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },

  error: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FCA5A5",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
};
