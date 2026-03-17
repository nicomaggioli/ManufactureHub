import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { NotFoundError } from "../utils/errors";

const TECH_PACK_INCLUDE = {
  materials: { orderBy: { sortOrder: "asc" as const } },
  measurements: { orderBy: { sortOrder: "asc" as const } },
  construction: { orderBy: { sortOrder: "asc" as const } },
  colorways: { orderBy: { sortOrder: "asc" as const } },
  labels: { orderBy: { sortOrder: "asc" as const } },
};

export interface CreateTechPackInput {
  projectId: string;
  name: string;
  category?: string;
  season?: string;
  status?: string;
  materials?: Array<{
    name: string;
    type: string;
    composition?: string;
    color?: string;
    colorCode?: string;
    supplier?: string;
    costPerUnit?: number;
    unit?: string;
    placement?: string;
    sortOrder?: number;
  }>;
  measurements?: Array<{
    pointOfMeasure: string;
    sizes: Record<string, number>;
    tolerance?: number;
    sortOrder?: number;
  }>;
  construction?: Array<{
    title: string;
    value: string;
    category?: string;
    notes?: string;
    sortOrder?: number;
  }>;
  colorways?: Array<{
    name: string;
    hexCode: string;
    pantoneRef?: string;
    status?: string;
    sortOrder?: number;
  }>;
  labels?: Array<{
    type: string;
    text?: string;
    placement?: string;
    careSymbols?: string[];
    sortOrder?: number;
  }>;
}

export interface UpdateTechPackInput {
  name?: string;
  category?: string;
  season?: string;
  status?: string;
  materials?: CreateTechPackInput["materials"];
  measurements?: CreateTechPackInput["measurements"];
  construction?: CreateTechPackInput["construction"];
  colorways?: CreateTechPackInput["colorways"];
  labels?: CreateTechPackInput["labels"];
}

export class TechPackService {
  async list(projectId: string) {
    return prisma.techPack.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: TECH_PACK_INCLUDE,
    });
  }

  async getById(id: string) {
    const techPack = await prisma.techPack.findUnique({
      where: { id },
      include: {
        ...TECH_PACK_INCLUDE,
        project: { select: { id: true, title: true } },
      },
    });

    if (!techPack) {
      throw new NotFoundError("Tech pack not found");
    }

    return techPack;
  }

  async create(userId: string, input: CreateTechPackInput) {
    return prisma.techPack.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        category: input.category,
        season: input.season,
        status: input.status ?? "draft",
        materials: input.materials?.length
          ? { create: input.materials }
          : undefined,
        measurements: input.measurements?.length
          ? { create: input.measurements }
          : undefined,
        construction: input.construction?.length
          ? { create: input.construction }
          : undefined,
        colorways: input.colorways?.length
          ? { create: input.colorways }
          : undefined,
        labels: input.labels?.length
          ? { create: input.labels }
          : undefined,
      },
      include: TECH_PACK_INCLUDE,
    });
  }

  async update(id: string, input: UpdateTechPackInput) {
    const existing = await prisma.techPack.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Tech pack not found");
    }

    const { materials, measurements, construction, colorways, labels, ...fields } = input;

    return prisma.$transaction(async (tx) => {
      // Replace nested collections if provided
      if (materials !== undefined) {
        await tx.techPackMaterial.deleteMany({ where: { techPackId: id } });
        if (materials.length) {
          await tx.techPackMaterial.createMany({
            data: materials.map((m) => ({ ...m, techPackId: id })),
          });
        }
      }

      if (measurements !== undefined) {
        await tx.techPackMeasurement.deleteMany({ where: { techPackId: id } });
        if (measurements.length) {
          await tx.techPackMeasurement.createMany({
            data: measurements.map((m) => ({ ...m, techPackId: id })),
          });
        }
      }

      if (construction !== undefined) {
        await tx.techPackConstruction.deleteMany({ where: { techPackId: id } });
        if (construction.length) {
          await tx.techPackConstruction.createMany({
            data: construction.map((c) => ({ ...c, techPackId: id })),
          });
        }
      }

      if (colorways !== undefined) {
        await tx.techPackColorway.deleteMany({ where: { techPackId: id } });
        if (colorways.length) {
          await tx.techPackColorway.createMany({
            data: colorways.map((c) => ({ ...c, techPackId: id })),
          });
        }
      }

      if (labels !== undefined) {
        await tx.techPackLabel.deleteMany({ where: { techPackId: id } });
        if (labels.length) {
          await tx.techPackLabel.createMany({
            data: labels.map((l) => ({ ...l, techPackId: id })),
          });
        }
      }

      // Update top-level fields
      return tx.techPack.update({
        where: { id },
        data: fields,
        include: TECH_PACK_INCLUDE,
      });
    });
  }

  async delete(id: string) {
    const existing = await prisma.techPack.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Tech pack not found");
    }

    await prisma.techPack.delete({ where: { id } });
  }

  async duplicate(id: string, newName: string) {
    const source = await prisma.techPack.findUnique({
      where: { id },
      include: TECH_PACK_INCLUDE,
    });

    if (!source) {
      throw new NotFoundError("Tech pack not found");
    }

    return prisma.techPack.create({
      data: {
        projectId: source.projectId,
        name: newName,
        category: source.category,
        season: source.season,
        status: "draft",
        materials: source.materials.length
          ? {
              create: source.materials.map(({ id: _id, techPackId: _tp, createdAt: _ca, ...rest }) => rest),
            }
          : undefined,
        measurements: source.measurements.length
          ? {
              create: source.measurements.map(({ id: _id, techPackId: _tp, createdAt: _ca, ...rest }) => ({
                ...rest,
                sizes: rest.sizes as Prisma.InputJsonValue,
              })),
            }
          : undefined,
        construction: source.construction.length
          ? {
              create: source.construction.map(({ id: _id, techPackId: _tp, createdAt: _ca, ...rest }) => rest),
            }
          : undefined,
        colorways: source.colorways.length
          ? {
              create: source.colorways.map(({ id: _id, techPackId: _tp, createdAt: _ca, ...rest }) => rest),
            }
          : undefined,
        labels: source.labels.length
          ? {
              create: source.labels.map(({ id: _id, techPackId: _tp, createdAt: _ca, ...rest }) => rest),
            }
          : undefined,
      },
      include: TECH_PACK_INCLUDE,
    });
  }
}
