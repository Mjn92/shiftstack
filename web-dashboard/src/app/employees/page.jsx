"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/app-shell/AppShell";
import PageHeader from "../../components/app-shell/PageHeader";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import {
  activateEmployee,
  createEmployee,
  deactivateEmployee,
  getEmployees,
  updateEmployee,
} from "../../api/employeeApi";
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
  const [formErrors, setFormErrors] = useState({});

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

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
    setFormErrors({});
    setFormOpen(false);
  };

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getEmployees();
      setEmployees(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }, []);

  const openCreateForm = () => {
    setError("");
    setMessage("");
    setFormErrors({});
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
    if (!canEditRole(emp.role)) {
      setError("You do not have permission to edit this account.");
      return;
    }

    setError("");
    setMessage("");
    setFormErrors({});
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

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const errors = {};

    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const department = form.department.trim();

    if (!firstName) {
      errors.first_name = "First name is required.";
    } else if (firstName.length > 50) {
      errors.first_name = "First name must be 50 characters or fewer.";
    }

    if (!lastName) {
      errors.last_name = "Last name is required.";
    } else if (lastName.length > 50) {
      errors.last_name = "Last name must be 50 characters or fewer.";
    }

    if (!email) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }

    if (phone && !/^[0-9()+\-\s.]{7,25}$/.test(phone)) {
      errors.phone = "Enter a valid phone number.";
    }

    if (department.length > 80) {
      errors.department = "Department must be 80 characters or fewer.";
    }

    if (!editingEmployee) {
      const password = form.password;

      if (!password) {
        errors.password = "Temporary password is required.";
      } else {
        const passwordRules = [
          password.length >= 12,
          /[A-Z]/.test(password),
          /[a-z]/.test(password),
          /\d/.test(password),
          /[^A-Za-z0-9]/.test(password),
        ];

        if (!passwordRules.every(Boolean)) {
          errors.password =
            "Use at least 12 characters with uppercase, lowercase, number, and special character.";
        }
      }
    }

    if (!allowedRoleOptions().includes(form.role)) {
      errors.role = "You do not have permission to assign this role.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      phone: form.phone.trim(),
      department: form.department.trim(),
    };

    if (!editingEmployee) {
      payload.password = form.password;
    }

    try {
      if (editingEmployee) {
        if (!canEditRole(editingEmployee.role)) {
          setError("You do not have permission to edit this account.");
          return;
        }

        await updateEmployee(editingEmployee.id, payload);
        setMessage("Employee updated successfully.");
      } else {
        await createEmployee(payload);
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

    if (!canEditRole(emp.role)) {
      setError("You do not have permission to deactivate this account.");
      return;
    }

    const confirmed = window.confirm(
      `Deactivate ${emp.first_name} ${emp.last_name}?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await deactivateEmployee(emp.id);
      setMessage("Employee deactivated successfully.");
      await loadEmployees();
    } catch (err) {
      setError(err.response?.data?.error || "Deactivate failed.");
    }
  };

  const handleActivate = async (emp) => {
    if (emp.id === currentUser?.id) {
      setError("You cannot change your own account status here.");
      return;
    }

    if (!canEditRole(emp.role)) {
      setError("You do not have permission to activate this account.");
      return;
    }

    try {
      setError("");
      setMessage("");

      await activateEmployee(emp.id);
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

  // Managers can see employees and managers, but admin accounts remain
  // outside the manager directory. The backend must enforce the same rule.
  const visibleEmployees =
    currentUser?.role === "manager"
      ? employees.filter((emp) => emp.role !== "admin")
      : employees;

  const departments = [
    ...new Set(
      visibleEmployees.map((emp) => emp.department?.trim()).filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const filteredEmployees = visibleEmployees.filter((emp) => {
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

    const matchesDepartment =
      departmentFilter === "all" || emp.department === departmentFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const stats = {
    employees: visibleEmployees.filter((emp) => emp.role === "employee").length,
    managers: visibleEmployees.filter((emp) => emp.role === "manager").length,
    admins: visibleEmployees.filter((emp) => emp.role === "admin").length,
    active: visibleEmployees.filter((emp) => isActive(emp.active)).length,
    inactive: visibleEmployees.filter((emp) => !isActive(emp.active)).length,
    departments,
  };

  const getRoleColor = (role) => {
    if (role === "admin") return "#DC2626";
    if (role === "manager") return "#D97706";
    return "#2563EB";
  };

  if (authLoading) {
    return (
      <main style={styles.permissionPage}>
        <div style={styles.permissionCard}>
          <LoadingState message="Checking permissions..." />
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
          title="Employee Management"
          description="Manage employee accounts, roles, departments, and account access."
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
          {currentUser.role === "admin" ? (
            <>
              <StatCard label="Employees" value={stats.employees} />
              <StatCard label="Managers" value={stats.managers} />
              <StatCard label="Admins" value={stats.admins} />
              <StatCard label="Active" value={stats.active} />
              <StatCard label="Inactive" value={stats.inactive} />
            </>
          ) : (
            <>
              <StatCard label="Total Staff" value={visibleEmployees.length} />
              <StatCard label="Employees" value={stats.employees} />
              <StatCard label="Active" value={stats.active} />
              <StatCard label="Inactive" value={stats.inactive} />
              <StatCard label="Departments" value={stats.departments.length} />
            </>
          )}
        </section>

        {message && (
          <div style={styles.successMessage} role="status" aria-live="polite">
            {message}
          </div>
        )}

        {error && (
          <div style={styles.messageWrapper}>
            <ErrorState
              message={error}
              onRetry={loading ? undefined : loadEmployees}
            />
          </div>
        )}

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            style={styles.formCard}
            aria-busy={saving}
          >
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

            <div style={styles.formSection}>
              <div style={styles.formSectionHeader}>
                <p style={styles.formSectionEyebrow}>Employee Information</p>
                <h3 style={styles.formSectionTitle}>
                  Personal and contact details
                </h3>
              </div>

              <div style={styles.formGrid}>
                <FormField
                  label="First name"
                  htmlFor="first_name"
                  error={formErrors.first_name}
                >
                  <input
                    id="first_name"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="First name"
                    style={{
                      ...styles.input,
                      ...(formErrors.first_name ? styles.inputError : {}),
                    }}
                    aria-invalid={Boolean(formErrors.first_name)}
                    required
                  />
                </FormField>

                <FormField
                  label="Last name"
                  htmlFor="last_name"
                  error={formErrors.last_name}
                >
                  <input
                    id="last_name"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="Last name"
                    style={{
                      ...styles.input,
                      ...(formErrors.last_name ? styles.inputError : {}),
                    }}
                    aria-invalid={Boolean(formErrors.last_name)}
                    required
                  />
                </FormField>

                <FormField
                  label="Email"
                  htmlFor="email"
                  error={formErrors.email}
                >
                  <input
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="employee@example.com"
                    type="email"
                    style={{
                      ...styles.input,
                      ...(formErrors.email ? styles.inputError : {}),
                    }}
                    aria-invalid={Boolean(formErrors.email)}
                    required
                  />
                </FormField>

                <FormField
                  label="Phone"
                  htmlFor="phone"
                  error={formErrors.phone}
                >
                  <input
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="Phone number"
                    type="tel"
                    style={{
                      ...styles.input,
                      ...(formErrors.phone ? styles.inputError : {}),
                    }}
                    aria-invalid={Boolean(formErrors.phone)}
                  />
                </FormField>

                <FormField
                  label="Department"
                  htmlFor="department"
                  error={formErrors.department}
                >
                  <input
                    id="department"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="Department"
                    style={{
                      ...styles.input,
                      ...(formErrors.department ? styles.inputError : {}),
                    }}
                    aria-invalid={Boolean(formErrors.department)}
                  />
                </FormField>
              </div>
            </div>

            <div style={styles.formSection}>
              <div style={styles.formSectionHeader}>
                <p style={styles.formSectionEyebrow}>Access & Permissions</p>
                <h3 style={styles.formSectionTitle}>
                  Account role and security
                </h3>
              </div>

              <div style={styles.formGrid}>
                <FormField label="Role" htmlFor="role" error={formErrors.role}>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    disabled={saving}
                    style={{
                      ...styles.input,
                      ...(formErrors.role ? styles.inputError : {}),
                    }}
                    aria-invalid={Boolean(formErrors.role)}
                  >
                    {allowedRoleOptions().map((role) => (
                      <option key={role} value={role}>
                        {formatRole(role)}
                      </option>
                    ))}
                  </select>
                </FormField>

                {!editingEmployee && (
                  <FormField
                    label="Temporary password"
                    htmlFor="password"
                    error={formErrors.password}
                  >
                    <input
                      id="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      disabled={saving}
                      placeholder="Temporary password"
                      type="password"
                      style={{
                        ...styles.input,
                        ...(formErrors.password ? styles.inputError : {}),
                      }}
                      aria-invalid={Boolean(formErrors.password)}
                      required
                    />

                    <span style={styles.passwordHint}>
                      12+ characters with uppercase, lowercase, number, and
                      special character.
                    </span>
                  </FormField>
                )}
              </div>

              {editingEmployee && (
                <p style={styles.securityNote}>
                  Role changes affect account permissions immediately. Managers
                  may only manage employee accounts; administrators can manage
                  all account roles.
                </p>
              )}
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
                Showing {filteredEmployees.length} of {visibleEmployees.length}{" "}
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
                <option value="all">
                  {currentUser.role === "manager" ? "All Staff" : "All Roles"}
                </option>
                <option value="employee">Employees</option>
                <option value="manager">Managers</option>
                {currentUser.role === "admin" && (
                  <option value="admin">Admins</option>
                )}
              </select>

              <select
                aria-label="Filter employees by department"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
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
            <LoadingState message="Loading employees..." />
          ) : employees.length === 0 ? (
            <div style={styles.emptyStateWrapper}>
              <EmptyState
                title="No employee accounts yet"
                description="Create the first employee account to begin building the workforce directory."
                action={
                  <button
                    type="button"
                    onClick={openCreateForm}
                    style={styles.primaryButton}
                  >
                    Add Employee
                  </button>
                }
              />
            </div>
          ) : (
            <>
              <div
                className="employees-desktop-table"
                style={styles.tableWrapper}
              >
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
                          No employees match the current filters. Adjust the
                          search or filters and try again.
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
                                      onClick={() => handleActivate(emp)}
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

              <div className="employees-mobile-list" style={styles.mobileList}>
                {filteredEmployees.length === 0 ? (
                  <EmptyState
                    title="No matching employees"
                    description="Adjust the search or filters and try again."
                  />
                ) : (
                  filteredEmployees.map((emp) => (
                    <article key={`mobile-${emp.id}`} style={styles.mobileCard}>
                      <div style={styles.mobileCardHeader}>
                        <div style={styles.employeeIdentity}>
                          <span style={styles.mobileAvatar}>
                            {getInitials(emp)}
                          </span>

                          <div>
                            <h3 style={styles.mobileName}>
                              {emp.first_name} {emp.last_name}
                            </h3>
                            <p style={styles.mobileEmail}>{emp.email}</p>
                          </div>
                        </div>

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
                      </div>

                      <div style={styles.mobileMetaGrid}>
                        <MobileDetail
                          label="Role"
                          value={formatRole(emp.role)}
                        />
                        <MobileDetail
                          label="Department"
                          value={emp.department || "—"}
                        />
                        <MobileDetail label="Phone" value={emp.phone || "—"} />
                      </div>

                      <div style={styles.mobileActions}>
                        {emp.id === currentUser?.id ? (
                          <span style={styles.currentUserLabel}>
                            Current User
                          </span>
                        ) : (
                          <>
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
                                  onClick={() => handleActivate(emp)}
                                  style={styles.activateButton}
                                >
                                  Activate
                                </button>
                              ))}
                          </>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          )}
        </section>

        <style jsx>{`
          .employees-mobile-list {
            display: none !important;
          }

          @media (max-width: 820px) {
            .employees-desktop-table {
              display: none !important;
            }

            .employees-mobile-list {
              display: grid !important;
            }
          }
        `}</style>
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

function FormField({ label, htmlFor, children, error }) {
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <label htmlFor={htmlFor} style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>

      {children}

      {error && (
        <span id={errorId} style={styles.fieldError} role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

function MobileDetail({ label, value }) {
  return (
    <div style={styles.mobileDetail}>
      <span style={styles.mobileDetailLabel}>{label}</span>
      <strong style={styles.mobileDetailValue}>{value}</strong>
    </div>
  );
}

function formatRole(role) {
  if (!role) return "Unknown";

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

  messageWrapper: {
    marginBottom: "16px",
  },

  emptyStateWrapper: {
    padding: "20px",
  },

  successMessage: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    border: "1px solid #BBF7D0",
    padding: "14px",
    borderRadius: "12px",
    marginBottom: "16px",
  },

  formSection: {
    padding: "20px",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    marginBottom: "18px",
    backgroundColor: "#FBFDFF",
  },

  formSectionHeader: {
    marginBottom: "16px",
  },

  formSectionEyebrow: {
    color: "#2563EB",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: "0 0 4px",
  },

  formSectionTitle: {
    color: "#172033",
    fontSize: "18px",
    margin: 0,
  },

  inputError: {
    borderColor: "#DC2626",
    boxShadow: "0 0 0 1px #DC2626",
  },

  fieldError: {
    color: "#B91C1C",
    fontSize: "12px",
    fontWeight: "600",
  },

  passwordHint: {
    color: "#64748B",
    fontSize: "12px",
    fontWeight: "normal",
    lineHeight: 1.5,
  },

  securityNote: {
    margin: "14px 0 0",
    padding: "12px 14px",
    border: "1px solid #BFDBFE",
    borderRadius: "10px",
    backgroundColor: "#EFF6FF",
    color: "#1E3A8A",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  mobileList: {
    display: "grid",
    gap: "14px",
    padding: "16px",
  },

  mobileCard: {
    padding: "18px",
    border: "1px solid #DCEBFF",
    borderRadius: "16px",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.05)",
  },

  mobileCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    paddingBottom: "14px",
    borderBottom: "1px solid #E2E8F0",
  },

  mobileAvatar: {
    display: "grid",
    placeItems: "center",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    fontSize: "13px",
    fontWeight: "bold",
    flex: "0 0 auto",
  },

  mobileName: {
    margin: 0,
    color: "#172033",
    fontSize: "16px",
  },

  mobileEmail: {
    margin: "4px 0 0",
    color: "#64748B",
    fontSize: "12px",
    overflowWrap: "anywhere",
  },

  mobileMetaGrid: {
    display: "grid",
    gap: "10px",
    padding: "14px 0",
  },

  mobileDetail: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
  },

  mobileDetailLabel: {
    color: "#64748B",
    fontSize: "13px",
  },

  mobileDetailValue: {
    color: "#172033",
    fontSize: "13px",
    textAlign: "right",
  },

  mobileActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    paddingTop: "4px",
  },

  emptyState: {
    padding: "40px",
    textAlign: "center",
    color: "#64748B",
  },
};
