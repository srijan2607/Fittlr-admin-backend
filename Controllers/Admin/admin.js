// Controllers/auth/admin_register.js

const prisma = require("../../db/connect");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../../errors");
const { createJWT } = require("../../services/jwt_create");
const { hashPassword } = require("../../services/password_auth");

const get_all_admin = async (req, res) => {
  const admin = await prisma.admin.findMany();
  res.status(StatusCodes.OK).json({ admin, count: admin.length });
};

const update_admin = async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  const admin = await prisma.admin.findFirst({
    where: { id: Number(id) },
  });
  if (!admin) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  // Create data object for update
  const updateData = { name, email };

  // Hash password if provided
  if (password) {
    updateData.password = await hashPassword(password);
  }

  const updated_admin = await prisma.admin.update({
    where: { id: Number(id) },
    data: updateData,
  });

  // Remove password from response
  const { password: _, ...adminWithoutPassword } = updated_admin;

  res.status(StatusCodes.OK).json({
    message: "Admin updated successfully",
    updated_admin: adminWithoutPassword,
  });
};

const delete_admin = async (req, res) => {
  const { id } = req.params;
  const admin = await prisma.admin.findFirst({
    where: { id: Number(id) },
  });
  if (!admin) {
    throw new UnauthenticatedError("Invalid credentials");
  }
  const deleted_admin = await prisma.admin.delete({
    where: { id: Number(id) },
  });
  res.status(StatusCodes.OK).json({
    message: "Admin deleted successfully",
    deleted_admin,
  });
};

const register_admin = async (req, res) => {
  const { name, email, password } = req.body;
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
};

module.exports = { register_admin, get_all_admin, update_admin, delete_admin };
