export function startOfDay(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}
export function endOfDay(value) {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
}
export function toDateOnlyString(value) {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toISOString().slice(0, 10);
}
export function toTimelineDateTime(date, hora) {
    const isoDate = toDateOnlyString(date);
    return hora ? `${isoDate}T${hora}:00.000Z` : `${isoDate}T00:00:00.000Z`;
}
