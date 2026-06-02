"use client";

import Navbar from "../../components/Navbar.jsx";

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <main className="p-8">
        <h2 className="text-3xl font-bold mb-4">Admin Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Employees</h3>
            <p className="text-gray-600">View and manage employee records.</p>
          </div>

          <div className="border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Time Entries</h3>
            <p className="text-gray-600">Review clock-in and clock-out logs.</p>
          </div>

          <div className="border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Reports</h3>
            <p className="text-gray-600">
              Weekly summaries and payroll exports.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
