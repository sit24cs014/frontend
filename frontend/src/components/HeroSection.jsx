import { useNavigate } from "react-router-dom";

function Illustration() {
  return (
    <svg viewBox="0 0 520 440" className="hero-art" role="img" aria-label="Circuit board with electronic components and green plants">
      <defs>
        <linearGradient id="gTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2fb47f" /><stop offset="1" stopColor="#127a52" /></linearGradient>
        <linearGradient id="gSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0e5a3d" /><stop offset="1" stopColor="#102D23" /></linearGradient>
        <linearGradient id="gLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8BC34A" /><stop offset="1" stopColor="#219966" /></linearGradient>
        <radialGradient id="gGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#8BC34A" stopOpacity=".35" /><stop offset="1" stopColor="#8BC34A" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="260" cy="260" rx="250" ry="170" fill="url(#gGlow)" />
      {/* board thickness */}
      <polygon points="40,250 260,350 260,372 40,272" fill="url(#gSide)" />
      <polygon points="260,350 480,250 480,272 260,372" fill="#0b3b29" />
      {/* board top */}
      <polygon points="260,150 480,250 260,350 40,250" fill="url(#gTop)" />
      {/* traces */}
      <g stroke="#b8e68a" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".85">
        <path d="M110 250 L190 214 L250 241" />
        <path d="M150 268 L230 304 L300 272" />
        <path d="M330 232 L390 259 L430 241" />
        <path d="M290 190 L340 213" />
        <path d="M200 262 L260 289 L330 258 L360 272" />
      </g>
      <g fill="#d6f5b0"><circle cx="110" cy="250" r="4" /><circle cx="430" cy="241" r="4" /><circle cx="300" cy="272" r="4" /><circle cx="290" cy="190" r="4" /></g>
      {/* main chip */}
      <polygon points="230,225 290,252 230,279 170,252" fill="#1b2b25" />
      <polygon points="170,252 230,279 230,295 170,268" fill="#0d1713" />
      <polygon points="230,279 290,252 290,268 230,295" fill="#142019" />
      <polygon points="230,235 270,252 230,269 190,252" fill="#2c4439" />
      {/* small chips */}
      <polygon points="370,215 405,231 370,247 335,231" fill="#26382f" />
      <polygon points="335,231 370,247 370,257 335,241" fill="#101b16" />
      <polygon points="370,247 405,231 405,241 370,257" fill="#17241d" />
      {/* capacitors */}
      <g>
        <rect x="310" y="262" width="22" height="36" fill="#e8b94a" /><ellipse cx="321" cy="262" rx="11" ry="5" fill="#f6d77c" />
        <rect x="336" y="274" width="22" height="30" fill="#d9a233" /><ellipse cx="347" cy="274" rx="11" ry="5" fill="#f2cc6a" />
      </g>
      {/* RAM stick */}
      <polygon points="95,244 160,274 150,279 85,249" fill="#16a06b" /><polygon points="85,249 150,279 150,287 85,257" fill="#0c6a47" />
      {/* plant */}
      <g transform="translate(400 120)">
        <path d="M30 120 Q-10 70 20 20 Q30 70 30 120Z" fill="url(#gLeaf)" />
        <path d="M32 120 Q70 60 55 0 Q35 55 32 120Z" fill="#6fae3b" />
        <path d="M30 120 Q-30 100 -35 60 Q15 70 30 120Z" fill="#219966" />
        <path d="M32 120 Q90 100 100 55 Q45 65 32 120Z" fill="url(#gLeaf)" />
        <path d="M12 118 h40 l-6 34 h-28z" fill="#0e5a3d" />
      </g>
      <g transform="translate(60 150) scale(.7)">
        <path d="M30 100 Q0 60 22 14 Q34 60 30 100Z" fill="url(#gLeaf)" />
        <path d="M32 100 Q66 56 52 6 Q36 50 32 100Z" fill="#6fae3b" />
      </g>
    </svg>
  );
}

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <div className="hero-text">
        <h1>
          Turn Your <span className="grad-text">E-Waste</span> Into <span className="grad-text">Value</span>
        </h1>
        <p>
          Upload a photo of your electronic waste, answer a few condition questions, get a reuse or recycling
          recommendation with an estimated value, and schedule a convenient pickup.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/signup")}>Get Started Free</button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate("/login")}>I Have an Account</button>
        </div>
        <p className="tagline">Give Your E-Waste a Second Life.</p>
      </div>
      <div className="hero-visual"><Illustration /></div>
    </section>
  );
}
