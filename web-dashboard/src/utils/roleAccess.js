export function canAccessManagement(role) {
  return role === "manager" || role === "admin";
}

export function canAccessAdmin(role) {
  return role === "admin";
}

export function hasValidRole(role) {
  return ["employee", "manager", "admin"].includes(role);
}
