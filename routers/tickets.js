const express = require("express");
const router = express.Router();
const {
  createTicket,
  get_user_ticket,
  update_ticket,
  delete_ticket,
  getServiceTickets,
} = require("../Controllers/tickets/tickets");

// Create new ticket
router.post("/create", createTicket);

// Get tickets for a specific user
router.get("/user/:userId", get_user_ticket);

// Get all service tickets
router.get("/service", getServiceTickets);

// Update ticket
router.put("/:ticketId", update_ticket);

// Delete ticket
router.delete("/:ticketId", delete_ticket);

module.exports = router;
