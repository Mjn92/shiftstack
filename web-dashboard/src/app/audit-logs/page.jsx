"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar.jsx";
import api from "../../api/api";

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const response = await api.get("/admin/audit-logs");
        setAuditLogs(response.data);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
        alert("Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Audit Logs</h1>
          <p style={styles.pageSubtitle}>
            Review system activity, login events, and security actions.
          </p>
        </div>

        <section style={styles.tableCard}>
          {loading ? (
            <div style={styles.loadingState}>Loading audit logs...</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.headerCell}>Action</th>
                  <th style={styles.headerCell}>Employee</th>
                  <th style={styles.headerCell}>Details</th>
                  <th style={styles.headerCell}>Created At</th>
                </tr>
              </thead>

              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td style={styles.emptyState} colSpan="4">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log, index) => (
                    <tr
                      key={log.id}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#FFFFFF" : "#F8FBFF",
                      }}
                    >
                      <td style={styles.cell}>
                        <span
                          style={{
                            ...styles.actionBadge,
                            backgroundColor: getActionColor(log.action),
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td style={styles.cell}>
                        {log.first_name && log.last_name
                          ? `${log.first_name} ${log.last_name}`
                          : "System / Unknown"}
                      </td>

                      <td style={styles.cell}>{log.details}</td>

                      <td style={styles.cell}>
                        {new Date(log.created_at).toLocaleString()}
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

const getActionColor = (action) => {
  switch (action) {
    case "LOGIN":
      return "#16A34A";
    case "FAILED_LOGIN":
      return "#DC2626";
    case "REGISTER":
      return "#2563EB";
    case "CLOCK_IN":
      return "#0A4DA2";
    case "CLOCK_OUT":
      return "#7C3AED";
    default:
      return "#6B7280";
  }
};

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

  actionBadge: {
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
};
