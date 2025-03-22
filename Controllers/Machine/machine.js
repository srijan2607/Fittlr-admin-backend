const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../../errors");

// CREATE: Add a new machine
const createMachine = async (req, res) => {
  try {
    const { name, description, imageUrl, No_Of_Uses, gymId, status } = req.body;

    // Validate required fields
    if (!name || !description || !imageUrl || !gymId) {
      throw new BadRequestError(
        "Missing required fields: name, description, imageUrl, and gymId are required"
      );
    }

    // Check if gym exists
    const gym = await prisma.gym.findUnique({
      where: { id: Number(gymId) },
    });

    if (!gym) {
      throw new NotFoundError(`Gym with ID ${gymId} not found`);
    }

    // Create the machine
    const machine = await prisma.machine.create({
      data: {
        name,
        description,
        imageUrl,
        No_Of_Uses: No_Of_Uses || 0,
        status: status || "active", // Default to active if not provided
        gym: {
          connect: { id: Number(gymId) },
        },
      },
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Machine created successfully",
      data: machine,
    });
  } catch (error) {
    console.error("Error creating machine:", error);
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
      message: "Failed to create machine",
      error: error.message,
    });
  }
};

// READ: Get all machines with pagination and filtering
const getAllMachines = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      name,
      status,
      needService,
      gymId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter conditions
    const where = {};
    if (name) where.name = { contains: name, mode: "insensitive" };
    if (status) where.status = status;
    if (needService) where.needService = needService === "true";
    if (gymId) where.gymId = Number(gymId);

    // Build sort condition
    const orderBy = { [sortBy]: sortOrder };

    // Get machines with count
    const [machines, totalCount] = await Promise.all([
      prisma.machine.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          gym: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
          service: true,
          _count: {
            select: {
              MachineBooking: true,
              Exercise: true,
              tickets: true,
            },
          },
        },
      }),
      prisma.machine.count({ where }),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: machines,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching machines:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch machines",
      error: error.message,
    });
  }
};

// READ: Get a single machine by ID
const getMachineById = async (req, res) => {
  try {
    const { id } = req.body;

    const machine = await prisma.machine.findUnique({
      where: { id: Number(id) },
      include: {
        gym: true,
        service: true,
        MachineBooking: {
          include: {
            booking: {
              include: {
                user: true,
              },
            },
          },
        },
        Exercise: {
          include: {
            plan: true,
          },
        },
        tickets: true,
      },
    });

    if (!machine) {
      throw new NotFoundError(`Machine with ID ${id} not found`);
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: machine,
    });
  } catch (error) {
    console.error("Error fetching machine:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch machine",
      error: error.message,
    });
  }
};

// UPDATE: Update a machine
const updateMachine = async (req, res) => {
  try {
    const { id } = req.body;
    const {
      name,
      description,
      imageUrl,
      No_Of_Uses,
      needService,
      status,
      gymId,
    } = req.body;

    // Check if machine exists
    const existingMachine = await prisma.machine.findUnique({
      where: { id: Number(id) },
    });

    if (!existingMachine) {
      throw new NotFoundError(`Machine with ID ${id} not found`);
    }

    // If updating gymId, check if the gym exists
    if (gymId !== undefined) {
      const gymExists = await prisma.gym.findUnique({
        where: { id: Number(gymId) },
      });

      if (!gymExists) {
        throw new NotFoundError(`Gym with ID ${gymId} not found`);
      }
    }

    // Update machine
    const updatedMachine = await prisma.machine.update({
      where: { id: Number(id) },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        No_Of_Uses: No_Of_Uses !== undefined ? Number(No_Of_Uses) : undefined,
        needService: needService !== undefined ? needService : undefined,
        status: status !== undefined ? status : undefined,
        gymId: gymId !== undefined ? Number(gymId) : undefined,
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Machine updated successfully",
      data: updatedMachine,
    });
  } catch (error) {
    console.error("Error updating machine:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update machine",
      error: error.message,
    });
  }
};

// DELETE: Delete a machine
const deleteMachine = async (req, res) => {
  try {
    const { id } = req.body;

    // Check if machine exists
    const existingMachine = await prisma.machine.findUnique({
      where: { id: Number(id) },
    });

    if (!existingMachine) {
      throw new NotFoundError(`Machine with ID ${id} not found`);
    }

    // Delete the machine and handle related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Handle service record if exists
      await tx.service.deleteMany({
        where: { machineId: Number(id) },
      });

      // Update exercises to remove machine reference
      await tx.exercise.updateMany({
        where: { machineId: Number(id) },
        data: { machineId: null },
      });

      // Update tickets to remove machine reference
      await tx.tickets.updateMany({
        where: { machineId: Number(id) },
        data: { machineId: null },
      });

      // Delete the machine
      await tx.machine.delete({
        where: { id: Number(id) },
      });
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Machine and related data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting machine:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to delete machine",
      error: error.message,
    });
  }
};

// UPDATE: Update machine status specifically
const updateMachineStatus = async (req, res) => {
  try {
    const { id } = req.body;
    const { status } = req.body;

    if (!status) {
      throw new BadRequestError("Status is required");
    }

    // Validate status value
    const validStatuses = ["active", "inactive", "maintenance"];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(
        `Status must be one of: ${validStatuses.join(", ")}`
      );
    }

    // Check if machine exists
    const existingMachine = await prisma.machine.findUnique({
      where: { id: Number(id) },
    });

    if (!existingMachine) {
      throw new NotFoundError(`Machine with ID ${id} not found`);
    }

    // Update machine status
    const updatedMachine = await prisma.machine.update({
      where: { id: Number(id) },
      data: { status },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Machine status updated successfully",
      data: updatedMachine,
    });
  } catch (error) {
    console.error("Error updating machine status:", error);
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
      message: "Failed to update machine status",
      error: error.message,
    });
  }
};

// UPDATE: Toggle service needs flag
const updateServiceNeeds = async (req, res) => {
  try {
    const { id } = req.body;
    const { needService } = req.body;

    if (needService === undefined) {
      throw new BadRequestError("needService flag is required");
    }

    // Check if machine exists
    const existingMachine = await prisma.machine.findUnique({
      where: { id: Number(id) },
    });

    if (!existingMachine) {
      throw new NotFoundError(`Machine with ID ${id} not found`);
    }

    // Update machine's service needs flag
    const updatedMachine = await prisma.machine.update({
      where: { id: Number(id) },
      data: { needService },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Machine service needs updated successfully",
      data: updatedMachine,
    });
  } catch (error) {
    console.error("Error updating machine service needs:", error);
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
      message: "Failed to update machine service needs",
      error: error.message,
    });
  }
};

// UPDATE: Increment machine uses
const incrementMachineUses = async (req, res) => {
  try {
    const { id } = req.body;
    const { increment = 1 } = req.body;

    // Check if machine exists
    const existingMachine = await prisma.machine.findUnique({
      where: { id: Number(id) },
    });

    if (!existingMachine) {
      throw new NotFoundError(`Machine with ID ${id} not found`);
    }

    // Increment machine uses
    const updatedMachine = await prisma.machine.update({
      where: { id: Number(id) },
      data: { No_Of_Uses: { increment: Number(increment) } },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Machine uses incremented successfully",
      data: updatedMachine,
    });
  } catch (error) {
    console.error("Error incrementing machine uses:", error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to increment machine uses",
      error: error.message,
    });
  }
};

module.exports = {
  createMachine,
  getAllMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
  updateMachineStatus,
  updateServiceNeeds,
  incrementMachineUses,
};
