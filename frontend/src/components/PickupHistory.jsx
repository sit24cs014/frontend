import { Link } from "react-router-dom";
import { CalendarClock, MapPin, Truck } from "lucide-react";
import { formatDate } from "../utils/format";

export default function PickupHistory({ items }) {
  return (
    <section className="panel">
      <h2>Pickup History</h2>
      {items.length === 0 ? (
        <div className="empty">
          <Truck size={34} />
          <p>No pickups booked yet. Analyze an item, then schedule a doorstep pickup.</p>
          <Link to="/schedule-pickup" className="btn btn-primary">Schedule Pickup</Link>
        </div>
      ) : (
        <ul className="list">
          {items.map((p) => (
            <li key={p.id} className="list-item">
              <div className="list-main">
                <p className="list-title"><MapPin size={15} /> {p.address || "—"}</p>
                <p className="list-meta"><CalendarClock size={14} /> {formatDate(p.date)} · {p.time || "—"}</p>
              </div>
              <span className={`badge status-${p.status.toLowerCase()}`}>{p.status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
