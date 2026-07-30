import Link from "next/link";

import { AlertTriangle, ArrowRight, Bell, Info, Megaphone } from "lucide-react";

export default function AnnouncementPreview({ announcements = [] }) {
  const preview = announcements.slice(0, 3);

  return (
    <section style={styles.panel}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Company</p>

          <h2 style={styles.title}>Announcements</h2>
        </div>

        <div style={styles.headerIcon}>
          <Megaphone size={22} aria-hidden="true" />
        </div>
      </div>

      {preview.length === 0 ? (
        <div style={styles.empty}>
          <Megaphone size={30} aria-hidden="true" />

          <h3 style={styles.emptyTitle}>No announcements</h3>

          <p style={styles.emptyText}>
            Company updates will appear here when something new is published.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {preview.map((announcement) => (
            <AnnouncementItem
              key={announcement.id}
              announcement={announcement}
            />
          ))}
        </div>
      )}

      <Link href="/announcements" style={styles.footerLink}>
        View all announcements
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}

function AnnouncementItem({ announcement }) {
  const priority = announcement.priority || "normal";

  const Icon = getPriorityIcon(priority);

  const priorityStyle = getPriorityStyle(priority);

  return (
    <article style={styles.item}>
      <div
        style={{
          ...styles.itemIcon,
          ...priorityStyle.icon,
        }}
      >
        <Icon size={18} aria-hidden="true" />
      </div>

      <div style={styles.content}>
        <div style={styles.titleRow}>
          <h3 style={styles.itemTitle}>{announcement.title}</h3>

          <span
            style={{
              ...styles.priority,
              ...priorityStyle.badge,
            }}
          >
            {formatLabel(priority)}
          </span>
        </div>

        <div style={styles.metadata}>
          <span style={styles.category}>
            {formatLabel(announcement.category || "general")}
          </span>

          {(announcement.publish_at || announcement.created_at) && (
            <>
              <span aria-hidden="true">•</span>

              <span>
                {formatDate(announcement.publish_at || announcement.created_at)}
              </span>
            </>
          )}
        </div>

        {announcement.message && (
          <p style={styles.message}>{truncate(announcement.message, 150)}</p>
        )}
      </div>
    </article>
  );
}

function getPriorityIcon(priority) {
  switch (priority) {
    case "urgent":
      return AlertTriangle;

    case "important":
      return Bell;

    default:
      return Info;
  }
}

function getPriorityStyle(priority) {
  switch (priority) {
    case "urgent":
      return {
        icon: {
          backgroundColor: "#FEE2E2",
          color: "#B91C1C",
        },

        badge: {
          backgroundColor: "#FEE2E2",
          color: "#991B1B",
        },
      };

    case "important":
      return {
        icon: {
          backgroundColor: "#FEF3C7",
          color: "#B45309",
        },

        badge: {
          backgroundColor: "#FEF3C7",
          color: "#92400E",
        },
      };

    default:
      return {
        icon: {
          backgroundColor: "#DBEAFE",
          color: "#2563EB",
        },

        badge: {
          backgroundColor: "#EFF6FF",
          color: "#1D4ED8",
        },
      };
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

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function truncate(value, length) {
  if (!value) {
    return "";
  }

  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length)}...`;
}

const styles = {
  panel: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    border: "1px solid #DCEBFF",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
  },

  eyebrow: {
    margin: "0 0 5px",
    color: "#2563EB",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },

  title: {
    margin: 0,
    color: "#111827",
    fontSize: "24px",
    fontWeight: "700",
  },

  headerIcon: {
    width: "44px",
    height: "44px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    borderRadius: "13px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
  },

  list: {
    display: "grid",
  },

  item: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    padding: "16px 0",
    borderTop: "1px solid #E5E7EB",
  },

  itemIcon: {
    width: "40px",
    height: "40px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    borderRadius: "11px",
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  itemTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "16px",
    fontWeight: "700",
    lineHeight: 1.4,
  },

  priority: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },

  metadata: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    flexWrap: "wrap",
    marginTop: "5px",
    color: "#94A3B8",
    fontSize: "12px",
  },

  category: {
    color: "#64748B",
    fontWeight: "600",
  },

  message: {
    margin: "9px 0 0",
    color: "#64748B",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  footerLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    marginTop: "16px",
    color: "#2563EB",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "700",
  },

  empty: {
    padding: "30px 20px",
    textAlign: "center",
    color: "#64748B",
    borderTop: "1px solid #E5E7EB",
  },

  emptyTitle: {
    margin: "10px 0 5px",
    color: "#111827",
    fontSize: "17px",
  },

  emptyText: {
    margin: 0,
    fontSize: "14px",
  },
};
