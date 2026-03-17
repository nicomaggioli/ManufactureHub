import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();
router.use(requireAuth);

// GET /api/v1/dashboard/stats
router.get("/stats", asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const [
    activeProjects,
    totalManufacturers,
    pendingComms,
    upcomingReminders,
    projectsByStatus,
  ] = await Promise.all([
    prisma.project.count({ where: { userId, archived: false } }),
    prisma.manufacturer.count(),
    prisma.communication.count({
      where: {
        project: { userId },
        direction: "sent",
        status: { in: ["sent", "delivered"] },
        followUpDueAt: { not: null },
      },
    }),
    prisma.reminder.count({
      where: {
        userId,
        completed: false,
        dueAt: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.project.groupBy({
      by: ["status"],
      where: { userId, archived: false },
      _count: true,
    }),
  ]);

  const pipeline = projectsByStatus.reduce(
    (acc, item) => {
      acc[item.status] = item._count;
      return acc;
    },
    {} as Record<string, number>
  );

  res.json({
    success: true,
    data: {
      activeProjects,
      totalManufacturers,
      pendingReplies: pendingComms,
      upcomingReminders,
      pipeline: {
        ideation: pipeline.ideation ?? 0,
        sourcing: pipeline.sourcing ?? 0,
        sampling: pipeline.sampling ?? 0,
        production: pipeline.production ?? 0,
        shipped: pipeline.shipped ?? 0,
      },
    },
  });
}));

// GET /api/v1/dashboard/activity
router.get("/activity", asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const recentComms = await prisma.communication.findMany({
    where: { project: { userId } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      manufacturer: { select: { name: true } },
      project: { select: { title: true } },
    },
  });

  const activity = recentComms.map((c) => ({
    id: c.id,
    type: c.direction === "sent" ? "message_sent" : "message_received",
    description: `${c.direction === "sent" ? "Sent to" : "Received from"} ${c.manufacturer.name}`,
    project: c.project.title,
    timestamp: c.createdAt,
  }));

  res.json({ success: true, data: activity });
}));

export default router;
