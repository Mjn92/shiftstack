"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar.jsx";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function NotificationsPage() {
  const router = useRouter();
  const { employee, loading } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);
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
      loadNotifications();
    }
  }, [employee]);

  const loadNotifications = async () => {
    try {
      setPageLoading(true);
      setError("");

      const response = await api.get("/notifications");
      setNotifications(response.data);
    } catch (err) {
      console.error("Notifications load error:", err);
      setError("Could not load notifications.");
    } finally {
      setPageLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      await loadNotifications();
    } catch (err) {
      setError("Could not mark notification as read.");
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      await loadNotifications();
    } catch (err) {
      setError("Could not mark all notifications as read.");
    }
  };

  if (loading || !employee) {
    return <p style={{ padding: "32px" }}>Loading...</p>;
  }

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.header}>
          <h1 style={styles.title}>Notifications</h1>
          <p style={styles.subtitle}>
            You have {unreadCount} unread notification
            {unreadCount === 1 ? "" : "s"}.
          </p>
        </section>

        <section style={styles.actions}>
          <button
            style={styles.secondaryButton}
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </button>

          <button style={styles.secondaryButton} onClick={loadNotifications}>
            Refresh
          </button>

          <button style={styles.secondaryButton} onClick={markAllRead}>
            Mark All Read
          </button>
        </section>

        {error && <div style={styles.error}>{error}</div>}

        {pageLoading ? (
          <div style={styles.card}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={styles.card}>No notifications found.</div>
        ) : (
          <div style={styles.list}>
            {notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  ...styles.card,
                  borderLeft: item.read
                    ? "6px solid #D1D5DB"
                    : "6px solid #0A4DA2",
                }}
              >
                <div style={styles.notificationHeader}>
                  <div>
                    <h2 style={styles.notificationTitle}>{item.title}</h2>
                    <p style={styles.notificationDate}>
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: item.read ? "#E5E7EB" : "#DBEAFE",
                      color: item.read ? "#374151" : "#0A4DA2",
                    }}
                  >
                    {item.read ? "Read" : "Unread"}
                  </span>
                </div>

                <p style={styles.message}>{item.message}</p>
                <p style={styles.type}>Type: {item.type}</p>

                {!item.read && (
                  <button
                    style={styles.button}
                    onClick={() => markRead(item.id)}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
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
  list: {
    display: "grid",
    gap: "16px",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
  },
  notificationHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
  },
  notificationTitle: {
    color: "#0A4DA2",
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "4px",
  },
  notificationDate: {
    color: "#6B7280",
    fontSize: "14px",
  },
  message: {
    color: "#374151",
    marginTop: "16px",
    lineHeight: "1.5",
  },
  type: {
    color: "#6B7280",
    fontSize: "14px",
    marginTop: "12px",
    textTransform: "capitalize",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: "bold",
    fontSize: "13px",
  },
  button: {
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "16px",
  },
  error: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
  },
};
