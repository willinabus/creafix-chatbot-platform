/**
 * Utility functions shared across the app
 */

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
  }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
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
