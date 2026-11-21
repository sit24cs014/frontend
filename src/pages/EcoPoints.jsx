import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { getDashboard } from "../services/wasteService";
import LoadingSpinner from "../components/LoadingSpinner";

export default function EcoPoints() {
  const [points, setPoints] = useState(null);
  useEffect(() => { getDashboard().then((d) => setPoints(d.ecoPoints)).catch(() => setPoints(0)); }, []);

  return (
    <div className="container narrow">
      <div className="card profile-card">
        <div className="stat-icon tone-green big"><Sparkles size={34} /></div>
        <h1>Your Eco Points</h1>
        {points === null ? <LoadingSpinner text="" /> : <p className="big-number">{points}</p>}
        <p className="muted">Earn Eco Points through responsible recycling. Analyze items and book pickups to grow your total.</p>
        <Link to="/upload" className="btn btn-primary">Upload E-Waste</Link>
      </div>
    </div>
  );
}
