// Small shared helpers for the employee panel (dates are "YYYY-MM-DD" strings).

// Fallback display name used by the payslip sample data.
export const employee = "Employee";

const pad2 = (value) => String(value).padStart(2, "0");

// Today's date in the user's local timezone, e.g. "2026-10-23".
export const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};

// Every date from `from` to `to` inclusive. Returns [] when the range is invalid.
export const dates = (from, to) => {
  if (!from || !to || from > to) return [];
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const cursor = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  const list = [];
  while (cursor <= end) {
    list.push(
      `${cursor.getFullYear()}-${pad2(cursor.getMonth() + 1)}-${pad2(cursor.getDate())}`,
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return list;
};

// "2026-10-23" -> "23-10-2026"
export const displayDate = (value) => {
  if (!value) return "";
  const [year, month, day] = String(value).split("T")[0].split("-");
  return year && month && day ? `${day}-${month}-${year}` : value;
};

// 52000 -> "₹52,000"
export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
