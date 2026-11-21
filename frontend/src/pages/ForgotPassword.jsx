import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { forgotPassword } from "../services/authService";
import { isEmail, getErrorMessage } from "../utils/format";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!isEmail(email)) return setMsg({ type: "error", text: "Enter a valid email address." });
    setLoading(true);
    setMsg(null);
    try {
      const res = await forgotPassword(email.trim());
      setMsg({ type: "success", text: res?.message || "If this email is registered, a reset link has been sent." });
    } catch (err) {
      setMsg({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Forgot Password?</h1>
        <p className="auth-sub">Enter your email and we'll help you reset your password.</p>
        {msg && <div className={`alert alert-${msg.type}`} role="alert">{msg.text}</div>}
        <label className="field">
          <span>Email Address</span>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? <><Loader2 size={18} className="spin" /> Sending...</> : "Send Reset Link"}
        </button>
        <p className="auth-switch"><Link to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}
