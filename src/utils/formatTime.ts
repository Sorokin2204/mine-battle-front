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
