import { Router } from "express";
import { DesignAssetService } from "../services/DesignAssetService";
import { AuditService } from "../services/AuditService";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  createDesignAssetSchema,
  updateDesignAssetSchema,
  listDesignAssetsQuery,
  createMoodboardItemSchema,
  updateMoodboardItemSchema,
} from "../schemas";

const router = Router();
const designAssetService = new DesignAssetService();
const auditService = new AuditService();

router.use(requireAuth);

// ─── Design Assets ───

// GET /api/v1/design/assets
router.get("/assets", validate(listDesignAssetsQuery, "query"), asyncHandler(async (req, res) => {
  const result = await designAssetService.listAssets(
    {
      projectId: req.query.projectId as string | undefined,
      userId: req.query.userId as string | undefined,
      type: req.query.type as any,
    },
    {
      cursor: req.query.cursor as string | undefined,
      limit: (req.query.limit as unknown as number) ?? 20,
    }
  );

  res.json({ success: true, data: result });
}));

// POST /api/v1/design/assets
router.post("/assets", validate(createDesignAssetSchema), asyncHandler(async (req, res) => {
  const asset = await designAssetService.createAsset(req.user!.id, req.body);

  await auditService.log({
    userId: req.user!.id,
    entityType: "design_asset",
    entityId: asset.id,
    action: "create",
  });

  res.status(201).json({ success: true, data: asset });
}));

// GET /api/v1/design/assets/:id
router.get("/assets/:id", asyncHandler(async (req, res) => {
  const asset = await designAssetService.getAssetById(req.params.id as string);
  res.json({ success: true, data: asset });
}));

// PUT /api/v1/design/assets/:id
router.put("/assets/:id", validate(updateDesignAssetSchema), asyncHandler(async (req, res) => {
  const asset = await designAssetService.updateAsset(req.params.id as string, req.user!.id, req.body);

  await auditService.log({
    userId: req.user!.id,
    entityType: "design_asset",
    entityId: asset.id,
    action: "update",
    diffJson: req.body,
  });

  res.json({ success: true, data: asset });
}));

// DELETE /api/v1/design/assets/:id
router.delete("/assets/:id", asyncHandler(async (req, res) => {
  await designAssetService.deleteAsset(req.params.id as string, req.user!.id);

  await auditService.log({
    userId: req.user!.id,
    entityType: "design_asset",
    entityId: req.params.id as string,
    action: "delete",
  });

  res.json({ success: true, data: null });
}));

// ─── Moodboard Items ───

// NOTE: /moodboard/item/:id routes MUST come before /moodboard/:designAssetId
// to avoid Express matching "item" as a :designAssetId parameter.

// GET /api/v1/design/moodboard/item/:id
router.get("/moodboard/item/:id", asyncHandler(async (req, res) => {
  const item = await designAssetService.getMoodboardItemById(req.params.id as string);
  res.json({ success: true, data: item });
}));

// PUT /api/v1/design/moodboard/item/:id
router.put("/moodboard/item/:id", validate(updateMoodboardItemSchema), asyncHandler(async (req, res) => {
  const item = await designAssetService.updateMoodboardItem(req.params.id as string, req.body);

  await auditService.log({
    userId: req.user!.id,
    entityType: "moodboard_item",
    entityId: item.id,
    action: "update",
    diffJson: req.body,
  });

  res.json({ success: true, data: item });
}));

// DELETE /api/v1/design/moodboard/item/:id
router.delete("/moodboard/item/:id", asyncHandler(async (req, res) => {
  await designAssetService.deleteMoodboardItem(req.params.id as string);

  await auditService.log({
    userId: req.user!.id,
    entityType: "moodboard_item",
    entityId: req.params.id as string,
    action: "delete",
  });

  res.json({ success: true, data: null });
}));

// GET /api/v1/design/moodboard/:designAssetId
router.get("/moodboard/:designAssetId", asyncHandler(async (req, res) => {
  const result = await designAssetService.listMoodboardItems(
    req.params.designAssetId as string,
    {
      cursor: req.query.cursor as string | undefined,
      limit: parseInt(req.query.limit as string) || 50,
    }
  );

  res.json({ success: true, data: result });
}));

// POST /api/v1/design/moodboard
router.post("/moodboard", validate(createMoodboardItemSchema), asyncHandler(async (req, res) => {
  const item = await designAssetService.createMoodboardItem(req.body);

  await auditService.log({
    userId: req.user!.id,
    entityType: "moodboard_item",
    entityId: item.id,
    action: "create",
  });

  res.status(201).json({ success: true, data: item });
}));

export default router;
