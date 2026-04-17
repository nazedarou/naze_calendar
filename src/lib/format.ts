import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Singapore";

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return formatInTimeZone(date, TZ, "MMM d, yyyy");
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return formatInTimeZone(date, TZ, "MMM d, yyyy h:mm a");
}

export function formatMoney(amount: unknown, currency = "USD") {
  const num = typeof amount === "number" ? amount : Number(amount ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(num);
}

export function toDateInputValue(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return formatInTimeZone(date, TZ, "yyyy-MM-dd");
}

export function toDateTimeInputValue(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return formatInTimeZone(date, TZ, "yyyy-MM-dd'T'HH:mm");
}
