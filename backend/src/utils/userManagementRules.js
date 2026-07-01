const USER_ROLES = {
  EMPLOYEE: "employee",
  MANAGER: "manager",
  ADMIN: "admin",
};

const USER_MANAGEMENT_RULES = {
  admin: {
    canCreate: ["employee", "manager", "admin"],
    canEdit: ["employee", "manager", "admin"],
    canActivate: ["employee", "manager", "admin"],
    canDeactivate: ["employee", "manager", "admin"],
    canChangeRoleTo: ["employee", "manager", "admin"],
  },

  manager: {
    canCreate: ["employee"],
    canEdit: ["employee"],
    canActivate: ["employee"],
    canDeactivate: ["employee"],
    canChangeRoleTo: ["employee"],
  },

  employee: {
    canCreate: [],
    canEdit: [],
    canActivate: [],
    canDeactivate: [],
    canChangeRoleTo: [],
  },
};

module.exports = {
  USER_ROLES,
  USER_MANAGEMENT_RULES,
};
