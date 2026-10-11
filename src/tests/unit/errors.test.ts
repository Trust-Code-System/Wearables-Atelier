/**
 * Unit tests for the AppError class and helpers
 */
import { describe, it, expect } from "vitest";
import { AppError, getErrorMessage, ERROR_MESSAGES } from "../../app/lib/errors";

describe("AppError", () => {
  it("creates an operational error with correct properties", () => {
    const err = new AppError("Not found", "NOT_FOUND");
    expect(err.message).toBe("Not found");
    expect(err.code).toBe("NOT_FOUND");
    expect(err.isOperational).toBe(true);
    expect(err.details).toBeNull();
    expect(err instanceof Error).toBe(true);
  });

  it("factory: notFound includes resource name in message", () => {
    const err = AppError.notFound("Order", "ord_123");
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toContain("ord_123");
  });

  it("factory: unauthorized defaults to correct message", () => {
    const err = AppError.unauthorized();
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Authentication required");
  });

  it("factory: validation stores details array", () => {
    const details = [{ field: "email", message: "Invalid email" }];
    const err = AppError.validation("Validation failed", details);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.details).toEqual(details);
  });

  it("factory: conflict sets correct code", () => {
    const err = AppError.conflict("Email already in use");
    expect(err.code).toBe("CONFLICT");
  });

  it("factory: rateLimited sets correct code", () => {
    const err = AppError.rateLimited();
    expect(err.code).toBe("RATE_LIMIT_EXCEEDED");
  });
});

describe("AppError.from", () => {
  it("returns the same AppError if already AppError", () => {
    const original = AppError.unauthorized();
    const wrapped = AppError.from(original);
    expect(wrapped).toBe(original);
  });

  it("maps structured unique constraint code to CONFLICT", () => {
    const supaErr = Object.assign(new Error("duplicate key"), { code: "23505" });
    const wrapped = AppError.from(supaErr);
    expect(wrapped.code).toBe("CONFLICT");
  });

  it("maps JWT error message to UNAUTHORIZED", () => {
    const jwtErr = new Error("JWT expired");
    const wrapped = AppError.from(jwtErr);
    expect(wrapped.code).toBe("UNAUTHORIZED");
  });

  it("maps network errors to NETWORK_ERROR", () => {
    const netErr = new Error("fetch failed: network error");
    const wrapped = AppError.from(netErr);
    expect(wrapped.code).toBe("NETWORK_ERROR");
  });

  it("maps unknown values to INTERNAL_ERROR", () => {
    const wrapped = AppError.from("string error");
    expect(wrapped.code).toBe("INTERNAL_ERROR");
  });

  it("maps null to INTERNAL_ERROR with fallback message", () => {
    const wrapped = AppError.from(null, "Custom fallback");
    expect(wrapped.code).toBe("INTERNAL_ERROR");
    expect(wrapped.message).toBe("Custom fallback");
  });
});

describe("getErrorMessage", () => {
  it("returns AppError message directly", () => {
    const err = AppError.notFound("Product", "shoe-001");
    expect(getErrorMessage(err)).toContain("shoe-001");
  });

  it("returns Error.message for plain errors", () => {
    expect(getErrorMessage(new Error("Something broke"))).toBe("Something broke");
  });

  it("returns INTERNAL_ERROR message for unknown values", () => {
    expect(getErrorMessage(42)).toBe(ERROR_MESSAGES.INTERNAL_ERROR);
  });
});

describe("ERROR_MESSAGES", () => {
  it("has a message for every ErrorCode", () => {
    const codes = [
      "VALIDATION_ERROR",
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "CONFLICT",
      "RATE_LIMIT_EXCEEDED",
      "NETWORK_ERROR",
      "EMAIL_ERROR",
      "PAYMENT_ERROR",
      "INTERNAL_ERROR",
    ] as const;

    for (const code of codes) {
      expect(typeof ERROR_MESSAGES[code]).toBe("string");
      expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    }
  });
});
