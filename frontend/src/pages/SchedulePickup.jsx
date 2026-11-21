import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, MapPin, CalendarClock, Hash } from "lucide-react";
import PickupForm from "../components/PickupForm";
import { useAuth } from "../context/AuthContext";
import { schedulePickup } from "../services/wasteService";
import { formatDate } from "../utils/format";

export default function SchedulePickup() {
  const { user } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);

  const submit = async (form) => {
    const payload = {
      ...form,
      analysisId: state?.analysisId,
      deviceType: state?.deviceType || "other",
    };
    const res = await schedulePickup(payload);
    setBooking({
      ...res,
      date: res.date || form.date,
      time: res.time || form.time,
      address: res.address || [form.address, form.city, form.state, form.pincode].join(", "),
    });
  };

  if (booking) {
    return (
      <div className="container narrow">
        <div className="card confirm-card">
          <CheckCircle2 size={56} className="confirm-icon" />
          <h1>Pickup Confirmed!</h1>
          <p className="muted">Our team will collect your e-waste at the chosen time.</p>
          <div className="confirm-rows">
            <p><Hash size={16} /> <strong>Booking reference:</strong> {booking.reference}</p>
            <p><CalendarClock size={16} /> <strong>Pickup:</strong> {formatDate(booking.date)}, {booking.time}</p>
            <p><MapPin size={16} /> <strong>Address:</strong> {booking.address}</p>
            <p><strong>Status:</strong> <span className={`badge status-${booking.status.toLowerCase()}`}>{booking.status}</span></p>
          </div>
          <button className="btn btn-primary btn-block" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container narrow">
      <div className="center-head"><h1>Schedule Your E-Waste Pickup</h1><p className="muted">Tell us where and when to collect your items.</p></div>
      <div className="card"><PickupForm defaultName={user?.name || ""} onSubmit={submit} /></div>
    </div>
  );
}
