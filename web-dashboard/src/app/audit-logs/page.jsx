"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "../../components/Navbar.jsx";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { canAccessAdmin } from "../../utils/roleAccess";

export default function AuditLogsPage() {
  const router = useRouter();
  const { employee, loading: authLoading } = useContext(AuthContext);

  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hasAccess = canAccessAdmin(employee?.role);

  useEffect(() => {
    if (authLoading) return;

    if (!employee) {
      router.replace("/login");
      return;
    }

    if (!hasAccess) {
      router.replace("/dashboard");
      return;
    }

    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/admin/audit-logs");

        setAuditLogs(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Failed to load audit logs:", err);

        setError(err.response?.data?.error || "Failed to load audit logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [authLoading, employee, hasAccess, router]);

  if (authLoading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingState} role="status" aria-live="polite">
          Checking permissions...
        </div>
      </main>
    );
  }

  if (!employee || !hasAccess) {
    return null;
  }

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

        {error && (
          <div style={styles.errorState} role="alert">
            {error}
          </div>
        )}

        <section style={styles.tableCard}>
          {loading ? (
            <div style={styles.loadingState} role="status" aria-live="polite">
              Loading audit logs...
            </div>
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
                    <td style={styles.emptyState} colSpan={4}>
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
                          {log.action || "UNKNOWN"}
                        </span>
                      </td>

                      <td style={styles.cell}>
                        {log.first_name && log.last_name
                          ? `${log.first_name} ${log.last_name}`
                          : "System / Unknown"}
                      </td>

                      <td style={styles.cell}>{log.details || "-"}</td>

                      <td style={styles.cell}>
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString()
                          : "-"}
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
    overflowX: "auto",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
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

  errorState: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FCA5A5",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
};
