"use client";

import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar.jsx";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "#EAF3FF",
          padding: "32px",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              color: "#0A4DA2",
              fontSize: "36px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            ShiftStack Dashboard
          </h1>

          <p
            style={{
              color: "#6B7280",
              fontSize: "16px",
            }}
          >
            Manage employees, review time entries, and generate reports.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>👥 Employees</h3>

            <p style={styles.cardText}>
              View employee records, roles, and account status.
            </p>

            <button
              style={styles.button}
              onClick={() => router.push("/employees")}
            >
              Manage Employees
            </button>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>⏰ Time Entries</h3>

            <p style={styles.cardText}>
              Review clock-ins, clock-outs, and shift history.
            </p>

            <button
              style={styles.button}
              onClick={() => router.push("/time-entries")}
            >
              View Time Entries
            </button>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📊 Reports</h3>

            <p style={styles.cardText}>
              Generate weekly reports and payroll exports.
            </p>

            <button
              style={styles.button}
              onClick={() => router.push("/reports")}
            >
              Open Reports
            </button>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📝 Audit Logs</h3>

            <p style={styles.cardText}>
              Review authentication events and system activity.
            </p>

            <button
              style={styles.button}
              onClick={() => router.push("/audit-logs")}
            >
              View Audit Logs
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

const styles = {
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
  },

  cardTitle: {
    color: "#0A4DA2",
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "12px",
  },

  cardText: {
    color: "#6B7280",
    marginBottom: "20px",
    lineHeight: "1.5",
  },

  button: {
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
  },
};
