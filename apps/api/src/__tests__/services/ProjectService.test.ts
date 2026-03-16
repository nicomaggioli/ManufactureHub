import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectService, NotFoundError } from "../../services/ProjectService";
import prisma from "../../lib/prisma";

const mockPrisma = prisma as unknown as {
  project: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

describe("ProjectService", () => {
  let service: ProjectService;

  beforeEach(() => {
    service = new ProjectService();
  });

  describe("create", () => {
    it("should create a project with default status", async () => {
      const projectData = {
        id: "proj-1",
        userId: "user-1",
        title: "Test Project",
        description: null,
        status: "ideation",
        createdAt: new Date(),
      };
      mockPrisma.project.create.mockResolvedValue(projectData);

      const result = await service.create("user-1", { title: "Test Project" });

      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          title: "Test Project",
          description: undefined,
          status: "ideation",
          targetLaunchDate: undefined,
        },
      });
      expect(result).toEqual(projectData);
    });

    it("should create a project with a custom status and description", async () => {
      const input = {
        title: "New Product",
        description: "A cool product",
        status: "sourcing" as const,
        targetLaunchDate: new Date("2026-06-01"),
      };
      mockPrisma.project.create.mockResolvedValue({ id: "proj-2", ...input });

      await service.create("user-1", input);

      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          title: "New Product",
          description: "A cool product",
          status: "sourcing",
          targetLaunchDate: input.targetLaunchDate,
        },
      });
    });
  });

  describe("getById", () => {
    it("should return a project when found", async () => {
      const project = { id: "proj-1", userId: "user-1", title: "My Project" };
      mockPrisma.project.findFirst.mockResolvedValue(project);

      const result = await service.getById("proj-1", "user-1");

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: "proj-1", userId: "user-1" },
        include: expect.objectContaining({
          teamMembers: expect.any(Object),
          _count: expect.any(Object),
        }),
      });
      expect(result).toEqual(project);
    });

    it("should throw NotFoundError when project does not exist", async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.getById("nonexistent", "user-1")).rejects.toThrow(
        NotFoundError
      );
      await expect(service.getById("nonexistent", "user-1")).rejects.toThrow(
        "Project not found"
      );
    });
  });

  describe("update", () => {
    it("should update the project when it exists", async () => {
      const existing = { id: "proj-1", userId: "user-1", title: "Old Title" };
      mockPrisma.project.findFirst.mockResolvedValue(existing);
      mockPrisma.project.update.mockResolvedValue({
        ...existing,
        title: "New Title",
      });

      const result = await service.update("proj-1", "user-1", {
        title: "New Title",
      });

      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: "proj-1", userId: "user-1" },
      });
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: "proj-1" },
        data: { title: "New Title" },
      });
      expect(result.title).toBe("New Title");
    });

    it("should throw NotFoundError when project does not exist", async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.update("nonexistent", "user-1", { title: "X" })
      ).rejects.toThrow(NotFoundError);

      expect(mockPrisma.project.update).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete the project when it exists", async () => {
      mockPrisma.project.findFirst.mockResolvedValue({
        id: "proj-1",
        userId: "user-1",
      });
      mockPrisma.project.delete.mockResolvedValue({});

      await service.delete("proj-1", "user-1");

      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: "proj-1" },
      });
    });

    it("should throw NotFoundError when project does not exist", async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.delete("nonexistent", "user-1")).rejects.toThrow(
        NotFoundError
      );
      expect(mockPrisma.project.delete).not.toHaveBeenCalled();
    });
  });

  describe("archive / unarchive", () => {
    it("should set archived to true", async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: "proj-1" });
      mockPrisma.project.update.mockResolvedValue({
        id: "proj-1",
        archived: true,
      });

      const result = await service.archive("proj-1", "user-1");

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: "proj-1" },
        data: { archived: true },
      });
      expect(result.archived).toBe(true);
    });

    it("should set archived to false", async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: "proj-1" });
      mockPrisma.project.update.mockResolvedValue({
        id: "proj-1",
        archived: false,
      });

      const result = await service.unarchive("proj-1", "user-1");

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: "proj-1" },
        data: { archived: false },
      });
      expect(result.archived).toBe(false);
    });

    it("should throw NotFoundError if project does not exist for archive", async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(service.archive("nope", "user-1")).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
