const express = require("express");
const router = express.Router();
const {
    createTicket,
    get_user_ticket,
    update_ticket,
    delete_ticket,
    getServiceTickets
} = require("../Controllers/tickets/tickets")   // Import the functions from the controllers/tickets.js file

router.post("/create", createTicket); // Create a new ticket
router.get("/get_user_ticket", get_user_ticket); // Get a user's ticket 
router.put("/update_ticket", update_ticket); // Update a ticket
router.delete("/delete_ticket", delete_ticket); // Delete a ticket
router.get("/get_service_tickets", getServiceTickets); // Get all service tickets

module.exports = router; // Export the router to be used in the app.js file