import { Router } from "express";
import { UploadService } from "../services/UploadService";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { z } from "zod";
import { validate } from "../middleware/validate";

const router = Router();
const uploadService = new UploadService();

router.use(requireAuth);

const presignedUrlSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  folder: z.string().optional(),
});

// POST /api/v1/uploads/presigned-url
router.post("/presigned-url", validate(presignedUrlSchema), asyncHandler(async (req, res) => {
  const { fileName, contentType, folder } = req.body;
  const result = await uploadService.getPresignedUploadUrl({
    userId: req.user!.id,
    fileName,
    contentType,
    folder,
  });
  res.json({ success: true, data: result });
}));

export default router;
