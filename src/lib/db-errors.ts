/**
 * Maps raw Postgres/PostgREST errors to messages safe and useful to show on
 * the floor. Server actions must RETURN these (never throw): Next.js redacts
 * thrown error messages in production builds.
 */
export function friendlyDbError(
  error: { code?: string; message: string },
  entity: string,
): string {
  if (error.code === "23503") {
    return `This ${entity} is referenced by existing records (deliveries, runs, farmers…) and cannot be deleted — traceability history is kept.`;
  }
  if (error.code === "23505") {
    return `A ${entity} with that name already exists.`;
  }
  return error.message;
}
