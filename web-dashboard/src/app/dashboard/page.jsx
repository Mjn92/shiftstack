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
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [error, setError] = useState("");

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
      setError("");

      const statusResponse = await api.get("/time/status");
      const entriesResponse = await api.get("/time/my-entries");
      const weeklyResponse = await api.get("/time/my-weekly-summary");

      setClockStatus(statusResponse.data);
      setEntries(entriesResponse.data);
      setWeeklySummary(weeklyResponse.data);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Could not load dashboard data.");
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
  const currentEntry = clockStatus?.current_entry;

  const lastEntry = entries.length > 0 ? entries[0] : null;

  const showManagerTools =
    employee.role === "manager" || employee.role === "admin";

  const showAdminTools = employee.role === "admin";

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.header}>
          <h1 style={styles.pageTitle}>Welcome back, {employee.first_name}</h1>

          <p style={styles.pageSubtitle}>
            Role: {employee.role} | ShiftStack Dashboard
          </p>
        </section>

        {error && <div style={styles.error}>{error}</div>}

        <section>
          <h2 style={styles.sectionTitle}>My Shift Overview</h2>

          <div style={styles.grid}>
            <DashboardCard
              title="Current Status"
              value={isClockedIn ? "Clocked In" : "Clocked Out"}
              text={
                isClockedIn
                  ? "You currently have an active shift."
                  : "You are not currently clocked in."
              }
              buttonText={isClockedIn ? "Clock Out" : "Clock In"}
              onClick={() => router.push("/clock")}
              highlight={isClockedIn ? "success" : "neutral"}
            />

            <DashboardCard
              title="Today's Hours"
              value={`${todaysHours} hrs`}
              text="Total closed shift hours for today."
              buttonText="View Time History"
              onClick={() => router.push("/time-history")}
            />

            <DashboardCard
              title="Weekly Hours"
              value={`${weeklySummary?.total_hours || 0} hrs`}
              text={`${weeklySummary?.total_shifts || 0} closed shifts this week.`}
              buttonText="Weekly Summary"
              onClick={() => router.push("/weekly-summary")}
            />

            <DashboardCard
              title="Overtime"
              value={`${weeklySummary?.overtime_hours || 0} hrs`}
              text="Estimated overtime above 40 hours."
              buttonText="View Weekly Summary"
              onClick={() => router.push("/weekly-summary")}
            />
          </div>
        </section>

        <section>
          <h2 style={styles.sectionTitle}>Shift Details</h2>

          <div style={styles.grid}>
            <DashboardCard
              title="Current Shift"
              value={
                currentEntry?.clock_in
                  ? new Date(currentEntry.clock_in).toLocaleTimeString()
                  : "None"
              }
              text={
                currentEntry?.clock_in
                  ? `Started on ${new Date(
                      currentEntry.clock_in,
                    ).toLocaleDateString()}`
                  : "No active shift right now."
              }
              buttonText="Open Clock Center"
              onClick={() => router.push("/clock")}
            />

            <DashboardCard
              title="Last Clock Event"
              value={
                lastEntry
                  ? lastEntry.status === "open"
                    ? "Clocked In"
                    : "Clocked Out"
                  : "None"
              }
              text={
                lastEntry
                  ? new Date(lastEntry.clock_in).toLocaleString()
                  : "No time entries found."
              }
              buttonText="View History"
              onClick={() => router.push("/time-history")}
            />

            <DashboardCard
              title="My Profile"
              value={employee.email}
              text={`${employee.first_name} ${employee.last_name}`}
              buttonText="Open Profile"
              onClick={() => router.push("/profile")}
            />
          </div>
        </section>

        {showManagerTools && (
          <section>
            <h2 style={styles.sectionTitle}>Management Tools</h2>

            <div style={styles.grid}>
              <DashboardCard
                title="Employees"
                value="Team"
                text="View employee records, roles, and account status."
                buttonText="Manage Employees"
                onClick={() => router.push("/employees")}
              />

              <DashboardCard
                title="Time Entries"
                value="Review"
                text="Review clock-ins, clock-outs, and shift history."
                buttonText="View Time Entries"
                onClick={() => router.push("/time-entries")}
              />

              <DashboardCard
                title="Reports"
                value="Reports"
                text="Generate weekly reports and payroll exports."
                buttonText="Open Reports"
                onClick={() => router.push("/reports")}
              />
            </div>
          </section>
        )}

        {showAdminTools && (
          <section>
            <h2 style={styles.sectionTitle}>Admin Tools</h2>

            <div style={styles.grid}>
              <DashboardCard
                title="Audit Logs"
                value="Security"
                text="Review authentication events and system activity."
                buttonText="View Audit Logs"
                onClick={() => router.push("/audit-logs")}
              />

              <DashboardCard
                title="System Health"
                value="Planned"
                text="Monitor database, RabbitMQ, and backend health."
                buttonText="Coming Soon"
                onClick={() => {}}
              />

              <DashboardCard
                title="Maintenance"
                value="Planned"
                text="Track cron jobs, cleanup tasks, and rotation history."
                buttonText="Coming Soon"
                onClick={() => {}}
              />
            </div>
          </section>
        )}
      </main>
    </>
  );
}

function DashboardCard({
  title,
  value,
  text,
  buttonText,
  onClick,
  highlight = "default",
}) {
  const highlightStyle =
    highlight === "success"
      ? styles.successValue
      : highlight === "neutral"
        ? styles.neutralValue
        : styles.cardValue;

  return (
    <div style={styles.card}>
      <p style={styles.cardLabel}>{title}</p>
      <h3 style={highlightStyle}>{value}</h3>
      <p style={styles.cardText}>{text}</p>

      <button style={styles.button} onClick={onClick}>
        {buttonText}
      </button>
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
    marginBottom: "32px",
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
  sectionTitle: {
    color: "#0A4DA2",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "32px 0 16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "8px",
    wordBreak: "break-word",
  },
  successValue: {
    color: "#16A34A",
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  neutralValue: {
    color: "#374151",
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  cardText: {
    color: "#6B7280",
    marginBottom: "20px",
    lineHeight: "1.5",
    minHeight: "48px",
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
  error: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
  },
};
