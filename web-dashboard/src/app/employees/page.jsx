"use client";

import { useContext, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";

export default function EmployeesPage() {
  const { employee: currentUser } = useContext(AuthContext);

  const [employees, setEmployees] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "employee",
    phone: "",
    department: "",
  });

  const canEditRole = (targetRole) => {
    if (currentUser?.role === "admin") return true;
    if (currentUser?.role === "manager") return targetRole === "employee";
    return false;
  };

  const allowedRoleOptions = () => {
    if (currentUser?.role === "admin") return ["employee", "manager", "admin"];
    return ["employee"];
  };

  const resetForm = () => {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role: "employee",
      phone: "",
      department: "",
    });
    setEditingEmployee(null);
    setFormOpen(false);
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/employees");
      console.log("Employees from API:", response.data);
      setEmployees(response.data);
    } catch {
      setError("Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setError("");
    setMessage("");
    setEditingEmployee(null);
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role: "employee",
      phone: "",
      department: "",
    });
    setFormOpen(true);
  };

  const openEditForm = (emp) => {
    setError("");
    setMessage("");
    setEditingEmployee(emp);
    setForm({
      first_name: emp.first_name || "",
      last_name: emp.last_name || "",
      email: emp.email || "",
      password: "",
      role: emp.role || "employee",
      phone: emp.phone || "",
      department: emp.department || "",
    });
    setFormOpen(true);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      if (editingEmployee) {
        const payload = { ...form };
        delete payload.password;
        await api.put(`/admin/employees/${editingEmployee.id}`, payload);
        setMessage("Employee updated successfully.");
      } else {
        await api.post("/admin/employees", form);
        setMessage("Employee created successfully.");
      }

      resetForm();
      await loadEmployees();
    } catch (err) {
      setError(err.response?.data?.error || "Request failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (emp) => {
    if (emp.id === currentUser?.id) {
      setError("You cannot deactivate your own account.");
      return;
    }

    if (!confirm("Are you sure you want to deactivate this account?")) return;

    try {
      setError("");
      setMessage("");
      await api.patch(`/admin/employees/${emp.id}/deactivate`);
      setMessage("Employee deactivated successfully.");
      await loadEmployees();
    } catch (err) {
      setError(err.response?.data?.error || "Deactivate failed.");
    }
  };

  const handleActivate = async (id) => {
    try {
      setError("");
      setMessage("");
      await api.patch(`/admin/employees/${id}/activate`);
      setMessage("Employee activated successfully.");
      await loadEmployees();
    } catch (err) {
      setError(err.response?.data?.error || "Activate failed.");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEmployees();
  }, []);

  const isActive = (value) => {
    return (
      value === true || value === "true" || value === "TRUE" || value === 1
    );
  };

  const filteredEmployees = employees.filter((emp) => {
    const searchText = `${emp.first_name || ""} ${emp.last_name || ""} ${
      emp.email || ""
    } ${emp.department || ""}`.toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || emp.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isActive(emp.active)) ||
      (statusFilter === "inactive" && !isActive(emp.active));

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    employees: employees.filter((emp) => emp.role === "employee").length,
    managers: employees.filter((emp) => emp.role === "manager").length,
    admins: employees.filter((emp) => emp.role === "admin").length,
    active: employees.filter((emp) => isActive(emp.active)).length,
    inactive: employees.filter((emp) => !isActive(emp.active)).length,
  };

  const getRoleColor = (role) => {
    if (role === "admin") return "#DC2626";
    if (role === "manager") return "#D97706";
    return "#2563EB";
  };

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <div style={styles.pageHeader}>
          <div>
            <h1 style={styles.pageTitle}>User Management</h1>
            <p style={styles.pageSubtitle}>
              Add, edit, activate, and deactivate employee accounts.
            </p>
          </div>

          <button onClick={openCreateForm} style={styles.primaryButton}>
            Add Employee
          </button>
        </div>

        <section style={styles.statsGrid}>
          <StatCard label="Employees" value={stats.employees} />
          <StatCard label="Managers" value={stats.managers} />
          <StatCard label="Admins" value={stats.admins} />
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Inactive" value={stats.inactive} />
        </section>

        {message && <div style={styles.successMessage}>{message}</div>}
        {error && <div style={styles.errorMessage}>{error}</div>}

        {formOpen && (
          <form onSubmit={handleSubmit} style={styles.formCard}>
            <h2 style={styles.formTitle}>
              {editingEmployee ? "Edit Employee" : "Add Employee"}
            </h2>

            <div style={styles.formGrid}>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="First Name"
                style={styles.input}
                required
              />

              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Last Name"
                style={styles.input}
                required
              />

              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                type="email"
                style={styles.input}
                required
              />

              {!editingEmployee && (
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Temporary Password"
                  type="password"
                  style={styles.input}
                  required
                />
              )}

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                style={styles.input}
              >
                {allowedRoleOptions().map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone"
                style={styles.input}
              />

              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="Department"
                style={styles.input}
              />
            </div>

            <div style={styles.formActions}>
              <button disabled={saving} style={styles.primaryButton}>
                {saving
                  ? "Saving..."
                  : editingEmployee
                    ? "Save Changes"
                    : "Create Employee"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                style={styles.secondaryButton}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <section style={styles.tableCard}>
          <div style={styles.filters}>
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Roles</option>
              <option value="employee">Employees</option>
              <option value="manager">Managers</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {loading ? (
            <div style={styles.loadingState}>Loading employees...</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.headerCell}>Name</th>
                  <th style={styles.headerCell}>Email</th>
                  <th style={styles.headerCell}>Role</th>
                  <th style={styles.headerCell}>Department</th>
                  <th style={styles.headerCell}>Phone</th>
                  <th style={styles.headerCell}>Status</th>
                  <th style={styles.headerCell}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td style={styles.emptyState} colSpan="7">
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp, index) => (
                    <tr
                      key={emp.id}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#FFFFFF" : "#F8FBFF",
                      }}
                    >
                      <td style={styles.cell}>
                        {emp.first_name} {emp.last_name}
                      </td>

                      <td style={styles.cell}>{emp.email}</td>

                      <td style={styles.cell}>
                        <span
                          style={{
                            ...styles.roleBadge,
                            backgroundColor: getRoleColor(emp.role),
                          }}
                        >
                          {emp.role}
                        </span>
                      </td>

                      <td style={styles.cell}>{emp.department || "-"}</td>
                      <td style={styles.cell}>{emp.phone || "-"}</td>

                      <td style={styles.cell}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: isActive(emp.active)
                              ? "#16A34A"
                              : "#6B7280",
                          }}
                        >
                          {isActive(emp.active) ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td style={styles.cell}>
                        {emp.id === currentUser?.id ? (
                          <span style={styles.currentUserLabel}>
                            Current User
                          </span>
                        ) : (
                          <div style={styles.actionGroup}>
                            {canEditRole(emp.role) && (
                              <button
                                onClick={() => openEditForm(emp)}
                                style={styles.editButton}
                              >
                                Edit
                              </button>
                            )}

                            {canEditRole(emp.role) &&
                              (isActive(emp.active) ? (
                                <button
                                  onClick={() => handleDeactivate(emp)}
                                  style={styles.deactivateButton}
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivate(emp.id)}
                                  style={styles.activateButton}
                                >
                                  Activate
                                </button>
                              ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
    </div>
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
  },
  statLabel: {
    color: "#6B7280",
    fontSize: "14px",
    marginBottom: "8px",
  },
  statValue: {
    color: "#0A4DA2",
    fontSize: "32px",
    fontWeight: "bold",
  },
  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
  },
  filters: {
    padding: "20px",
    display: "flex",
    gap: "12px",
    borderBottom: "1px solid #E5E7EB",
    flexWrap: "wrap",
  },
  searchInput: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    minWidth: "320px",
  },
  filterSelect: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
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
    display: "inline-block",
  },
  statusBadge: {
    color: "#FFFFFF",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
    display: "inline-block",
  },
  primaryButton: {
    backgroundColor: "#0A4DA2",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryButton: {
    backgroundColor: "#E5E7EB",
    color: "#111827",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  editButton: {
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  deactivateButton: {
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  activateButton: {
    backgroundColor: "#16A34A",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  actionGroup: {
    display: "flex",
    gap: "8px",
  },
  currentUserLabel: {
    color: "#6B7280",
    fontWeight: "bold",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #DCEBFF",
    marginBottom: "24px",
  },
  formTitle: {
    color: "#0A4DA2",
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "16px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
  },
  formActions: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
  },
  successMessage: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    border: "1px solid #BBF7D0",
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "16px",
  },
  errorMessage: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    border: "1px solid #FECACA",
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "16px",
  },
  loadingState: {
    padding: "40px",
    textAlign: "center",
    color: "#6B7280",
  },
  emptyState: {
    padding: "40px",
    textAlign: "center",
    color: "#6B7280",
  },
};
