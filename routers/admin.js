const express = require("express");
const router = express.Router();
const {
  register_admin,
  get_all_admin,
  update_admin,
  delete_admin,
} = require("../Controllers/Admin/admin"); // Import the functions from the controllers/admin.js file

router.post("/register", register_admin); // Register a new admin
router.get("/all", get_all_admin); // Get all admins
router.patch("/update/:id", update_admin); // Update an admin
router.delete("/delete/:id", delete_admin); // Delete an admin

module.exports = router; // Export the router to be used in the app.js file
