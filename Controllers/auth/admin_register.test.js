// Controllers/auth/admin_register.js

const prisma = require("../../db/connect");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../../errors");
const { createJWT } = require("../../services/jwt_create");
const { hashPassword } = require("../../services/password_auth");

/**
 * Registers a new admin user.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.name - The name of the admin user.
 * @param {string} req.body.email - The email of the admin user.
 * @param {string} req.body.password - The password of the admin user.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves to void.
 * @throws {BadRequestError} - If a user with the given email already exists.
 */
const register_admin = async (req, res) => {
  const { name, email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (user) {
    throw new BadRequestError("User already exists");
  }
  const hashedPassword = await hashPassword(password);
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      isAdmin: true,
    },
  });

  const token = createJWT(newUser.id, newUser.name);

  res.status(StatusCodes.CREATED).json({
    message: "Admin registered successfully",
    token,
    newUser,
  });
};

module.exports = register_admin;
