const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  register,
  login,
  me,
  logout,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validationMiddleware");

router.post(
  "/register",
  [
    body("first_name").notEmpty().withMessage("First name is required"),
    body("last_name").notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validateRequest,
  register,
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  login,
);

router.post("/refresh", refresh);

router.post("/logout", protect, logout);

router.get("/me", protect, me);

router.put("/profile", protect, updateProfile);

router.put("/change-password", protect, changePassword);

module.exports = router;
