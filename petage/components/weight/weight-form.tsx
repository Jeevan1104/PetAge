"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { createWeightSchema, type CreateWeightInput } from "@/lib/schemas/weight";
import { useWeightStore } from "@/lib/store/weightStore";

interface WeightFormProps {
  petId: string;
}

export default function WeightForm({ petId }: WeightFormProps) {
  const router = useRouter();
  const { createLog } = useWeightStore();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateWeightInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createWeightSchema) as any,
    defaultValues: {
      logDate: new Date().toISOString().split("T")[0],
      unit: "lbs",
      notes: "",
    },
  });

  async function onSubmit(data: CreateWeightInput) {
    const { error } = await createLog(petId, data);
    if (error) {
      setError("root", { message: error });
      return;
    }
    router.push(`/dashboard/weight?petId=${petId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Input
            type="number"
            step="0.1"
            min="0"
            label="Weight"
            placeholder="0.0"
            {...register("weight")}
            error={errors.weight?.message}
          />
        </div>
        <div className="w-[100px] flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
            Unit
          </label>
          <select 
            className="w-full h-12 px-4 rounded-[10px] border-[1.5px] border-[#C5D0E0] text-text-primary text-[16px] outline-none transition-colors focus:border-clinical-blue focus:ring-1 focus:ring-clinical-blue bg-white appearance-none"
            {...register("unit")}
          >
            <option value="lbs">lbs</option>
            <option value="kg">kg</option>
          </select>
        </div>
      </div>

      <Input
        type="date"
        label="Date Recorded"
        {...register("logDate")}
        error={errors.logDate?.message}
      />

      <Input
        label="Notes (Optional)"
        placeholder="Diet changes, vet insights"
        {...register("notes")}
        error={errors.notes?.message}
      />

      {errors.root && (
        <div className="p-3 bg-pale-red text-status-red text-body-sm rounded-md">
          {errors.root.message}
        </div>
      )}

      <div className="pt-4">
        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
        >
          Save Log
        </Button>
      </div>
    </form>
  );
}
