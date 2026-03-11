import { Router, Request, Response } from "express";
import { DesignAssetService } from "../services/DesignAssetService";
import { AuditService } from "../services/AuditService";
import { requireAuth } from "../middleware/auth";
import { NotFoundError } from "../services/ProjectService";

const router = Router();
const designAssetService = new DesignAssetService();
const auditService = new AuditService();

router.use(requireAuth);

// ─── Design Assets ───

// GET /api/v1/design/assets
router.get("/assets", async (req: Request, res: Response) => {
  try {
    const result = await designAssetService.listAssets(
      {
        projectId: req.query.projectId as string | undefined,
        userId: req.query.userId as string | undefined,
        type: req.query.type as any,
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

// POST /api/v1/design/assets
router.post("/assets", async (req: Request, res: Response) => {
  try {
    const asset = await designAssetService.createAsset(req.user!.id, req.body);

    await auditService.log({
      userId: req.user!.id,
      entityType: "design_asset",
      entityId: asset.id,
      action: "create",
    });

    res.status(201).json({ success: true, data: asset });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// GET /api/v1/design/assets/:id
router.get("/assets/:id", async (req: Request, res: Response) => {
  try {
    const asset = await designAssetService.getAssetById(req.params.id as string);
    res.json({ success: true, data: asset });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// PUT /api/v1/design/assets/:id
router.put("/assets/:id", async (req: Request, res: Response) => {
  try {
    const asset = await designAssetService.updateAsset(req.params.id as string, req.user!.id, req.body);

    await auditService.log({
      userId: req.user!.id,
      entityType: "design_asset",
      entityId: asset.id,
      action: "update",
      diffJson: req.body,
    });

    res.json({ success: true, data: asset });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// DELETE /api/v1/design/assets/:id
router.delete("/assets/:id", async (req: Request, res: Response) => {
  try {
    await designAssetService.deleteAsset(req.params.id as string, req.user!.id);

    await auditService.log({
      userId: req.user!.id,
      entityType: "design_asset",
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

// ─── Moodboard Items ───

// GET /api/v1/design/moodboard/:designAssetId
router.get("/moodboard/:designAssetId", async (req: Request, res: Response) => {
  try {
    const result = await designAssetService.listMoodboardItems(
      req.params.designAssetId as string,
      {
        cursor: req.query.cursor as string | undefined,
        limit: parseInt(req.query.limit as string) || 50,
      }
    );

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// POST /api/v1/design/moodboard
router.post("/moodboard", async (req: Request, res: Response) => {
  try {
    const item = await designAssetService.createMoodboardItem(req.body);

    await auditService.log({
      userId: req.user!.id,
      entityType: "moodboard_item",
      entityId: item.id,
      action: "create",
    });

    res.status(201).json({ success: true, data: item });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// GET /api/v1/design/moodboard/item/:id
router.get("/moodboard/item/:id", async (req: Request, res: Response) => {
  try {
    const item = await designAssetService.getMoodboardItemById(req.params.id as string);
    res.json({ success: true, data: item });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// PUT /api/v1/design/moodboard/item/:id
router.put("/moodboard/item/:id", async (req: Request, res: Response) => {
  try {
    const item = await designAssetService.updateMoodboardItem(req.params.id as string, req.body);

    await auditService.log({
      userId: req.user!.id,
      entityType: "moodboard_item",
      entityId: item.id,
      action: "update",
      diffJson: req.body,
    });

    res.json({ success: true, data: item });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// DELETE /api/v1/design/moodboard/item/:id
router.delete("/moodboard/item/:id", async (req: Request, res: Response) => {
  try {
    await designAssetService.deleteMoodboardItem(req.params.id as string);

    await auditService.log({
      userId: req.user!.id,
      entityType: "moodboard_item",
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
