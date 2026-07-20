"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "../../components/Navbar";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { canAccessManagement } from "../../utils/roleAccess";

export default function TimeEntriesPage() {
  const router = useRouter();
  const { employee, loading: authLoading } = useContext(AuthContext);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hasAccess = canAccessManagement(employee?.role);

  useEffect(() => {
    if (authLoading) {
      return (
        <main style={styles.page}>
          <div style={styles.loadingState} role="status">
            Checking permissions...
          </div>
        </main>
      );
    }

    if (!employee) {
      router.replace("/login");
      return;
    }

    if (!hasAccess) {
      router.replace("/dashboard");
      return;
    }

    const loadEntries = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/admin/time-entries");

        setEntries(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error loading time entries:", err);
        setError(err.response?.data?.error || "Failed to load time entries.");
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [authLoading, employee, hasAccess, router]);

  if (authLoading) {
    return <main style={styles.loadingState}>Checking permissions...</main>;
  }

  if (!employee || !hasAccess) {
    return null;
  }

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Time Entries</h1>

          <p style={styles.pageSubtitle}>
            Review employee clock-in and clock-out activity.
          </p>
        </div>

        {error && <div style={styles.errorState}>{error}</div>}

        <section style={styles.tableCard}>
          {loading ? (
            <div style={styles.loadingState}>Loading time entries...</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.headerCell}>ID</th>
                  <th style={styles.headerCell}>Employee ID</th>
                  <th style={styles.headerCell}>Clock In</th>
                  <th style={styles.headerCell}>Clock Out</th>
                  <th style={styles.headerCell}>Total Minutes</th>
                  <th style={styles.headerCell}>Status</th>
                </tr>
              </thead>

              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td style={styles.emptyState} colSpan={6}>
                      No time entries found.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#FFFFFF" : "#F8FBFF",
                      }}
                    >
                      <td style={styles.cell}>{entry.id}</td>

                      <td style={styles.cell}>{entry.employee_id}</td>

                      <td style={styles.cell}>
                        {new Date(entry.clock_in).toLocaleString()}
                      </td>

                      <td style={styles.cell}>
                        {entry.clock_out
                          ? new Date(entry.clock_out).toLocaleString()
                          : "Open"}
                      </td>

                      <td style={styles.cell}>{entry.total_minutes ?? "-"}</td>

                      <td style={styles.cell}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor:
                              entry.status === "open" ? "#16A34A" : "#2563EB",
                          }}
                        >
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
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

  pageHeader: {
    marginBottom: "24px",
  },

  pageTitle: {
    color: "#0A4DA2",
    fontSize: "36px",
    fontWeight: "bold",
    marginBottom: "8px",
  },

  pageSubtitle: {
    color: "#6B7280",
    fontSize: "16px",
  },

  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    overflowX: "auto",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "850px",
  },

  tableHeaderRow: {
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
  },

  headerCell: {
    padding: "16px",
    textAlign: "left",
    fontWeight: "bold",
  },

  cell: {
    padding: "16px",
    borderBottom: "1px solid #E5E7EB",
    color: "#111827",
  },

  statusBadge: {
    color: "#FFFFFF",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
    display: "inline-block",
  },

  loadingState: {
    padding: "40px",
    textAlign: "center",
    color: "#6B7280",
  },

  emptyState: {
    padding: "40px",
    textAlign: "center",
    color: "#6B7280",
  },

  errorState: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FCA5A5",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
};
