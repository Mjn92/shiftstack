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

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/employees");
      setEmployees(response.data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
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

  const filteredEmployees = employees.filter((emp) => {
    const searchText = `${emp.first_name || ""} ${emp.last_name || ""} ${
      emp.email || ""
    } ${emp.department || ""}`.toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || emp.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && emp.active) ||
      (statusFilter === "inactive" && !emp.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    employees: employees.filter((emp) => emp.role === "employee").length,
    managers: employees.filter((emp) => emp.role === "manager").length,
    admins: employees.filter((emp) => emp.role === "admin").length,
    active: employees.filter((emp) => emp.active).length,
    inactive: employees.filter((emp) => !emp.active).length,
  };

  const RoleBadge = ({ role }) => {
    const className =
      role === "admin"
        ? "bg-red-100 text-red-700 px-2 py-1 rounded font-semibold capitalize"
        : role === "manager"
          ? "bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-semibold capitalize"
          : "bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold capitalize";

    return <span className={className}>{role}</span>;
  };

  const StatusBadge = ({ active }) => {
    return active ? (
      <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
        Active
      </span>
    ) : (
      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded font-semibold">
        Inactive
      </span>
    );
  };

  return (
    <>
      <Navbar />

      <main className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">User Management</h2>
            <p className="text-gray-600">
              Add, edit, activate, and deactivate employee accounts.
            </p>
          </div>

          <button
            onClick={openCreateForm}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Add Employee
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="border rounded-xl p-4 bg-white">
            <p className="text-sm text-gray-500">Employees</p>
            <p className="text-2xl font-bold">{stats.employees}</p>
          </div>

          <div className="border rounded-xl p-4 bg-white">
            <p className="text-sm text-gray-500">Managers</p>
            <p className="text-2xl font-bold">{stats.managers}</p>
          </div>

          <div className="border rounded-xl p-4 bg-white">
            <p className="text-sm text-gray-500">Admins</p>
            <p className="text-2xl font-bold">{stats.admins}</p>
          </div>

          <div className="border rounded-xl p-4 bg-white">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold">{stats.active}</p>
          </div>

          <div className="border rounded-xl p-4 bg-white">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-2xl font-bold">{stats.inactive}</p>
          </div>
        </div>

        {message && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border rounded-xl p-6 mb-8 shadow-sm"
          >
            <h3 className="text-xl font-bold mb-4">
              {editingEmployee ? "Edit Employee" : "Add Employee"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="First Name"
                className="border p-3 rounded"
                required
              />

              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Last Name"
                className="border p-3 rounded"
                required
              />

              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                type="email"
                className="border p-3 rounded"
                required
              />

              {!editingEmployee && (
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Temporary Password"
                  type="password"
                  className="border p-3 rounded"
                  required
                />
              )}

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="border p-3 rounded"
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
                className="border p-3 rounded"
              />

              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="Department"
                className="border p-3 rounded"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                disabled={saving}
                className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
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
                className="bg-gray-300 text-black px-4 py-2 rounded disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-3 rounded w-full md:w-96"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border p-3 rounded"
          >
            <option value="all">All Roles</option>
            <option value="employee">Employees</option>
            <option value="manager">Managers</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border p-3 rounded"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="border rounded-xl p-6 bg-white">
            Loading employees...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-3 text-left">Name</th>
                  <th className="border p-3 text-left">Email</th>
                  <th className="border p-3 text-left">Role</th>
                  <th className="border p-3 text-left">Department</th>
                  <th className="border p-3 text-left">Phone</th>
                  <th className="border p-3 text-left">Status</th>
                  <th className="border p-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="border p-3">
                      {emp.first_name} {emp.last_name}
                    </td>

                    <td className="border p-3">{emp.email}</td>

                    <td className="border p-3">
                      <RoleBadge role={emp.role} />
                    </td>

                    <td className="border p-3">{emp.department || "-"}</td>

                    <td className="border p-3">{emp.phone || "-"}</td>

                    <td className="border p-3">
                      <StatusBadge active={emp.active} />
                    </td>

                    <td className="border p-3">
                      {emp.id === currentUser?.id ? (
                        <span className="text-gray-500 font-semibold">
                          Current User
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          {canEditRole(emp.role) && (
                            <button
                              onClick={() => openEditForm(emp)}
                              className="bg-blue-600 text-white px-3 py-1 rounded"
                            >
                              Edit
                            </button>
                          )}

                          {canEditRole(emp.role) &&
                            (emp.active ? (
                              <button
                                onClick={() => handleDeactivate(emp)}
                                className="bg-red-600 text-white px-3 py-1 rounded"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(emp.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded"
                              >
                                Activate
                              </button>
                            ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td className="border p-3 text-center" colSpan="7">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
