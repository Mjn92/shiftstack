"use client";

import Link from "next/link";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Sidebar() {
  const { employee } = useContext(AuthContext);

  const role = employee?.role;

  const employeeLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Clock", href: "/clock" },
    { label: "Time History", href: "/time-history" },
    { label: "Profile", href: "/profile" },
  ];

  const managerLinks = [
    ...employeeLinks,
    { label: "Team", href: "/team" },
    { label: "Team Time Entries", href: "/team-time-entries" },
    { label: "Reports", href: "/reports" },
  ];

  const adminLinks = [
    ...employeeLinks,
    { label: "Users", href: "/users" },
    { label: "Reports", href: "/reports" },
    { label: "Audit Logs", href: "/audit-logs" },
    { label: "System Health", href: "/system-health" },
    { label: "Maintenance", href: "/maintenance" },
  ];

  const links =
    role === "admin"
      ? adminLinks
      : role === "manager"
        ? managerLinks
        : employeeLinks;

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-xl font-bold mb-6">ShiftStack</h2>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded px-3 py-2 hover:bg-gray-700"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
