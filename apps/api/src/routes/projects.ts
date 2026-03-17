import { Router } from "express";
import { ProjectService } from "../services/ProjectService";
import { AuditService } from "../services/AuditService";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuery,
  archiveProjectSchema,
} from "../schemas";

const router = Router();
const projectService = new ProjectService();
const auditService = new AuditService();

router.use(requireAuth);

// GET /api/v1/projects
router.get("/", validate(listProjectsQuery, "query"), asyncHandler(async (req, res) => {
  const result = await projectService.list(
    req.user!.id,
    {
      status: req.query.status as any,
      archived: (req.query.archived as unknown as boolean) ?? false,
    },
    {
      cursor: req.query.cursor as string | undefined,
      limit: (req.query.limit as unknown as number) ?? 20,
    }
  );

  res.json({ success: true, data: result });
}));

// POST /api/v1/projects
router.post("/", validate(createProjectSchema), asyncHandler(async (req, res) => {
  const project = await projectService.create(req.user!.id, req.body);

  await auditService.log({
    userId: req.user!.id,
    entityType: "project",
    entityId: project.id,
    action: "create",
  });

  res.status(201).json({ success: true, data: project });
}));

// GET /api/v1/projects/:id
router.get("/:id", asyncHandler(async (req, res) => {
  const project = await projectService.getById(req.params.id as string, req.user!.id);
  res.json({ success: true, data: project });
}));

// PUT /api/v1/projects/:id
router.put("/:id", validate(updateProjectSchema), asyncHandler(async (req, res) => {
  const project = await projectService.update(req.params.id as string, req.user!.id, req.body);

  await auditService.log({
    userId: req.user!.id,
    entityType: "project",
    entityId: project.id,
    action: "update",
    diffJson: req.body,
  });

  res.json({ success: true, data: project });
}));

// DELETE /api/v1/projects/:id
router.delete("/:id", asyncHandler(async (req, res) => {
  await projectService.delete(req.params.id as string, req.user!.id);

  await auditService.log({
    userId: req.user!.id,
    entityType: "project",
    entityId: req.params.id as string,
    action: "delete",
  });

  res.json({ success: true, data: null });
}));

// POST /api/v1/projects/:id/archive
router.post("/:id/archive", validate(archiveProjectSchema), asyncHandler(async (req, res) => {
  const { action } = req.body; // "archive" or "unarchive"
  const project =
    action === "unarchive"
      ? await projectService.unarchive(req.params.id as string, req.user!.id)
      : await projectService.archive(req.params.id as string, req.user!.id);

  await auditService.log({
    userId: req.user!.id,
    entityType: "project",
    entityId: project.id,
    action: action === "unarchive" ? "unarchive" : "archive",
  });

  res.json({ success: true, data: project });
}));

export default router;
