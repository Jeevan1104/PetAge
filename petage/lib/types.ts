// ===========================
// PetAge TypeScript Types
// Mirrors Firestore schema from TRD §4
// ===========================

import { Timestamp } from "firebase/firestore";

// ---- User ----
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  tier: "free" | "premium";
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionEnd?: Timestamp;
  expoPushToken?: string;
  notifPush: boolean;
  notifEmail: boolean;
  reminderLeadDays: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---- Pet ----
export type PetSpecies = "dog" | "cat" | "exotic" | "other";

export interface Pet {
  petId: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  dateOfBirth?: Timestamp;
  photoURL?: string;
  microchipId?: string;
  isArchived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---- Vaccine ----
export type VaccineStatus = "current" | "due_soon" | "overdue";

export interface Vaccine {
  vaccineId: string;
  petId: string;
  ownerId: string;
  name: string;
  dateAdministered: Timestamp;
  expiryDate?: Timestamp;
  reminderEnabled: boolean;
  reminderLeadDays: number;
  reminderSent: boolean;
  status: VaccineStatus;
  notes?: string;
  isArchived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---- Vet Visit ----
export interface VetVisit {
  visitId: string;
  petId: string;
  ownerId: string;
  visitDate: Timestamp;
  clinicName?: string;
  vetName?: string;
  cost?: number;
  reason: string;
  notes?: string;
  isArchived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---- Medication ----
export type MedFrequency = "daily" | "weekly" | "monthly" | "custom";

export interface Medication {
  medicationId: string;
  petId: string;
  ownerId: string;
  name: string;
  isGeneric: boolean;
  dosageStrength?: string;
  frequency: MedFrequency;
  customFreqDays?: number;
  startDate: Timestamp;
  nextDueDate: Timestamp;
  reminderEnabled: boolean;
  reminderSent: boolean;
  isArchived: boolean;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---- Weight Log ----
export type WeightUnit = "kg" | "lbs";

export interface WeightLog {
  logId: string;
  petId: string;
  ownerId: string;
  weight: number; // Always stored in kg internally
  unit: WeightUnit;
  logDate: Timestamp;
  notes?: string;
  createdAt: Timestamp;
}
