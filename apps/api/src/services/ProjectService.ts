import { Prisma, ProjectStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { paginate, PaginatedResult, PaginationOptions } from "../utils/pagination";

export interface CreateProjectInput {
  title: string;
  description?: string;
  status?: ProjectStatus;
  targetLaunchDate?: Date;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  targetLaunchDate?: Date;
}

export interface ListProjectFilters {
  status?: ProjectStatus;
  archived?: boolean;
}

export class ProjectService {
  async list(
    userId: string,
    filters: ListProjectFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const where: Prisma.ProjectWhereInput = {
      userId,
      archived: filters.archived ?? false,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    return paginate(
      prisma.project as any,
      {
        where,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              communications: true,
              quotes: true,
              samples: true,
              designAssets: true,
            },
          },
        },
      },
      pagination
    );
  }

  async getById(id: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        teamMembers: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: {
          select: {
            communications: true,
            quotes: true,
            samples: true,
            designAssets: true,
            reminders: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    return project;
  }

  async create(userId: string, input: CreateProjectInput) {
    return prisma.project.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        status: input.status ?? "ideation",
        targetLaunchDate: input.targetLaunchDate,
      },
    });
  }

  async update(id: string, userId: string, input: UpdateProjectInput) {
    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError("Project not found");
    }

    return prisma.project.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string, userId: string) {
    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError("Project not found");
    }

    await prisma.project.delete({ where: { id } });
  }

  async archive(id: string, userId: string) {
    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError("Project not found");
    }

    return prisma.project.update({
      where: { id },
      data: { archived: true },
    });
  }

  async unarchive(id: string, userId: string) {
    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError("Project not found");
    }

    return prisma.project.update({
      where: { id },
      data: { archived: false },
    });
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
