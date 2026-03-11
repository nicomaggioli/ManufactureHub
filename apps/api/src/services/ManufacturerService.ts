import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { paginate, PaginatedResult, PaginationOptions } from "../utils/pagination";
import { NotFoundError } from "./ProjectService";

export interface CreateManufacturerInput {
  name: string;
  country: string;
  city?: string;
  specialties?: string[];
  certifications?: string[];
  moq?: number;
  verified?: boolean;
  responseRate?: number;
  rating?: number;
  sustainabilityScore?: number;
  source?: "manual" | "alibaba";
  externalId?: string;
}

export interface UpdateManufacturerInput {
  name?: string;
  country?: string;
  city?: string;
  specialties?: string[];
  certifications?: string[];
  moq?: number;
  verified?: boolean;
  responseRate?: number;
  rating?: number;
  sustainabilityScore?: number;
}

export interface ManufacturerFilters {
  search?: string;
  country?: string;
  certifications?: string[];
  moqMin?: number;
  moqMax?: number;
  verified?: boolean;
  sustainabilityScoreMin?: number;
}

export class ManufacturerService {
  /**
   * List manufacturers with full-text search and multi-filter support.
   * Full-text search uses PostgreSQL tsvector on name and specialties.
   */
  async list(
    filters: ManufacturerFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    // If full-text search is requested, use raw SQL for tsvector ranking
    if (filters.search) {
      return this.fullTextSearch(filters, pagination);
    }

    const where: Prisma.ManufacturerWhereInput = {};

    if (filters.country) {
      where.country = filters.country;
    }
    if (filters.certifications && filters.certifications.length > 0) {
      where.certifications = { hasSome: filters.certifications };
    }
    if (filters.moqMin !== undefined || filters.moqMax !== undefined) {
      where.moq = {};
      if (filters.moqMin !== undefined) where.moq.gte = filters.moqMin;
      if (filters.moqMax !== undefined) where.moq.lte = filters.moqMax;
    }
    if (filters.verified !== undefined) {
      where.verified = filters.verified;
    }
    if (filters.sustainabilityScoreMin !== undefined) {
      where.sustainabilityScore = { gte: filters.sustainabilityScoreMin };
    }

    return paginate(
      prisma.manufacturer as any,
      {
        where,
        orderBy: { createdAt: "desc" },
        include: {
          contacts: true,
          _count: {
            select: { quotes: true, samples: true, communications: true },
          },
        },
      },
      pagination
    );
  }

  /**
   * Full-text search using PostgreSQL tsvector on name and specialties array.
   */
  private async fullTextSearch(
    filters: ManufacturerFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<any>> {
    const searchQuery = filters.search!
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w + ":*")
      .join(" & ");

    const limit = Math.min(Math.max(1, pagination.limit ?? 20), 100);
    const params: any[] = [searchQuery, limit + 1];

    let whereClause = `
      WHERE (
        to_tsvector('english', m.name || ' ' || array_to_string(m.specialties, ' '))
        @@ to_tsquery('english', $1)
      )
    `;

    let paramIdx = 3;

    if (filters.country) {
      whereClause += ` AND m.country = $${paramIdx}`;
      params.push(filters.country);
      paramIdx++;
    }
    if (filters.verified !== undefined) {
      whereClause += ` AND m.verified = $${paramIdx}`;
      params.push(filters.verified);
      paramIdx++;
    }
    if (filters.moqMin !== undefined) {
      whereClause += ` AND m.moq >= $${paramIdx}`;
      params.push(filters.moqMin);
      paramIdx++;
    }
    if (filters.moqMax !== undefined) {
      whereClause += ` AND m.moq <= $${paramIdx}`;
      params.push(filters.moqMax);
      paramIdx++;
    }
    if (filters.sustainabilityScoreMin !== undefined) {
      whereClause += ` AND m."sustainabilityScore" >= $${paramIdx}`;
      params.push(filters.sustainabilityScoreMin);
      paramIdx++;
    }

    if (pagination.cursor) {
      whereClause += ` AND m.id > $${paramIdx}`;
      params.push(pagination.cursor);
      paramIdx++;
    }

    const sql = `
      SELECT m.*,
        ts_rank(
          to_tsvector('english', m.name || ' ' || array_to_string(m.specialties, ' ')),
          to_tsquery('english', $1)
        ) AS rank
      FROM manufacturers m
      ${whereClause}
      ORDER BY rank DESC, m."createdAt" DESC
      LIMIT $2
    `;

    const rows: any[] = await prisma.$queryRawUnsafe(sql, ...params);

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, nextCursor, hasMore };
  }

  async getById(id: string) {
    const manufacturer = await prisma.manufacturer.findUnique({
      where: { id },
      include: {
        contacts: true,
        _count: {
          select: { quotes: true, samples: true, communications: true },
        },
      },
    });

    if (!manufacturer) {
      throw new NotFoundError("Manufacturer not found");
    }

    return manufacturer;
  }

  async create(input: CreateManufacturerInput) {
    return prisma.manufacturer.create({
      data: {
        name: input.name,
        country: input.country,
        city: input.city,
        specialties: input.specialties ?? [],
        certifications: input.certifications ?? [],
        moq: input.moq,
        verified: input.verified ?? false,
        responseRate: input.responseRate,
        rating: input.rating,
        sustainabilityScore: input.sustainabilityScore,
        source: input.source ?? "manual",
        externalId: input.externalId,
      },
    });
  }

  async update(id: string, input: UpdateManufacturerInput) {
    const existing = await prisma.manufacturer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Manufacturer not found");
    }

    return prisma.manufacturer.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string) {
    const existing = await prisma.manufacturer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Manufacturer not found");
    }

    await prisma.manufacturer.delete({ where: { id } });
  }

  /**
   * Side-by-side comparison of up to 4 manufacturers.
   */
  async compare(ids: string[]) {
    if (ids.length < 2 || ids.length > 4) {
      throw new ValidationError("Comparison requires 2 to 4 manufacturer IDs");
    }

    const manufacturers = await prisma.manufacturer.findMany({
      where: { id: { in: ids } },
      include: {
        contacts: true,
        _count: {
          select: { quotes: true, samples: true, communications: true },
        },
      },
    });

    if (manufacturers.length !== ids.length) {
      throw new NotFoundError("One or more manufacturers not found");
    }

    return manufacturers;
  }

  /**
   * Bulk import manufacturers from CSV data.
   * Expects an array of parsed CSV rows.
   */
  async bulkImportCsv(
    rows: CreateManufacturerInput[]
  ): Promise<{ imported: number; errors: Array<{ row: number; error: string }> }> {
    const errors: Array<{ row: number; error: string }> = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.name || !row.country) {
          errors.push({ row: i + 1, error: "name and country are required" });
          continue;
        }

        await prisma.manufacturer.create({
          data: {
            name: row.name,
            country: row.country,
            city: row.city,
            specialties: row.specialties ?? [],
            certifications: row.certifications ?? [],
            moq: row.moq,
            verified: row.verified ?? false,
            responseRate: row.responseRate,
            rating: row.rating,
            sustainabilityScore: row.sustainabilityScore,
            source: row.source ?? "manual",
            externalId: row.externalId,
          },
        });
        imported++;
      } catch (err: any) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    return { imported, errors };
  }

  /**
   * Return manufacturer data suitable for map visualization (id, name, country, city, coordinates placeholder).
   */
  async getMapData() {
    return prisma.manufacturer.findMany({
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
        specialties: true,
        verified: true,
        sustainabilityScore: true,
      },
    });
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
