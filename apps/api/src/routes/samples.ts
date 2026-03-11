import { Router, Request, Response } from "express";
import { SampleService } from "../services/SampleService";
import { AuditService } from "../services/AuditService";
import { requireAuth } from "../middleware/auth";
import { NotFoundError } from "../services/ProjectService";

const router = Router();
const sampleService = new SampleService();
const auditService = new AuditService();

router.use(requireAuth);

// GET /api/v1/samples
router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await sampleService.list(
      {
        projectId: req.query.projectId as string | undefined,
        manufacturerId: req.query.manufacturerId as string | undefined,
        status: req.query.status as any,
      },
      {
        cursor: req.query.cursor as string | undefined,
        limit: parseInt(req.query.limit as string) || 20,
      }
    );

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// POST /api/v1/samples
router.post("/", async (req: Request, res: Response) => {
  try {
    const sample = await sampleService.create(req.body);

    await auditService.log({
      userId: req.user!.id,
      entityType: "sample",
      entityId: sample.id,
      action: "create",
    });

    res.status(201).json({ success: true, data: sample });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// GET /api/v1/samples/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const sample = await sampleService.getById(req.params.id as string);
    res.json({ success: true, data: sample });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// PUT /api/v1/samples/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const sample = await sampleService.update(req.params.id as string, req.body);

    await auditService.log({
      userId: req.user!.id,
      entityType: "sample",
      entityId: sample.id,
      action: "update",
      diffJson: req.body,
    });

    res.json({ success: true, data: sample });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// DELETE /api/v1/samples/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await sampleService.delete(req.params.id as string);

    await auditService.log({
      userId: req.user!.id,
      entityType: "sample",
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

// PUT /api/v1/samples/:id/status
router.put("/:id/status", async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "status is required" },
      });
      return;
    }

    const sample = await sampleService.updateStatus(req.params.id as string, status);

    await auditService.log({
      userId: req.user!.id,
      entityType: "sample",
      entityId: sample.id,
      action: "status_change",
      diffJson: { status },
    });

    res.json({ success: true, data: sample });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

export default router;
