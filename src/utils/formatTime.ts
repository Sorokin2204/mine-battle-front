/**
 * Format a date to show relative time like "Сегодня 20:30" or "Вчера 03:04"
 */
export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) {
    return `Сегодня ${timeStr}`;
  }

  if (isYesterday) {
    return `Вчера ${timeStr}`;
  }

  // For older dates, show full date
  const dateStr = date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  });

  return `${dateStr} ${timeStr}`;
}

/** Format a date as time only, for cards grouped under a date heading. */
export function formatTime(dateString: string | null): string {
  if (!dateString) return '';

  return new Date(dateString).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format a local calendar-day heading: "Сегодня", "Вчера" or "12 сентября". */
export function formatDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDifference = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (dayDifference === 0) return 'Сегодня';
  if (dayDifference === 1) return 'Вчера';

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

/** Stable key for grouping dates by the user's local calendar day. */
export function getLocalDateKey(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
