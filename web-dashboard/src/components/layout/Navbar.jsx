"use client";

import { useContext } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { employee, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold">ShiftStack Dashboard</h1>
        <p className="text-sm text-gray-500">
          {employee?.first_name} {employee?.last_name} | {employee?.role}
        </p>
      </div>

      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </header>
  );
}
