/**
 * Shared Zod field schemas for Vaccine validation.
 * Used by both the create (POST) and update (PATCH) API routes.
 */

import { z } from "zod";
import { differenceInCalendarDays } from "date-fns";
import { emptyToUndefined } from "@/lib/validation";
import type { VaccineStatus } from "@/lib/types";

// ---- Reusable field schemas ----

const vaccineNameField = z
  .string({ error: "Vaccine name is required" })
  .min(1, "Vaccine name is required")
  .max(100, "Name must be 100 characters or less")
  .trim();

const dateAdministeredField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((d) => {
    const date = new Date(d);
    return !isNaN(date.getTime()) && date <= new Date();
  }, "Date administered must be in the past or today");

const expiryDateField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((d) => !isNaN(new Date(d).getTime()), "Invalid expiry date")
    .optional()
);

const notesField = z.preprocess(
  emptyToUndefined,
  z.string().max(500, "Notes must be 500 characters or less").trim().optional()
);

// ---- Composed schemas ----

export const createVaccineSchema = z.object({
  name: vaccineNameField,
  dateAdministered: dateAdministeredField,
  expiryDate: expiryDateField,
  reminderEnabled: z.boolean().default(true),
  reminderLeadDays: z.number().int().min(1).max(365).default(30),
  notes: notesField,
});

export const updateVaccineSchema = z.object({
  name: vaccineNameField.optional(),
  dateAdministered: dateAdministeredField.optional(),
  expiryDate: expiryDateField,
  reminderEnabled: z.boolean().optional(),
  reminderLeadDays: z.number().int().min(1).max(365).optional(),
  reminderSent: z.boolean().optional(), // allows the cron job to reset this flag
  notes: notesField,
});

export type CreateVaccineInput = z.infer<typeof createVaccineSchema>;
export type UpdateVaccineInput = z.infer<typeof updateVaccineSchema>;

// ---- Status calculation ----

/**
 * Computes the vaccine status based on expiry date and reminder lead time.
 * Pure function — no Firestore dependency.
 */
export function computeVaccineStatus(
  expiryDate: Date | undefined,
  leadDays: number
): VaccineStatus {
  if (!expiryDate) return "current";
  const today = new Date();
  const daysUntilExpiry = differenceInCalendarDays(expiryDate, today);
  if (daysUntilExpiry < 0) return "overdue";
  if (daysUntilExpiry <= leadDays) return "due_soon";
  return "current";
}
