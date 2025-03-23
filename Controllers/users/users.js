const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../../errors");

const get_all_users = async (req, res) => {
    const users = await prisma.user.findMany();
    res.status(StatusCodes.OK).json({ users, count: users.length });
}

module.exports = { get_all_users };