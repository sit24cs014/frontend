// DEMO MODE ONLY – used when the backend is unreachable.
// Nothing here is a real Machine Learning prediction.
const KEY = "erevive_demo_db";
const load = () => JSON.parse(localStorage.getItem(KEY) || '{"users":[],"analyses":[],"pickups":[]}');
const save = (db) => localStorage.setItem(KEY, JSON.stringify(db));
const wait = (ms = 700) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);
const current = () => localStorage.getItem("erevive_demo_email");

const ecoPoints = (db, email) =>
  db.analyses.filter((a) => a.owner === email).length * 10 +
  db.pickups.filter((p) => p.owner === email).length * 25;

export async function register({ name, email, password }) {
  await wait();
  const db = load();
  if (db.users.some((u) => u.email === email.toLowerCase())) throw new Error("An account with this email already exists.");
  db.users.push({ name, email: email.toLowerCase(), password });
  save(db);
  localStorage.setItem("erevive_demo_email", email.toLowerCase());
  return { token: "demo-token", user: { name, email: email.toLowerCase() } };
}

export async function login({ email, password }) {
  await wait();
  const u = load().users.find((x) => x.email === email.toLowerCase() && x.password === password);
  if (!u) throw new Error("Invalid email or password.");
  localStorage.setItem("erevive_demo_email", u.email);
  return { token: "demo-token", user: { name: u.name, email: u.email } };
}

export async function forgotPassword() {
  await wait();
  return { message: "Demo mode: no email was sent. Connect the backend to enable password reset." };
}

export async function getDashboard() {
  await wait(300);
  const db = load();
  const me = current();
  const analyses = db.analyses.filter((a) => a.owner === me).reverse();
  const pickups = db.pickups.filter((p) => p.owner === me).reverse();
  return { ecoPoints: ecoPoints(db, me), itemsAnalyzed: analyses.length, pickupsBooked: pickups.length, analyses, pickups };
}

export async function analyzeImage(file, thumb) {
  await wait(1500);
  const db = load();
  const record = {
    id: uid(),
    owner: current(),
    image_url: thumb,
    created_at: new Date().toISOString(),
    demo: true,
    component: "Sample component (demo)",
    reusability: "Medium",
    price_min: 100,
    price_max: 300,
    repair_suggestion: "Demo text only. Connect the backend to get a real repair or reuse recommendation.",
    co2_saved: "2–3 kg",
  };
  db.analyses.push(record);
  save(db);
  return record;
}

export async function getAnalysis(id) {
  const a = load().analyses.find((x) => x.id === id);
  if (!a) throw new Error("Analysis not found.");
  return a;
}

export async function schedulePickup(payload) {
  await wait(900);
  const db = load();
  const record = { id: uid(), owner: current(), reference: "DEMO-" + uid().toUpperCase(), status: "Scheduled", ...payload };
  db.pickups.push(record);
  save(db);
  return record;
}

export function makeThumb(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 320 / img.width);
        const c = document.createElement("canvas");
        c.width = img.width * s;
        c.height = img.height * s;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => resolve("");
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
