"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { createMedicationSchema, type CreateMedicationInput, type UpdateMedicationInput } from "@/lib/schemas/medication";
import { useMedicationStore } from "@/lib/store/medicationStore";
import type { Medication } from "@/lib/types";
import { formatTimestampToDateInput } from "@/components/vaccines/vaccine-utils";

interface MedicationFormProps {
  petId: string;
  initialData?: Medication;
}

export default function MedicationForm({ petId, initialData }: MedicationFormProps) {
  const router = useRouter();
  const { createMedication, updateMedication } = useMedicationStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateMedicationInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createMedicationSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      isGeneric: initialData?.isGeneric ?? false,
      dosageStrength: initialData?.dosageStrength || "",
      frequency: initialData?.frequency || "daily",
      customFreqDays: initialData?.customFreqDays,
      startDate: initialData?.startDate 
        ? formatTimestampToDateInput(initialData.startDate)
        : new Date().toISOString().split("T")[0],
      reminderEnabled: initialData?.reminderEnabled ?? true,
      notes: initialData?.notes || "",
    },
  });

  const frequency = watch("frequency");
  const isGeneric = watch("isGeneric");
  const reminderEnabled = watch("reminderEnabled");

  async function onSubmit(data: CreateMedicationInput) {
    if (initialData) {
      // Update existing
      const { error } = await updateMedication(petId, initialData.medicationId, data as UpdateMedicationInput);
      if (error) {
        setError("root", { message: error });
        return;
      }
    } else {
      // Create new
      const { error } = await createMedication(petId, data);
      if (error) {
        setError("root", { message: error });
        return;
      }
    }
    router.push(`/dashboard/medications?petId=${petId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Input
        label="Medication Name"
        placeholder="e.g. Heartgard Plus, Apoquel"
        {...register("name")}
        error={errors.name?.message}
      />

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox"
            className="w-4 h-4 rounded border-border-strong text-clinical-blue focus:ring-clinical-blue"
            checked={isGeneric}
            onChange={(e) => setValue("isGeneric", e.target.checked)}
          />
          <span className="text-[14px] text-text-primary font-medium">This is a Generic or OTC medication</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Dosage Strength (Optional)"
          placeholder="e.g. 5.4mg, 1 chew"
          {...register("dosageStrength")}
          error={errors.dosageStrength?.message}
        />
        <Input
          type="date"
          label="Start Date"
          {...register("startDate")}
          error={errors.startDate?.message}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
          Frequency
        </label>
        <select 
          className="w-full h-12 px-4 rounded-[10px] border-[1.5px] border-[#C5D0E0] text-text-primary text-[16px] outline-none transition-colors focus:border-clinical-blue focus:ring-1 focus:ring-clinical-blue bg-white appearance-none"
          {...register("frequency")}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom (e.g. every X days)</option>
        </select>
        {errors.frequency && <p className="text-[12px] text-status-red mt-1">{errors.frequency.message}</p>}
      </div>

      {frequency === "custom" && (
        <Input
          type="number"
          min="1"
          max="365"
          label="Custom Frequency (Days)"
          placeholder="e.g. 90 for every 3 months"
          {...register("customFreqDays")}
          error={errors.customFreqDays?.message}
        />
      )}

      <Input
        label="Notes"
        placeholder="Instructions, side effects, etc."
        {...register("notes")}
        error={errors.notes?.message}
      />

      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-md">
        <div>
          <p className="text-body-sm font-medium text-text-primary mb-0.5">
            Set Reminder
          </p>
          <p className="text-caption text-text-secondary">
            Get notified when it&apos;s time to administer
          </p>
        </div>
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
          {initialData ? "Save Changes" : "Save Medication"}
        </Button>
      </div>
    </form>
  );
}
