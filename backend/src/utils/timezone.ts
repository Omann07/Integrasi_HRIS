import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

const TIMEZONE = "Asia/Jakarta";

/**
 * Ambil nama hari sekarang dalam WIB (misalnya: "monday", "tuesday", dst.)
 */
export function getTodayWIB(): string {
  return formatInTimeZone(new Date(), TIMEZONE, "EEEE").toLowerCase();
}

/**
 * Konversi tanggal dari WIB ke UTC (untuk disimpan di DB)
 */
export function toUTCFromWIB(date: Date | string | number): Date {
  return fromZonedTime(date, TIMEZONE);
}

/**
 * Konversi tanggal dari UTC ke WIB (untuk ditampilkan ke user)
 */
export function fromUTCToWIB(date: Date | string | number): Date {
  return toZonedTime(date, TIMEZONE);
}

/**
 * Format tanggal dalam WIB sesuai pola (contoh: "yyyy-MM-dd HH:mm:ss")
 */
export function formatWIB(date: Date | string | number, pattern = "yyyy-MM-dd HH:mm:ss"): string {
  return formatInTimeZone(date, TIMEZONE, pattern);
}
