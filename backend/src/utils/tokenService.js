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
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES,
    },
  );
};

const generateRefreshToken = (employee) => {
  return jwt.sign(
    {
      id: employee.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES,
    },
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
