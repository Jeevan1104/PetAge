"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { getStorage, getAuth } from "@/lib/firebase";
import { usePetStore } from "@/lib/store/petStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const speciesOptions = [
  { value: "dog", label: "Dog", emoji: "🐕" },
  { value: "cat", label: "Cat", emoji: "🐈" },
  { value: "exotic", label: "Exotic", emoji: "🦎" },
  { value: "other", label: "Other", emoji: "🐾" },
] as const;

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Max 50 characters"),
  species: z.enum(["dog", "cat", "exotic", "other"]),
  breed: z.string().max(60).optional(),
  dateOfBirth: z.string().optional(),
  microchipId: z.string().max(30).optional(),
});

type FormData = z.infer<typeof schema>;

async function uploadPetPhoto(file: File): Promise<string> {
  const userId = getAuth().currentUser?.uid;
  if (!userId) throw new Error("Not authenticated");
  const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
  const path = `pets/${userId}/${Date.now()}_${safeName}`;
  const ref = storageRef(getStorage(), path);
  const snap = await uploadBytes(ref, file);
  return getDownloadURL(snap.ref);
}

export default function AddPetPage() {
  const router = useRouter();
  const { createPet } = usePetStore();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function onSubmit(data: FormData) {
    setServerError(null);
    setUploading(true);

    try {
      let photoURL: string | undefined;
      if (photoFile) {
        photoURL = await uploadPetPhoto(photoFile);
      }

      const result = await createPet({
        name: data.name,
        species: data.species,
        breed: data.breed || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        microchipId: data.microchipId || undefined,
        photoURL,
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
    } finally {
      setUploading(false);
    }
  }

  const isLoading = isSubmitting || uploading;

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
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-2 py-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-blue-tint border-2 border-dashed border-border-strong flex items-center justify-center overflow-hidden hover:border-clinical-blue transition-colors active:scale-[0.97]"
              aria-label="Upload pet photo"
            >
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Pet preview"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">
                  {speciesOptions.find((s) => s.value === selectedSpecies)
                    ?.emoji ?? "🐾"}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[13px] text-clinical-blue font-medium hover:underline"
            >
              {photoPreview ? "Change photo" : "Add photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

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
            loading={isLoading}
          >
            {uploading ? "Uploading photo…" : "Save pet"}
          </Button>
        </form>
      </div>
    </div>
  );
}
