const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../../errors");
const cloudflareImageService = require("../../services/cloudflare");

// CREATE: Add a new gym with opening hours
const createGym = async (req, res) => {
  try {
    const { name, location, MaxCapacity, openingHours, userId } = req.body;
    let imageUrl = req.body.imageUrl;

    // Validate required fields
    if (!name || !location || !MaxCapacity) {
      throw new BadRequestError(
        "Missing required fields: name, location, and MaxCapacity are required"
      );
    }

    // Handle image upload if file is provided
    if (req.files && req.files.Gym_image && req.files.Gym_image.length > 0) {
      const imageFile = req.files.Gym_image[0];
      const fileName = `gym_${Date.now()}_${imageFile.originalname}`;

      // Upload image to Cloudflare
      imageUrl = await cloudflareImageService.uploadImage(
        imageFile.buffer,
        fileName
      );

      console.log("Image uploaded to Cloudflare:", imageUrl);
    }

    // If no image was provided, set a default image
    if (!imageUrl) {
      imageUrl =
        "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DvH8kYVahdrU&psig=AOvVaw15DcFBbIDAb7jFXHg_h1SG&ust=1742713548705000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCKCX0IGQnYwDFQAAAAAdAAAAABAE";
    }

    // Create the gym with its opening hours in a transaction
    const gym = await prisma.$transaction(async (tx) => {
      // Create the gym
      const newGym = await tx.gym.create({
        data: {
          name,
          location,
          imageUrl, // This will now always have a value
          MaxCapacity,
          currnt_users: 0, // Initialize with 0 current users
          userId: userId || undefined, // Optional relation to a user
        },
      });

      // Create opening hours if provided
      if (
        openingHours &&
        Array.isArray(openingHours) &&
        openingHours.length > 0
      ) {
        await tx.openingHours.createMany({
          data: openingHours.map((hour) => ({
            dayOfWeek: hour.dayOfWeek,
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            gymId: newGym.id,
          })),
        });
      }

      // Return the created gym with its opening hours
      return await tx.gym.findUnique({
        where: { id: newGym.id },
        include: { openingHours: true },
      });
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Gym created successfully",
      data: gym,
    });
  } catch (error) {
    console.error("Error creating gym:", error);
    if (error instanceof BadRequestError) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create gym",
      error: error.message,
    });
  }
};

// READ: Get all gyms with pagination and filtering
const getAllGyms = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      name,
      location,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter conditions
    const where = {};
    if (name) where.name = { contains: name, mode: "insensitive" };
    if (location) where.location = { contains: location, mode: "insensitive" };

    // Build sort condition
    const orderBy = { [sortBy]: sortOrder };

    // Get gyms with count
    const [gyms, totalCount] = await Promise.all([
      prisma.gym.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          openingHours: true,
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              machines: true,
              GymBooking: true,
            },
          },
        },
      }),
      prisma.gym.count({ where }),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: gyms,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching gyms:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch gyms",
      error: error.message,
    });
  }
};

// READ: Get a single gym by ID
const getGymById = async (req, res) => {
  try {
    const { id } = req.body;

    const gym = await prisma.gym.findUnique({
      where: { id: Number(id) },
      include: {
        openingHours: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        machines: true,
        user: {
          select: {
            googleId: true,
            name: true,
            email: true,
            profileImg: true,
          },
        },
      },
    });

    if (!gym) {
      throw new NotFoundError(`Gym with ID ${id} not found`);
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: gym,
    });
  } catch (error) {
    console.error("Error fetching gym:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch gym",
      error: error.message,
    });
  }
};

// UPDATE: Update a gym and its opening hours
const updateGym = async (req, res) => {
  try {
    const { id } = req.body;
    const { name, location, MaxCapacity, openingHours, userId } = req.body;
    let { imageUrl } = req.body;

    // Check if gym exists
    const existingGym = await prisma.gym.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingGym) {
      throw new NotFoundError(`Gym with ID ${id} not found`);
    }

    // Handle image upload if file is provided
    if (req.files && req.files.Gym_image && req.files.Gym_image.length > 0) {
      const imageFile = req.files.Gym_image[0];
      const fileName = `gym_${Date.now()}_${imageFile.originalname}`;

      // Upload image to Cloudflare
      imageUrl = await cloudflareImageService.uploadImage(
        imageFile.buffer,
        fileName
      );

      // If there was a previous image, delete it
      if (existingGym.imageUrl && existingGym.imageUrl.includes("cloudflare")) {
        try {
          await cloudflareImageService.deleteImage(existingGym.imageUrl);
        } catch (err) {
          console.error("Failed to delete old image:", err);
        }
      }
    }

    // Update gym in a transaction to handle opening hours
    const updatedGym = await prisma.$transaction(async (tx) => {
      // Update gym data
      const gym = await tx.gym.update({
        where: { id: parseInt(id) },
        data: {
          name: name !== undefined ? name : undefined,
          location: location !== undefined ? location : undefined,
          imageUrl: imageUrl !== undefined ? imageUrl : undefined,
          MaxCapacity: MaxCapacity !== undefined ? MaxCapacity : undefined,
          userId: userId !== undefined ? userId : undefined,
        },
      });

      // Update opening hours if provided
      if (openingHours && Array.isArray(openingHours)) {
        // Delete existing opening hours
        await tx.openingHours.deleteMany({
          where: { gymId: parseInt(id) },
        });

        // Create new opening hours
        if (openingHours.length > 0) {
          await tx.openingHours.createMany({
            data: openingHours.map((hour) => ({
              dayOfWeek: hour.dayOfWeek,
              openTime: hour.openTime,
              closeTime: hour.closeTime,
              gymId: parseInt(id),
            })),
          });
        }
      }

      // Return updated gym with opening hours
      return await tx.gym.findUnique({
        where: { id: parseInt(id) },
        include: { openingHours: true },
      });
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Gym updated successfully",
      data: updatedGym,
    });
  } catch (error) {
    console.error("Error updating gym:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update gym",
      error: error.message,
    });
  }
};

// DELETE: Delete a gym and associated data
const deleteGym = async (req, res) => {
  try {
    const { id } = req.body;

    // Check if gym exists
    const existingGym = await prisma.gym.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingGym) {
      throw new NotFoundError(`Gym with ID ${id} not found`);
    }

    // Delete the gym and associated data in a transaction
    await prisma.$transaction(async (tx) => {
      // First, delete related opening hours
      await tx.openingHours.deleteMany({
        where: { gymId: parseInt(id) },
      });

      // Handle admin relationship by setting gymId to null
      await tx.admin.updateMany({
        where: { gymId: parseInt(id) },
        data: { gymId: null },
      });

      // Delete the gym itself
      await tx.gym.delete({
        where: { id: parseInt(id) },
      });
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Gym and related data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting gym:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to delete gym",
      error: error.message,
    });
  }
};

// Update current users count
const updateCurrentUsers = async (req, res) => {
  try {
    const { id } = req.body;
    const { count } = req.body;

    if (count === undefined) {
      throw new BadRequestError("Current users count is required");
    }

    const gym = await prisma.gym.findUnique({
      where: { id: parseInt(id) },
    });

    if (!gym) {
      throw new NotFoundError(`Gym with ID ${id} not found`);
    }

    if (count > gym.MaxCapacity) {
      throw new BadRequestError(
        `Current users count cannot exceed maximum capacity of ${gym.MaxCapacity}`
      );
    }

    const updatedGym = await prisma.gym.update({
      where: { id: parseInt(id) },
      data: { currnt_users: count },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Current users count updated successfully",
      data: updatedGym,
    });
  } catch (error) {
    console.error("Error updating current users count:", error);
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      return res
        .status(
          error instanceof BadRequestError
            ? StatusCodes.BAD_REQUEST
            : StatusCodes.NOT_FOUND
        )
        .json({
          success: false,
          message: error.message,
        });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update current users count",
      error: error.message,
    });
  }
};

module.exports = {
  createGym,
  getAllGyms,
  getGymById,
  updateGym,
  deleteGym,
  updateCurrentUsers,
};
