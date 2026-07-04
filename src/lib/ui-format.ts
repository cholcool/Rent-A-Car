import { cn } from "@/lib/utils";

export const appSurfaceClass =
  "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60";

export const appInputClass =
  "h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm shadow-slate-200/50 outline-none transition-colors placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20";

export function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function formatBaht(value: unknown) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function formatCompactNumber(value: unknown) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(toNumber(value));
}

export function formatThaiDate(value?: Date | string | null) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const parts = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";

  return `${day}/${month}/${year}`;
}

export function getStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    Active: "ใช้งาน",
    Available: "พร้อมให้เช่า",
    Booked: "จองแล้ว",
    Cancelled: "ยกเลิก",
    Confirmed: "ยืนยันแล้ว",
    Completed: "เสร็จสิ้น",
    Failed: "ล้มเหลว",
    InActive: "ไม่ใช้งาน",
    InProgress: "กำลังดำเนินการ",
    Insurance: "ประกันภัย",
    Maintenance: "บำรุงรักษา",
    Paid: "ชำระเงินแล้ว",
    Pending: "รอดำเนินการ",
    Reserved: "กำลังจอง",
    Rejected: "ถูกปฏิเสธ",
    Refunded: "คืนเงิน",
    Tax: "ภาษี",
    Unavailable: "ไม่พร้อมใช้",
  };

  return status ? labels[status] ?? status : "Unknown";
}

export function getNotificationLabel(status?: string | null) {
  const labels: Record<string, string> = {
    Active: "แจ้งเตือน",
    Complete: "เสร็จสิ้น",
    Pending: "รอแจ้งเตือน",
    Overdue: "เกินกำหนด",
  };

  return status ? labels[status] ?? status : "Unknown";
}

export function getStatusBadgeClass(status?: string | null, className?: string) {
  const normalized = (status ?? "").toLowerCase().replace(/\s+/g, "");

  return cn(
    "rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700",
    ["available", "active", "confirmed", "inprogress", "paid"].includes(normalized) &&
      "bg-emerald-100 text-emerald-700",
    ["pending", "maintenance"].includes(normalized) && "bg-amber-100 text-amber-700",
    ["booked", "reserved"].includes(normalized) && "bg-blue-100 text-blue-700",
    ["completed", "complete", "refunded"].includes(normalized) && "bg-blue-100 text-blue-700",
    ["cancelled", "rejected", "failed", "unavailable"].includes(normalized) &&
      "bg-red-100 text-red-700",
    className
  );
}
