"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../api/api";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  const buildQueryString = () => {
    const params = [];

    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);

    return params.length > 0 ? `?${params.join("&")}` : "";
  };

  const loadReports = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/reports/weekly${buildQueryString()}`);
      setReports(response.data);
    } catch (err) {
      console.error("Error loading reports:", err);
      alert("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://localhost:5000/api/reports/weekly/export${buildQueryString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("CSV export failed");
      }

      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = "weekly_report.csv";
      a.click();

      window.URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error("Error exporting CSV:", err);
      alert("Failed to export CSV.");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Weekly Reports</h1>
          <p style={styles.pageSubtitle}>
            Review employee hours, shift totals, and payroll-ready summaries.
          </p>
        </div>

        <section style={styles.filterCard}>
          <h2 style={styles.sectionTitle}>Report Filters</h2>

          <div style={styles.filterGrid}>
            <div>
              <label style={styles.label}>Start Date</label>
              <input
                type="date"
                style={styles.input}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label style={styles.label}>End Date</label>
              <input
                type="date"
                style={styles.input}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button onClick={loadReports} style={styles.filterButton}>
              Filter Reports
            </button>

            <button onClick={exportCsv} style={styles.exportButton}>
              Export CSV
            </button>
          </div>
        </section>

        <section style={styles.tableCard}>
          {loading ? (
            <div style={styles.loadingState}>Loading reports...</div>
          ) : (
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
                {reports.length === 0 ? (
                  <tr>
                    <td style={styles.emptyState} colSpan="5">
                      No weekly report data found.
                    </td>
                  </tr>
                ) : (
                  reports.map((row, index) => (
                    <tr
                      key={row.employee_id}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#FFFFFF" : "#F8FBFF",
                      }}
                    >
                      <td style={styles.cell}>
                        {row.first_name} {row.last_name}
                      </td>

                      <td style={styles.cell}>{row.email}</td>

                      <td style={styles.cell}>
                        <span style={styles.countBadge}>
                          {row.total_shifts}
                        </span>
                      </td>

                      <td style={styles.cell}>{row.total_minutes}</td>

                      <td style={styles.cell}>
                        <span style={styles.hoursBadge}>{row.total_hours}</span>
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

  filterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
  },

  sectionTitle: {
    color: "#0A4DA2",
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "18px",
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    alignItems: "end",
  },

  label: {
    display: "block",
    color: "#374151",
    fontWeight: "bold",
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "14px",
    backgroundColor: "#F9FAFB",
  },

  filterButton: {
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    padding: "13px 16px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  exportButton: {
    backgroundColor: "#16A34A",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    padding: "13px 16px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
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

  countBadge: {
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "bold",
  },

  hoursBadge: {
    backgroundColor: "#16A34A",
    color: "#FFFFFF",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "bold",
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
};
