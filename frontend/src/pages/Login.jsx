import { Navigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <div className="auth-page"><LoginForm /></div>;
}
