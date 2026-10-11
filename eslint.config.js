// eslint.config.js — flat config (ESLint 9+)
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Base recommended rules
  ...tseslint.configs.recommended,

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // ── Quality ──────────────────────────────────────────────────────────
      "no-console": "warn",                          // Use logger.ts instead
      "no-debugger": "error",
      "eqeqeq": ["error", "always"],                 // Always === not ==
      "prefer-const": "error",                       // Immutable by default
      "no-var": "error",                             // No var declarations

      // ── TypeScript ────────────────────────────────────────────────────────
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "warn",  // Avoid implicit any
      "@typescript-eslint/no-floating-promises": "error", // Catch unhandled promises
      "@typescript-eslint/await-thenable": "error",  // Don't await non-promises

      // ── Security ──────────────────────────────────────────────────────────
      // Prevent common XSS / injection patterns
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
    languageOptions: {
      parserOptions: {
        // Enable type-aware rules (no-floating-promises requires this)
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Ignore build output and node_modules
  {
    ignores: ["dist/**", "node_modules/**", "*.config.js", "*.config.ts"],
  }
);
