import { Prisma, CommunicationDirection, CommunicationStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { paginate, PaginatedResult, PaginationOptions } from "../utils/pagination";
import { NotFoundError } from "../utils/errors";
import { EmailService } from "./EmailService";

export interface CreateCommunicationInput {
  projectId: string;
  manufacturerId: string;
  contactId?: string;
  subject?: string;
  body: string;
  direction: CommunicationDirection;
  status?: CommunicationStatus;
  sentAt?: Date;
  followUpDueAt?: Date;
}

export interface SearchCommunicationParams {
  keyword?: string;
  dateFrom?: Date;
  dateTo?: Date;
  projectId?: string;
  manufacturerId?: string;
}

export class CommunicationService {
  private emailService = new EmailService();

  async list(
    filters: { projectId?: string; manufacturerId?: string } = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const where: Prisma.CommunicationWhereInput = {};

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.manufacturerId) where.manufacturerId = filters.manufacturerId;

    return paginate(
      prisma.communication as any,
      {
        where,
        orderBy: { createdAt: "desc" },
        include: {
          manufacturer: { select: { id: true, name: true, country: true } },
          project: { select: { id: true, title: true } },
          contact: { select: { id: true, name: true, email: true } },
        },
      },
      pagination
    );
  }

  async getById(id: string) {
    const communication = await prisma.communication.findUnique({
      where: { id },
      include: {
        manufacturer: { select: { id: true, name: true, country: true } },
        project: { select: { id: true, title: true } },
        contact: true,
      },
    });

    if (!communication) {
      throw new NotFoundError("Communication not found");
    }

    return communication;
  }

  async create(input: CreateCommunicationInput) {
    const communication = await prisma.communication.create({
      data: {
        projectId: input.projectId,
        manufacturerId: input.manufacturerId,
        contactId: input.contactId,
        subject: input.subject,
        body: input.body,
        direction: input.direction,
        status: input.status ?? "draft",
        sentAt: input.sentAt,
        followUpDueAt: input.followUpDueAt,
      },
      include: {
        manufacturer: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
      },
    });

    // Send email for outbound communications
    if (input.direction === "sent") {
      const manufacturer = await prisma.manufacturer.findUnique({
        where: { id: input.manufacturerId },
        include: { contacts: true },
      });

      const contactEmail = input.contactId
        ? manufacturer?.contacts?.find((c) => c.id === input.contactId)?.email
        : manufacturer?.contacts?.[0]?.email;

      if (contactEmail) {
        const emailResult = await this.emailService.sendCommunication({
          to: contactEmail,
          manufacturerName: manufacturer!.name,
          subject: input.subject || "Message regarding your services",
          body: input.body,
        });

        if (emailResult.sent) {
          const updated = await prisma.communication.update({
            where: { id: communication.id },
            data: { status: "sent", sentAt: new Date() },
            include: {
              manufacturer: { select: { id: true, name: true } },
              project: { select: { id: true, title: true } },
            },
          });
          return updated;
        }
      }
    }

    return communication;
  }

  /**
   * Thread view: all communications for a specific manufacturer+project pair,
   * ordered chronologically.
   */
  async getThread(
    manufacturerId: string,
    projectId: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    return paginate(
      prisma.communication as any,
      {
        where: { manufacturerId, projectId },
        orderBy: { createdAt: "asc" },
        include: {
          contact: { select: { id: true, name: true, email: true } },
        },
      },
      pagination
    );
  }

  /**
   * Search communications with date range and keyword filtering.
   */
  async search(
    params: SearchCommunicationParams,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const where: Prisma.CommunicationWhereInput = {};

    if (params.projectId) where.projectId = params.projectId;
    if (params.manufacturerId) where.manufacturerId = params.manufacturerId;

    if (params.keyword) {
      where.OR = [
        { subject: { contains: params.keyword, mode: "insensitive" } },
        { body: { contains: params.keyword, mode: "insensitive" } },
      ];
    }

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = params.dateFrom;
      if (params.dateTo) where.createdAt.lte = params.dateTo;
    }

    return paginate(
      prisma.communication as any,
      {
        where,
        orderBy: { createdAt: "desc" },
        include: {
          manufacturer: { select: { id: true, name: true } },
          project: { select: { id: true, title: true } },
          contact: { select: { id: true, name: true } },
        },
      },
      pagination
    );
  }

  /**
   * Set or update follow-up due date.
   */
  async setFollowUpDue(id: string, followUpDueAt: Date) {
    const existing = await prisma.communication.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Communication not found");
    }

    return prisma.communication.update({
      where: { id },
      data: { followUpDueAt },
    });
  }
}
