const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get user statistics (total, members, admins)
const getUserStats = async () => {
  try {
    const membersCount = await prisma.user.count();
    const adminsCount = await prisma.admin.count();

    return {
      total: membersCount + adminsCount,
      members: membersCount,
      admins: adminsCount,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw error;
  }
};

// Get equipment statistics (total, working, needs maintenance)
const getEquipmentStats = async () => {
  try {
    const totalEquipment = await prisma.machine.count();
    const needsMaintenance = await prisma.machine.count({
      where: {
        needService: true,
        status: {
          not: "active",
        },
      },
    });

    return {
      total: totalEquipment,
      working: totalEquipment - needsMaintenance,
      maintenance: needsMaintenance,
    };
  } catch (error) {
    console.error("Error fetching equipment stats:", error);
    throw error;
  }
};

// Get ticket statistics (total, open, closed)
const getTicketStats = async () => {
  try {
    const totalTickets = await prisma.tickets.count();
    const openTickets = await prisma.tickets.count({
      where: {
        status: "open",
      },
    });

    return {
      total: totalTickets,
      open: openTickets,
      closed: totalTickets - openTickets,
    };
  } catch (error) {
    console.error("Error fetching ticket stats:", error);
    throw error;
  }
};

// Get detailed ticket information
const getDetailedTickets = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      status,
      ticketType,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where condition based on filters
    const where = {};
    if (status) where.status = status;
    if (ticketType) where.ticketType = ticketType;

    // Get tickets with pagination
    const [tickets, totalCount] = await Promise.all([
      prisma.tickets.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              googleId: true,
              name: true,
              email: true,
              profileImg: true,
            },
          },
          machine: {
            include: {
              gym: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                },
              },
            },
          },
        },
      }),
      prisma.tickets.count({ where }),
    ]);

    res.status(200).json({
      tickets,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching detailed ticket information:", error);
    res.status(500).json({ error: "Failed to fetch ticket details" });
  }
};

// Get all dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [userStats, equipmentStats, ticketStats, recentTickets] =
      await Promise.all([
        getUserStats(),
        getEquipmentStats(),
        getTicketStats(),
        // Get 5 most recent tickets
        prisma.tickets.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            machine: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        }),
      ]);

    res.status(200).json({
      users: userStats,
      equipment: equipmentStats,
      tickets: ticketStats,
      recentTickets: recentTickets,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};

module.exports = {
  getDashboardStats,
  getUserStats,
  getEquipmentStats,
  getTicketStats,
  getDetailedTickets,
};
