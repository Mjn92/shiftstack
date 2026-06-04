"use client";

import Link from "next/link";
import { useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { employee, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getLinkStyle = (path) => ({
    backgroundColor: pathname === path ? "#2563EB" : "#1F2937",
    color: "white",
    padding: "10px 16px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: pathname === path ? "bold" : "normal",
    boxShadow: pathname === path ? "0 0 12px rgba(37, 99, 235, 0.6)" : "none",
    border: pathname === path ? "1px solid #60A5FA" : "1px solid transparent",
    transition: "all 0.2s ease",
  });

  return (
    <nav
      style={{
        backgroundColor: "#111827",
        color: "white",
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "3px solid #2563EB",
      }}
    >
      <div>
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
          }}
        >
          {employee?.first_name} | {employee?.role}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <Link href="/dashboard" style={getLinkStyle("/dashboard")}>
          Dashboard
        </Link>

        <Link href="/employees" style={getLinkStyle("/employees")}>
          Employees
        </Link>

        <Link href="/time-entries" style={getLinkStyle("/time-entries")}>
          Time Entries
        </Link>

        <Link href="/audit-logs" style={getLinkStyle("/audit-logs")}>
          Audit Logs
        </Link>

        <Link href="/reports" style={getLinkStyle("/reports")}>
          Reports
        </Link>

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
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
