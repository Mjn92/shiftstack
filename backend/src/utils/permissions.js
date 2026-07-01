const { USER_MANAGEMENT_RULES } = require("./userManagementRules");

const canManageUser = (currentRole, targetRole, action = "canEdit") => {
  const rules = USER_MANAGEMENT_RULES[currentRole];

  if (!rules) {
    return false;
  }

  return rules[action]?.includes(targetRole) || false;
};

module.exports = {
  canManageUser,
};
