import { Router } from "express";
import { CommunicationService } from "../services/CommunicationService";
import { AuditService } from "../services/AuditService";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
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
router.get("/", validate(listCommunicationsQuery, "query"), asyncHandler(async (req, res) => {
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
}));

// POST /api/v1/communications
router.post("/", validate(createCommunicationSchema), asyncHandler(async (req, res) => {
  const communication = await communicationService.create(req.body);

  await auditService.log({
    userId: req.user!.id,
    entityType: "communication",
    entityId: communication.id,
    action: "create",
  });

  res.status(201).json({ success: true, data: communication });
}));

// POST /api/v1/communications/search
router.post("/search", validate(searchCommunicationsSchema), asyncHandler(async (req, res) => {
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
}));

// GET /api/v1/communications/thread/:manufacturerId/:projectId
router.get("/thread/:manufacturerId/:projectId", asyncHandler(async (req, res) => {
  const result = await communicationService.getThread(
    req.params.manufacturerId as string,
    req.params.projectId as string,
    {
      cursor: req.query.cursor as string | undefined,
      limit: parseInt(req.query.limit as string) || 50,
    }
  );

  res.json({ success: true, data: result });
}));

// GET /api/v1/communications/:id
router.get("/:id", asyncHandler(async (req, res) => {
  const communication = await communicationService.getById(req.params.id as string);
  res.json({ success: true, data: communication });
}));

export default router;
