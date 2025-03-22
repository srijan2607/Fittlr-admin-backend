const express = require("express");
const router = express.Router();
const {
    getDashboardStats,
    getUserStats,
    getEquipmentStats,
    getTicketStats,
  } = require("../Controllers/Dasboard/dashboard")

router.get("/stats", getDashboardStats);
router.get("/user", getUserStats);
router.get("/equipment", getEquipmentStats);
router.get("/ticket", getTicketStats);

module.exports = router;