import api, { API_ENDPOINTS } from "./api";
import { cap } from "../utils/format";

const TIME_SLOT_LABELS = {
  "09:00-11:00": "09:00 AM – 11:00 AM",
  "11:00-13:00": "11:00 AM – 01:00 PM",
  "14:00-16:00": "02:00 PM – 04:00 PM",
  "16:00-18:00": "04:00 PM – 06:00 PM",
};

export const normAnalysis = (a = {}) => ({
  ...a,
  id: a.id ?? a.surveyId ?? a._id,
  image: a.image_url || a.imageUrl || a.image || "",
  component: a.component || a.detected_component || a.predicted_class || "Unknown",
  reusability: cap(a.reusability || a.reusability_level || a.recommendation || "Unknown"),
  priceMin: a.price_min ?? a.priceMin ?? a.estimatedValueMin ?? a.estimated_price?.min,
  priceMax: a.price_max ?? a.priceMax ?? a.estimatedValueMax ?? a.estimated_price?.max,
  priceRaw: typeof a.estimated_price === "string" ? a.estimated_price : undefined,
  suggestion: a.repair_suggestion || a.suggestion || a.reason || "",
  co2: a.co2_saved ?? a.carbon_saved ?? a.co2SavedKg ?? a.co2 ?? "",
  date: a.created_at || a.createdAt || a.date,
});

export const normPickup = (p = {}) => ({
  ...p,
  id: p.id ?? p.bookingId ?? p._id,
  reference: p.reference || p.booking_reference || p.bookingId || p.id || p._id,
  address: p.pickupAddress || p.address || [p.city, p.state, p.pincode].filter(Boolean).join(", "),
  date: p.date || p.pickupDate || p.pickup_date,
  time: TIME_SLOT_LABELS[p.time || p.timeSlot || p.pickup_time] || p.time || p.timeSlot || p.pickup_time,
  status: cap(p.status || "Pending"),
});

export const getDashboard = async () => {
  const { data } = await api.get(API_ENDPOINTS.dashboard);
  return {
    ...data,
    ecoPoints: data.ecoPoints ?? data.eco_points ?? 0,
    itemsAnalyzed: data.itemsAnalyzed ?? data.items_analyzed ?? data.analyses?.length ?? 0,
    pickupsBooked: data.pickupsBooked ?? data.pickups_booked ?? data.pickups?.length ?? 0,
    analyses: (data.analyses || []).map(normAnalysis),
    pickups: (data.pickups || []).map(normPickup),
  };
};

export const submitQuestionnaire = async (answers, file) => {
  const form = new FormData();
  Object.entries(answers).forEach(([key, value]) => form.append(key, value));
  if (file) form.append("image", file);
  const { data } = await api.post(API_ENDPOINTS.survey, form);
  return normAnalysis(data);
};

export const getAnalysis = async (id) => {
  const { data } = await api.get(`${API_ENDPOINTS.analyses}/${encodeURIComponent(id)}`);
  return normAnalysis(data);
};

export const schedulePickup = async (form) => {
  const payload = {
    fullName: form.name,
    phone: form.mobile,
    address: form.address,
    city: form.city,
    state: form.state,
    pinCode: form.pincode,
    pickupDate: form.date,
    timeSlot: form.time,
    instructions: form.instructions,
    deviceType: form.deviceType,
    analysisId: form.analysisId,
  };
  const { data } = await api.post(API_ENDPOINTS.pickups, payload);
  return normPickup(data);
};