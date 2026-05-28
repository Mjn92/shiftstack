const express = require("express");
const router = express.Router();

const { getEmployees } = require("../controllers/employeeController");

router.get("/employees", getEmployees);

module.exports = router;
