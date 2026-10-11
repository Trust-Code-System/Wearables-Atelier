/**
 * Centralised error types for the Wearables Atelier frontend service layer.
 *
 * Mirrors the engineering standard's AppError pattern adapted for a
 * frontend architecture (no server statusCode on the class —
 * the UI layer decides how to display each error kind).
 */

export type ErrorCode =
  // Validation
  | "VALIDATION_ERROR"
  // Auth
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  // Resource
  | "NOT_FOUND"
  | "CONFLICT"
  // Rate limiting
  | "RATE_LIMIT_EXCEEDED"
  // Network / external
  | "NETWORK_ERROR"
  | "EMAIL_ERROR"
  | "PAYMENT_ERROR"
  // Generic
  | "INTERNAL_ERROR";

export interface ErrorDetail {
  field?: string;
  message: string;
}

/**
 * Operational error — safe to display to the user or log without concern.
 * Programmer errors (bugs) should propagate as plain `Error` instances.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details: ErrorDetail[] | null;
  readonly isOperational = true;

  constructor(
    message: string,
    code: ErrorCode,
    details: ErrorDetail[] | null = null
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
    // Maintains proper stack trace in V8
    const errorConstructor = Error as ErrorConstructor & { captureStackTrace?: (error: Error, constructor: typeof AppError) => void };
    errorConstructor.captureStackTrace?.(this, AppError);
  }

  // ─── Factory helpers ───────────────────────────────────────────────────────

  static notFound(resource: string, id?: string): AppError {
    const msg = id
      ? `${resource} with ID "${id}" was not found`
      : `${resource} was not found`;
    return new AppError(msg, "NOT_FOUND");
  }

  static unauthorized(message = "Authentication required"): AppError {
    return new AppError(message, "UNAUTHORIZED");
  }

  static forbidden(message = "You don't have permission to do that"): AppError {
    return new AppError(message, "FORBIDDEN");
  }

  static conflict(message: string): AppError {
    return new AppError(message, "CONFLICT");
  }

  static validation(message: string, details?: ErrorDetail[]): AppError {
    return new AppError(message, "VALIDATION_ERROR", details ?? null);
  }

  static network(message = "Network request failed. Check your connection."): AppError {
    return new AppError(message, "NETWORK_ERROR");
  }

  static email(message = "Failed to send email. Please try again."): AppError {
    return new AppError(message, "EMAIL_ERROR");
  }

  static payment(message: string): AppError {
    return new AppError(message, "PAYMENT_ERROR");
  }

  static rateLimited(message = "Too many requests. Please wait a moment."): AppError {
    return new AppError(message, "RATE_LIMIT_EXCEEDED");
  }

  /** Wraps an unknown caught value into an AppError for consistent handling. */
  static from(err: unknown, fallbackMessage = "An unexpected error occurred"): AppError {
    if (err instanceof AppError) return err;

    if (err instanceof Error) {
      // Structured service errors can carry a `code` field
      const supaErr = err as Error & { code?: string; message: string };

      if (supaErr.code === "23505") {
        return AppError.conflict("This record already exists.");
      }
      if (supaErr.code === "PGRST116" || supaErr.message?.includes("not found")) {
        return AppError.notFound("Resource");
      }
      if (
        supaErr.message?.includes("JWT") ||
        supaErr.message?.includes("not authenticated")
      ) {
        return AppError.unauthorized();
      }
      if (supaErr.message?.includes("permission denied")) {
        return AppError.forbidden();
      }
      if (
        supaErr.message?.toLowerCase().includes("network") ||
        supaErr.message?.toLowerCase().includes("fetch")
      ) {
        return AppError.network(supaErr.message);
      }

      return new AppError(supaErr.message || fallbackMessage, "INTERNAL_ERROR");
    }

    return new AppError(fallbackMessage, "INTERNAL_ERROR");
  }
}

/**
 * User-friendly messages for each error code — use in toast notifications.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Please check the form and try again.",
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "The requested item could not be found.",
  CONFLICT: "This record already exists.",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please wait a moment.",
  NETWORK_ERROR: "Network error. Check your connection and try again.",
  EMAIL_ERROR: "Failed to send email. Please try again.",
  PAYMENT_ERROR: "Payment failed. Please try again.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
};

/** Returns a user-friendly message string for any caught error. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof AppError) {
    return err.message || ERROR_MESSAGES[err.code];
  }
  if (err instanceof Error) {
    return err.message;
  }
  return ERROR_MESSAGES.INTERNAL_ERROR;
}
