/**
 * Shared Zod field schemas for Pet validation.
 * Used by both the create (POST) and update (PATCH) API routes
 * to avoid maintaining duplicate definitions.
 */

import { z } from "zod";
import { emptyToUndefined, isFirebaseStorageUrl } from "@/lib/validation";

// ---- Reusable field schemas ----

export const nameField = z
  .string({ error: "Name is required" })
  .min(1, "Name is required")
  .max(50, "Name must be 50 characters or less")
  .trim();

export const speciesField = z.enum(["dog", "cat", "exotic", "other"], {
  message: "Species must be one of: dog, cat, exotic, other",
});

export const breedField = z.preprocess(
  emptyToUndefined,
  z.string().max(60, "Breed must be 60 characters or less").trim().optional()
);

export const dateOfBirthField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((d) => {
      const date = new Date(d);
      return !isNaN(date.getTime()) && date <= new Date();
    }, "Date of birth must be in the past")
    .optional()
);

export const photoURLField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .url("Invalid photo URL")
    .max(512, "Photo URL too long")
    .refine(isFirebaseStorageUrl, "Photo must be hosted on Firebase Storage")
    .optional()
);

export const microchipIdField = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .max(30, "Microchip ID must be 30 characters or less")
    .regex(
      /^[A-Za-z0-9-]*$/,
      "Microchip ID may only contain letters, numbers, and hyphens"
    )
    .optional()
);

// ---- Composed schemas ----

export const createPetSchema = z.object({
  name: nameField,
  species: speciesField,
  breed: breedField,
  dateOfBirth: dateOfBirthField,
  photoURL: photoURLField,
  microchipId: microchipIdField,
});

export const updatePetSchema = z.object({
  name: nameField.optional(),
  species: speciesField.optional(),
  breed: breedField,
  dateOfBirth: dateOfBirthField,
  photoURL: photoURLField,
  microchipId: microchipIdField,
});
