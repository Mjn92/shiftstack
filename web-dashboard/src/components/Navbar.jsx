"use client";

import Link from "next/link";
import { useContext } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AuthContext } from "../context/AuthContext";
import { canAccessAdmin, canAccessManagement } from "../utils/roleAccess";

import "./navbar.css";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { employee, logout } = useContext(AuthContext);

  const canManage = canAccessManagement(employee?.role);
  const canViewAdmin = canAccessAdmin(employee?.role);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  };

  const getLinkStyle = (path) => {
    const isActive =
      pathname === path ||
      (path !== "/dashboard" && pathname?.startsWith(`${path}/`));

    return {
      backgroundColor: isActive ? "#2563EB" : "#1F2937",
      color: "white",
      padding: "10px 14px",
      borderRadius: "8px",
      textDecoration: "none",
      fontWeight: isActive ? "bold" : "normal",
      boxShadow: isActive ? "0 0 12px rgba(37, 99, 235, 0.6)" : "none",
      border: isActive ? "1px solid #60A5FA" : "1px solid transparent",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
      fontSize: "14px",
    };
  };

  const employeeLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/clock", label: "Clock" },
    { href: "/time-history", label: "Time History" },
    { href: "/weekly-summary", label: "Weekly Summary" },
    { href: "/notifications", label: "Notifications" },
    { href: "/profile", label: "Profile" },
  ];

  const managementLinks = [
    { href: "/employees", label: "Employees" },
    { href: "/time-entries", label: "Time Entries" },
    { href: "/reports", label: "Reports" },
  ];

  const adminLinks = [{ href: "/audit-logs", label: "Audit Logs" }];

  return (
    <nav style={styles.nav} aria-label="Primary navigation">
      <div style={styles.brand}>
        <h1 style={styles.brandTitle}>ShiftStack</h1>

        <p style={styles.brandSubtitle}>
          {employee?.first_name || "User"} | {employee?.role || "role"}
        </p>
      </div>

      <div style={styles.navigationArea}>
        <NavGroup title="Home">
          {employeeLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="navbar-link"
              style={getLinkStyle(link.href)}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </NavGroup>

        {canManage && (
          <NavGroup title="Management">
            {managementLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="navbar-link"
                style={getLinkStyle(link.href)}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </NavGroup>
        )}

        {canViewAdmin && (
          <NavGroup title="Admin">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="navbar-link"
                style={getLinkStyle(link.href)}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </NavGroup>
        )}

        <div style={styles.sessionGroup}>
          <span style={styles.groupTitle}>Session</span>

          <button
            type="button"
            onClick={handleLogout}
            className="navbar-logout-button"
            style={styles.logoutButton}
            aria-label="Log out of ShiftStack"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavGroup({ title, children }) {
  return (
    <div style={styles.navGroup}>
      <span style={styles.groupTitle}>{title}</span>

      <div style={styles.linkGroup} aria-label={`${title} navigation links`}>
        {children}
      </div>
    </div>
  );
}

const styles = {
  nav: {
    backgroundColor: "#111827",
    color: "white",
    padding: "16px clamp(16px, 3vw, 32px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    borderBottom: "3px solid #2563EB",
    flexWrap: "wrap",
    width: "100%",
    boxSizing: "border-box",
  },

  brand: {
    minWidth: "180px",
    flex: "0 1 auto",
  },

  brandTitle: {
    margin: 0,
    fontSize: "clamp(24px, 3vw, 28px)",
    fontWeight: "bold",
    overflowWrap: "anywhere",
  },

  brandSubtitle: {
    margin: 0,
    color: "#9CA3AF",
    fontSize: "14px",
    overflowWrap: "anywhere",
  },

  navigationArea: {
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    flex: "1 1 600px",
    minWidth: 0,
  },

  navGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: 0,
  },

  groupTitle: {
    color: "#9CA3AF",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  linkGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    minWidth: 0,
  },

  sessionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "flex-end",
    flex: "0 0 auto",
  },

  logoutButton: {
    backgroundColor: "#DC2626",
    color: "white",
    border: "none",
    padding: "10px 16px",
    minHeight: "44px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
};
