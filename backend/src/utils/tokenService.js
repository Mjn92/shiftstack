const jwt = require("jsonwebtoken");

const generateAccessToken = (employee) => {
  return jwt.sign(
    {
      id: employee.id,
      email: employee.email,
      role: employee.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    },
  );
};

module.exports = {
  generateAccessToken,
};
