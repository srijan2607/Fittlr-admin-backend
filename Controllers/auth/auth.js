const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../../errors");
const { comparePassword, createJWT } = require("../../services/password_auth");
const prisma = require("../../db/connect");
const { preloadCache } = require("../../services/cachePreloader");

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.isAdmin) {
    throw new UnauthenticatedError("Invalid Credentials");
  }

  const isPasswordCorrect = await comparePassword(password, user.password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid Credentials");
  }

  const token = createJWT({ userId: user.id, name: user.name });

  // Trigger cache preloading immediately after successful login
  try {
    await preloadCache();
    console.log("Cache preloaded successfully after login");
  } catch (error) {
    console.error("Cache preloading failed:", error);
    // Don't block the login response even if preloading fails
  }

  res.status(StatusCodes.OK).json({
    user: { id: user.id, name: user.name },
    token,
  });
};
