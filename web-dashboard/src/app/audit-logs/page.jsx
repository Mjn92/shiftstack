"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar.jsx";
import api from "../../api/api";

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAuditLogs();
  }, []);

  return (
    <>
      <Navbar />

      <main style={{ padding: "24px" }}>
        <h2>Audit Logs</h2>
        <p>Review system activity and security events.</p>

        {loading ? (
          <p>Loading audit logs...</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "20px",
              background: "white",
            }}
          >
            <thead>
              <tr>
                <th style={styles.th}>Action</th>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Details</th>
                <th style={styles.th}>Created At</th>
              </tr>
            </thead>

            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan="4">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={styles.td}>{log.action}</td>
                    <td style={styles.td}>
                      {log.first_name && log.last_name
                        ? `${log.first_name} ${log.last_name}`
                        : "System / Unknown"}
                    </td>
                    <td style={styles.td}>{log.details}</td>
                    <td style={styles.td}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}

const styles = {
  th: {
    border: "1px solid #ddd",
    padding: "12px",
    backgroundColor: "#111827",
    color: "white",
    textAlign: "left",
  },
  td: {
    border: "1px solid #ddd",
    padding: "12px",
  },
};
