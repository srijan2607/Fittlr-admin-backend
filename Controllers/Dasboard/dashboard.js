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

// Get all dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [userStats, equipmentStats, ticketStats] = await Promise.all([
      getUserStats(),
      getEquipmentStats(),
      getTicketStats(),
    ]);

    res.status(200).json({
      users: userStats,
      equipment: equipmentStats,
      tickets: ticketStats,
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
};
