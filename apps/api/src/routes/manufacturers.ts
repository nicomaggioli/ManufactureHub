import { Router } from "express";
import { ManufacturerService } from "../services/ManufacturerService";
import { AuditService } from "../services/AuditService";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  createManufacturerSchema,
  updateManufacturerSchema,
  listManufacturersQuery,
  compareManufacturersQuery,
  importManufacturersCsvSchema,
} from "../schemas";

const router = Router();
const manufacturerService = new ManufacturerService();
const auditService = new AuditService();

router.use(requireAuth);

// GET /api/v1/manufacturers
router.get("/", validate(listManufacturersQuery, "query"), asyncHandler(async (req, res) => {
  const filters = {
    search: req.query.search as string | undefined,
    country: req.query.country as string | undefined,
    certifications: req.query.certifications
      ? (req.query.certifications as string).split(",")
      : undefined,
    moqMin: req.query.moqMin as unknown as number | undefined,
    moqMax: req.query.moqMax as unknown as number | undefined,
    verified: req.query.verified as unknown as boolean | undefined,
    sustainabilityScoreMin: req.query.sustainabilityScoreMin as unknown as number | undefined,
  };

  const result = await manufacturerService.list(filters, {
    cursor: req.query.cursor as string | undefined,
    limit: (req.query.limit as unknown as number) ?? 20,
  });

  res.json({ success: true, data: result });
}));

// GET /api/v1/manufacturers/compare
router.get("/compare", validate(compareManufacturersQuery, "query"), asyncHandler(async (req, res) => {
  const ids = (req.query.ids as string)?.split(",").filter(Boolean) ?? [];
  const result = await manufacturerService.compare(ids);
  res.json({ success: true, data: result });
}));

// GET /api/v1/manufacturers/map-data
router.get("/map-data", asyncHandler(async (_req, res) => {
  const data = await manufacturerService.getMapData();
  res.json({ success: true, data });
}));

// POST /api/v1/manufacturers
router.post("/", validate(createManufacturerSchema), asyncHandler(async (req, res) => {
  const manufacturer = await manufacturerService.create(req.body);

  await auditService.log({
    userId: req.user!.id,
    entityType: "manufacturer",
    entityId: manufacturer.id,
    action: "create",
  });

  res.status(201).json({ success: true, data: manufacturer });
}));

// POST /api/v1/manufacturers/import-csv
router.post("/import-csv", validate(importManufacturersCsvSchema), asyncHandler(async (req, res) => {
  const { rows } = req.body;

  const result = await manufacturerService.bulkImportCsv(rows);

  await auditService.log({
    userId: req.user!.id,
    entityType: "manufacturer",
    entityId: "bulk-import",
    action: "create",
    diffJson: { imported: result.imported, errorCount: result.errors.length },
  });

  res.json({ success: true, data: result });
}));

// GET /api/v1/manufacturers/:id
router.get("/:id", asyncHandler(async (req, res) => {
  const manufacturer = await manufacturerService.getById(req.params.id as string);
  res.json({ success: true, data: manufacturer });
}));

// PUT /api/v1/manufacturers/:id
router.put("/:id", validate(updateManufacturerSchema), asyncHandler(async (req, res) => {
  const manufacturer = await manufacturerService.update(req.params.id as string, req.body);

  await auditService.log({
    userId: req.user!.id,
    entityType: "manufacturer",
    entityId: manufacturer.id,
    action: "update",
    diffJson: req.body,
  });

  res.json({ success: true, data: manufacturer });
}));

// DELETE /api/v1/manufacturers/:id
router.delete("/:id", asyncHandler(async (req, res) => {
  await manufacturerService.delete(req.params.id as string);

  await auditService.log({
    userId: req.user!.id,
    entityType: "manufacturer",
    entityId: req.params.id as string,
    action: "delete",
  });

  res.json({ success: true, data: null });
}));

export default router;
