/**
 * Zod schemas for Medication validation.
 * Used by the create (POST) and update (PATCH) API routes.
 */

import { z } from "zod";
import { addDays, addWeeks, addMonths } from "date-fns";
import { emptyToUndefined } from "@/lib/validation";
import type { MedFrequency } from "@/lib/types";

// ---- Reusable field schemas ----

const medNameField = z
  .string({ error: "Medication name is required" })
  .min(1, "Medication name is required")
  .max(150, "Name must be 150 characters or less")
  .trim();

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((d) => !isNaN(new Date(d).getTime()), "Invalid date");

const frequencyField = z.enum(["daily", "weekly", "monthly", "custom"], {
  error: "Frequency must be daily, weekly, monthly, or custom",
});

const dosageField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .max(100, "Dosage must be 100 characters or less")
    .trim()
    .optional()
);

const notesField = z.preprocess(
  emptyToUndefined,
  z.string().max(500, "Notes must be 500 characters or less").trim().optional()
);

// Coerces HTML number input string → number (or undefined for empty string)
const customFreqDaysField = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : Math.trunc(num);
}, z.number().int().min(1, "Must be at least 1 day").max(365, "Must be 365 days or less").optional());

// ---- Composed schemas ----

export const createMedicationSchema = z
  .object({
    name: medNameField,
    isGeneric: z.boolean().default(false),
    dosageStrength: dosageField,
    frequency: frequencyField,
    customFreqDays: customFreqDaysField,
    startDate: dateField,
    reminderEnabled: z.boolean().default(true),
    notes: notesField,
  })
  .refine(
    (d) => d.frequency !== "custom" || (d.customFreqDays !== undefined && d.customFreqDays > 0),
    { message: "customFreqDays is required when frequency is custom", path: ["customFreqDays"] }
  );

export const updateMedicationSchema = z
  .object({
    name: medNameField.optional(),
    isGeneric: z.boolean().optional(),
    dosageStrength: dosageField,
    frequency: frequencyField.optional(),
    customFreqDays: customFreqDaysField,
    startDate: dateField.optional(),
    reminderEnabled: z.boolean().optional(),
    notes: notesField,
  })
  .refine(
    (d) => d.frequency !== "custom" || d.customFreqDays !== undefined,
    { message: "customFreqDays is required when frequency is custom", path: ["customFreqDays"] }
  );

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;

// ---- Next due date calculation ----

/**
 * Calculates the next due date based on a reference date and frequency.
 * Pure function — no Firestore dependency.
 */
export function computeNextDueDate(
  from: Date,
  frequency: MedFrequency,
  customFreqDays?: number
): Date {
  switch (frequency) {
    case "daily":
      return addDays(from, 1);
    case "weekly":
      return addWeeks(from, 1);
    case "monthly":
      return addMonths(from, 1);
    case "custom":
      return addDays(from, customFreqDays ?? 1);
  }
}
