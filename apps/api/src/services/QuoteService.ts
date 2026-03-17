import { Prisma, QuoteStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { paginate, PaginatedResult, PaginationOptions } from "../utils/pagination";
import { NotFoundError, ValidationError } from "../utils/errors";

export interface CreateQuoteInput {
  projectId: string;
  manufacturerId: string;
  unitPrice: number;
  currency?: string;
  moq?: number;
  leadTimeDays?: number;
  validityDate?: Date;
  notes?: string;
}

export interface UpdateQuoteInput {
  unitPrice?: number;
  currency?: string;
  moq?: number;
  leadTimeDays?: number;
  validityDate?: Date;
  notes?: string;
}

export class QuoteService {
  async list(
    filters: { projectId?: string; manufacturerId?: string; status?: QuoteStatus } = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const where: Prisma.QuoteWhereInput = {};

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.manufacturerId) where.manufacturerId = filters.manufacturerId;
    if (filters.status) where.status = filters.status;

    return paginate(
      prisma.quote as any,
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
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        manufacturer: { select: { id: true, name: true, country: true, moq: true } },
        project: { select: { id: true, title: true } },
      },
    });

    if (!quote) {
      throw new NotFoundError("Quote not found");
    }

    return quote;
  }

  async create(input: CreateQuoteInput) {
    return prisma.quote.create({
      data: {
        projectId: input.projectId,
        manufacturerId: input.manufacturerId,
        unitPrice: input.unitPrice,
        currency: input.currency ?? "USD",
        moq: input.moq,
        leadTimeDays: input.leadTimeDays,
        validityDate: input.validityDate,
        notes: input.notes,
        status: "pending",
      },
      include: {
        manufacturer: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
      },
    });
  }

  async update(id: string, input: UpdateQuoteInput) {
    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Quote not found");
    }

    return prisma.quote.update({
      where: { id },
      data: input,
      include: {
        manufacturer: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Quote not found");
    }

    await prisma.quote.delete({ where: { id } });
  }

  /**
   * Compare all quotes for a given project, grouped by manufacturer.
   */
  async compareByProject(projectId: string) {
    const quotes = await prisma.quote.findMany({
      where: { projectId },
      include: {
        manufacturer: {
          select: {
            id: true,
            name: true,
            country: true,
            rating: true,
            responseRate: true,
            sustainabilityScore: true,
          },
        },
      },
      orderBy: { unitPrice: "asc" },
    });

    if (quotes.length === 0) {
      return { quotes: [], summary: null };
    }

    const prices = quotes.map((q) => q.unitPrice);
    const summary = {
      count: quotes.length,
      lowestPrice: Math.min(...prices),
      highestPrice: Math.max(...prices),
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      shortestLeadTime: quotes
        .filter((q) => q.leadTimeDays != null)
        .reduce((min, q) => Math.min(min, q.leadTimeDays!), Infinity),
    };

    if (summary.shortestLeadTime === Infinity) {
      summary.shortestLeadTime = null as any;
    }

    return { quotes, summary };
  }

  async accept(id: string) {
    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Quote not found");
    }
    if (existing.status !== "pending") {
      throw new ValidationError("Only pending quotes can be accepted");
    }

    return prisma.quote.update({
      where: { id },
      data: { status: "accepted" },
    });
  }

  async reject(id: string) {
    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Quote not found");
    }
    if (existing.status !== "pending") {
      throw new ValidationError("Only pending quotes can be rejected");
    }

    return prisma.quote.update({
      where: { id },
      data: { status: "rejected" },
    });
  }
}
