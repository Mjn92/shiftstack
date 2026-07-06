"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar.jsx";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function DashboardPage() {
  const router = useRouter();
  const { employee, loading } = useContext(AuthContext);

  const [clockStatus, setClockStatus] = useState(null);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!loading && !employee) {
      router.push("/login");
    }
  }, [loading, employee, router]);

  useEffect(() => {
    if (employee) {
      // eslint-disable-next-line react-hooks/immutability
      loadDashboardData();
    }
  }, [employee]);

  const loadDashboardData = async () => {
    try {
      const statusResponse = await api.get("/time/status");
      const entriesResponse = await api.get("/time/my-entries");

      setClockStatus(statusResponse.data);
      setEntries(entriesResponse.data);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  };

  if (loading || !employee) {
    return <p style={{ padding: "32px" }}>Loading...</p>;
  }

  const today = new Date().toDateString();

  const todaysEntries = entries.filter((entry) => {
    return new Date(entry.clock_in).toDateString() === today;
  });

  const todaysMinutes = todaysEntries.reduce((total, entry) => {
    return total + (entry.total_minutes || 0);
  }, 0);

  const todaysHours = (todaysMinutes / 60).toFixed(2);

  const isClockedIn = clockStatus?.clocked_in;

  const showAdminCards =
    employee.role === "admin" || employee.role === "manager";

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
          <h1 style={styles.pageTitle}>Welcome back, {employee.first_name}</h1>

          <p style={styles.pageSubtitle}>
            Role: {employee.role} | ShiftStack Dashboard
          </p>
        </div>

        <h2 style={styles.sectionTitle}>My Shift Overview</h2>

        <div style={styles.grid}>
          <DashboardCard
            title="Current Status"
            text={
              isClockedIn
                ? "You are currently clocked in."
                : "You are currently clocked out."
            }
            buttonText={isClockedIn ? "Clock Out" : "Clock In"}
            onClick={() => router.push("/clock")}
          />

          <DashboardCard
            title="Today's Hours"
            text={`${todaysHours} hours worked today.`}
            buttonText="View Time History"
            onClick={() => router.push("/time-history")}
          />

          <DashboardCard
            title="Profile"
            text={`${employee.first_name} ${employee.last_name} | ${employee.email}`}
            buttonText="View Profile"
            onClick={() => router.push("/profile")}
          />
        </div>

        {showAdminCards && (
          <>
            <h2 style={styles.sectionTitle}>Management Tools</h2>

            <div style={styles.grid}>
              <DashboardCard
                title="👥 Employees"
                text="View employee records, roles, and account status."
                buttonText="Manage Employees"
                onClick={() => router.push("/employees")}
              />

              <DashboardCard
                title="⏰ Time Entries"
                text="Review clock-ins, clock-outs, and shift history."
                buttonText="View Time Entries"
                onClick={() => router.push("/time-entries")}
              />

              <DashboardCard
                title="📊 Reports"
                text="Generate weekly reports and payroll exports."
                buttonText="Open Reports"
                onClick={() => router.push("/reports")}
              />

              <DashboardCard
                title="📝 Audit Logs"
                text="Review authentication events and system activity."
                buttonText="View Audit Logs"
                onClick={() => router.push("/audit-logs")}
              />
            </div>
          </>
        )}
      </main>
    </>
  );
}

function DashboardCard({ title, text, buttonText, onClick }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardText}>{text}</p>
      <button style={styles.button} onClick={onClick}>
        {buttonText}
      </button>
    </div>
  );
}

const styles = {
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
  sectionTitle: {
    color: "#0A4DA2",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "32px 0 16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
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
