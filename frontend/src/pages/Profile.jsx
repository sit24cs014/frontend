import { useNavigate } from "react-router-dom";
import { UserCircle, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="container narrow">
      <div className="card profile-card">
        <UserCircle size={72} className="confirm-icon" />
        <h1>{user?.name}</h1>
        <p className="muted">{user?.email}</p>
        <button className="btn btn-outline" onClick={() => { logout(); navigate("/"); }}><LogOut size={18} /> Logout</button>
      </div>
    </div>
  );
}
