// controllers/auth/logout.js

// Importing the StatusCodes object from the http-status-codes package
const { StatusCodes } = require("http-status-codes");

// Function to handle user logout
const logout = (req, res) => {
    // Clear the JWT token from the client-side by removing the 'jwtToken' cookie
    res.clearCookie('jwtToken');

    // Send a response indicating successful logout with a 200 OK status
    res.status(StatusCodes.OK).json({ message: 'Logout successful' });
};

// Export the logout function to be used in other parts of the application
module.exports = logout;