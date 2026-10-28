// All attendance/leave dates are stored as UTC midnight ("date-only" values) so
// "2026-10-23" always means the same calendar day no matter where the server runs.
const TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

// "YYYY-MM-DD" for a stored UTC-midnight date (or any Date/ISO string).
export const formatDateToString = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

// Today's calendar date as "YYYY-MM-DD" in the business timezone.
export const getTodayString = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

// Today as a UTC-midnight Date (how attendance dates are stored and compared).
export const getTodayUTC = () => new Date(`${getTodayString()}T00:00:00.000Z`);

// Parses "YYYY-MM-DD" (or an ISO string) into a UTC-midnight Date, or null if invalid.
export const parseDateOnly = (value) => {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Every "YYYY-MM-DD" between two UTC-midnight dates, inclusive (capped for safety).
export const eachDateInRange = (from, to, maxDays = 800) => {
  const days = [];
  const cursor = new Date(from);
  while (cursor <= to && days.length < maxDays) {
    days.push(formatDateToString(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
};
