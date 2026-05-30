const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided" });
    }

    const existingUser = await pool.query(
      "SELECT id FROM employees WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO employees 
       (first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, first_name, last_name, email, role`,
      [first_name, last_name, email, password_hash, role || "employee"],
    );

    res.status(201).json({
      message: "Employee registered successfully",
      employee: result.rows[0],
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM employees WHERE email = $1 AND active = TRUE",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const employee = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      employee.password_hash,
    );

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: employee.id,
        email: employee.email,
        role: employee.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({
      message: "Login successful",
      token,
      employee: {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        role: employee.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const me = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, first_name, last_name, email, role FROM employees WHERE id = $1",
      [req.user.id],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  register,
  login,
  me,
};
