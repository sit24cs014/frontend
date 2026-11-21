import { Navigate } from "react-router-dom";
import SignupForm from "../components/SignupForm";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <div className="auth-page"><SignupForm /></div>;
}
