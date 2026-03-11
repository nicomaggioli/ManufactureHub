import { Prisma, SampleStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { paginate, PaginatedResult, PaginationOptions } from "../utils/pagination";
import { NotFoundError } from "./ProjectService";

export interface CreateSampleInput {
  projectId: string;
  manufacturerId: string;
  trackingNumber?: string;
  notes?: string;
  photos?: string[];
}

export interface UpdateSampleInput {
  trackingNumber?: string;
  notes?: string;
  photos?: string[];
}

export class SampleService {
  async list(
    filters: { projectId?: string; manufacturerId?: string; status?: SampleStatus } = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const where: Prisma.SampleWhereInput = {};

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.manufacturerId) where.manufacturerId = filters.manufacturerId;
    if (filters.status) where.status = filters.status;

    return paginate(
      prisma.sample as any,
      {
        where,
        orderBy: { createdAt: "desc" },
        include: {
          manufacturer: { select: { id: true, name: true, country: true } },
          project: { select: { id: true, title: true } },
        },
      },
      pagination
    );
  }

  async getById(id: string) {
    const sample = await prisma.sample.findUnique({
      where: { id },
      include: {
        manufacturer: { select: { id: true, name: true, country: true } },
        project: { select: { id: true, title: true } },
      },
    });

    if (!sample) {
      throw new NotFoundError("Sample not found");
    }

    return sample;
  }

  async create(input: CreateSampleInput) {
    return prisma.sample.create({
      data: {
        projectId: input.projectId,
        manufacturerId: input.manufacturerId,
        trackingNumber: input.trackingNumber,
        notes: input.notes,
        photos: input.photos ?? [],
        status: "requested",
      },
      include: {
        manufacturer: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
      },
    });
  }

  async update(id: string, input: UpdateSampleInput) {
    const existing = await prisma.sample.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Sample not found");
    }

    return prisma.sample.update({
      where: { id },
      data: input,
      include: {
        manufacturer: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    const existing = await prisma.sample.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Sample not found");
    }

    await prisma.sample.delete({ where: { id } });
  }

  /**
   * Update sample status with appropriate side-effects (e.g., set receivedAt).
   */
  async updateStatus(id: string, status: SampleStatus) {
    const existing = await prisma.sample.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Sample not found");
    }

    const data: Prisma.SampleUpdateInput = { status };

    // Auto-set receivedAt when status transitions to received/approved/rejected
    if (
      ["received", "approved", "rejected"].includes(status) &&
      !existing.receivedAt
    ) {
      data.receivedAt = new Date();
    }

    return prisma.sample.update({
      where: { id },
      data,
      include: {
        manufacturer: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
      },
    });
  }
}
