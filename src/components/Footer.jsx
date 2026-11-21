import { Link } from "react-router-dom";
import { Recycle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link to="/" className="logo">
          <span className="logo-icon"><Recycle size={18} /></span>
          <span>E:Revive</span>
        </Link>
        <p>Give Your E-Waste a Second Life.</p>
        <small>© {new Date().getFullYear()} E:Revive – A Smart E-Waste Management System Using Machine Learning</small>
      </div>
    </footer>
  );
}
