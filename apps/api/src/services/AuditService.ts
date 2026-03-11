import prisma from "../lib/prisma";
import { logger } from "../config/logger";

export interface AuditEntry {
  userId: string;
  entityType: string;
  entityId: string;
  action: "create" | "update" | "delete" | "archive" | "unarchive" | "status_change" | string;
  diffJson?: Record<string, unknown> | null | undefined;
}

export class AuditService {
  /**
   * Log an audit entry for an entity change.
   * Fire-and-forget: errors are logged but do not propagate.
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          diffJson: (entry.diffJson as any) ?? undefined,
        },
      });
    } catch (err) {
      logger.error("Failed to write audit log", {
        error: err,
        entry,
      });
    }
  }

  /**
   * Log multiple audit entries in a single transaction.
   */
  async logBatch(entries: AuditEntry[]): Promise<void> {
    try {
      await prisma.auditLog.createMany({
        data: entries.map((e) => ({
          userId: e.userId,
          entityType: e.entityType,
          entityId: e.entityId,
          action: e.action,
          diffJson: (e.diffJson as any) ?? undefined,
        })),
      });
    } catch (err) {
      logger.error("Failed to write batch audit logs", {
        error: err,
        count: entries.length,
      });
    }
  }

  /**
   * Retrieve audit log for a specific entity.
   */
  async getForEntity(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Retrieve audit log for a specific user.
   */
  async getForUser(userId: string, limit: number = 50) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
