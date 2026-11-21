import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Recycle, Menu, X, Upload, LayoutDashboard, User, Sparkles, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const links = [
    { to: "/upload", label: "Upload", icon: Upload },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/profile", label: "User Profile", icon: User },
    { to: "/eco-points", label: "Eco Points", icon: Sparkles },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to={user ? "/dashboard" : "/"} className="logo">
          <span className="logo-icon"><Recycle size={20} /></span>
          <span>E:Revive</span>
        </Link>

        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          {user ? (
            <>
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className="nav-link">
                  <Icon size={17} /> {label}
                </NavLink>
              ))}
              <button className="nav-link nav-logout" onClick={handleLogout}>
                <LogOut size={17} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
