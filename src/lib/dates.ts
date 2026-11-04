/** Date helpers shared by server and client. All dates are local YYYY-MM-DD strings. */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function today(): string {
  return toISODate(new Date());
}

export function monthKey(d: Date | string = new Date()): string {
  const date = typeof d === "string" ? parseISODate(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonthKey(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

export function monthLabel(key: string, opts: { year?: boolean } = {}): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    ...(opts.year ? { year: "numeric" } : {}),
  });
}

function daysInMonth(y: number, m0: number) {
  return new Date(y, m0 + 1, 0).getDate();
}

/** Add months, clamping the day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(iso: string, n: number): string {
  const d = parseISODate(iso);
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const day = Math.min(
    d.getDate(),
    daysInMonth(target.getFullYear(), target.getMonth()),
  );
  return toISODate(new Date(target.getFullYear(), target.getMonth(), day));
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = parseISODate(fromIso).getTime();
  const b = parseISODate(toIso).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Next date (today or later) a monthly bill on `dayOfMonth` falls. */
export function nextBillDate(
  dayOfMonth: number,
  from: string = today(),
): string {
  const f = parseISODate(from);
  const thisMonth = new Date(
    f.getFullYear(),
    f.getMonth(),
    Math.min(dayOfMonth, daysInMonth(f.getFullYear(), f.getMonth())),
  );
  if (toISODate(thisMonth) >= from) return toISODate(thisMonth);
  const nm = new Date(f.getFullYear(), f.getMonth() + 1, 1);
  return toISODate(
    new Date(
      nm.getFullYear(),
      nm.getMonth(),
      Math.min(dayOfMonth, daysInMonth(nm.getFullYear(), nm.getMonth())),
    ),
  );
}

/** Next occurrence of a fixed calendar date (month 1–12) on or after `from`. */
export function nextAnnual(
  month: number,
  day: number,
  from: string = today(),
): string {
  const f = parseISODate(from);
  const candidate = toISODate(new Date(f.getFullYear(), month - 1, day));
  return candidate >= from
    ? candidate
    : toISODate(new Date(f.getFullYear() + 1, month - 1, day));
}

/** UK tax year: 6 April – 5 April. */
export function ukTaxYear(from: string = today()) {
  const f = parseISODate(from);
  const startYear =
    f.getMonth() > 3 || (f.getMonth() === 3 && f.getDate() >= 6)
      ? f.getFullYear()
      : f.getFullYear() - 1;
  const start = toISODate(new Date(startYear, 3, 6));
  const end = toISODate(new Date(startYear + 1, 3, 5));
  return {
    label: `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`,
    start,
    end,
    daysLeft: daysBetween(from, end),
    elapsed: daysBetween(start, from) / daysBetween(start, end),
  };
}

export function relativeDue(iso: string, from: string = today()): string {
  const n = daysBetween(from, iso);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n < 0) return `${-n} days overdue`;
  if (n < 14) return `In ${n} days`;
  if (n < 60) return `In ${Math.round(n / 7)} weeks`;
  return `In ${Math.round(n / 30)} months`;
}

export function shortDate(iso: string): string {
  const d = parseISODate(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
