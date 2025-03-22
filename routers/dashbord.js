const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getUserStats,
  getEquipmentStats,
  getTicketStats,
  getDetailedTickets,
} = require("../Controllers/Dasboard/dashboard");

router.get("/stats", getDashboardStats);
router.get("/user", getUserStats);
router.get("/equipment", getEquipmentStats);
router.get("/ticket", getTicketStats);
router.get("/tickets/details", getDetailedTickets);

module.exports = router;
