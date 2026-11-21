import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { isEmail, getErrorMessage } from "../utils/format";

export default function SignupForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!isEmail(form.email)) e.email = "Enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setMessage(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      setMessage({ type: "success", text: "Account created. Redirecting to your dashboard..." });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setMessage({ type: "error", text: getErrorMessage(err) });
      setLoading(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={submit} noValidate>
      <h1>Create Account</h1>
      <p className="auth-sub">Join E:Revive and start managing your e-waste responsibly.</p>

      {message && <div className={`alert alert-${message.type}`} role="alert">{message.text}</div>}

      <label className="field">
        <span>Full Name</span>
        <input type="text" placeholder="Your full name" value={form.name} onChange={set("name")} autoComplete="name" />
        {errors.name && <small className="field-error">{errors.name}</small>}
      </label>

      <label className="field">
        <span>Email Address</span>
        <input type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} autoComplete="email" />
        {errors.email && <small className="field-error">{errors.email}</small>}
      </label>

      <label className="field">
        <span>Password</span>
        <div className="pw-wrap">
          <input type={show ? "text" : "password"} placeholder="At least 6 characters" value={form.password} onChange={set("password")} autoComplete="new-password" />
          <button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <small className="field-error">{errors.password}</small>}
      </label>

      <label className="field">
        <span>Confirm Password</span>
        <input type={show ? "text" : "password"} placeholder="Re-enter your password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
        {errors.confirm && <small className="field-error">{errors.confirm}</small>}
      </label>

      <button className="btn btn-primary btn-block" disabled={loading}>
        {loading ? <><Loader2 size={18} className="spin" /> Creating account...</> : "Create Account"}
      </button>

      <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
    </form>
  );
}
