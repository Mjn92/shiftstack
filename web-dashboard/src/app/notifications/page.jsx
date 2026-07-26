"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  CircleAlert,
  Info,
  ShieldAlert,
} from "lucide-react";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";
import { notifyNotificationsUpdated } from "../../utils/notificationEvents";

import "./notifications.css";

export default function NotificationsPage() {
  const router = useRouter();

  const { employee, loading } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [markingReadIds, setMarkingReadIds] = useState(() => new Set());
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    read: "all",
    type: "all",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading && !employee) {
      router.replace("/login");
    }
  }, [loading, employee, router]);

  const loadNotifications = useCallback(
    async ({
      page = 1,
      limit = 10,
      activeFilters = {
        read: "all",
        type: "all",
      },
    } = {}) => {
      try {
        setPageLoading(true);
        setError("");

        const response = await api.get("/notifications", {
          params: {
            page,
            limit,
            read: activeFilters.read,
            type: activeFilters.type,
          },
        });

        const data =
          response?.data &&
          typeof response.data === "object" &&
          !Array.isArray(response.data)
            ? response.data
            : {};

        setNotifications(
          Array.isArray(data.notifications) ? data.notifications : [],
        );

        setUnreadCount(Number(data.unread_count) || 0);

        setPagination({
          page: Number(data.pagination?.page) || page,

          limit: Number(data.pagination?.limit) || limit,

          total: Number(data.pagination?.total) || 0,

          totalPages: Number(data.pagination?.total_pages) || 0,

          hasPreviousPage: Boolean(data.pagination?.has_previous_page),

          hasNextPage: Boolean(data.pagination?.has_next_page),
        });
      } catch (err) {
        console.error("Notifications load error:", err);

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Could not load notifications.",
        );
      } finally {
        setPageLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (employee) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadNotifications({
        page: 1,
        limit: 10,
        activeFilters: {
          read: "all",
          type: "all",
        },
      });
    }
  }, [employee, loadNotifications]);

  const handleFilterChange = async (event) => {
    const { name, value } = event.target;

    const nextFilters = {
      ...filters,
      [name]: value,
    };

    setFilters(nextFilters);

    await loadNotifications({
      page: 1,
      limit: pagination.limit,
      activeFilters: nextFilters,
    });
  };

  const changePage = async (nextPage) => {
    if (pageLoading || nextPage < 1 || nextPage > pagination.totalPages) {
      return;
    }

    await loadNotifications({
      page: nextPage,
      limit: pagination.limit,
      activeFilters: filters,
    });
  };

  const changePageSize = async (event) => {
    const limit = Number(event.target.value);

    await loadNotifications({
      page: 1,
      limit,
      activeFilters: filters,
    });
  };

  const markRead = async (id) => {
    if (markingReadIds.has(id)) {
      return;
    }

    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    const targetNotification = notifications.find((item) => item.id === id);

    if (!targetNotification || targetNotification.read) {
      return;
    }

    setMarkingReadIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });

    setNotifications((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              read: true,
            }
          : item,
      ),
    );

    setUnreadCount((current) => Math.max(current - 1, 0));

    try {
      setError("");

      await api.patch(`/notifications/${id}/read`);

      notifyNotificationsUpdated();

      if (filters.read === "unread") {
        const nextPage =
          notifications.length === 1 && pagination.page > 1
            ? pagination.page - 1
            : pagination.page;

        await loadNotifications({
          page: nextPage,
          limit: pagination.limit,
          activeFilters: filters,
        });
      }
    } catch (err) {
      console.error("Mark notification read error:", err);

      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not mark notification as read.",
      );
    } finally {
      setMarkingReadIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0 || actionLoading) {
      return;
    }

    const confirmed = window.confirm("Mark all notifications as read?");

    if (!confirmed) {
      return;
    }

    const previousNotifications = notifications;

    const previousUnreadCount = unreadCount;

    try {
      setActionLoading(true);
      setError("");

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          read: true,
        })),
      );

      setUnreadCount(0);

      await api.patch("/notifications/read-all");

      notifyNotificationsUpdated();

      if (filters.read === "unread") {
        await loadNotifications({
          page: 1,
          limit: pagination.limit,
          activeFilters: filters,
        });
      }
    } catch (err) {
      console.error("Mark all notifications read error:", err);

      setNotifications(previousNotifications);

      setUnreadCount(previousUnreadCount);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Could not mark all notifications as read.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !employee) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingCard}>
          <LoadingState message="Loading notifications..." />
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <div style={styles.page}>
        <PageHeader
          eyebrow="Inbox"
          title="Notifications"
          description={`You have ${unreadCount} unread notification${
            unreadCount === 1 ? "" : "s"
          }.`}
          actions={
            <>
              <button
                type="button"
                className="notification-button notification-button--secondary"
                onClick={() =>
                  loadNotifications({
                    page: pagination.page,
                    limit: pagination.limit,
                    activeFilters: filters,
                  })
                }
                disabled={pageLoading}
              >
                {pageLoading ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                className="notification-button notification-button--primary"
                onClick={markAllRead}
                disabled={pageLoading || actionLoading || unreadCount === 0}
              >
                {actionLoading ? "Updating..." : "Mark All Read"}
              </button>
            </>
          }
        />

        {error && (
          <div style={styles.messageWrapper}>
            <ErrorState
              message={error}
              onRetry={
                pageLoading
                  ? undefined
                  : () =>
                      loadNotifications({
                        page: pagination.page,
                        limit: pagination.limit,
                        activeFilters: filters,
                      })
              }
            />
          </div>
        )}

        <section
          className="notification-summary"
          aria-label="Notification summary"
        >
          <NotificationStat
            label="Unread"
            value={unreadCount}
            description="Notifications requiring attention"
          />

          <NotificationStat
            label="Showing"
            value={notifications.length}
            description="Notifications on this page"
          />

          <NotificationStat
            label="Total"
            value={pagination.total}
            description="Notifications matching your filters"
          />
        </section>

        <section
          className="notification-filters"
          aria-labelledby="notification-filters-heading"
        >
          <div>
            <p className="notification-eyebrow">Inbox Controls</p>

            <h2 id="notification-filters-heading">Filter notifications</h2>
          </div>

          <div className="notification-filters__controls">
            <label>
              <span>Status</span>

              <select
                name="read"
                value={filters.read}
                onChange={handleFilterChange}
                disabled={pageLoading}
              >
                <option value="all">All</option>

                <option value="unread">Unread</option>

                <option value="read">Read</option>
              </select>
            </label>

            <label>
              <span>Type</span>

              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                disabled={pageLoading}
              >
                <option value="all">All types</option>

                <option value="info">Info</option>

                <option value="success">Success</option>

                <option value="warning">Warning</option>

                <option value="error">Error</option>

                <option value="system">System</option>
              </select>
            </label>
          </div>
        </section>

        {pageLoading && notifications.length === 0 ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          <NotificationEmptyState filters={filters} />
        ) : (
          <>
            <div className="notification-list">
              {notifications.map((item) => {
                const Icon = getNotificationIcon(item.type);

                const notificationType = normalizeNotificationType(item.type);

                return (
                  <article
                    key={item.id}
                    className={`notification-card ${
                      item.read
                        ? "notification-card--read"
                        : "notification-card--unread"
                    }`}
                  >
                    <div
                      className={`notification-card__icon notification-card__icon--${notificationType}`}
                      aria-hidden="true"
                    >
                      <Icon size={21} />
                    </div>

                    <div className="notification-card__content">
                      <div className="notification-card__header">
                        <div>
                          <div className="notification-card__title-row">
                            <h2>{item.title}</h2>

                            {!item.read && (
                              <span
                                className="notification-card__unread-dot"
                                aria-label="Unread notification"
                              />
                            )}
                          </div>

                          <p className="notification-card__time">
                            {formatNotificationTime(item.created_at)}
                          </p>
                        </div>

                        <span
                          className={`notification-type notification-type--${notificationType}`}
                        >
                          {formatNotificationType(notificationType)}
                        </span>
                      </div>

                      <p className="notification-card__message">
                        {item.message}
                      </p>

                      {!item.read && (
                        <button
                          type="button"
                          className="notification-card__read-button"
                          onClick={() => markRead(item.id)}
                          disabled={markingReadIds.has(item.id)}
                          aria-busy={markingReadIds.has(item.id)}
                        >
                          {markingReadIds.has(item.id)
                            ? "Updating..."
                            : "Mark as read"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {pagination.total > 0 && (
              <div className="notification-pagination">
                <label>
                  <span>Per page</span>

                  <select
                    value={pagination.limit}
                    onChange={changePageSize}
                    disabled={pageLoading}
                  >
                    <option value="10">10</option>

                    <option value="20">20</option>

                    <option value="50">50</option>
                  </select>
                </label>

                <p>
                  Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
                </p>

                <div>
                  <button
                    type="button"
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={pageLoading || !pagination.hasPreviousPage}
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={pageLoading || !pagination.hasNextPage}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function NotificationStat({ label, value, description }) {
  return (
    <article className="notification-stat">
      <p>{label}</p>

      <strong>{value}</strong>

      <span>{description}</span>
    </article>
  );
}

function NotificationSkeleton() {
  return (
    <div
      className="notification-skeleton"
      role="status"
      aria-label="Loading notifications"
      aria-live="polite"
    >
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          className="notification-skeleton__card"
          key={`notification-skeleton-${index}`}
        >
          <div className="notification-skeleton__icon" />

          <div>
            <div className="notification-skeleton__line notification-skeleton__line--short" />

            <div className="notification-skeleton__line notification-skeleton__line--long" />

            <div className="notification-skeleton__line notification-skeleton__line--medium" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationEmptyState({ filters }) {
  const filtered = filters.read !== "all" || filters.type !== "all";

  return (
    <EmptyState
      title={filtered ? "No matching notifications" : "Your inbox is clear"}
      description={
        filtered
          ? "No notifications match the current filters."
          : "New ShiftStack alerts and messages will appear here."
      }
    />
  );
}

function getNotificationIcon(type) {
  switch (normalizeNotificationType(type)) {
    case "success":
      return CheckCircle2;

    case "warning":
      return CircleAlert;

    case "error":
      return AlertCircle;

    case "system":
      return ShieldAlert;

    default:
      return Info;
  }
}

function normalizeNotificationType(type) {
  if (typeof type !== "string" || !type.trim()) {
    return "info";
  }

  const normalized = type.trim().toLowerCase();

  const supportedTypes = new Set([
    "info",
    "success",
    "warning",
    "error",
    "system",
  ]);

  return supportedTypes.has(normalized) ? normalized : "info";
}

function formatNotificationType(type) {
  if (!type) {
    return "Info";
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatNotificationTime(value) {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const now = Date.now();

  const differenceMs = now - date.getTime();

  if (differenceMs < 0) {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const minutes = Math.floor(differenceMs / (1000 * 60));

  const hours = Math.floor(minutes / 60);

  const days = Math.floor(hours / 24);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  if (hours < 24) {
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const styles = {
  page: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
    backgroundColor: "#F4F7FB",
  },

  messageWrapper: {
    marginBottom: "20px",
  },

  loadingCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "16px",
    padding: "24px",
    color: "#475569",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.06)",
  },
};
