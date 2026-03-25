"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { createVaccineSchema, type CreateVaccineInput, type UpdateVaccineInput } from "@/lib/schemas/vaccine";
import { useVaccineStore } from "@/lib/store/vaccineStore";
import type { Vaccine } from "@/lib/types";
import { formatTimestampToDateInput } from "./vaccine-utils";

interface VaccineFormProps {
  petId: string;
  initialData?: Vaccine;
}

export default function VaccineForm({ petId, initialData }: VaccineFormProps) {
  const router = useRouter();
  const { createVaccine, updateVaccine } = useVaccineStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateVaccineInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createVaccineSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      dateAdministered: initialData?.dateAdministered 
        ? formatTimestampToDateInput(initialData.dateAdministered)
        : new Date().toISOString().split("T")[0],
      expiryDate: initialData?.expiryDate 
        ? formatTimestampToDateInput(initialData.expiryDate)
        : "",
      reminderEnabled: initialData?.reminderEnabled ?? true,
      reminderLeadDays: initialData?.reminderLeadDays ?? 30,
      notes: initialData?.notes ?? "",
    },
  });

  const reminderEnabled = watch("reminderEnabled");

  async function onSubmit(data: CreateVaccineInput) {
    if (initialData) {
      // Update existing
      const { error } = await updateVaccine(petId, initialData.vaccineId, data as UpdateVaccineInput);
      if (error) {
        setError("root", { message: error });
        return;
      }
    } else {
      // Create new
      const { error } = await createVaccine(petId, data);
      if (error) {
        setError("root", { message: error });
        return;
      }
    }
    router.push(`/dashboard/vaccines?petId=${petId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Input
        label="Vaccine Name"
        placeholder="e.g. Rabies (1 Yr)"
        {...register("name")}
        error={errors.name?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Date Administered"
          {...register("dateAdministered")}
          error={errors.dateAdministered?.message}
        />
        <Input
          type="date"
          label="Expiry Date (Optional)"
          {...register("expiryDate")}
          error={errors.expiryDate?.message}
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-md">
        <div>
          <p className="text-body-sm font-medium text-text-primary mb-0.5">
            Set Reminder
          </p>
          <p className="text-caption text-text-secondary">
            Get notified 30 days before expiry
          </p>
        </div>
        
        {/* Simple Switch */}
        <button
          type="button"
          onClick={() => setValue("reminderEnabled", !reminderEnabled)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinical-blue focus-visible:ring-offset-2
            ${reminderEnabled ? "bg-clinical-blue" : "bg-border-strong"}
          `}
          role="switch"
          aria-checked={reminderEnabled}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${reminderEnabled ? "translate-x-6" : "translate-x-1"}
            `}
          />
        </button>
      </div>

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
          {initialData ? "Save Changes" : "Save Vaccine"}
        </Button>
      </div>
    </form>
  );
}
