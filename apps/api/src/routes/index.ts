import { Router } from "express";
import projectRoutes from "./projects";
import manufacturerRoutes from "./manufacturers";
import communicationRoutes from "./communications";
import reminderRoutes from "./reminders";
import designRoutes from "./design";
import quoteRoutes from "./quotes";
import sampleRoutes from "./samples";
import aiRoutes from "./ai";
import dashboardRoutes from "./dashboard";

const router = Router();

router.use("/dashboard", dashboardRoutes);
router.use("/projects", projectRoutes);
router.use("/manufacturers", manufacturerRoutes);
router.use("/communications", communicationRoutes);
router.use("/reminders", reminderRoutes);
router.use("/design", designRoutes);
router.use("/quotes", quoteRoutes);
router.use("/samples", sampleRoutes);
router.use("/ai", aiRoutes);

// Health check
router.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

export default router;
