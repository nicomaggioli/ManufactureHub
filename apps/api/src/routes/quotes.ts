import { Router } from "express";
import { QuoteService } from "../services/QuoteService";
import { AuditService } from "../services/AuditService";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  createQuoteSchema,
  updateQuoteSchema,
  listQuotesQuery,
} from "../schemas";

const router = Router();
const quoteService = new QuoteService();
const auditService = new AuditService();

router.use(requireAuth);

// GET /api/v1/quotes
router.get("/", validate(listQuotesQuery, "query"), asyncHandler(async (req, res) => {
  const result = await quoteService.list(
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

// GET /api/v1/quotes/compare/:projectId
router.get("/compare/:projectId", asyncHandler(async (req, res) => {
  const comparison = await quoteService.compareByProject(req.params.projectId as string);
  res.json({ success: true, data: comparison });
}));

// POST /api/v1/quotes
router.post("/", validate(createQuoteSchema), asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.validityDate) data.validityDate = new Date(data.validityDate);

  const quote = await quoteService.create(data);

  await auditService.log({
    userId: req.user!.id,
    entityType: "quote",
    entityId: quote.id,
    action: "create",
  });

  res.status(201).json({ success: true, data: quote });
}));

// GET /api/v1/quotes/:id
router.get("/:id", asyncHandler(async (req, res) => {
  const quote = await quoteService.getById(req.params.id as string);
  res.json({ success: true, data: quote });
}));

// PUT /api/v1/quotes/:id
router.put("/:id", validate(updateQuoteSchema), asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.validityDate) data.validityDate = new Date(data.validityDate);

  const quote = await quoteService.update(req.params.id as string, data);

  await auditService.log({
    userId: req.user!.id,
    entityType: "quote",
    entityId: quote.id,
    action: "update",
    diffJson: req.body,
  });

  res.json({ success: true, data: quote });
}));

// DELETE /api/v1/quotes/:id
router.delete("/:id", asyncHandler(async (req, res) => {
  await quoteService.delete(req.params.id as string);

  await auditService.log({
    userId: req.user!.id,
    entityType: "quote",
    entityId: req.params.id as string,
    action: "delete",
  });

  res.json({ success: true, data: null });
}));

// POST /api/v1/quotes/:id/accept
router.post("/:id/accept", asyncHandler(async (req, res) => {
  const quote = await quoteService.accept(req.params.id as string);

  await auditService.log({
    userId: req.user!.id,
    entityType: "quote",
    entityId: quote.id,
    action: "status_change",
    diffJson: { status: "accepted" },
  });

  res.json({ success: true, data: quote });
}));

// POST /api/v1/quotes/:id/reject
router.post("/:id/reject", asyncHandler(async (req, res) => {
  const quote = await quoteService.reject(req.params.id as string);

  await auditService.log({
    userId: req.user!.id,
    entityType: "quote",
    entityId: quote.id,
    action: "status_change",
    diffJson: { status: "rejected" },
  });

  res.json({ success: true, data: quote });
}));

export default router;
