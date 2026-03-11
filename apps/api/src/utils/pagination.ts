/**
 * Cursor-based pagination helper for Prisma queries.
 *
 * Usage:
 *   const result = await paginate(prisma.product, {
 *     where: { userId: "abc" },
 *     orderBy: { createdAt: "desc" },
 *   }, { cursor: req.query.cursor, limit: 20 });
 */

export interface PaginationOptions {
  cursor?: string | null;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Performs a cursor-based paginated query against a Prisma model delegate.
 *
 * @param model  - A Prisma model delegate (e.g. `prisma.product`).
 * @param args   - Standard Prisma `findMany` args (where, orderBy, include, select, etc.).
 * @param opts   - Pagination options: cursor (opaque string = record id) and limit.
 */
export async function paginate<T extends { id: string }>(
  model: { findMany: (args: Record<string, unknown>) => Promise<T[]> },
  args: Record<string, unknown>,
  opts: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  const limit = Math.min(Math.max(1, opts.limit ?? DEFAULT_LIMIT), MAX_LIMIT);

  const queryArgs: Record<string, unknown> = {
    ...args,
    take: limit + 1, // fetch one extra to determine hasMore
  };

  if (opts.cursor) {
    queryArgs.cursor = { id: opts.cursor };
    queryArgs.skip = 1; // skip the cursor record itself
  }

  const rows: T[] = await model.findMany(queryArgs);

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return { data, nextCursor, hasMore };
}
