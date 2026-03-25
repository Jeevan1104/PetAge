import Image from "next/image";
import StatusPill from "./StatusPill";
import { speciesEmoji } from "@/lib/constants";

// Design Brief §05: 220px wide, 16px radius, 52×52 avatar
// 2px Clinical Blue ring when active
// Dashed border for "Add Pet" card

interface PetCardProps {
  name: string;
  breed?: string;
  age?: string;
  species: string;
  photoURL?: string;
  alertCount?: number;
  alertType?: "due_soon" | "overdue";
  isActive?: boolean;
  onClick?: () => void;
}

interface AddPetCardProps {
  onClick?: () => void;
}

export function PetCard({
  name,
  breed,
  age,
  species,
  photoURL,
  alertCount,
  alertType,
  isActive,
  onClick,
}: PetCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3.5 w-[220px] p-4
        bg-card border rounded-lg
        transition-all duration-100 text-left cursor-pointer shrink-0
        hover:border-mid-blue
        active:scale-[0.97]
        ${isActive ? "border-[2px] border-clinical-blue" : "border-border"}
      `}
    >
      {/* Avatar */}
      <div className="w-[52px] h-[52px] rounded-full bg-blue-tint flex items-center justify-center text-[22px] shrink-0 overflow-hidden">
        {photoURL ? (
          <Image
            src={photoURL}
            alt={name}
            width={52}
            height={52}
            className="w-full h-full object-cover"
          />
        ) : (
          speciesEmoji[species] || "🐾"
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0">
        <span className="text-[15px] font-semibold text-text-primary truncate">
          {name}
        </span>
        <span className="text-[12px] text-text-tertiary truncate">
          {breed && `${breed} · `}{age}
        </span>
        {alertCount && alertCount > 0 && (
          <div className="mt-1.5">
            <StatusPill
              variant={alertType === "overdue" ? "red" : "amber"}
            >
              {alertCount} {alertType === "overdue" ? "overdue" : "due soon"}
            </StatusPill>
          </div>
        )}
      </div>
    </button>
  );
}

export function AddPetCard({ onClick }: AddPetCardProps) {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center justify-center w-[220px] min-h-[100px] p-4
        border-2 border-dashed border-border-strong rounded-lg
        text-text-tertiary hover:border-mid-blue hover:text-mid-blue
        transition-colors duration-150 cursor-pointer shrink-0
        active:scale-[0.97]
      "
    >
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl">+</span>
        <span className="text-[13px] font-medium">Add Pet</span>
      </div>
    </button>
  );
}
