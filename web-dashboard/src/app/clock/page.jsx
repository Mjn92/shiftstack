"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import { formatDateTime, formatMinutes } from "../../utils/dateTime";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function ClockPage() {
  const router = useRouter();
  const { employee, loading: authLoading } = useContext(AuthContext);

  const [clockStatus, setClockStatus] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // One action state is used for both clock-in and clock-out so the user
  // cannot submit duplicate or overlapping clock requests.
  const [clockAction, setClockAction] = useState(null);

  // Keeps the active-shift duration current while the employee remains
  // clocked in without requiring a manual refresh.
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const loadClockStatus = useCallback(async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/time/status");

      const data =
        response?.data &&
        typeof response.data === "object" &&
        !Array.isArray(response.data)
          ? response.data
          : {};

      setClockStatus(data);
      setCurrentTime(Date.now());
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

  useEffect(() => {
    if (!clockStatus?.clocked_in) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [clockStatus?.clocked_in]);

  const handleClockIn = async () => {
    if (clockAction || clockStatus?.clocked_in) {
      return;
    }

    try {
      setClockAction("in");
      setMessage("");
      setError("");

      const response = await api.post("/time/clock-in");

      setMessage(response.data?.message || "Clock-in request accepted.");

      // The backend remains the source of truth. Reload status rather than
      // assuming the request succeeded based only on frontend state.
      await loadClockStatus();
    } catch (err) {
      console.error("Clock in error:", err);

      setError(err.response?.data?.error || "Could not clock in.");
    } finally {
      setClockAction(null);
    }
  };

  const handleClockOut = async () => {
    if (clockAction || !clockStatus?.clocked_in) {
      return;
    }

    try {
      setClockAction("out");
      setMessage("");
      setError("");

      const response = await api.post("/time/clock-out");

      setMessage(response.data?.message || "Clock-out request accepted.");

      await loadClockStatus();
    } catch (err) {
      console.error("Clock out error:", err);

      setError(err.response?.data?.error || "Could not clock out.");
    } finally {
      setClockAction(null);
    }
  };

  const isClockedIn = Boolean(clockStatus?.clocked_in);
  const currentEntry = clockStatus?.current_entry;
  const actionInProgress = Boolean(clockAction);

  const currentShiftDuration = getCurrentShiftDuration(
    isClockedIn,
    currentEntry?.clock_in,
    currentTime,
  );

  if (authLoading || !employee) {
    return (
      <main style={styles.loadingPage}>
        <LoadingState message="Loading clock center..." />
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
                disabled={actionInProgress}
              >
                Time History
              </button>

              <button
                type="button"
                style={{
                  ...styles.secondaryButton,
                  ...(pageLoading || actionInProgress
                    ? styles.disabledButton
                    : {}),
                }}
                onClick={loadClockStatus}
                disabled={pageLoading || actionInProgress}
              >
                {pageLoading ? "Refreshing..." : "Refresh Status"}
              </button>
            </>
          }
        />

        {message && (
          <div style={styles.success} role="status" aria-live="polite">
            <span>{message}</span>

            <button
              type="button"
              style={styles.dismissButton}
              onClick={() => setMessage("")}
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <ErrorState
            message={error}
            onRetry={
              pageLoading || actionInProgress ? undefined : loadClockStatus
            }
          />
        )}

        {pageLoading && !clockStatus ? (
          <section style={styles.statusCard}>
            <LoadingState message="Loading your current clock status..." />
          </section>
        ) : (
          <div style={styles.contentGrid}>
            <section
              style={styles.statusCard}
              aria-labelledby="clock-status-title"
            >
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.cardEyebrow}>Current Status</p>
                  <h2 id="clock-status-title" style={styles.cardTitle}>
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
                    backgroundColor:
                      isClockedIn || actionInProgress ? "#94A3B8" : "#0A4DA2",
                    ...(isClockedIn || actionInProgress
                      ? styles.disabledButton
                      : {}),
                  }}
                  onClick={handleClockIn}
                  disabled={isClockedIn || actionInProgress}
                  aria-busy={clockAction === "in"}
                >
                  {clockAction === "in" ? "Clocking In..." : "Clock In"}
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.clockButton,
                    backgroundColor:
                      !isClockedIn || actionInProgress ? "#94A3B8" : "#DC2626",
                    ...(!isClockedIn || actionInProgress
                      ? styles.disabledButton
                      : {}),
                  }}
                  onClick={handleClockOut}
                  disabled={!isClockedIn || actionInProgress}
                  aria-busy={clockAction === "out"}
                >
                  {clockAction === "out" ? "Clocking Out..." : "Clock Out"}
                </button>
              </div>
            </section>

            <aside style={styles.helpCard}>
              <p style={styles.cardEyebrow}>Shift Guidance</p>
              <h2 style={styles.helpTitle}>Before you clock</h2>

              <ul style={styles.helpList}>
                <li>Clock in only when your scheduled shift begins.</li>
                <li>Wait for the request to finish before clicking again.</li>
                <li>Clock out before leaving at the end of your shift.</li>
                <li>Use Time History to review completed entries.</li>
              </ul>

              <div style={styles.helpNote}>
                {isClockedIn
                  ? `You currently have an active shift (${currentShiftDuration}). Clock out when your work is complete.`
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

function getCurrentShiftDuration(isClockedIn, clockInValue, currentTime) {
  if (!isClockedIn || !clockInValue) {
    return "No active shift";
  }

  const startedAt = new Date(clockInValue);

  if (Number.isNaN(startedAt.getTime())) {
    return "Active shift";
  }

  const elapsedMinutes = Math.max(
    0,
    Math.floor((currentTime - startedAt.getTime()) / 60000),
  );

  return formatMinutes(elapsedMinutes);
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

  page: {
    width: "100%",
    maxWidth: "1440px",
    margin: "0 auto",
  },

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
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
    flexWrap: "wrap",
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
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    backgroundColor: "#DCFCE7",
    color: "#166534",
    border: "1px solid #BBF7D0",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },

  dismissButton: {
    flex: "0 0 auto",
    border: "none",
    background: "transparent",
    color: "#166534",
    cursor: "pointer",
    fontSize: "22px",
    lineHeight: 1,
  },
};
