/**
 * Utility functions shared across the app
 */

/**
 * Deep merge objects — skips null/undefined values from source.
 * Keeps destination values when source is null/undefined.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function deepMerge<T extends object>(dest: T, source: Partial<T>): T {
  const result: Record<string, unknown> = { ...(dest as Record<string, unknown>) };
  const sourceRecord = source as Record<string, unknown>;
  for (const key of Object.keys(sourceRecord)) {
    const sVal = sourceRecord[key];
    if (sVal === null || sVal === undefined) {
      continue; // keep destination value
    }
    const dVal = result[key];
    if (isPlainObject(dVal) && isPlainObject(sVal)) {
      result[key] = deepMerge(dVal, sVal);
    } else {
      result[key] = sVal;
    }
  }
  return result as T;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Zurich",
  }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Zurich",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} à ${formatTime(date)}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function safelyParseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Parse an ISO date string but interpret it as Europe/Zurich local time.
 * The AI passes dates like "2026-04-30T15:00:00.000Z" meaning 15:00 Zurich time.
 */
export function parseAsZurichDate(isoString: string): Date {
  const match = isoString.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/
  );
  if (!match) return new Date(isoString);
  const [, y, mo, d, h, m, s] = match.map(Number);
  return new Date(y, mo - 1, d, h, m, s);
}

/**
 * Format a Date as "YYYY-MM-DDTHH:mm:ss" without timezone offset.
 * Google Calendar will interpret this with the provided timeZone field.
 */
export function formatLocalDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
