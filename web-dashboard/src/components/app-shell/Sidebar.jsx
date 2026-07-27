"use client";

import Link from "next/link";
import { useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Clock3,
  FileBarChart,
  History,
  LayoutDashboard,
  LogOut,
  Plane,
  ScrollText,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Megaphone,
} from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import { canAccessAdmin, canAccessManagement } from "../../utils/roleAccess";
import useUnreadNotifications from "../../hooks/useUnreadNotifications";

const employeeLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/clock",
    label: "Clock Center",
    icon: Clock3,
  },
  {
    href: "/time-history",
    label: "Time History",
    icon: History,
  },
  {
    href: "/weekly-summary",
    label: "Weekly Summary",
    icon: CalendarDays,
  },
  {
    href: "/pto",
    label: "Paid Time Off",
    icon: Plane,
  },
  {
    href: "/calendar",
    label: "My Calendar",
    icon: CalendarRange,
  },
  {
    href: "/announcements",
    label: "Announcements",
    icon: Megaphone,
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    badge: "notifications",
  },
  {
    href: "/profile",
    label: "My Profile",
    icon: UserRound,
  },
];

const managementLinks = [
  {
    href: "/employees",
    label: "Employees",
    icon: Users,
  },
  {
    href: "/time-entries",
    label: "Time Entries",
    icon: ClipboardList,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: FileBarChart,
  },
];

const adminLinks = [
  {
    href: "/audit-logs",
    label: "Audit Logs",
    icon: ScrollText,
  },
];

export default function Sidebar({ mobile = false, onNavigate }) {
  const pathname = usePathname();
  const router = useRouter();

  const { employee, logout } = useContext(AuthContext);

  const showManagement = canAccessManagement(employee?.role);
  const showAdmin = canAccessAdmin(employee?.role);

  const { unreadCount } = useUnreadNotifications(Boolean(employee));

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      onNavigate?.();
      router.replace("/login");
    }
  };

  return (
    <aside
      className={
        mobile
          ? "app-sidebar app-sidebar--mobile"
          : "app-sidebar app-sidebar--desktop"
      }
      aria-label={mobile ? "Mobile navigation" : "Primary navigation"}
    >
      <div className="app-sidebar__brand">
        <div className="app-sidebar__logo" aria-hidden="true">
          S
        </div>

        <div>
          <p className="app-sidebar__brand-name">ShiftStack</p>

          <p className="app-sidebar__brand-description">Workforce Management</p>
        </div>
      </div>

      <div className="app-sidebar__user">
        <div className="app-sidebar__avatar" aria-hidden="true">
          {getInitials(employee)}
        </div>

        <div className="app-sidebar__user-details">
          <p className="app-sidebar__user-name">
            {employee
              ? `${employee.first_name} ${employee.last_name}`
              : "ShiftStack User"}
          </p>

          <p className="app-sidebar__user-role">
            <ShieldCheck size={14} aria-hidden="true" />
            {formatRole(employee?.role)}
          </p>
        </div>
      </div>

      <nav className="app-sidebar__navigation">
        <NavigationSection
          title="Employee"
          links={employeeLinks}
          pathname={pathname}
          onNavigate={onNavigate}
          unreadCount={unreadCount}
        />

        {showManagement && (
          <NavigationSection
            title="Management"
            links={managementLinks}
            pathname={pathname}
            onNavigate={onNavigate}
            unreadCount={unreadCount}
          />
        )}

        {showAdmin && (
          <NavigationSection
            title="Administration"
            links={adminLinks}
            pathname={pathname}
            onNavigate={onNavigate}
            unreadCount={unreadCount}
          />
        )}
      </nav>

      <div className="app-sidebar__footer">
        <Link
          href="/profile"
          className="app-sidebar__footer-link"
          onClick={onNavigate}
        >
          <Settings size={18} aria-hidden="true" />
          Account Settings
        </Link>

        <button
          type="button"
          className="app-sidebar__logout"
          onClick={handleLogout}
          aria-label="Log out of ShiftStack"
        >
          <LogOut size={18} aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>
  );
}

function NavigationSection({
  title,
  links,
  pathname,
  onNavigate,
  unreadCount,
}) {
  return (
    <section className="app-sidebar__section">
      <h2 className="app-sidebar__section-title">{title}</h2>

      <div className="app-sidebar__links">
        {links.map((link) => {
          const Icon = link.icon;

          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" &&
              pathname?.startsWith(`${link.href}/`));

          const showNotificationBadge =
            link.badge === "notifications" && unreadCount > 0;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`app-sidebar__link${
                active ? " app-sidebar__link--active" : ""
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={19} aria-hidden="true" />

              <span>{link.label}</span>

              {showNotificationBadge && (
                <span
                  className="app-sidebar__notification-badge"
                  aria-label={`${unreadCount} unread notification${
                    unreadCount === 1 ? "" : "s"
                  }`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function getInitials(employee) {
  if (!employee) {
    return "SS";
  }

  const firstInitial = employee.first_name?.charAt(0) || "";
  const lastInitial = employee.last_name?.charAt(0) || "";

  return `${firstInitial}${lastInitial}`.toUpperCase() || "SS";
}

function formatRole(role) {
  if (!role) {
    return "Employee";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}
