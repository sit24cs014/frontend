import { Link, useNavigate } from "react-router-dom";
import { ImageOff, ScanSearch } from "lucide-react";
import { formatDate, formatPrice } from "../utils/format";

export default function RecentAnalysis({ items }) {
  const navigate = useNavigate();
  return (
    <section className="panel">
      <h2>Recent Analyses</h2>
      {items.length === 0 ? (
        <div className="empty">
          <ScanSearch size={34} />
          <p>No analyses yet. Upload a photo of your e-waste to get started.</p>
          <Link to="/upload" className="btn btn-primary">Upload E-Waste</Link>
        </div>
      ) : (
        <ul className="list">
          {items.map((a) => (
            <li key={a.id} className="list-item clickable" onClick={() => navigate(`/analysis/${a.id}`, { state: { analysis: a } })}>
              <div className="thumb">{a.image ? <img src={a.image} alt={a.component} /> : <ImageOff size={22} />}</div>
              <div className="list-main">
                <p className="list-title">{a.component}</p>
                <p className="list-meta">Estimated Price: {formatPrice(a.priceMin, a.priceMax, a.priceRaw)}</p>
                <p className="list-meta">{formatDate(a.date)}</p>
              </div>
              <span className={`badge reuse-${a.reusability.toLowerCase()}`}>{a.reusability}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
