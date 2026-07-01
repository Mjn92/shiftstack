import api from "./api";

export const getEmployees = () => api.get("/admin/employees");

export const createEmployee = (employee) =>
  api.post("/admin/employees", employee);

export const updateEmployee = (id, employee) =>
  api.put(`/admin/employees/${id}`, employee);

export const deactivateEmployee = (id) =>
  api.patch(`/admin/employees/${id}/deactivate`);

export const activateEmployee = (id) =>
  api.patch(`/admin/employees/${id}/activate`);
