"use client";

import Link from "next/link";
import { useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { employee, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav
      style={{
        backgroundColor: "#111827",
        color: "white",
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "3px solid #2563eb",
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
            color: "#9ca3af",
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
        <Link
          href="/dashboard"
          style={{
            backgroundColor: "#1f2937",
            color: "white",
            padding: "10px 16px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Dashboard
        </Link>

        <Link
          href="/employees"
          style={{
            backgroundColor: "#1f2937",
            color: "white",
            padding: "10px 16px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Employees
        </Link>

        <Link
          href="/time-entries"
          style={{
            backgroundColor: "#1f2937",
            color: "white",
            padding: "10px 16px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Time Entries
        </Link>

        <Link
          href="/audit-logs"
          style={{
            backgroundColor: "#1f2937",
            color: "white",
            padding: "10px 16px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Audit Logs
        </Link>

        <Link
          href="/reports"
          style={{
            backgroundColor: "#1f2937",
            color: "white",
            padding: "10px 16px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Reports
        </Link>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#dc2626",
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
