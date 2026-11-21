import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, BarChart3, Truck, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getDashboard } from "../services/wasteService";
import { getErrorMessage } from "../utils/format";
import DashboardCard from "../components/DashboardCard";
import RecentAnalysis from "../components/RecentAnalysis";
import PickupHistory from "../components/PickupHistory";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    getDashboard().then(setData).catch((e) => setError(getErrorMessage(e)));
  };
  useEffect(load, []);

  return (
    <div className="container">
      <div className="dash-head">
        <div>
          <h1>Welcome, {user?.name}!</h1>
          <p className="muted">Your eco-impact dashboard.</p>
        </div>
        <Link to="/upload" className="btn btn-primary"><Upload size={18} /> Upload E-Waste</Link>
      </div>

      {error && (
        <div className="alert alert-error">
          {error} <button className="link-btn" onClick={load}>Try again</button>
        </div>
      )}
      {!data && !error && <LoadingSpinner text="Loading your dashboard..." />}

      {data && (
        <>
          <div className="stat-grid">
            <DashboardCard icon={Sparkles} label="Eco Points" value={data.ecoPoints} tone="green" />
            <DashboardCard icon={BarChart3} label="Items Analyzed" value={data.itemsAnalyzed} tone="blue" />
            <DashboardCard icon={Truck} label="Pickups Booked" value={data.pickupsBooked} tone="orange" />
          </div>
          <div className="dash-panels">
            <RecentAnalysis items={data.analyses} />
            <PickupHistory items={data.pickups} />
          </div>
        </>
      )}
    </div>
  );
}
