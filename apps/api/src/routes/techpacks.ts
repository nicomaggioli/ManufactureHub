import { Router } from "express";
import { TechPackService } from "../services/TechPackService";
import { AuditService } from "../services/AuditService";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  createTechPackSchema,
  updateTechPackSchema,
  duplicateTechPackSchema,
} from "../schemas";

const router = Router();
const techPackService = new TechPackService();
const auditService = new AuditService();

router.use(requireAuth);

// GET /api/v1/techpacks?projectId=...
router.get("/", asyncHandler(async (req, res) => {
  const projectId = req.query.projectId as string;
  if (!projectId) {
    res.status(400).json({
      success: false,
      error: { code: "BAD_REQUEST", message: "projectId query parameter is required" },
    });
    return;
  }

  const techPacks = await techPackService.list(projectId);
  res.json({ success: true, data: techPacks });
}));

// GET /api/v1/techpacks/:id
router.get("/:id", asyncHandler(async (req, res) => {
  const techPack = await techPackService.getById(req.params.id as string);
  res.json({ success: true, data: techPack });
}));

// POST /api/v1/techpacks
router.post("/", validate(createTechPackSchema), asyncHandler(async (req, res) => {
  const techPack = await techPackService.create(req.user!.id, req.body);

  await auditService.log({
    userId: req.user!.id,
    entityType: "tech_pack",
    entityId: techPack.id,
    action: "create",
  });

  res.status(201).json({ success: true, data: techPack });
}));

// PUT /api/v1/techpacks/:id
router.put("/:id", validate(updateTechPackSchema), asyncHandler(async (req, res) => {
  const techPack = await techPackService.update(req.params.id as string, req.body);

  await auditService.log({
    userId: req.user!.id,
    entityType: "tech_pack",
    entityId: techPack.id,
    action: "update",
    diffJson: req.body,
  });

  res.json({ success: true, data: techPack });
}));

// DELETE /api/v1/techpacks/:id
router.delete("/:id", asyncHandler(async (req, res) => {
  await techPackService.delete(req.params.id as string);

  await auditService.log({
    userId: req.user!.id,
    entityType: "tech_pack",
    entityId: req.params.id as string,
    action: "delete",
  });

  res.json({ success: true, data: null });
}));

// POST /api/v1/techpacks/:id/duplicate
router.post("/:id/duplicate", validate(duplicateTechPackSchema), asyncHandler(async (req, res) => {
  const techPack = await techPackService.duplicate(req.params.id as string, req.body.name);

  await auditService.log({
    userId: req.user!.id,
    entityType: "tech_pack",
    entityId: techPack.id,
    action: "duplicate",
  });

  res.status(201).json({ success: true, data: techPack });
}));

export default router;
