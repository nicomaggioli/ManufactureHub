import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ManufacturerService,
  ValidationError,
} from "../../services/ManufacturerService";
import { NotFoundError } from "../../services/ProjectService";
import prisma from "../../lib/prisma";

const mockPrisma = prisma as unknown as {
  manufacturer: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  $queryRawUnsafe: ReturnType<typeof vi.fn>;
};

describe("ManufacturerService", () => {
  let service: ManufacturerService;

  beforeEach(() => {
    service = new ManufacturerService();
  });

  describe("list (without search)", () => {
    it("should list manufacturers with no filters", async () => {
      const manufacturers = [
        { id: "m1", name: "Factory A" },
        { id: "m2", name: "Factory B" },
      ];
      mockPrisma.manufacturer.findMany.mockResolvedValue(manufacturers);

      const result = await service.list();

      expect(mockPrisma.manufacturer.findMany).toHaveBeenCalled();
      expect(result.data).toBeDefined();
    });

    it("should apply country filter", async () => {
      mockPrisma.manufacturer.findMany.mockResolvedValue([]);

      await service.list({ country: "China" });

      const callArgs = mockPrisma.manufacturer.findMany.mock.calls[0][0];
      expect(callArgs.where.country).toBe("China");
    });

    it("should apply verified filter", async () => {
      mockPrisma.manufacturer.findMany.mockResolvedValue([]);

      await service.list({ verified: true });

      const callArgs = mockPrisma.manufacturer.findMany.mock.calls[0][0];
      expect(callArgs.where.verified).toBe(true);
    });

    it("should apply MOQ range filters", async () => {
      mockPrisma.manufacturer.findMany.mockResolvedValue([]);

      await service.list({ moqMin: 100, moqMax: 5000 });

      const callArgs = mockPrisma.manufacturer.findMany.mock.calls[0][0];
      expect(callArgs.where.moq).toEqual({ gte: 100, lte: 5000 });
    });

    it("should apply certifications filter with hasSome", async () => {
      mockPrisma.manufacturer.findMany.mockResolvedValue([]);

      await service.list({ certifications: ["ISO9001", "GOTS"] });

      const callArgs = mockPrisma.manufacturer.findMany.mock.calls[0][0];
      expect(callArgs.where.certifications).toEqual({
        hasSome: ["ISO9001", "GOTS"],
      });
    });

    it("should apply sustainability score minimum filter", async () => {
      mockPrisma.manufacturer.findMany.mockResolvedValue([]);

      await service.list({ sustainabilityScoreMin: 80 });

      const callArgs = mockPrisma.manufacturer.findMany.mock.calls[0][0];
      expect(callArgs.where.sustainabilityScore).toEqual({ gte: 80 });
    });
  });

  describe("list (with full-text search)", () => {
    it("should use raw SQL for search queries", async () => {
      const rows = [{ id: "m1", name: "Cotton Factory", rank: 0.5 }];
      mockPrisma.$queryRawUnsafe.mockResolvedValue(rows);

      const result = await service.list({ search: "cotton" });

      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
      const sql = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
      expect(sql).toContain("to_tsvector");
      expect(sql).toContain("to_tsquery");
      expect(result.data).toEqual(rows);
      expect(result.hasMore).toBe(false);
    });

    it("should indicate hasMore when extra rows are returned", async () => {
      // Default limit is 20, so return 21 rows to trigger hasMore
      const rows = Array.from({ length: 21 }, (_, i) => ({
        id: `m${i}`,
        name: `Factory ${i}`,
      }));
      mockPrisma.$queryRawUnsafe.mockResolvedValue(rows);

      const result = await service.list({ search: "factory" });

      expect(result.hasMore).toBe(true);
      expect(result.data).toHaveLength(20);
      expect(result.nextCursor).toBe("m19");
    });
  });

  describe("getById", () => {
    it("should return manufacturer when found", async () => {
      const manufacturer = { id: "m1", name: "Factory A" };
      mockPrisma.manufacturer.findUnique.mockResolvedValue(manufacturer);

      const result = await service.getById("m1");

      expect(mockPrisma.manufacturer.findUnique).toHaveBeenCalledWith({
        where: { id: "m1" },
        include: expect.objectContaining({
          contacts: true,
          _count: expect.any(Object),
        }),
      });
      expect(result).toEqual(manufacturer);
    });

    it("should throw NotFoundError when not found", async () => {
      mockPrisma.manufacturer.findUnique.mockResolvedValue(null);

      await expect(service.getById("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("create", () => {
    it("should create manufacturer with defaults", async () => {
      const created = { id: "m1", name: "New Factory", country: "Vietnam" };
      mockPrisma.manufacturer.create.mockResolvedValue(created);

      const result = await service.create({
        name: "New Factory",
        country: "Vietnam",
      });

      expect(mockPrisma.manufacturer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "New Factory",
          country: "Vietnam",
          specialties: [],
          certifications: [],
          verified: false,
          source: "manual",
        }),
      });
      expect(result).toEqual(created);
    });
  });

  describe("update", () => {
    it("should update when manufacturer exists", async () => {
      mockPrisma.manufacturer.findUnique.mockResolvedValue({ id: "m1" });
      mockPrisma.manufacturer.update.mockResolvedValue({
        id: "m1",
        name: "Updated",
      });

      const result = await service.update("m1", { name: "Updated" });

      expect(mockPrisma.manufacturer.update).toHaveBeenCalledWith({
        where: { id: "m1" },
        data: { name: "Updated" },
      });
      expect(result.name).toBe("Updated");
    });

    it("should throw NotFoundError when manufacturer does not exist", async () => {
      mockPrisma.manufacturer.findUnique.mockResolvedValue(null);

      await expect(service.update("nope", { name: "X" })).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("delete", () => {
    it("should delete when manufacturer exists", async () => {
      mockPrisma.manufacturer.findUnique.mockResolvedValue({ id: "m1" });
      mockPrisma.manufacturer.delete.mockResolvedValue({});

      await service.delete("m1");

      expect(mockPrisma.manufacturer.delete).toHaveBeenCalledWith({
        where: { id: "m1" },
      });
    });

    it("should throw NotFoundError when manufacturer does not exist", async () => {
      mockPrisma.manufacturer.findUnique.mockResolvedValue(null);

      await expect(service.delete("nope")).rejects.toThrow(NotFoundError);
    });
  });

  describe("compare", () => {
    it("should return manufacturers for valid IDs", async () => {
      const manufacturers = [
        { id: "m1", name: "A" },
        { id: "m2", name: "B" },
      ];
      mockPrisma.manufacturer.findMany.mockResolvedValue(manufacturers);

      const result = await service.compare(["m1", "m2"]);

      expect(mockPrisma.manufacturer.findMany).toHaveBeenCalledWith({
        where: { id: { in: ["m1", "m2"] } },
        include: expect.objectContaining({ contacts: true }),
      });
      expect(result).toHaveLength(2);
    });

    it("should throw ValidationError for fewer than 2 IDs", async () => {
      await expect(service.compare(["m1"])).rejects.toThrow(ValidationError);
      await expect(service.compare(["m1"])).rejects.toThrow(
        "Comparison requires 2 to 4 manufacturer IDs"
      );
    });

    it("should throw ValidationError for more than 4 IDs", async () => {
      await expect(
        service.compare(["m1", "m2", "m3", "m4", "m5"])
      ).rejects.toThrow(ValidationError);
    });

    it("should throw NotFoundError if not all IDs are found", async () => {
      mockPrisma.manufacturer.findMany.mockResolvedValue([{ id: "m1" }]);

      await expect(service.compare(["m1", "m2"])).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("bulkImportCsv", () => {
    it("should import valid rows and collect errors for invalid ones", async () => {
      mockPrisma.manufacturer.create
        .mockResolvedValueOnce({ id: "m1" })
        .mockRejectedValueOnce(new Error("duplicate"));

      const result = await service.bulkImportCsv([
        { name: "Factory A", country: "China" },
        { name: "Factory B", country: "Vietnam" },
        { name: "", country: "" }, // invalid — missing name and country
      ]);

      expect(result.imported).toBe(1); // first succeeds, second rejects, third skipped
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toEqual({
        row: 2,
        error: "duplicate",
      });
      expect(result.errors[1]).toEqual({
        row: 3,
        error: "name and country are required",
      });
    });
  });
});
