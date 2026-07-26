import api from "./api";

export const getEmployees = () => {
  return api.get("/admin/employees");
};

export const createEmployee = (employeeData) => {
  return api.post("/admin/employees", employeeData);
};

export const updateEmployee = (id, employeeData) => {
  validateEmployeeId(id);

  return api.put(`/admin/employees/${id}`, employeeData);
};

export const deactivateEmployee = (id) => {
  validateEmployeeId(id);

  return api.patch(`/admin/employees/${id}/deactivate`);
};

export const activateEmployee = (id) => {
  validateEmployeeId(id);

  return api.patch(`/admin/employees/${id}/activate`);
};

function validateEmployeeId(id) {
  if (id === undefined || id === null || id === "") {
    throw new Error("Employee ID is required.");
  }
}
