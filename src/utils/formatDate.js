

export function formatIsoToLocal(iso, {
  timeZone = 'Europe/Belgrade',      // stavi svoj TZ ili ukloni za device tz
  locale = navigator.language,
  dateStyle = 'medium',
  timeStyle = 'short',
} = {}) {
  if (!iso) return '';
  const d = new Date(iso);                 // parsira ISO i tretira ga kao UTC
  if (Number.isNaN(d)) return String(iso); // fallback
  return new Intl.DateTimeFormat(locale, { dateStyle, timeStyle, timeZone }).format(d);
}