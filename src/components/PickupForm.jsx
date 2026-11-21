import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getErrorMessage } from "../utils/format";

const SLOTS = ["09:00 AM – 11:00 AM", "11:00 AM – 01:00 PM", "02:00 PM – 04:00 PM", "04:00 PM – 06:00 PM"];
const today = () => new Date().toISOString().split("T")[0];

function Field({ label, error, wide, children }) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export default function PickupForm({ defaultName = "", onSubmit }) {
  const [f, setF] = useState({ name: defaultName, mobile: "", address: "", city: "", state: "", pincode: "", date: "", time: "", instructions: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = "Full name is required.";
    if (!/^[6-9]\d{9}$/.test(f.mobile)) e.mobile = "Enter a valid 10-digit mobile number.";
    if (!f.address.trim()) e.address = "Pickup address is required.";
    if (!f.city.trim()) e.city = "City is required.";
    if (!f.state.trim()) e.state = "State is required.";
    if (!/^\d{6}$/.test(f.pincode)) e.pincode = "Enter a valid 6-digit pincode.";
    if (!f.date) e.date = "Choose a pickup date.";
    else if (f.date < today()) e.date = "Pickup date cannot be in the past.";
    if (!f.time) e.time = "Choose a pickup time.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(f);
    } catch (err) {
      setServerError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <form className="pickup-form" onSubmit={submit} noValidate>
      {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
      <div className="form-grid">
        <Field error={errors.name} label="Full Name"><input value={f.name} onChange={set("name")} placeholder="Your full name" /></Field>
        <Field error={errors.mobile} label="Mobile Number"><input value={f.mobile} onChange={set("mobile")} placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} /></Field>
        <Field error={errors.address} label="Pickup Address" wide><input value={f.address} onChange={set("address")} placeholder="House / flat, street, area" /></Field>
        <Field error={errors.city} label="City"><input value={f.city} onChange={set("city")} placeholder="City" /></Field>
        <Field error={errors.state} label="State"><input value={f.state} onChange={set("state")} placeholder="State" /></Field>
        <Field error={errors.pincode} label="Pincode"><input value={f.pincode} onChange={set("pincode")} placeholder="6-digit pincode" inputMode="numeric" maxLength={6} /></Field>
        <Field error={errors.date} label="Preferred Pickup Date"><input type="date" min={today()} value={f.date} onChange={set("date")} /></Field>
        <Field error={errors.time} label="Preferred Pickup Time">
          <select value={f.time} onChange={set("time")}>
            <option value="">Select a time slot</option>
            {SLOTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field error={errors.instructions} label="Additional Instructions" wide>
          <textarea rows={3} value={f.instructions} onChange={set("instructions")} placeholder="Landmark, gate code, or anything the pickup team should know (optional)" />
        </Field>
      </div>
      <button className="btn btn-primary btn-block" disabled={loading}>
        {loading ? <><Loader2 size={18} className="spin" /> Confirming...</> : "Confirm Pickup"}
      </button>
    </form>
  );
}
