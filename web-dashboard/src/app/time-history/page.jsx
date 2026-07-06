"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar.jsx";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function TimeHistoryPage() {
  const router = useRouter();
  const { employee, loading } = useContext(AuthContext);

  const [entries, setEntries] = useState([]);
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
      loadEntries();
    }
  }, [employee]);

  const loadEntries = async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/time/my-entries");

      setEntries(response.data);
    } catch (err) {
      console.error("Time history load error:", err);
      setError("Could not load time history.");
    } finally {
      setPageLoading(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "Open";

    return new Date(value).toLocaleString();
  };

  const formatHours = (minutes) => {
    if (minutes === null || minutes === undefined) return "Pending";

    return `${(minutes / 60).toFixed(2)} hrs`;
  };

  if (loading || !employee) {
    return <p style={{ padding: "32px" }}>Loading...</p>;
  }

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.header}>
          <h1 style={styles.title}>My Time History</h1>
          <p style={styles.subtitle}>
            View your clock-in and clock-out records.
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
            onClick={() => router.push("/clock")}
          >
            Clock Center
          </button>

          <button style={styles.secondaryButton} onClick={loadEntries}>
            Refresh
          </button>
        </section>

        {error && <div style={styles.error}>{error}</div>}

        {pageLoading ? (
          <div style={styles.card}>Loading time entries...</div>
        ) : entries.length === 0 ? (
          <div style={styles.card}>No time entries found.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Clock In</th>
                  <th style={styles.th}>Clock Out</th>
                  <th style={styles.th}>Total Hours</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={styles.td}>
                      {new Date(entry.clock_in).toLocaleDateString()}
                    </td>

                    <td style={styles.td}>{formatDateTime(entry.clock_in)}</td>

                    <td style={styles.td}>{formatDateTime(entry.clock_out)}</td>

                    <td style={styles.td}>
                      {formatHours(entry.total_minutes)}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor:
                            entry.status === "open" ? "#DCFCE7" : "#E5E7EB",
                          color:
                            entry.status === "open" ? "#166534" : "#374151",
                        }}
                      >
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
  },
  tableWrapper: {
    overflowX: "auto",
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "16px",
    backgroundColor: "#F3F8FF",
    color: "#0A4DA2",
    borderBottom: "1px solid #DCEBFF",
  },
  td: {
    padding: "16px",
    borderBottom: "1px solid #E5E7EB",
    color: "#374151",
  },
  statusBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  error: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
  },
};
