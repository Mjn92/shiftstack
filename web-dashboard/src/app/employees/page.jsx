"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import { canAccessManagement } from "../../utils/roleAccess";

export default function EmployeesPage() {
  const router = useRouter();
  const { employee: currentUser, loading: authLoading } =
    useContext(AuthContext);

  const hasAccess = canAccessManagement(currentUser?.role);

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
    if (currentUser?.role === "admin") {
      return ["employee", "manager", "admin"];
    }

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

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/employees");
      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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

    const confirmed = window.confirm(
      `Deactivate ${emp.first_name} ${emp.last_name}?`,
    );

    if (!confirmed) return;

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
    if (!authLoading && !currentUser) {
      router.replace("/login");
      return;
    }

    if (!authLoading && currentUser && !hasAccess) {
      router.replace("/dashboard");
    }
  }, [authLoading, currentUser, hasAccess, router]);

  useEffect(() => {
    if (!authLoading && currentUser && hasAccess) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadEmployees();
    }
  }, [authLoading, currentUser, hasAccess, loadEmployees]);

  const isActive = (value) => {
    return (
      value === true || value === "true" || value === "TRUE" || value === 1
    );
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filteredEmployees = employees.filter((emp) => {
    const searchText = [
      emp.first_name,
      emp.last_name,
      emp.email,
      emp.department,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      normalizedSearch === "" || searchText.includes(normalizedSearch);

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

  if (authLoading) {
    return (
      <main style={styles.permissionPage}>
        <div style={styles.permissionCard} role="status" aria-live="polite">
          Checking permissions...
        </div>
      </main>
    );
  }

  if (!currentUser || !hasAccess) {
    return null;
  }

  return (
    <AppShell>
      <div style={styles.page}>
        <PageHeader
          eyebrow="Management"
          title="User Management"
          description="Add, edit, activate, and deactivate employee accounts."
          actions={
            <button
              type="button"
              onClick={openCreateForm}
              style={styles.primaryButton}
            >
              Add Employee
            </button>
          }
        />

        <section style={styles.statsGrid} aria-label="Employee account totals">
          <StatCard label="Employees" value={stats.employees} />
          <StatCard label="Managers" value={stats.managers} />
          <StatCard label="Admins" value={stats.admins} />
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Inactive" value={stats.inactive} />
        </section>

        {message && (
          <div style={styles.successMessage} role="status" aria-live="polite">
            {message}
          </div>
        )}

        {error && (
          <div style={styles.errorMessage} role="alert">
            {error}
          </div>
        )}

        {formOpen && (
          <form onSubmit={handleSubmit} style={styles.formCard}>
            <div style={styles.formHeader}>
              <div>
                <p style={styles.formEyebrow}>
                  {editingEmployee ? "Update account" : "New account"}
                </p>

                <h2 style={styles.formTitle}>
                  {editingEmployee ? "Edit Employee" : "Add Employee"}
                </h2>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                style={styles.closeButton}
                aria-label="Close employee form"
              >
                ×
              </button>
            </div>

            <div style={styles.formGrid}>
              <FormField label="First name" htmlFor="first_name">
                <input
                  id="first_name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  style={styles.input}
                  required
                />
              </FormField>

              <FormField label="Last name" htmlFor="last_name">
                <input
                  id="last_name"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  style={styles.input}
                  required
                />
              </FormField>

              <FormField label="Email" htmlFor="email">
                <input
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="employee@example.com"
                  type="email"
                  style={styles.input}
                  required
                />
              </FormField>

              {!editingEmployee && (
                <FormField label="Temporary password" htmlFor="password">
                  <input
                    id="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Temporary password"
                    type="password"
                    style={styles.input}
                    required
                  />
                </FormField>
              )}

              <FormField label="Role" htmlFor="role">
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  style={styles.input}
                >
                  {allowedRoleOptions().map((role) => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Phone" htmlFor="phone">
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                  type="tel"
                  style={styles.input}
                />
              </FormField>

              <FormField label="Department" htmlFor="department">
                <input
                  id="department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="Department"
                  style={styles.input}
                />
              </FormField>
            </div>

            <div style={styles.formActions}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...styles.primaryButton,
                  ...(saving ? styles.disabledButton : {}),
                }}
              >
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

        <section
          style={styles.tableCard}
          aria-labelledby="employee-table-title"
        >
          <div style={styles.tableToolbar}>
            <div>
              <p style={styles.tableEyebrow}>Directory</p>
              <h2 id="employee-table-title" style={styles.tableTitle}>
                Employee Accounts
              </h2>
              <p style={styles.tableSubtitle}>
                Showing {filteredEmployees.length} of {employees.length}{" "}
                accounts.
              </p>
            </div>

            <div style={styles.filters}>
              <input
                type="search"
                aria-label="Search employees"
                placeholder="Search name, email, or department"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={styles.searchInput}
              />

              <select
                aria-label="Filter employees by role"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Roles</option>
                <option value="employee">Employees</option>
                <option value="manager">Managers</option>
                <option value="admin">Admins</option>
              </select>

              <select
                aria-label="Filter employees by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingState} role="status" aria-live="polite">
              Loading employees...
            </div>
          ) : (
            <div style={styles.tableWrapper}>
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
                      <td style={styles.emptyState} colSpan={7}>
                        No employees match the current filters.
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
                          <div style={styles.employeeIdentity}>
                            <span style={styles.employeeAvatar}>
                              {getInitials(emp)}
                            </span>

                            <span style={styles.employeeName}>
                              {emp.first_name} {emp.last_name}
                            </span>
                          </div>
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

                        <td style={styles.cell}>{emp.department || "—"}</td>
                        <td style={styles.cell}>{emp.phone || "—"}</td>

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
                                  type="button"
                                  onClick={() => openEditForm(emp)}
                                  style={styles.editButton}
                                >
                                  Edit
                                </button>
                              )}

                              {canEditRole(emp.role) &&
                                (isActive(emp.active) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeactivate(emp)}
                                    style={styles.deactivateButton}
                                  >
                                    Deactivate
                                  </button>
                                ) : (
                                  <button
                                    type="button"
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
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }) {
  return (
    <article style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
    </article>
  );
}

function FormField({ label, htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function formatRole(role) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getInitials(employee) {
  const first = employee.first_name?.charAt(0) || "";
  const last = employee.last_name?.charAt(0) || "";

  return `${first}${last}`.toUpperCase() || "SS";
}

const styles = {
  permissionPage: {
    minHeight: "100vh",
    backgroundColor: "#F4F7FB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
  },

  permissionCard: {
    backgroundColor: "#FFFFFF",
    color: "#0A4DA2",
    border: "1px solid #DCEBFF",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    padding: "24px",
    fontWeight: "bold",
    textAlign: "center",
  },

  page: {
    width: "100%",
    maxWidth: "1440px",
    margin: "0 auto",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #DCEBFF",
  },

  statLabel: {
    color: "#64748B",
    fontSize: "14px",
    margin: "0 0 8px",
  },

  statValue: {
    color: "#0A4DA2",
    fontSize: "32px",
    fontWeight: "bold",
    margin: 0,
  },

  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #DCEBFF",
  },

  tableToolbar: {
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    borderBottom: "1px solid #E5E7EB",
    flexWrap: "wrap",
  },

  tableEyebrow: {
    color: "#2563EB",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: "0 0 4px",
  },

  tableTitle: {
    color: "#172033",
    fontSize: "22px",
    margin: 0,
  },

  tableSubtitle: {
    color: "#64748B",
    fontSize: "14px",
    margin: "6px 0 0",
  },

  filters: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  searchInput: {
    width: "min(100%, 330px)",
    minWidth: "240px",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    font: "inherit",
  },

  filterSelect: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    font: "inherit",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "980px",
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
    whiteSpace: "nowrap",
  },

  cell: {
    padding: "16px",
    borderBottom: "1px solid #E5E7EB",
    color: "#111827",
    verticalAlign: "middle",
  },

  employeeIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  employeeAvatar: {
    display: "grid",
    placeItems: "center",
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    fontSize: "12px",
    fontWeight: "bold",
    flex: "0 0 auto",
  },

  employeeName: {
    fontWeight: "bold",
    whiteSpace: "nowrap",
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
    minHeight: "44px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  secondaryButton: {
    backgroundColor: "#E5E7EB",
    color: "#111827",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    minHeight: "44px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  disabledButton: {
    cursor: "not-allowed",
    opacity: 0.65,
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
    flexWrap: "wrap",
  },

  currentUserLabel: {
    color: "#64748B",
    fontWeight: "bold",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
    border: "1px solid #DCEBFF",
    marginBottom: "24px",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
  },

  formEyebrow: {
    color: "#2563EB",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: "0 0 4px",
  },

  formTitle: {
    color: "#172033",
    fontSize: "24px",
    fontWeight: "bold",
    margin: 0,
  },

  closeButton: {
    width: "42px",
    height: "42px",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    color: "#475569",
    cursor: "pointer",
    fontSize: "24px",
    lineHeight: 1,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },

  field: {
    display: "grid",
    gap: "7px",
    color: "#334155",
    fontWeight: "bold",
  },

  fieldLabel: {
    fontSize: "14px",
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    font: "inherit",
    fontWeight: "normal",
  },

  formActions: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
    flexWrap: "wrap",
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
    color: "#64748B",
  },

  emptyState: {
    padding: "40px",
    textAlign: "center",
    color: "#64748B",
  },
};
