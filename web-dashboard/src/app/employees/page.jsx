"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../api/api";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);

  const loadEmployees = async () => {
    try {
      const response = await api.get("/admin/employees");
      setEmployees(response.data);
    } catch (err) {
      console.error("Error loading employees:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEmployees();
  }, []);

  return (
    <>
      <Navbar />
      <main className="p-8">
        <h2 className="text-3xl font-bold mb-4">Employees</h2>

        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">First Name</th>
                <th className="border p-3 text-left">Last Name</th>
                <th className="border p-3 text-left">Email</th>
                <th className="border p-3 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="border p-3">{emp.id}</td>
                  <td className="border p-3">{emp.first_name}</td>
                  <td className="border p-3">{emp.last_name}</td>
                  <td className="border p-3">{emp.email}</td>
                  <td className="border p-3">{emp.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
