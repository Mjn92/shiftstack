"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import SectionHeader from "../../components/SectionHeader";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

export default function CalendarPage() {
  const router = useRouter();
  const { employee, loading } = useContext(AuthContext);

  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );

  const [events, setEvents] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (!loading && !employee) {
      router.push("/login");
    }
  }, [loading, employee, router]);

  useEffect(() => {
    if (employee) {
      loadCalendar();
    }
  }, [employee, currentMonth]);

  const monthStart = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );

  const monthEnd = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  );

  const loadCalendar = async () => {
    try {
      setPageLoading(true);
      setError("");

      const startDate = formatDateForApi(monthStart);
      const endDate = formatDateForApi(monthEnd);

      const response = await api.get("/calendar", {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });

      setEvents(response.data.events || []);
    } catch (err) {
      console.error("Calendar load error:", err);

      setError(err.response?.data?.error || "Could not load your calendar.");
    } finally {
      setPageLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const days = [];

    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );

    const lastDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );

    // Monday = 0, Sunday = 6
    const leadingDays = (firstDay.getDay() + 6) % 7;

    for (let i = leadingDays; i > 0; i -= 1) {
      days.push(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1 - i),
      );
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      days.push(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day),
      );
    }

    while (days.length % 7 !== 0) {
      const last = days[days.length - 1];

      days.push(
        new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      );
    }

    return days;
  }, [currentMonth]);

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    const today = new Date();

    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  if (loading || !employee) {
    return <main style={styles.loadingPage}>Loading calendar...</main>;
  }

  return (
    <AppShell>
      <main style={styles.page}>
        <div style={styles.container}>
          <PageHeader
            eyebrow="Schedule"
            title="My Calendar"
            description="Review your worked shifts and time-off requests."
            actions={
              <button
                type="button"
                style={styles.todayButton}
                onClick={goToToday}
              >
                Today
              </button>
            }
          />
          {error && <div style={styles.error}>{error}</div>}

          <SectionHeader title="Schedule & Time Off" styles={styles} />

          <div style={styles.calendarCard}>
            <div style={styles.calendarToolbar}>
              <button style={styles.navigationButton} onClick={previousMonth}>
                ← Previous
              </button>

              <h2 style={styles.monthTitle}>
                {currentMonth.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </h2>

              <button style={styles.navigationButton} onClick={nextMonth}>
                Next →
              </button>
            </div>

            <div style={styles.weekHeader}>
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => (
                <div key={day} style={styles.weekDay}>
                  {day}
                </div>
              ))}
            </div>

            {pageLoading ? (
              <div style={styles.loadingCalendar}>Loading calendar...</div>
            ) : (
              <div style={styles.calendarGrid}>
                {calendarDays.map((date) => {
                  const dayEvents = getEventsForDate(events, date);

                  const outsideMonth =
                    date.getMonth() !== currentMonth.getMonth();

                  const today = isSameDay(date, new Date());

                  return (
                    <div
                      key={date.toISOString()}
                      style={{
                        ...styles.dayCell,
                        ...(outsideMonth ? styles.outsideMonth : {}),
                        ...(today ? styles.todayCell : {}),
                      }}
                    >
                      <div style={styles.dayNumber}>{date.getDate()}</div>

                      <div style={styles.eventList}>
                        {dayEvents.map((event) => (
                          <button
                            key={`${event.id}-${formatDateForApi(date)}`}
                            style={{
                              ...styles.event,
                              ...(event.type === "pto"
                                ? styles.ptoEvent
                                : styles.shiftEvent),
                              ...(event.status === "pending"
                                ? styles.pendingEvent
                                : {}),
                            }}
                            onClick={() => setSelectedEvent(event)}
                          >
                            {event.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={styles.legend}>
            <LegendItem label="Worked Shift" style={styles.shiftEvent} />
            <LegendItem label="Approved PTO" style={styles.ptoEvent} />
            <LegendItem label="Pending PTO" style={styles.pendingEvent} />
          </div>

          {selectedEvent && (
            <div style={styles.detailsCard}>
              <SectionHeader title="Event Details" styles={styles} />

              <p>
                <strong>{selectedEvent.title}</strong>
              </p>

              <p>Type: {selectedEvent.type}</p>
              <p>Status: {selectedEvent.status}</p>

              <p>Start: {formatDisplayDate(selectedEvent.start_date)}</p>

              {selectedEvent.end_date && (
                <p>End: {formatDisplayDate(selectedEvent.end_date)}</p>
              )}

              {selectedEvent.total_minutes != null && (
                <p>Worked: {formatMinutes(selectedEvent.total_minutes)}</p>
              )}

              <button
                style={styles.closeButton}
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}

function LegendItem({ label, style }) {
  return (
    <div style={styles.legendItem}>
      <span
        style={{
          ...styles.legendMarker,
          ...style,
        }}
      />
      {label}
    </div>
  );
}

function getEventsForDate(events, date) {
  const target = toLocalDateKey(date);

  return events.filter((event) => {
    if (event.type === "shift") {
      return getDateKey(event.start_date) === target;
    }

    const start = getDateKey(event.start_date);
    const end = getDateKey(event.end_date || event.start_date);

    return target >= start && target <= end;
  });
}

function getDateKey(value) {
  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);

    if (match) {
      return match[1];
    }
  }

  return toLocalDateKey(new Date(value));
}

function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateForApi(date) {
  return toLocalDateKey(date);
}

function isSameDay(first, second) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function formatDisplayDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function formatMinutes(minutes) {
  const total = Number(minutes) || 0;

  const hours = Math.floor(total / 60);
  const remaining = total % 60;

  return `${hours}h ${remaining}m`;
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#EAF3FF",
    padding: "32px",
  },

  container: {
    maxWidth: "1500px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },

  pageTitle: {
    color: "#0A4DA2",
    fontSize: "36px",
    fontWeight: "bold",
    margin: 0,
  },

  pageSubtitle: {
    color: "#6B7280",
    marginTop: "8px",
  },

  todayButton: {
    backgroundColor: "#0A4DA2",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "12px 20px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  calendarCard: {
    backgroundColor: "white",
    borderRadius: "18px",
    border: "1px solid #DCEBFF",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },

  calendarToolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    gap: "16px",
  },

  monthTitle: {
    color: "#0A4DA2",
    margin: 0,
  },

  navigationButton: {
    border: "1px solid #BFDBFE",
    backgroundColor: "#EFF6FF",
    color: "#0A4DA2",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  weekHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(120px, 1fr))",
    backgroundColor: "#F3F4F6",
  },

  weekDay: {
    padding: "12px",
    textAlign: "center",
    fontWeight: "bold",
    color: "#374151",
  },

  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(120px, 1fr))",
  },

  dayCell: {
    minHeight: "135px",
    padding: "10px",
    borderTop: "1px solid #E5E7EB",
    borderRight: "1px solid #E5E7EB",
    backgroundColor: "#FFFFFF",
  },

  outsideMonth: {
    backgroundColor: "#F9FAFB",
    opacity: 0.55,
  },

  todayCell: {
    outline: "2px solid #2563EB",
    outlineOffset: "-2px",
  },

  dayNumber: {
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#374151",
  },

  eventList: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  event: {
    width: "100%",
    border: "none",
    borderRadius: "6px",
    padding: "6px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "12px",
  },

  shiftEvent: {
    backgroundColor: "#DBEAFE",
    color: "#1E40AF",
  },

  ptoEvent: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },

  pendingEvent: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },

  legend: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginTop: "18px",
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#4B5563",
  },

  legendMarker: {
    width: "18px",
    height: "18px",
    borderRadius: "5px",
    display: "inline-block",
  },

  detailsCard: {
    marginTop: "24px",
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "18px",
    border: "1px solid #DCEBFF",
  },

  closeButton: {
    backgroundColor: "#374151",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    cursor: "pointer",
  },

  loadingCalendar: {
    padding: "50px",
    textAlign: "center",
    color: "#6B7280",
  },

  loadingPage: {
    minHeight: "100vh",
    padding: "40px",
  },

  error: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    padding: "14px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  sectionTitle: {
    color: "#0A4DA2",
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "14px",
  },
};
