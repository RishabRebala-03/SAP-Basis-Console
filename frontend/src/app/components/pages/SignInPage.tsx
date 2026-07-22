import { useState } from "react";
import { KeyRound, Eye, EyeOff, AlertCircle, Shield, Users } from "lucide-react";
import logoImage from "../../../imports/image.png";

const F = {
  primary: "#0070f2", primaryDark: "#0057d2", error: "#bb0000", text: "#1a2733",
  muted: "#5b738b", border: "#d9d9d9", bg: "#f7f8fa", white: "#ffffff",
};

export function SignInPage({ onSignIn }: { onSignIn: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    onSignIn();
  };

  const inputStyle = {
    border: `1px solid ${error ? F.error : F.border}`,
    background: F.white,
    color: F.text,
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = F.primary;
    e.target.style.boxShadow = "0 0 0 3px rgba(0,112,242,0.12)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = error ? F.error : F.border;
    e.target.style.boxShadow = "none";
  };

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ fontFamily: "'72', '72full', Arial, Helvetica, sans-serif", background: F.bg }}
    >
      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col items-center justify-center w-1/2 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #06091a 0%, #0c1230 45%, #160826 100%)" }}
      >
        {/* Ambient glow — cyan (logo left tone) */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "18%", left: "-10%",
            width: "520px", height: "520px",
            background: "radial-gradient(circle, rgba(64,178,240,0.18) 0%, transparent 68%)",
            filter: "blur(8px)",
          }}
        />
        {/* Ambient glow — purple (logo right tone) */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "10%", right: "-14%",
            width: "480px", height: "480px",
            background: "radial-gradient(circle, rgba(138,62,210,0.22) 0%, transparent 68%)",
            filter: "blur(8px)",
          }}
        />
        {/* Faint grid */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center text-center px-14 select-none">

          {/* Logo — large, no rings */}
          <img
            src={logoImage}
            alt="Naxrita"
            style={{
              width: "200px",
              height: "auto",
              marginBottom: "2.5rem",
              filter: "drop-shadow(0 4px 32px rgba(64,178,240,0.38)) drop-shadow(0 2px 12px rgba(138,62,210,0.28))",
            }}
          />

          {/* Wordmark — SAP 72 style: light weight, tight tracking */}
          <div
            style={{
              fontFamily: "'72', '72full', Arial, Helvetica, sans-serif",
              fontSize: "2rem",
              fontWeight: 300,
              letterSpacing: "0.55em",
              textTransform: "uppercase",
              color: "#ffffff",
              lineHeight: 1,
              paddingLeft: "0.55em", /* compensate tracking on last char */
            }}
          >
            Naxrita
          </div>

          {/* Divider */}
          <div
            style={{
              width: "48px", height: "1px", margin: "1.5rem auto",
              background: "linear-gradient(90deg, transparent, rgba(64,178,240,0.6), rgba(138,62,210,0.6), transparent)",
            }}
          />

          {/* Subtitle — SAP Horizon caption style */}
          <div
            style={{
              fontFamily: "'72', '72full', Arial, Helvetica, sans-serif",
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.625rem",
              fontWeight: 400,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              paddingLeft: "0.32em",
            }}
          >
            SAP Basis Provisioning Console
          </div>

          {/* Tagline */}
          <p
            style={{
              marginTop: "2.25rem",
              maxWidth: "280px",
              color: "rgba(255,255,255,0.25)",
              fontSize: "0.775rem",
              fontWeight: 300,
              lineHeight: 1.8,
              letterSpacing: "0.015em",
            }}
          >
            Enterprise user lifecycle management across your SAP landscape — unified, auditable, and secure.
          </p>
        </div>

        {/* Bottom watermark */}
        <div
          className="absolute bottom-7 text-center"
          style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.65rem", letterSpacing: "0.12em" }}
        >
          © 2026 NAXRITA · ENTERPRISE EDITION
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={logoImage} alt="Naxrita" style={{ width: "36px", height: "auto" }} />
            <div>
              <div style={{ color: F.text }}>Naxrita</div>
              <div className="text-xs" style={{ color: F.muted }}>SAP Basis Provisioning Console</div>
            </div>
          </div>

          <h2 style={{ color: F.text, fontSize: "1.5rem", letterSpacing: "-0.3px" }}>Welcome back</h2>
          <p className="text-sm mt-1.5 mb-8" style={{ color: F.muted }}>
            Sign in with your SAP dialog user credentials to continue.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: F.text }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="e.g. ADMIN"
                autoFocus
                className="w-full px-3.5 py-3 text-sm rounded-lg outline-none transition-shadow"
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs" style={{ color: F.text }}>Password</label>
                <button type="button" className="text-xs" style={{ color: F.primary }}>Forgot password?</button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Your SAP logon password"
                  className="w-full px-3.5 py-3 pr-11 text-sm rounded-lg outline-none transition-shadow"
                  style={inputStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: F.muted }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs" style={{ background: "#fff2f2", border: `1px solid #bb000030`, color: F.error }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading ? "#74a8f5" : `linear-gradient(180deg, ${F.primary} 0%, ${F.primaryDark} 100%)`,
                boxShadow: loading ? "none" : "0 6px 16px rgba(0,112,242,0.32)",
                opacity: loading ? 0.9 : 1,
              }}
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</>
                : <><KeyRound size={15} /> Sign In</>
              }
            </button>
          </form>

          <div className="flex items-center gap-2 mt-8">
            <Shield size={13} style={{ color: F.muted }} />
            <span className="text-xs" style={{ color: F.muted }}>Secured connection · Session encrypted end-to-end</span>
          </div>
        </div>

        <p className="text-xs absolute bottom-6" style={{ color: F.muted }}>
          © 2026 Naxrita SAP Basis Provisioning Console
        </p>
      </div>
    </div>
  );
}
