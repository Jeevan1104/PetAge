"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePetStore } from "@/lib/store/petStore";
import { speciesOptions } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Max 50 characters").trim(),
  species: z.enum(["dog", "cat", "exotic", "other"]),
  breed: z.string().max(60, "Max 60 characters").trim().optional(),
  dateOfBirth: z
    .string()
    .refine((d) => {
      if (!d) return true;
      const date = new Date(d);
      return !isNaN(date.getTime()) && date <= new Date();
    }, "Date of birth must be in the past")
    .optional(),
  microchipId: z
    .string()
    .max(30, "Max 30 characters")
    .regex(/^[A-Za-z0-9-]*$/, "Only letters, numbers, and hyphens allowed")
    .optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddPetPage() {
  const router = useRouter();
  const { createPet } = usePetStore();

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { species: "dog" },
  });

  const selectedSpecies = watch("species");

  async function onSubmit(data: FormData) {
    setServerError(null);

    try {
      const result = await createPet({
        name: data.name,
        species: data.species,
        breed: data.breed || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        microchipId: data.microchipId || undefined,
      });

      if (result.error) {
        setServerError(result.error);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 md:px-10 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface transition-colors text-text-secondary text-xl leading-none"
          aria-label="Go back"
        >
          ←
        </button>
        <h1 className="text-h2 text-navy">Add Pet</h1>
      </div>

      <div className="px-6 md:px-10 py-8 max-w-[560px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Species */}
          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-2">
              Species
            </label>
            <div className="grid grid-cols-4 gap-2">
              {speciesOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("species", opt.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-[10px] border transition-all active:scale-[0.97] ${
                    selectedSpecies === opt.value
                      ? "border-clinical-blue bg-blue-tint text-clinical-blue"
                      : "border-border bg-card text-text-secondary hover:border-border-strong"
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-[12px] font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <Input
            label="Pet's name"
            placeholder="e.g. Luna"
            error={errors.name?.message}
            {...register("name")}
          />

          {/* Breed */}
          <Input
            label="Breed (optional)"
            placeholder="e.g. Golden Retriever"
            error={errors.breed?.message}
            {...register("breed")}
          />

          {/* Date of birth */}
          <Input
            label="Date of birth (optional)"
            type="date"
            error={errors.dateOfBirth?.message}
            {...register("dateOfBirth")}
          />

          {/* Microchip */}
          <Input
            label="Microchip ID (optional)"
            placeholder="15-digit number"
            error={errors.microchipId?.message}
            {...register("microchipId")}
          />

          {/* Server error */}
          {serverError && (
            <div className="bg-pale-red border border-[#FECDD3] rounded-[10px] px-4 py-3">
              <p className="text-[14px] text-status-red">{serverError}</p>
              {serverError.includes("Premium") && (
                <a
                  href="/dashboard/upgrade"
                  className="text-[13px] text-status-red underline font-medium mt-1 inline-block"
                >
                  View upgrade options →
                </a>
              )}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={isSubmitting}
          >
            Save pet
          </Button>
        </form>
      </div>
    </div>
  );
}
