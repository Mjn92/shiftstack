"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../api/api";

export default function TimeEntriesPage() {
  const [entries, setEntries] = useState([]);

  const loadEntries = async () => {
    try {
      const response = await api.get("/admin/time-entries");
      setEntries(response.data);
    } catch (err) {
      console.error("Error loading time entries:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries();
  }, []);

  return (
    <>
      <Navbar />
      <main className="p-8">
        <h2 className="text-3xl font-bold mb-4">Time Entries</h2>

        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Employee ID</th>
                <th className="border p-3 text-left">Clock In</th>
                <th className="border p-3 text-left">Clock Out</th>
                <th className="border p-3 text-left">Total Minutes</th>
                <th className="border p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="border p-3">{entry.id}</td>
                  <td className="border p-3">{entry.employee_id}</td>
                  <td className="border p-3">
                    {new Date(entry.clock_in).toLocaleString()}
                  </td>
                  <td className="border p-3">
                    {entry.clock_out
                      ? new Date(entry.clock_out).toLocaleString()
                      : "Open"}
                  </td>
                  <td className="border p-3">{entry.total_minutes || "-"}</td>
                  <td className="border p-3">{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
