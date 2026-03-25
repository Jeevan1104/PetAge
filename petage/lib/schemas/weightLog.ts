/**
 * Zod schemas for Weight Log validation.
 * Used by the create (POST) API route.
 * No update schema — the UI only supports add + delete, not edit.
 */

import { z } from "zod";
import { emptyToUndefined } from "@/lib/validation";

// ---- Reusable field schemas ----

// Coerces HTML number input string → number (or undefined for empty)
const weightField = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  },
  z
    .number({ error: "Weight is required" })
    .positive("Weight must be positive")
    .max(999, "Weight must be 999 or less")
);

const unitField = z.enum(["kg", "lbs"], {
  error: "Unit must be kg or lbs",
});

const logDateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((d) => !isNaN(new Date(d).getTime()), "Invalid date");

const notesField = z.preprocess(
  emptyToUndefined,
  z.string().max(500, "Notes must be 500 characters or less").trim().optional()
);

// ---- Composed schema ----

export const createWeightLogSchema = z.object({
  weight: weightField,
  unit: unitField,
  logDate: logDateField,
  notes: notesField,
});

export type CreateWeightLogInput = z.infer<typeof createWeightLogSchema>;
