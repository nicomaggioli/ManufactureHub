import { Router, Request, Response } from "express";
import { QuoteService } from "../services/QuoteService";
import { AuditService } from "../services/AuditService";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { NotFoundError } from "../services/ProjectService";
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
router.get("/", validate(listQuotesQuery, "query"), async (req: Request, res: Response) => {
  try {
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
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// GET /api/v1/quotes/compare/:projectId
router.get("/compare/:projectId", async (req: Request, res: Response) => {
  try {
    const comparison = await quoteService.compareByProject(req.params.projectId as string);
    res.json({ success: true, data: comparison });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// POST /api/v1/quotes
router.post("/", validate(createQuoteSchema), async (req: Request, res: Response) => {
  try {
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
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// GET /api/v1/quotes/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const quote = await quoteService.getById(req.params.id as string);
    res.json({ success: true, data: quote });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// PUT /api/v1/quotes/:id
router.put("/:id", validate(updateQuoteSchema), async (req: Request, res: Response) => {
  try {
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
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// DELETE /api/v1/quotes/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await quoteService.delete(req.params.id as string);

    await auditService.log({
      userId: req.user!.id,
      entityType: "quote",
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

// POST /api/v1/quotes/:id/accept
router.post("/:id/accept", async (req: Request, res: Response) => {
  try {
    const quote = await quoteService.accept(req.params.id as string);

    await auditService.log({
      userId: req.user!.id,
      entityType: "quote",
      entityId: quote.id,
      action: "status_change",
      diffJson: { status: "accepted" },
    });

    res.json({ success: true, data: quote });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

// POST /api/v1/quotes/:id/reject
router.post("/:id/reject", async (req: Request, res: Response) => {
  try {
    const quote = await quoteService.reject(req.params.id as string);

    await auditService.log({
      userId: req.user!.id,
      entityType: "quote",
      entityId: quote.id,
      action: "status_change",
      diffJson: { status: "rejected" },
    });

    res.json({ success: true, data: quote });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

export default router;
