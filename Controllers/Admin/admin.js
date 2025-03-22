// Controllers/auth/admin_register.js

const prisma = require("../../db/connect");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../../errors");
const { createJWT } = require("../../services/jwt_create");
const { hashPassword } = require("../../services/password_auth");

/**
 * Registers a new admin admin.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.name - The name of the admin admin.
 * @param {string} req.body.email - The email of the admin admin.
 * @param {string} req.body.password - The password of the admin admin.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves to void.
 * @throws {BadRequestError} - If a user with the given email already exists. 
 */
const get_all_admin = async (req, res) => {
  const admin = await prisma.admin.findMany();
  res.status(StatusCodes.OK).json({ admin , count : admin.length});
}

const update_admin = async (req, res) => {
  const {id, name, email, password} = req.body;
  const admin = await prisma.admin.findFirst({
    where: {id},
  });
  if (!admin) {
    throw new UnauthenticatedError("Invalid credentials");
  }
  const updated_admin = await prisma.admin.update({
    where: {id},
    data: {
      name,
      email,
      password,
    },
  });
  res.status(StatusCodes.OK).json({
    message: "Admin updated successfully",
    updated_admin,
  });
}

const delete_admin = async (req, res) => {
  const {id} = req.body;
  const admin = await prisma.admin.findFirst({
    where: {id},
  });
  if (!admin) {
    throw new UnauthenticatedError("Invalid credentials");
  }
  const deleted_admin = await prisma.admin.delete({
    where: {id},
  });
  res.status(StatusCodes.OK).json({
    message: "Admin deleted successfully",
    deleted_admin,
  });
}


const register_admin = async (req, res) => {
  const {name , email, password} = req.body;
  const admin = await prisma.admin.findFirst({
    where: { email },
  });
  if (admin) {
    throw new BadRequestError("admin already exists");
  }
  const hashedPassword = await hashPassword(password);
  const newadmin = await prisma.admin.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });
  const token = createJWT(newadmin.id, newadmin.name);
  res.status(StatusCodes.CREATED).json({
    message: "Admin registered successfully",
    token,
    newadmin,
  });

}

module.exports = {register_admin, get_all_admin, update_admin, delete_admin};