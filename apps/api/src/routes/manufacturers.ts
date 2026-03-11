import { Router, Request, Response } from "express";
import { ManufacturerService, ValidationError } from "../services/ManufacturerService";
import { AuditService } from "../services/AuditService";
import { requireAuth } from "../middleware/auth";
import { NotFoundError } from "../services/ProjectService";

const router = Router();
const manufacturerService = new ManufacturerService();
const auditService = new AuditService();

router.use(requireAuth);

// GET /api/v1/manufacturers
router.get("/", async (req: Request, res: Response) => {
  try {
    const filters = {
      search: req.query.search as string | undefined,
      country: req.query.country as string | undefined,
      certifications: req.query.certifications
        ? (req.query.certifications as string).split(",")
        : undefined,
      moqMin: req.query.moqMin ? parseInt(req.query.moqMin as string) : undefined,
      moqMax: req.query.moqMax ? parseInt(req.query.moqMax as string) : undefined,
      verified: req.query.verified !== undefined ? (req.query.verified as string) === "true" : undefined,
      sustainabilityScoreMin: req.query.sustainabilityScoreMin
        ? parseFloat(req.query.sustainabilityScoreMin as string)
        : undefined,
    };

    const result = await manufacturerService.list(filters, {
      cursor: req.query.cursor as string | undefined,
      limit: parseInt(req.query.limit as string) || 20,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// GET /api/v1/manufacturers/compare
router.get("/compare", async (req: Request, res: Response) => {
  try {
    const ids = (req.query.ids as string)?.split(",").filter(Boolean) ?? [];
    const result = await manufacturerService.compare(ids);
    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof ValidationError) {
      res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: err.message } });
      return;
    }
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// GET /api/v1/manufacturers/map-data
router.get("/map-data", async (_req: Request, res: Response) => {
  try {
    const data = await manufacturerService.getMapData();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// POST /api/v1/manufacturers
router.post("/", async (req: Request, res: Response) => {
  try {
    const manufacturer = await manufacturerService.create(req.body);

    await auditService.log({
      userId: req.user!.id,
      entityType: "manufacturer",
      entityId: manufacturer.id,
      action: "create",
    });

    res.status(201).json({ success: true, data: manufacturer });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// POST /api/v1/manufacturers/import-csv
router.post("/import-csv", async (req: Request, res: Response) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows)) {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "body.rows must be an array" },
      });
      return;
    }

    const result = await manufacturerService.bulkImportCsv(rows);

    await auditService.log({
      userId: req.user!.id,
      entityType: "manufacturer",
      entityId: "bulk-import",
      action: "create",
      diffJson: { imported: result.imported, errorCount: result.errors.length },
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// GET /api/v1/manufacturers/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const manufacturer = await manufacturerService.getById(req.params.id as string);
    res.json({ success: true, data: manufacturer });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// PUT /api/v1/manufacturers/:id
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const manufacturer = await manufacturerService.update(req.params.id as string, req.body);

    await auditService.log({
      userId: req.user!.id,
      entityType: "manufacturer",
      entityId: manufacturer.id,
      action: "update",
      diffJson: req.body,
    });

    res.json({ success: true, data: manufacturer });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// DELETE /api/v1/manufacturers/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await manufacturerService.delete(req.params.id as string);

    await auditService.log({
      userId: req.user!.id,
      entityType: "manufacturer",
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

export default router;
