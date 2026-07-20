"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar.jsx";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function WeeklySummaryPage() {
  const router = useRouter();
  const { employee, loading } = useContext(AuthContext);

  const [summary, setSummary] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !employee) {
      router.push("/login");
    }
  }, [loading, employee, router]);

  useEffect(() => {
    if (employee) {
      // eslint-disable-next-line react-hooks/immutability
      loadSummary();
    }
  }, [employee]);

  const loadSummary = async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/time/my-weekly-summary");
      setSummary(response.data);
    } catch (err) {
      console.error("Weekly summary error:", err);
      setError("Could not load weekly summary.");
    } finally {
      setPageLoading(false);
    }
  };

  if (loading || !employee) {
    return <p style={{ padding: "32px" }}>Loading...</p>;
  }

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.header}>
          <h1 style={styles.title}>Weekly Summary</h1>
          <p style={styles.subtitle}>
            Review your hours and shifts for the current week.
          </p>
        </section>

        <section style={styles.actions}>
          <button
            style={styles.secondaryButton}
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => router.push("/time-history")}
          >
            Time History
          </button>

          <button style={styles.secondaryButton} onClick={loadSummary}>
            Refresh
          </button>
        </section>

        {error && <div style={styles.error}>{error}</div>}

        {pageLoading ? (
          <div style={styles.card}>Loading weekly summary...</div>
        ) : (
          <div style={styles.grid}>
            <SummaryCard
              title="Total Hours"
              value={`${summary?.total_hours || 0} hrs`}
              subtitle="Hours worked this week"
            />

            <SummaryCard
              title="Total Shifts"
              value={summary?.total_shifts || 0}
              subtitle="Closed shifts this week"
            />

            <SummaryCard
              title="Overtime"
              value={`${summary?.overtime_hours || 0} hrs`}
              subtitle="Hours over 40"
            />

            <SummaryCard
              title="Total Minutes"
              value={summary?.total_minutes || 0}
              subtitle="Raw worked minutes"
            />
          </div>
        )}
      </main>
    </>
  );
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <div style={styles.card}>
      <p style={styles.cardLabel}>{title}</p>
      <h2 style={styles.cardValue}>{value}</h2>
      <p style={styles.cardSubtitle}>{subtitle}</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#EAF3FF",
    padding: "32px",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    color: "#0A4DA2",
    fontSize: "36px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: "16px",
  },
  actions: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #0A4DA2",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
  },
  cardLabel: {
    color: "#6B7280",
    fontSize: "14px",
    marginBottom: "8px",
  },
  cardValue: {
    color: "#0A4DA2",
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  cardSubtitle: {
    color: "#6B7280",
    fontSize: "14px",
  },
  error: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
  },
};
