"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../api/api";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadReports = async () => {
    try {
      let url = "/reports/weekly";

      const params = [];

      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);

      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }

      const response = await api.get(url);
      setReports(response.data);
    } catch (err) {
      console.error("Error loading reports:", err);
    }
  };

  const exportCsv = () => {
    let url = "http://localhost:5000/api/reports/weekly/export";

    const params = [];

    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);

    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    const token = localStorage.getItem("token");

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const fileUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = "weekly_report.csv";
        a.click();
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReports();
  }, []);

  return (
    <>
      <Navbar />
      <main className="p-8">
        <h2 className="text-3xl font-bold mb-4">Weekly Reports</h2>

        <div className="flex gap-4 mb-6">
          <input
            type="date"
            className="border p-3 rounded"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <input
            type="date"
            className="border p-3 rounded"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <button
            onClick={loadReports}
            className="bg-black text-white px-4 rounded"
          >
            Filter
          </button>

          <button
            onClick={exportCsv}
            className="bg-green-700 text-white px-4 rounded"
          >
            Export CSV
          </button>
        </div>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3 text-left">Employee</th>
              <th className="border p-3 text-left">Email</th>
              <th className="border p-3 text-left">Shifts</th>
              <th className="border p-3 text-left">Minutes</th>
              <th className="border p-3 text-left">Hours</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((row) => (
              <tr key={row.employee_id}>
                <td className="border p-3">
                  {row.first_name} {row.last_name}
                </td>
                <td className="border p-3">{row.email}</td>
                <td className="border p-3">{row.total_shifts}</td>
                <td className="border p-3">{row.total_minutes}</td>
                <td className="border p-3">{row.total_hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
}
