const prisma = require("../../db/connect");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../../errors");
const { createJWT } = require("../../services/jwt_create");
const { comparePassword } = require("../../services/password_auth");

// Controller function to handle user login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
  }

  // Always fetch user from database for password verification
  const user = await prisma.user.findUnique({
    where: {
      email,
      OR: [
        { isAdmin: true },
        { isValidator: true },
        { isContent_creator: true },
      ],
    },
  });

  if (!user) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  // Compare provided password with stored password hash
  const isPasswordCorrect = await comparePassword(password, user.password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  // Create JWT token
  const token = createJWT(user);

  // Remove sensitive information before sending response
  const { password: _, ...userWithoutPassword } = user;

  // Send response
  res.status(StatusCodes.OK).json({
    success: true,
    user: userWithoutPassword,
    token,
  });
};

module.exports = loginUser;
