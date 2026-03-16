import { Router, Request, Response } from "express";
import { CommunicationService } from "../services/CommunicationService";
import { AuditService } from "../services/AuditService";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { NotFoundError } from "../services/ProjectService";
import {
  createCommunicationSchema,
  listCommunicationsQuery,
  searchCommunicationsSchema,
} from "../schemas";

const router = Router();
const communicationService = new CommunicationService();
const auditService = new AuditService();

router.use(requireAuth);

// GET /api/v1/communications
router.get("/", validate(listCommunicationsQuery, "query"), async (req: Request, res: Response) => {
  try {
    const result = await communicationService.list(
      {
        projectId: req.query.projectId as string | undefined,
        manufacturerId: req.query.manufacturerId as string | undefined,
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

// POST /api/v1/communications
router.post("/", validate(createCommunicationSchema), async (req: Request, res: Response) => {
  try {
    const communication = await communicationService.create(req.body);

    await auditService.log({
      userId: req.user!.id,
      entityType: "communication",
      entityId: communication.id,
      action: "create",
    });

    res.status(201).json({ success: true, data: communication });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// POST /api/v1/communications/search
router.post("/search", validate(searchCommunicationsSchema), async (req: Request, res: Response) => {
  try {
    const { keyword, dateFrom, dateTo, projectId, manufacturerId, cursor, limit } = req.body;

    const result = await communicationService.search(
      {
        keyword,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        projectId,
        manufacturerId,
      },
      { cursor, limit }
    );

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

// GET /api/v1/communications/thread/:manufacturerId/:projectId
router.get("/thread/:manufacturerId/:projectId", async (req: Request, res: Response) => {
  try {
    const result = await communicationService.getThread(
      req.params.manufacturerId as string,
      req.params.projectId as string,
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

// GET /api/v1/communications/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const communication = await communicationService.getById(req.params.id as string);
    res.json({ success: true, data: communication });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: err.message } });
      return;
    }
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: err.message } });
  }
});

export default router;
