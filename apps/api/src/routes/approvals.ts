import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import prisma from "../lib/prisma";
import {
  createApprovalSchema,
  updateApprovalStatusSchema,
  listApprovalsQuery,
} from "../schemas";

const router = Router();

router.use(requireAuth);

// GET /api/v1/approvals
router.get("/", validate(listApprovalsQuery, "query"), asyncHandler(async (req, res) => {
  const { projectId, status, cursor, limit } = req.query as any;
  const userId = req.user!.id;

  const where: any = {
    project: { userId },
    ...(projectId && { projectId }),
    ...(status && { status }),
  };

  const approvals = await prisma.approval.findMany({
    where,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { sentAt: "desc" },
    include: { project: { select: { id: true, title: true } } },
  });

  const hasMore = approvals.length > limit;
  const data = hasMore ? approvals.slice(0, -1) : approvals;

  res.json({
    success: true,
    data: {
      data: data.map((a) => ({
        ...a,
        projectName: a.project.title,
      })),
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    },
  });
}));

// GET /api/v1/approvals/:id
router.get("/:id", asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const approval = await prisma.approval.findFirst({
    where: { id: req.params.id, project: { userId } },
    include: { project: { select: { id: true, title: true } } },
  });

  if (!approval) {
    res.status(404).json({ success: false, message: "Approval not found" });
    return;
  }

  res.json({ success: true, data: { ...approval, projectName: approval.project.title } });
}));

// POST /api/v1/approvals
router.post("/", validate(createApprovalSchema), asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { projectId, deliverableName, type, clientName } = req.body;

  // Verify project ownership
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) {
    res.status(403).json({ success: false, message: "Not authorized to access this project" });
    return;
  }

  const approval = await prisma.approval.create({
    data: { projectId, deliverableName, type, clientName },
  });

  res.status(201).json({ success: true, data: approval });
}));

// PUT /api/v1/approvals/:id/status
router.put("/:id/status", validate(updateApprovalStatusSchema), asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { status, feedback } = req.body;

  const existing = await prisma.approval.findFirst({
    where: { id: req.params.id, project: { userId } },
  });

  if (!existing) {
    res.status(404).json({ success: false, message: "Approval not found" });
    return;
  }

  const approval = await prisma.approval.update({
    where: { id: req.params.id },
    data: {
      status,
      feedback: feedback ?? null,
      respondedAt: new Date(),
    },
  });

  res.json({ success: true, data: approval });
}));

// DELETE /api/v1/approvals/:id
router.delete("/:id", asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const existing = await prisma.approval.findFirst({
    where: { id: req.params.id, project: { userId } },
  });

  if (!existing) {
    res.status(404).json({ success: false, message: "Approval not found" });
    return;
  }

  await prisma.approval.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: null });
}));

export default router;
