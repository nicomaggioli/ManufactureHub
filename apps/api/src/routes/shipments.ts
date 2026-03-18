import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import prisma from "../lib/prisma";
import {
  createShipmentSchema,
  updateShipmentStatusSchema,
  listShipmentsQuery,
} from "../schemas";

const router = Router();

router.use(requireAuth);

// GET /api/v1/shipments
router.get("/", validate(listShipmentsQuery, "query"), asyncHandler(async (req, res) => {
  const { projectId, manufacturerId, status, cursor, limit } = req.query as any;
  const userId = req.user!.id;

  const where: any = {
    project: { userId },
    ...(projectId && { projectId }),
    ...(manufacturerId && { manufacturerId }),
    ...(status && { status }),
  };

  const shipments = await prisma.shipment.findMany({
    where,
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { shipDate: "desc" },
    include: {
      project: { select: { id: true, title: true } },
      manufacturer: { select: { id: true, name: true } },
    },
  });

  const hasMore = shipments.length > limit;
  const data = hasMore ? shipments.slice(0, -1) : shipments;

  res.json({
    success: true,
    data: {
      data: data.map((s) => ({
        ...s,
        projectName: s.project.title,
        manufacturerName: s.manufacturer.name,
      })),
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    },
  });
}));

// GET /api/v1/shipments/:id
router.get("/:id", asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const shipment = await prisma.shipment.findFirst({
    where: { id: req.params.id, project: { userId } },
    include: {
      project: { select: { id: true, title: true } },
      manufacturer: { select: { id: true, name: true } },
    },
  });

  if (!shipment) {
    res.status(404).json({ success: false, message: "Shipment not found" });
    return;
  }

  res.json({
    success: true,
    data: {
      ...shipment,
      projectName: shipment.project.title,
      manufacturerName: shipment.manufacturer.name,
    },
  });
}));

// POST /api/v1/shipments
router.post("/", validate(createShipmentSchema), asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { projectId, manufacturerId, sampleId, itemName, courier, trackingNumber, shipDate, estimatedDelivery } = req.body;

  // Verify project ownership
  const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
  if (!project) {
    res.status(403).json({ success: false, message: "Not authorized to access this project" });
    return;
  }

  const shipment = await prisma.shipment.create({
    data: {
      projectId,
      manufacturerId,
      sampleId,
      itemName,
      courier,
      trackingNumber,
      shipDate: new Date(shipDate),
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
    },
  });

  res.status(201).json({ success: true, data: shipment });
}));

// PUT /api/v1/shipments/:id/status
router.put("/:id/status", validate(updateShipmentStatusSchema), asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { status, actualDelivery } = req.body;

  const existing = await prisma.shipment.findFirst({
    where: { id: req.params.id, project: { userId } },
  });

  if (!existing) {
    res.status(404).json({ success: false, message: "Shipment not found" });
    return;
  }

  const shipment = await prisma.shipment.update({
    where: { id: req.params.id },
    data: {
      status,
      ...(status === "delivered" && { actualDelivery: actualDelivery ? new Date(actualDelivery) : new Date() }),
    },
  });

  res.json({ success: true, data: shipment });
}));

// DELETE /api/v1/shipments/:id
router.delete("/:id", asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const existing = await prisma.shipment.findFirst({
    where: { id: req.params.id, project: { userId } },
  });

  if (!existing) {
    res.status(404).json({ success: false, message: "Shipment not found" });
    return;
  }

  await prisma.shipment.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: null });
}));

export default router;
