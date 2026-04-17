import { format } from "date-fns";

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "MMM d, yyyy");
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "MMM d, yyyy h:mm a");
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
  return format(date, "yyyy-MM-dd");
}

export function toDateTimeInputValue(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "yyyy-MM-dd'T'HH:mm");
}
