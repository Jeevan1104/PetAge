export function parseTimestampString(val: unknown): Date | null {
  if (!val) return null;
  
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    // Firestore Admin SDK Timestamp serialization typically looks like:
    // { _seconds: 1673308800, _nanoseconds: 0 }
    if ('_seconds' in obj && typeof obj._seconds === 'number') {
      return new Date(obj._seconds * 1000);
    }
    // Client SDK Timestamp
    if ('seconds' in obj && typeof obj.seconds === 'number') {
      return new Date(obj.seconds * 1000);
    }
  }
  
  // If it's a direct ISO string (e.g. from our mock data previously)
  if (typeof val === 'string') {
    return new Date(val);
  }
  
  return null;
}

export function formatTimestampToDateInput(val: unknown): string {
  const date = parseTimestampString(val);
  if (!date) return "";
  return date.toISOString().split("T")[0];
}
