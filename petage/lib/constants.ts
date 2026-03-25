/**
 * Shared constants used across the PetAge application.
 * Centralises values that were previously duplicated across components.
 */

// ---- Species ----

/** Emoji mapping for pet species, used in PetCard and pet profile pages. */
export const speciesEmoji: Record<string, string> = {
  dog: "🐕",
  cat: "🐈",
  exotic: "🦎",
  other: "🐾",
};

/** Species picker options for the Add Pet form. */
export const speciesOptions = [
  { value: "dog", label: "Dog", emoji: "🐕" },
  { value: "cat", label: "Cat", emoji: "🐈" },
  { value: "exotic", label: "Exotic", emoji: "🦎" },
  { value: "other", label: "Other", emoji: "🐾" },
] as const;

// ---- Photo upload constraints ----

/** Maximum file size for pet photos (5 MB). */
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

/** MIME types accepted for pet photo uploads. */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];
