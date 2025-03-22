const prisma = require("../../db/connect");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../../errors");
const { createJWT } = require("../../services/jwt_create");
const { comparePassword } = require("../../services/password_auth");

const login = async (req, res) => {
  const { email,password} = req.body;
  const admin = await prisma.admin.findFirst({
    where: { email: email.toLowerCase() },
  });
  if (!admin) {
    throw new UnauthenticatedError("Invalid credentials");
  }
  const isPasswordCorrect = await comparePassword(password, admin.password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid credentials");
  }
  const token = createJWT(admin.id, admin.name);
  res.status(StatusCodes.OK).json({
    message: "Admin logged in successfully",
    token,
    admin,
  });
} 
module.exports = login;