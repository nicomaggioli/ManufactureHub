import { describe, it, expect, vi } from "vitest";
import { paginate, PaginationOptions } from "../../utils/pagination";

function mockModel(rows: Array<{ id: string }>) {
  return {
    findMany: vi.fn().mockResolvedValue(rows),
  };
}

describe("paginate", () => {
  it("should return data with hasMore false when fewer rows than limit", async () => {
    const rows = [
      { id: "1", name: "A" },
      { id: "2", name: "B" },
    ];
    const model = mockModel(rows);

    const result = await paginate(model, { where: {} }, { limit: 10 });

    expect(result.data).toEqual(rows);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
    // Should request limit + 1 (11)
    expect(model.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 11 })
    );
  });

  it("should return hasMore true and nextCursor when rows exceed limit", async () => {
    // Simulate 3 rows returned for limit 2 (requesting take: 3)
    const rows = [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
      { id: "c", name: "C" },
    ];
    const model = mockModel(rows);

    const result = await paginate(model, { where: {} }, { limit: 2 });

    expect(result.data).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe("b"); // last item of the truncated data
  });

  it("should use default limit of 20 when none is specified", async () => {
    const model = mockModel([]);

    await paginate(model, { where: {} });

    expect(model.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 21 })
    );
  });

  it("should clamp limit to maximum of 100", async () => {
    const model = mockModel([]);

    await paginate(model, { where: {} }, { limit: 500 });

    expect(model.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 101 })
    );
  });

  it("should clamp limit to minimum of 1", async () => {
    const model = mockModel([]);

    await paginate(model, { where: {} }, { limit: -5 });

    expect(model.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 2 })
    );
  });

  it("should apply cursor and skip when cursor is provided", async () => {
    const model = mockModel([]);

    await paginate(model, { where: {} }, { cursor: "abc-123", limit: 10 });

    expect(model.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: "abc-123" },
        skip: 1,
        take: 11,
      })
    );
  });

  it("should not set cursor or skip when cursor is null", async () => {
    const model = mockModel([]);

    await paginate(model, { where: {} }, { cursor: null, limit: 5 });

    const callArgs = model.findMany.mock.calls[0][0];
    expect(callArgs.cursor).toBeUndefined();
    expect(callArgs.skip).toBeUndefined();
  });

  it("should preserve additional query args like orderBy and include", async () => {
    const model = mockModel([]);
    const args = {
      where: { userId: "u1" },
      orderBy: { createdAt: "desc" },
      include: { _count: true },
    };

    await paginate(model, args, { limit: 10 });

    expect(model.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1" },
        orderBy: { createdAt: "desc" },
        include: { _count: true },
        take: 11,
      })
    );
  });

  it("should return empty data with no cursor when model returns empty", async () => {
    const model = mockModel([]);

    const result = await paginate(model, { where: {} });

    expect(result.data).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });
});
