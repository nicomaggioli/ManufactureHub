import { Prisma, ReminderType } from "@prisma/client";
import prisma from "../lib/prisma";
import { paginate, PaginatedResult, PaginationOptions } from "../utils/pagination";
import { NotFoundError } from "./ProjectService";

export interface CreateReminderInput {
  projectId: string;
  type: ReminderType;
  title?: string;
  dueAt: Date;
  recurrenceRule?: string;
}

export interface UpdateReminderInput {
  type?: ReminderType;
  title?: string;
  dueAt?: Date;
  recurrenceRule?: string;
}

export class ReminderService {
  async list(
    userId: string,
    filters: { projectId?: string; completed?: boolean } = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const where: Prisma.ReminderWhereInput = {
      userId,
      completed: filters.completed ?? false,
    };

    if (filters.projectId) where.projectId = filters.projectId;

    return paginate(
      prisma.reminder as any,
      {
        where,
        orderBy: { dueAt: "asc" },
        include: {
          project: { select: { id: true, title: true } },
        },
      },
      pagination
    );
  }

  /**
   * Return reminders due in the next 7 days for a user.
   */
  async listUpcoming(userId: string): Promise<any[]> {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return prisma.reminder.findMany({
      where: {
        userId,
        completed: false,
        dueAt: { gte: now, lte: sevenDaysLater },
        OR: [
          { snoozeUntil: null },
          { snoozeUntil: { lte: now } },
        ],
      },
      orderBy: { dueAt: "asc" },
      include: {
        project: { select: { id: true, title: true } },
      },
    });
  }

  async create(userId: string, input: CreateReminderInput) {
    return prisma.reminder.create({
      data: {
        userId,
        projectId: input.projectId,
        type: input.type,
        title: input.title,
        dueAt: input.dueAt,
        recurrenceRule: input.recurrenceRule,
      },
      include: {
        project: { select: { id: true, title: true } },
      },
    });
  }

  async update(id: string, userId: string, input: UpdateReminderInput) {
    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError("Reminder not found");
    }

    return prisma.reminder.update({
      where: { id },
      data: input,
      include: {
        project: { select: { id: true, title: true } },
      },
    });
  }

  async delete(id: string, userId: string) {
    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError("Reminder not found");
    }

    await prisma.reminder.delete({ where: { id } });
  }

  async markComplete(id: string, userId: string) {
    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError("Reminder not found");
    }

    return prisma.reminder.update({
      where: { id },
      data: { completed: true },
    });
  }

  /**
   * Snooze a reminder by a given number of minutes.
   */
  async snooze(id: string, userId: string, snoozeMinutes: number = 60) {
    const existing = await prisma.reminder.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError("Reminder not found");
    }

    const snoozeUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000);

    return prisma.reminder.update({
      where: { id },
      data: { snoozeUntil },
    });
  }
}
