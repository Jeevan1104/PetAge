import { z } from "zod";
import { emptyToUndefined } from "@/lib/validation";

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((d) => !isNaN(new Date(d).getTime()), "Invalid date");

export const createWeightSchema = z.object({
  weight: z.preprocess((val) => {
    if (val === "" || val === undefined || val === null) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().positive("Weight must be greater than 0")),
  
  unit: z.enum(["kg", "lbs"]),
  
  logDate: dateField,
  
  notes: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(500, "Notes must be 500 characters or less").optional()
  ),
});

export const updateWeightSchema = createWeightSchema.partial();
export type CreateWeightInput = z.infer<typeof createWeightSchema>;
export type UpdateWeightInput = z.infer<typeof updateWeightSchema>;

// Conversion utilities
export const LBS_PER_KG = 2.20462;

export function kgToLbs(kg: number): number {
  return kg * LBS_PER_KG;
}

export function lbsToKg(lbs: number): number {
  return lbs / LBS_PER_KG;
}
