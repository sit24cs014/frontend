import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { isEmail, getErrorMessage } from "../utils/format";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!isEmail(form.email)) e.email = "Enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setMessage(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      setMessage({ type: "success", text: "Login successful. Redirecting..." });
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
      setLoading(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={submit} noValidate>
      <h1>Welcome Back!</h1>
      <p className="auth-sub">Log in to continue your sustainable journey.</p>

      {message && <div className={`alert alert-${message.type}`} role="alert">{message.text}</div>}

      <label className="field">
        <span>Email Address</span>
        <input type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} autoComplete="email" />
        {errors.email && <small className="field-error">{errors.email}</small>}
      </label>

      <label className="field">
        <span>Password</span>
        <div className="pw-wrap">
          <input type={show ? "text" : "password"} placeholder="Enter your password" value={form.password} onChange={set("password")} autoComplete="current-password" />
          <button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <small className="field-error">{errors.password}</small>}
      </label>

      <div className="forgot"><Link to="/forgot-password">Forgot Password?</Link></div>

      <button className="btn btn-primary btn-block" disabled={loading}>
        {loading ? <><Loader2 size={18} className="spin" /> Logging in...</> : "Login"}
      </button>

      <p className="auth-switch">Don't have an account? <Link to="/signup">Sign Up</Link></p>
    </form>
  );
}
