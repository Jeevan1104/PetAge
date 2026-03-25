"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { createVisitSchema, type CreateVisitInput, type UpdateVisitInput } from "@/lib/schemas/visit";
import { useVisitStore } from "@/lib/store/visitStore";
import type { VetVisit } from "@/lib/types";
import { formatTimestampToDateInput } from "@/components/vaccines/vaccine-utils"; // Reuse utility

interface VisitFormProps {
  petId: string;
  initialData?: VetVisit;
}

export default function VisitForm({ petId, initialData }: VisitFormProps) {
  const router = useRouter();
  const { createVisit, updateVisit } = useVisitStore();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateVisitInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createVisitSchema) as any,
    defaultValues: {
      visitDate: initialData?.visitDate 
        ? formatTimestampToDateInput(initialData.visitDate)
        : new Date().toISOString().split("T")[0],
      reason: initialData?.reason || "",
      clinicName: initialData?.clinicName || "",
      vetName: initialData?.vetName || "",
      cost: initialData?.cost,
      notes: initialData?.notes || "",
    },
  });

  async function onSubmit(data: CreateVisitInput) {
    if (initialData) {
      // Update existing
      const { error } = await updateVisit(petId, initialData.visitId, data as UpdateVisitInput);
      if (error) {
        setError("root", { message: error });
        return;
      }
    } else {
      // Create new
      const { error } = await createVisit(petId, data);
      if (error) {
        setError("root", { message: error });
        return;
      }
    }
    router.push(`/dashboard/visits?petId=${petId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Input
        label="Reason for Visit"
        placeholder="e.g. Annual Checkup, Limping"
        {...register("reason")}
        error={errors.reason?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Date of Visit"
          {...register("visitDate")}
          error={errors.visitDate?.message}
        />
        <Input
          type="number"
          step="0.01"
          min="0"
          label="Cost ($) (Optional)"
          placeholder="0.00"
          {...register("cost")}
          error={errors.cost?.message}
        />
      </div>

      <Input
        label="Clinic Name (Optional)"
        placeholder="e.g. Riverside Vet"
        {...register("clinicName")}
        error={errors.clinicName?.message}
      />

      <Input
        label="Veterinarian Name (Optional)"
        placeholder="e.g. Dr. Smith"
        {...register("vetName")}
        error={errors.vetName?.message}
      />

      <Input
        label="Notes"
        placeholder="Treatment details, prescribed meds, etc."
        {...register("notes")}
        error={errors.notes?.message}
      />

      {errors.root && (
        <div className="p-3 bg-pale-red text-status-red text-body-sm rounded-md">
          {errors.root.message}
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
        >
          {initialData ? "Save Changes" : "Save Visit"}
        </Button>
      </div>
    </form>
  );
}
