/**
 * Zod schemas for Vet Visit validation.
 * Used by the create (POST) and update (PATCH) API routes.
 */

import { z } from "zod";
import { emptyToUndefined } from "@/lib/validation";

// ---- Reusable field schemas ----

const visitDateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((d) => !isNaN(new Date(d).getTime()), "Invalid date");

const reasonField = z
  .string({ error: "Reason for visit is required" })
  .min(1, "Reason for visit is required")
  .max(200, "Reason must be 200 characters or less")
  .trim();

const clinicNameField = z.preprocess(
  emptyToUndefined,
  z.string().max(150, "Clinic name must be 150 characters or less").trim().optional()
);

const vetNameField = z.preprocess(
  emptyToUndefined,
  z.string().max(150, "Vet name must be 150 characters or less").trim().optional()
);

const notesField = z.preprocess(
  emptyToUndefined,
  z.string().max(1000, "Notes must be 1000 characters or less").trim().optional()
);

const photoURLsField = z
  .array(z.string().regex(/^https?:\/\/.+/, "Each photo must be a valid URL"))
  .max(10, "Maximum 10 photos per visit")
  .optional();

const costField = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}, z.number().nonnegative("Cost cannot be negative").optional());

// ---- Composed schemas ----

export const createVisitSchema = z.object({
  visitDate: visitDateField,
  reason: reasonField,
  clinicName: clinicNameField,
  vetName: vetNameField,
  notes: notesField,
  photoURLs: photoURLsField,
  cost: costField,
});

export const updateVisitSchema = z.object({
  visitDate: visitDateField.optional(),
  reason: reasonField.optional(),
  clinicName: clinicNameField,
  vetName: vetNameField,
  notes: notesField,
  photoURLs: photoURLsField,
  cost: costField,
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
