"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../api/api";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get("/admin/employees");
        setEmployees(response.data);
      } catch (err) {
        console.error("Error loading employees:", err);
        alert("Failed to load employees.");
      }
    };

    fetchEmployees();
  }, []);

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Employees</h1>
          <p style={styles.pageSubtitle}>
            View employee records, roles, and account information.
          </p>
        </div>

        <section style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.headerCell}>ID</th>
                <th style={styles.headerCell}>First Name</th>
                <th style={styles.headerCell}>Last Name</th>
                <th style={styles.headerCell}>Email</th>
                <th style={styles.headerCell}>Role</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((emp, index) => (
                <tr
                  key={emp.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F8FBFF",
                  }}
                >
                  <td style={styles.cell}>{emp.id}</td>
                  <td style={styles.cell}>{emp.first_name}</td>
                  <td style={styles.cell}>{emp.last_name}</td>
                  <td style={styles.cell}>{emp.email}</td>
                  <td style={styles.cell}>
                    <span
                      style={{
                        ...styles.roleBadge,
                        backgroundColor:
                          emp.role === "admin"
                            ? "#DC2626"
                            : emp.role === "manager"
                              ? "#2563EB"
                              : "#16A34A",
                      }}
                    >
                      {emp.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {employees.length === 0 && (
            <div style={styles.emptyState}>No employees found.</div>
          )}
        </section>
      </main>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#EAF3FF",
    padding: "32px",
  },

  pageHeader: {
    marginBottom: "24px",
  },

  pageTitle: {
    color: "#0A4DA2",
    fontSize: "36px",
    fontWeight: "bold",
    marginBottom: "8px",
  },

  pageSubtitle: {
    color: "#6B7280",
    fontSize: "16px",
  },

  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  tableHeaderRow: {
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
  },

  headerCell: {
    padding: "16px",
    textAlign: "left",
    fontWeight: "bold",
  },

  cell: {
    padding: "16px",
    borderBottom: "1px solid #E5E7EB",
    color: "#111827",
  },

  roleBadge: {
    color: "#FFFFFF",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  emptyState: {
    padding: "40px",
    textAlign: "center",
    color: "#6B7280",
  },
};
