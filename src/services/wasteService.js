import api, { withFallback } from "./api";
import * as demo from "./demo";
import { cap } from "../utils/format";

export const normAnalysis = (a = {}) => ({
  id: a.id ?? a._id,
  image: a.image_url || a.imageUrl || a.image || "",
  component: a.component || a.detected_component || a.predicted_class || "Unknown",
  reusability: cap(a.reusability || a.reusability_level || "Unknown"),
  priceMin: a.price_min ?? a.priceMin ?? a.estimated_price?.min,
  priceMax: a.price_max ?? a.priceMax ?? a.estimated_price?.max,
  priceRaw: typeof a.estimated_price === "string" ? a.estimated_price : undefined,
  suggestion: a.repair_suggestion || a.suggestion || "",
  co2: a.co2_saved ?? a.carbon_saved ?? a.co2 ?? "",
  date: a.created_at || a.createdAt || a.date,
  demo: !!a.demo,
});

export const normPickup = (p = {}) => ({
  id: p.id ?? p._id,
  reference: p.reference || p.booking_reference || p.bookingId || p.id || p._id,
  address: [p.address, p.city, p.state, p.pincode].filter(Boolean).join(", "),
  date: p.date || p.pickup_date,
  time: p.time || p.pickup_time,
  status: cap(p.status || "Pending"),
});

// Expected backend: GET /dashboard -> { ecoPoints, itemsAnalyzed, pickupsBooked, analyses[], pickups[] }
export const getDashboard = () =>
  withFallback(
    async () => (await api.get("/dashboard")).data,
    () => demo.getDashboard()
  ).then((d) => ({
    ecoPoints: d.ecoPoints ?? d.eco_points ?? 0,
    itemsAnalyzed: d.itemsAnalyzed ?? d.items_analyzed ?? d.analyses?.length ?? 0,
    pickupsBooked: d.pickupsBooked ?? d.pickups_booked ?? d.pickups?.length ?? 0,
    analyses: (d.analyses || []).map(normAnalysis),
    pickups: (d.pickups || []).map(normPickup),
  }));

// Expected backend: POST /analyze  (multipart field "image") -> analysis object
export const analyzeImage = (file, onProgress) => {
  const form = new FormData();
  form.append("image", file);
  return withFallback(
    async () =>
      normAnalysis(
        (
          await api.post("/analyze", form, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)),
          })
        ).data
      ),
    async () => normAnalysis(await demo.analyzeImage(file, await demo.makeThumb(file)))
  );
};

// Expected backend: GET /analyses/:id
export const getAnalysis = (id) =>
  withFallback(
    async () => normAnalysis((await api.get(`/analyses/${id}`)).data),
    async () => normAnalysis(await demo.getAnalysis(id))
  );

// Expected backend: POST /pickups -> { id, reference, status, ... }
export const schedulePickup = (payload) =>
  withFallback(
    async () => normPickup({ ...payload, ...(await api.post("/pickups", payload)).data }),
    async () => normPickup(await demo.schedulePickup(payload))
  );
// Submit questionnaire answers to the Java backend
export const submitQuestionnaire = async (answers) => {
  const response = await api.post("/survey", answers);
  return response.data;
};