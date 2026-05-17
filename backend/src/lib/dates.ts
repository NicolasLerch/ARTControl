export function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function toDateOnlyString(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function toTimelineDateTime(date: Date, hora?: string | null) {
  const isoDate = toDateOnlyString(date);
  return hora ? `${isoDate}T${hora}:00.000Z` : `${isoDate}T00:00:00.000Z`;
}
