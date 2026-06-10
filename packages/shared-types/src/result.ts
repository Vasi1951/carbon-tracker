/**
 * Represents the result of an operation that could fail.
 */
export type Result<T, E = Error> = { success: true; value: T } | { success: false; error: E };

/**
 * Returns a success Result.
 */
export function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

/**
 * Returns a failure Result.
 */
export function fail<E>(error: E): Result<never, E> {
  return { success: false, error };
}
