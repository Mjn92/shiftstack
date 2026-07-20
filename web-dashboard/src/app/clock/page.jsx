"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar.jsx";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function ClockPage() {
  const router = useRouter();
  const { employee, loading } = useContext(AuthContext);

  const [clockStatus, setClockStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !employee) {
      router.push("/login");
    }
  }, [loading, employee, router]);

  useEffect(() => {
    if (employee) {
      // eslint-disable-next-line react-hooks/immutability
      loadClockStatus();
    }
  }, [employee]);

  const loadClockStatus = async () => {
    try {
      const response = await api.get("/time/status");
      setClockStatus(response.data);
    } catch (err) {
      console.error("Clock status error:", err);
      setError("Could not load clock status.");
    }
  };

  const handleClockIn = async () => {
    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      await api.post("/time/clock-in");

      setMessage("Clock-in request accepted.");
      await loadClockStatus();
    } catch (err) {
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

      await api.post("/time/clock-out");

      setMessage("Clock-out request accepted.");
      await loadClockStatus();
    } catch (err) {
      setError(err.response?.data?.error || "Clock-out failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !employee) {
    return <p style={{ padding: "32px" }}>Loading...</p>;
  }

  const isClockedIn = clockStatus?.clocked_in;
  const currentEntry = clockStatus?.current_entry;

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.header}>
          <h1 style={styles.title}>Clock Center</h1>
          <p style={styles.subtitle}>
            Clock in, clock out, and view your current shift status.
          </p>
        </section>

        {message && <div style={styles.success}>{message}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <section style={styles.card}>
          <p style={styles.label}>Current Status</p>

          <div
            style={{
              ...styles.statusBadge,
              backgroundColor: isClockedIn ? "#DCFCE7" : "#E5E7EB",
              color: isClockedIn ? "#166534" : "#374151",
            }}
          >
            {isClockedIn ? "Clocked In" : "Clocked Out"}
          </div>

          {currentEntry?.clock_in && (
            <p style={styles.shiftText}>
              Current shift started at:{" "}
              <strong>
                {new Date(currentEntry.clock_in).toLocaleString()}
              </strong>
            </p>
          )}

          {!currentEntry && (
            <p style={styles.shiftText}>No active shift right now.</p>
          )}

          <div style={styles.buttonGrid}>
            <button
              style={{
                ...styles.button,
                backgroundColor: isClockedIn ? "#9CA3AF" : "#0A4DA2",
              }}
              onClick={handleClockIn}
              disabled={isClockedIn || submitting}
            >
              Clock In
            </button>

            <button
              style={{
                ...styles.button,
                backgroundColor: !isClockedIn ? "#9CA3AF" : "#DC2626",
              }}
              onClick={handleClockOut}
              disabled={!isClockedIn || submitting}
            >
              Clock Out
            </button>
          </div>
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
            View Time History
          </button>
        </section>
      </main>
    </>
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
    maxWidth: "700px",
  },
  label: {
    color: "#6B7280",
    fontSize: "16px",
    marginBottom: "12px",
  },
  statusBadge: {
    display: "inline-block",
    padding: "10px 18px",
    borderRadius: "999px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  shiftText: {
    color: "#374151",
    fontSize: "16px",
    marginBottom: "24px",
  },
  buttonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },
  button: {
    color: "#FFFFFF",
    border: "none",
    padding: "14px 20px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  actions: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    marginTop: "24px",
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
  success: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
    maxWidth: "700px",
  },
  error: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
    maxWidth: "700px",
  },
};
