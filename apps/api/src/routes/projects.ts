import { Router, Request, Response } from "express";
import { ProjectService, NotFoundError } from "../services/ProjectService";
import { AuditService } from "../services/AuditService";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
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
router.get("/", validate(listProjectsQuery, "query"), async (req: Request, res: Response) => {
  try {
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
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// POST /api/v1/projects
router.post("/", validate(createProjectSchema), async (req: Request, res: Response) => {
  try {
    const project = await projectService.create(req.user!.id, req.body);

    await auditService.log({
      userId: req.user!.id,
      entityType: "project",
      entityId: project.id,
      action: "create",
    });

    res.status(201).json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// GET /api/v1/projects/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const project = await projectService.getById(req.params.id as string, req.user!.id);
    res.json({ success: true, data: project });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// PUT /api/v1/projects/:id
router.put("/:id", validate(updateProjectSchema), async (req: Request, res: Response) => {
  try {
    const project = await projectService.update(req.params.id as string, req.user!.id, req.body);

    await auditService.log({
      userId: req.user!.id,
      entityType: "project",
      entityId: project.id,
      action: "update",
      diffJson: req.body,
    });

    res.json({ success: true, data: project });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// DELETE /api/v1/projects/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await projectService.delete(req.params.id as string, req.user!.id);

    await auditService.log({
      userId: req.user!.id,
      entityType: "project",
      entityId: req.params.id as string,
      action: "delete",
    });

    res.json({ success: true, data: null });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// POST /api/v1/projects/:id/archive
router.post("/:id/archive", validate(archiveProjectSchema), async (req: Request, res: Response) => {
  try {
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
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

export default router;
