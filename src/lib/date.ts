export const DUBAI_TIMEZONE = 'Asia/Dubai';

/**
 * Format a date/ISO string into Dubai date and time (GST, UTC+4).
 */
export function formatDubaiDateTime(
  dateInput: string | Date | null | undefined,
  options?: { includeSeconds?: boolean; short?: boolean }
): string {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('en-GB', {
      timeZone: DUBAI_TIMEZONE,
      day: '2-digit',
      month: options?.short ? 'short' : 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: options?.includeSeconds ? '2-digit' : undefined,
      hour12: false,
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Format a date/ISO string into just the Dubai time (HH:mm or HH:mm:ss).
 */
export function formatDubaiTime(
  dateInput: string | Date | null | undefined,
  options?: { includeSeconds?: boolean }
): string {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('en-GB', {
      timeZone: DUBAI_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: options?.includeSeconds ? '2-digit' : undefined,
      hour12: false,
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Format a date/ISO string into Dubai date only (e.g. 29 Sep 2026).
 */
export function formatDubaiDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('en-GB', {
      timeZone: DUBAI_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
}

/**
 * Checks if a timestamp in Dubai time falls outside business hours:
 * Operating hours: Mon-Sat 09:00 - 19:00 GST
 * Outside: Sunday (all day), or Mon-Sat before 09:00 or at/after 19:00.
 */
export function isOutsideDubaiBusinessHours(dateInput: string | Date): boolean {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return false;

    // Get weekday and hour in Asia/Dubai
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: DUBAI_TIMEZONE,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const weekday = parts.find((p) => p.type === 'weekday')?.value; // 'Sun', 'Mon', etc.
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

    // Sunday is completely outside business hours
    if (weekday === 'Sun') {
      return true;
    }

    // Mon - Sat operating hours: 09:00 to 19:00
    // Outside if before 9:00 (hour < 9) or at/after 19:00 (hour >= 19)
    if (hour < 9 || hour >= 19) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Formats wait duration relative to now or a target time (e.g. 14m, 2h 15m, 3d).
 */
export function formatDuration(sinceInput: string | Date | null | undefined): string {
  if (!sinceInput) return '—';
  try {
    const date = typeof sinceInput === 'string' ? new Date(sinceInput) : sinceInput;
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 0) return 'Just now';

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;

    const diffHours = Math.floor(diffMin / 60);
    const remMin = diffMin % 60;
    if (diffHours < 24) {
      return remMin > 0 ? `${diffHours}h ${remMin}m` : `${diffHours}h`;
    }

    const diffDays = Math.floor(diffHours / 24);
    const remHours = diffHours % 24;
    return remHours > 0 ? `${diffDays}d ${remHours}h` : `${diffDays}d`;
  } catch {
    return '—';
  }
}
