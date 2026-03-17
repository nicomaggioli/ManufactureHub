import { Prisma, AssetType, MoodboardItemType } from "@prisma/client";
import prisma from "../lib/prisma";
import { paginate, PaginatedResult, PaginationOptions } from "../utils/pagination";
import { NotFoundError } from "../utils/errors";

export interface CreateDesignAssetInput {
  projectId: string;
  type: AssetType;
  fileName?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface UpdateDesignAssetInput {
  type?: AssetType;
  fileName?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface CreateMoodboardItemInput {
  designAssetId: string;
  sourceUrl?: string;
  notes?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  itemType?: MoodboardItemType;
}

export interface UpdateMoodboardItemInput {
  sourceUrl?: string;
  notes?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  itemType?: MoodboardItemType;
}

export class DesignAssetService {
  // ─── Design Assets ───

  async listAssets(
    filters: { projectId?: string; userId?: string; type?: AssetType } = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const where: Prisma.DesignAssetWhereInput = {};

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.type) where.type = filters.type;

    return paginate(
      prisma.designAsset as any,
      {
        where,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { moodboardItems: true } },
        },
      },
      pagination
    );
  }

  async getAssetById(id: string) {
    const asset = await prisma.designAsset.findUnique({
      where: { id },
      include: {
        moodboardItems: { orderBy: { zIndex: "asc" } },
        project: { select: { id: true, title: true } },
      },
    });

    if (!asset) {
      throw new NotFoundError("Design asset not found");
    }

    return asset;
  }

  /**
   * Create asset metadata. The actual file is uploaded to S3 separately;
   * the client passes in the resulting fileUrl and thumbnailUrl.
   */
  async createAsset(userId: string, input: CreateDesignAssetInput) {
    return prisma.designAsset.create({
      data: {
        userId,
        projectId: input.projectId,
        type: input.type,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        thumbnailUrl: input.thumbnailUrl,
        tags: input.tags ?? [],
        version: 1,
      },
    });
  }

  /**
   * Update an asset. If fileUrl changes, the version is incremented
   * to provide basic version tracking.
   */
  async updateAsset(id: string, userId: string, input: UpdateDesignAssetInput) {
    const existing = await prisma.designAsset.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError("Design asset not found");
    }

    const data: Prisma.DesignAssetUpdateInput = { ...input };

    // Bump version if the file itself is being replaced
    if (input.fileUrl && input.fileUrl !== existing.fileUrl) {
      data.version = existing.version + 1;
    }

    return prisma.designAsset.update({ where: { id }, data });
  }

  async deleteAsset(id: string, userId: string) {
    const existing = await prisma.designAsset.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError("Design asset not found");
    }

    await prisma.designAsset.delete({ where: { id } });
  }

  // ─── Moodboard Items ───

  async listMoodboardItems(
    designAssetId: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    return paginate(
      prisma.moodboardItem as any,
      {
        where: { designAssetId },
        orderBy: { zIndex: "asc" },
      },
      pagination
    );
  }

  async getMoodboardItemById(id: string) {
    const item = await prisma.moodboardItem.findUnique({
      where: { id },
      include: {
        designAsset: { select: { id: true, fileName: true, projectId: true } },
      },
    });

    if (!item) {
      throw new NotFoundError("Moodboard item not found");
    }

    return item;
  }

  async createMoodboardItem(input: CreateMoodboardItemInput) {
    // Verify the parent design asset exists
    const asset = await prisma.designAsset.findUnique({
      where: { id: input.designAssetId },
    });
    if (!asset) {
      throw new NotFoundError("Design asset not found");
    }

    return prisma.moodboardItem.create({
      data: {
        designAssetId: input.designAssetId,
        sourceUrl: input.sourceUrl,
        notes: input.notes,
        positionX: input.positionX ?? 0,
        positionY: input.positionY ?? 0,
        width: input.width ?? 200,
        height: input.height ?? 200,
        zIndex: input.zIndex ?? 0,
        itemType: input.itemType ?? "image",
      },
    });
  }

  async updateMoodboardItem(id: string, input: UpdateMoodboardItemInput) {
    const existing = await prisma.moodboardItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Moodboard item not found");
    }

    return prisma.moodboardItem.update({
      where: { id },
      data: input,
    });
  }

  async deleteMoodboardItem(id: string) {
    const existing = await prisma.moodboardItem.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Moodboard item not found");
    }

    await prisma.moodboardItem.delete({ where: { id } });
  }
}
