import { vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------
vi.mock("../lib/prisma", () => {
  const mockModel = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  });

  return {
    default: {
      project: mockModel(),
      manufacturer: mockModel(),
      user: mockModel(),
      communication: mockModel(),
      quote: mockModel(),
      sample: mockModel(),
      designAsset: mockModel(),
      reminder: mockModel(),
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $queryRaw: vi.fn(),
      $queryRawUnsafe: vi.fn(),
    },
  };
});

// ---------------------------------------------------------------------------
// Mock Redis / cache
// ---------------------------------------------------------------------------
vi.mock("../lib/redis", () => ({
  default: null,
}));

vi.mock("../utils/cache", () => ({
  cache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    getOrSet: vi.fn((_key: string, _ttl: number, fn: () => Promise<unknown>) => fn()),
    getClient: vi.fn().mockReturnValue(null),
  },
}));

// ---------------------------------------------------------------------------
// Mock logger to keep test output clean
// ---------------------------------------------------------------------------
vi.mock("../config/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
