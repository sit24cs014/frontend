import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { getDashboard } from "../services/wasteService";
import { getErrorMessage } from "../utils/format";
import LoadingSpinner from "../components/LoadingSpinner";

export default function EcoPoints() {
  const [points, setPoints] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getDashboard()
      .then((data) => setPoints(data.ecoPoints))
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);

  return (
    <div className="container narrow">
      <div className="card profile-card">
        <div className="stat-icon tone-green big"><Sparkles size={34} /></div>
        <h1>Your Eco Points</h1>
        {error ? <div className="alert alert-error" role="alert">{error}</div> : null}
        {points === null && !error ? <LoadingSpinner text="" /> : null}
        {points !== null ? <p className="big-number">{points}</p> : null}
        <p className="muted">Earn Eco Points through responsible recycling. Analyze items and book pickups to grow your total.</p>
        <Link to="/upload" className="btn btn-primary">Upload E-Waste</Link>
      </div>
    </div>
  );
}
