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
    <nav className="bg-black text-white px-6 py-4 flex justify-between items-center">
      <div>
        <h1 className="font-bold text-xl">ShiftStack</h1>
        <p className="text-sm text-gray-300">
          {employee?.first_name} | {employee?.role}
        </p>
      </div>

      <div className="flex gap-4 items-center">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/employees">Employees</Link>
        <Link href="/time-entries">Time Entries</Link>
        <button onClick={handleLogout} className="bg-red-600 px-3 py-2 rounded">
          Logout
        </button>
      </div>
    </nav>
  );
}
