export type VaccineStatus = "current" | "due_soon" | "overdue" | "no_expiry";

export interface Vaccine {
  id: string;
  name: string;
  dateAdministered: string; // ISO date string
  expiryDate?: string; // ISO date string
  reminderEnabled: boolean;
  status: VaccineStatus;
}
