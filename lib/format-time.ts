const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelative(past: Date, now: Date = new Date()): string {
  let seconds = Math.round((past.getTime() - now.getTime()) / 1000);
  const sign = seconds < 0 ? -1 : 1;
  const abs = Math.abs(seconds);

  if (abs < 45) return rtf.format(Math.round(seconds / 1) || sign, "second");

  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");

  const hours = Math.round(seconds / 3600);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");

  const days = Math.round(seconds / 86400);
  if (Math.abs(days) < 30) return rtf.format(days, "day");

  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return rtf.format(months, "month");

  const years = Math.round(months / 12);
  return rtf.format(years, "year");
}

const dtf = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatAbsolute(d: Date): string {
  return dtf.format(d);
}
