import { Router } from "express";
import { SampleService } from "../services/SampleService";
import { AuditService } from "../services/AuditService";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  createSampleSchema,
  updateSampleSchema,
  updateSampleStatusSchema,
  listSamplesQuery,
} from "../schemas";

const router = Router();
const sampleService = new SampleService();
const auditService = new AuditService();

router.use(requireAuth);

// GET /api/v1/samples
router.get("/", validate(listSamplesQuery, "query"), asyncHandler(async (req, res) => {
  const result = await sampleService.list(
    {
      projectId: req.query.projectId as string | undefined,
      manufacturerId: req.query.manufacturerId as string | undefined,
      status: req.query.status as any,
    },
    {
      cursor: req.query.cursor as string | undefined,
      limit: (req.query.limit as unknown as number) ?? 20,
    }
  );

  res.json({ success: true, data: result });
}));

// POST /api/v1/samples
router.post("/", validate(createSampleSchema), asyncHandler(async (req, res) => {
  const sample = await sampleService.create(req.body);

  await auditService.log({
    userId: req.user!.id,
    entityType: "sample",
    entityId: sample.id,
    action: "create",
  });

  res.status(201).json({ success: true, data: sample });
}));

// GET /api/v1/samples/:id
router.get("/:id", asyncHandler(async (req, res) => {
  const sample = await sampleService.getById(req.params.id as string);
  res.json({ success: true, data: sample });
}));

// PUT /api/v1/samples/:id
router.put("/:id", validate(updateSampleSchema), asyncHandler(async (req, res) => {
  const sample = await sampleService.update(req.params.id as string, req.body);

  await auditService.log({
    userId: req.user!.id,
    entityType: "sample",
    entityId: sample.id,
    action: "update",
    diffJson: req.body,
  });

  res.json({ success: true, data: sample });
}));

// DELETE /api/v1/samples/:id
router.delete("/:id", asyncHandler(async (req, res) => {
  await sampleService.delete(req.params.id as string);

  await auditService.log({
    userId: req.user!.id,
    entityType: "sample",
    entityId: req.params.id as string,
    action: "delete",
  });

  res.json({ success: true, data: null });
}));

// PUT /api/v1/samples/:id/status
router.put("/:id/status", validate(updateSampleStatusSchema), asyncHandler(async (req, res) => {
  const { status } = req.body;

  const sample = await sampleService.updateStatus(req.params.id as string, status);

  await auditService.log({
    userId: req.user!.id,
    entityType: "sample",
    entityId: sample.id,
    action: "status_change",
    diffJson: { status },
  });

  res.json({ success: true, data: sample });
}));

export default router;
