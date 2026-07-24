"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function WeeklySummaryPage() {
  const router = useRouter();
  const { employee, loading } = useContext(AuthContext);

  const [summary, setSummary] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/time/my-weekly-summary");
      setSummary(response.data || {});
    } catch (err) {
      console.error("Weekly summary error:", err);

      setError(
        err.response?.data?.error ||
          "Could not load your weekly summary. Please try again.",
      );
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !employee) {
      router.replace("/login");
    }
  }, [loading, employee, router]);

  useEffect(() => {
    if (employee) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSummary();
    }
  }, [employee, loadSummary]);

  if (loading || !employee) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingSessionCard} role="status" aria-live="polite">
          Loading your weekly summary...
        </div>
      </main>
    );
  }

  const totalHours = Number(summary?.total_hours || 0);
  const totalShifts = Number(summary?.total_shifts || 0);
  const overtimeHours = Number(summary?.overtime_hours || 0);
  const totalMinutes = Number(summary?.total_minutes || 0);

  return (
    <AppShell>
      <div style={styles.page}>
        <PageHeader
          eyebrow="Time Tracking"
          title="Weekly Summary"
          description="Review your worked hours, completed shifts, and overtime for the current week."
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
                  ...styles.primaryButton,
                  ...(pageLoading ? styles.disabledButton : {}),
                }}
                onClick={loadSummary}
                disabled={pageLoading}
              >
                {pageLoading ? "Refreshing..." : "Refresh"}
              </button>
            </>
          }
        />

        {error && (
          <div style={styles.error} role="alert">
            {error}
          </div>
        )}

        {pageLoading ? (
          <div style={styles.loadingCard} role="status" aria-live="polite">
            Loading weekly summary...
          </div>
        ) : (
          <>
            <section style={styles.summaryBanner}>
              <div>
                <p style={styles.bannerLabel}>Current Week</p>

                <h2 style={styles.bannerValue}>
                  {formatHours(totalHours)} Worked
                </h2>

                <p style={styles.bannerText}>
                  {totalShifts} completed{" "}
                  {totalShifts === 1 ? "shift" : "shifts"}
                  {" • "}
                  {formatHours(overtimeHours)} overtime
                </p>
              </div>
            </section>

            <section
              style={styles.grid}
              aria-label="Weekly time summary statistics"
            >
              <SummaryCard
                title="Total Hours"
                value={formatHours(totalHours)}
                subtitle="Hours worked this week"
                accent="#2563EB"
              />

              <SummaryCard
                title="Total Shifts"
                value={totalShifts}
                subtitle="Closed shifts this week"
                accent="#16A34A"
              />

              <SummaryCard
                title="Overtime"
                value={formatHours(overtimeHours)}
                subtitle="Hours worked above 40"
                accent="#D97706"
              />

              <SummaryCard
                title="Total Minutes"
                value={totalMinutes.toLocaleString()}
                subtitle="Raw worked minutes"
                accent="#7C3AED"
              />
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function SummaryCard({ title, value, subtitle, accent }) {
  return (
    <article style={styles.card}>
      <div
        style={{
          ...styles.cardAccent,
          backgroundColor: accent,
        }}
        aria-hidden="true"
      />

      <div>
        <p style={styles.cardLabel}>{title}</p>
        <h2 style={styles.cardValue}>{value}</h2>
        <p style={styles.cardSubtitle}>{subtitle}</p>
      </div>
    </article>
  );
}

function formatHours(value) {
  const numericValue = Number(value || 0);

  return `${numericValue.toFixed(2)} hrs`;
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

  loadingSessionCard: {
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
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
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

  summaryBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "28px",
    marginBottom: "24px",
    border: "1px solid #DCEBFF",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  },

  bannerLabel: {
    color: "#2563EB",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "12px",
    margin: "0 0 6px",
  },

  bannerValue: {
    fontSize: "clamp(28px, 4vw, 38px)",
    fontWeight: "bold",
    color: "#172033",
    margin: "0 0 8px",
  },

  bannerText: {
    color: "#64748B",
    fontSize: "15px",
    margin: 0,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },

  card: {
    position: "relative",
    display: "flex",
    gap: "16px",
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #DCEBFF",
    overflow: "hidden",
  },

  cardAccent: {
    width: "6px",
    minHeight: "100%",
    borderRadius: "999px",
    flex: "0 0 auto",
  },

  cardLabel: {
    color: "#64748B",
    fontSize: "14px",
    margin: "0 0 8px",
  },

  cardValue: {
    color: "#0A4DA2",
    fontSize: "32px",
    fontWeight: "bold",
    margin: "0 0 8px",
  },

  cardSubtitle: {
    color: "#64748B",
    fontSize: "14px",
    lineHeight: 1.5,
    margin: 0,
  },

  loadingCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "20px",
    padding: "48px",
    textAlign: "center",
    color: "#64748B",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  },

  error: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FECACA",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
};
