"use client";

import Link from "next/link";
import { useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { employee, logout } = useContext(AuthContext);

  const isManager = employee?.role === "manager";
  const isAdmin = employee?.role === "admin";
  const canManage = isManager || isAdmin;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getLinkStyle = (path) => ({
    backgroundColor: pathname === path ? "#2563EB" : "#1F2937",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: pathname === path ? "bold" : "normal",
    boxShadow: pathname === path ? "0 0 12px rgba(37, 99, 235, 0.6)" : "none",
    border: pathname === path ? "1px solid #60A5FA" : "1px solid transparent",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    fontSize: "14px",
  });

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
    <nav
      style={{
        backgroundColor: "#111827",
        color: "white",
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "24px",
        borderBottom: "3px solid #2563EB",
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: "180px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: "bold",
          }}
        >
          ShiftStack
        </h1>

        <p
          style={{
            margin: 0,
            color: "#9CA3AF",
            fontSize: "14px",
          }}
        >
          {employee?.first_name || "User"} | {employee?.role || "role"}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "flex-start",
          flexWrap: "wrap",
          justifyContent: "flex-end",
          flex: 1,
        }}
      >
        <NavGroup title="Home">
          {employeeLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={getLinkStyle(link.href)}
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
                style={getLinkStyle(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </NavGroup>
        )}

        {isAdmin && (
          <NavGroup title="Admin">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={getLinkStyle(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </NavGroup>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            alignItems: "flex-end",
          }}
        >
          <span style={{ color: "#9CA3AF", fontSize: "12px" }}>Session</span>

          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#DC2626",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <span
        style={{
          color: "#9CA3AF",
          fontSize: "12px",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </span>

      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {children}
      </div>
    </div>
  );
}
