"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CircleAlert,
  Info,
  Megaphone,
  RefreshCcw,
} from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import api from "../../api/api";

import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";

import "./announcements.css";

export default function AnnouncementsPage() {
  const router = useRouter();

  const { employee, loading: authLoading } = useContext(AuthContext);

  const [announcements, setAnnouncements] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    category: "all",
    priority: "all",
  });

  useEffect(() => {
    if (!authLoading && !employee) {
      router.replace("/login");
    }
  }, [authLoading, employee, router]);

  const loadAnnouncements = useCallback(
    async (activeFilters = filters) => {
      try {
        setPageLoading(true);
        setError("");

        const response = await api.get("/announcements", {
          params: {
            category:
              activeFilters.category === "all"
                ? undefined
                : activeFilters.category,

            priority:
              activeFilters.priority === "all"
                ? undefined
                : activeFilters.priority,
          },
        });

        const data = response?.data;

        setAnnouncements(
          Array.isArray(data?.announcements) ? data.announcements : [],
        );
      } catch (err) {
        console.error("Announcements load error:", err);

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Could not load company announcements.",
        );
      } finally {
        setPageLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    if (employee) {
      loadAnnouncements(filters);
    }
  }, [employee, filters, loadAnnouncements]);

  const ANNOUNCEMENT_CATEGORIES = [
    "general",
    "policy",
    "schedule",
    "benefits",
    "event",
    "emergency",
  ];

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  if (authLoading || !employee) {
    return (
      <main className="announcements-session-loading">
        <div className="announcements-session-loading__card">
          <Megaphone size={30} aria-hidden="true" />

          <h1>Loading announcements...</h1>

          <p>Checking your ShiftStack account.</p>
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <div className="announcements-page">
        <PageHeader
          eyebrow="Company"
          title="Announcements"
          description="Stay informed about company news, policies, scheduling updates, events, and important notices."
          actions={
            <button
              type="button"
              className="announcements-refresh"
              onClick={() => loadAnnouncements(filters)}
              disabled={pageLoading}
            >
              <RefreshCcw size={17} aria-hidden="true" />

              {pageLoading ? "Refreshing..." : "Refresh"}
            </button>
          }
        />

        {error && (
          <div className="announcements-error" role="alert">
            <div>
              <CircleAlert size={20} aria-hidden="true" />

              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() => loadAnnouncements(filters)}
              disabled={pageLoading}
            >
              Try Again
            </button>
          </div>
        )}

        <section
          className="announcements-summary"
          aria-label="Announcement summary"
        >
          <SummaryCard
            label="Available"
            value={announcements.length}
            description="Published company announcements"
            icon={Megaphone}
          />

          <SummaryCard
            label="Important"
            value={
              announcements.filter((item) => item.priority === "important")
                .length
            }
            description="Important company updates"
            icon={Bell}
          />

          <SummaryCard
            label="Urgent"
            value={
              announcements.filter((item) => item.priority === "urgent").length
            }
            description="Announcements requiring attention"
            icon={AlertTriangle}
          />
        </section>

        <section
          className="announcements-filters"
          aria-labelledby="announcement-filter-heading"
        >
          <div>
            <p className="announcements-eyebrow">Company Feed</p>

            <h2 id="announcement-filter-heading">Filter announcements</h2>
          </div>

          <div className="announcements-filters__controls">
            <label>
              <span>Category</span>

              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                disabled={pageLoading}
              >
                <option value="all">All categories</option>

                {ANNOUNCEMENT_CATEGORIES.map((category) => (
                  <option value={category} key={category}>
                    {formatLabel(category)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Priority</span>

              <select
                name="priority"
                value={filters.priority}
                onChange={handleFilterChange}
                disabled={pageLoading}
              >
                <option value="all">All priorities</option>

                <option value="normal">Normal</option>

                <option value="important">Important</option>

                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>
        </section>

        {pageLoading && announcements.length === 0 ? (
          <AnnouncementsSkeleton />
        ) : announcements.length === 0 ? (
          <AnnouncementsEmptyState />
        ) : (
          <section
            className="announcements-feed"
            aria-label="Company announcements"
          >
            {announcements.map((announcement) => (
              <AnnouncementCard
                announcement={announcement}
                key={announcement.id}
              />
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value, description, icon: Icon }) {
  return (
    <article className="announcement-summary-card">
      <div className="announcement-summary-card__icon" aria-hidden="true">
        <Icon size={20} />
      </div>

      <p>{label}</p>

      <strong>{value}</strong>

      <span>{description}</span>
    </article>
  );
}

function AnnouncementCard({ announcement }) {
  const Icon = getAnnouncementIcon(announcement.priority);

  return (
    <article
      className={`announcement-card announcement-card--${
        announcement.priority || "normal"
      }`}
    >
      <div
        className={`announcement-card__icon announcement-card__icon--${
          announcement.priority || "normal"
        }`}
        aria-hidden="true"
      >
        <Icon size={23} />
      </div>

      <div className="announcement-card__content">
        <div className="announcement-card__header">
          <div>
            <div className="announcement-card__title-row">
              <h2>{announcement.title}</h2>

              <span
                className={`announcement-priority announcement-priority--${
                  announcement.priority || "normal"
                }`}
              >
                {formatLabel(announcement.priority || "normal")}
              </span>
            </div>

            <div className="announcement-card__metadata">
              <span>{formatLabel(announcement.category || "general")}</span>

              <span aria-hidden="true">•</span>

              <span>
                {formatAnnouncementDate(
                  announcement.publish_at || announcement.created_at,
                )}
              </span>
            </div>
          </div>
        </div>

        <p className="announcement-card__message">{announcement.message}</p>

        {announcement.expires_at && (
          <p className="announcement-card__expiration">
            <CalendarDays size={15} aria-hidden="true" />
            Available until {new Date(announcement.expires_at).toLocaleString()}
          </p>
        )}
      </div>
    </article>
  );
}

function AnnouncementsEmptyState() {
  return (
    <section className="announcements-empty">
      <Megaphone size={38} aria-hidden="true" />

      <h2>No announcements available</h2>

      <p>Published company updates and notices will appear here.</p>
    </section>
  );
}

function AnnouncementsSkeleton() {
  return (
    <div
      className="announcements-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading announcements"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="announcements-skeleton__card" key={index}>
          <div className="announcements-skeleton__icon" />

          <div className="announcements-skeleton__content">
            <div className="announcements-skeleton__line announcements-skeleton__line--short" />

            <div className="announcements-skeleton__line announcements-skeleton__line--long" />

            <div className="announcements-skeleton__line announcements-skeleton__line--medium" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getAnnouncementIcon(priority) {
  switch (priority) {
    case "urgent":
      return AlertTriangle;

    case "important":
      return Bell;

    default:
      return Info;
  }
}

function formatLabel(value) {
  if (!value) {
    return "";
  }

  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAnnouncementDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
