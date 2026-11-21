export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return String(d);
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
};

export const formatPrice = (min, max, raw) => {
  if (raw && min == null && max == null) return String(raw);
  if (min == null && max == null) return "Not available";
  const f = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
  if (min == null || max == null || min === max) return f(min ?? max);
  return `${f(min)}–${f(max)}`;
};

export const formatCo2 = (v) => {
  if (v == null || v === "") return "";
  return typeof v === "number" ? `${v} kg` : String(v);
};

export const cap = (s = "") => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "");

export const getErrorMessage = (e) =>
  e?.response?.data?.message ||
  e?.response?.data?.error ||
  e?.response?.data?.detail ||
  e?.message ||
  "Something went wrong. Please try again.";
