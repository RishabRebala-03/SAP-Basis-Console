import { useState } from "react";
import { KeyRound, Eye, EyeOff, AlertCircle, Shield, ArrowLeft, CheckCircle2, Mail, Lock } from "lucide-react";
import logoImage from "../../../imports/image.png";
import { loginApi, forgotPasswordApi, resetPasswordAuthApi, User } from "../../../api/authApi";

const F = {
  primary: "#0070f2", primaryDark: "#0057d2", error: "#bb0000", success: "#107e3e", text: "#1a2733",
  muted: "#5b738b", border: "#d9d9d9", bg: "#f7f8fa", white: "#ffffff",
};

export function SignInPage({ onSignIn }: { onSignIn: (user?: User) => void }) {
  const [viewMode, setViewMode] = useState<"signin" | "forgot" | "reset">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await loginApi({ username: username.trim(), password });
      setLoading(false);
      onSignIn(data.user);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Invalid credentials. Please check username and password.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await forgotPasswordApi(email.trim());
      setLoading(false);
      setSuccessMsg(res.message || "Password reset instructions sent.");
      if (res.dev_reset_token) {
        setResetToken(res.dev_reset_token);
      }
      setViewMode("reset");
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to process request. Please check email address.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim() || !newPassword.trim()) {
      setError("Please enter the reset token and your new password.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await resetPasswordAuthApi(resetToken.trim(), newPassword.trim());
      setLoading(false);
      setSuccessMsg(res.message || "Password reset successfully! You can now sign in.");
      setViewMode("signin");
      setPassword(newPassword);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Password reset failed. Invalid or expired token.");
    }
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
        <div
          className="absolute pointer-events-none"
          style={{
            top: "18%", left: "-10%",
            width: "520px", height: "520px",
            background: "radial-gradient(circle, rgba(64,178,240,0.18) 0%, transparent 68%)",
            filter: "blur(8px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "10%", right: "-14%",
            width: "480px", height: "480px",
            background: "radial-gradient(circle, rgba(138,62,210,0.22) 0%, transparent 68%)",
            filter: "blur(8px)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-14 select-none">
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

          <div
            style={{
              fontFamily: "'72', '72full', Arial, Helvetica, sans-serif",
              fontSize: "2rem",
              fontWeight: 300,
              letterSpacing: "0.55em",
              textTransform: "uppercase",
              color: "#ffffff",
              lineHeight: 1,
              paddingLeft: "0.55em",
            }}
          >
            Naxrita
          </div>

          <div
            style={{
              width: "48px", height: "1px", margin: "1.5rem auto",
              background: "linear-gradient(90deg, transparent, rgba(64,178,240,0.6), rgba(138,62,210,0.6), transparent)",
            }}
          />

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

          {successMsg && (
            <div className="flex items-start gap-2 px-3.5 py-3 rounded-lg text-xs mb-5" style={{ background: "#f1fdf6", border: `1px solid ${F.success}40`, color: F.success }}>
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}

          {viewMode === "signin" && (
            <>
              <h2 style={{ color: F.text, fontSize: "1.5rem", letterSpacing: "-0.3px" }}>Welcome back</h2>
              <p className="text-sm mt-1.5 mb-8" style={{ color: F.muted }}>
                Sign in with your SAP administrator credentials to continue.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: F.text }}>Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    placeholder="e.g. admin"
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
                    <button type="button" onClick={() => { setViewMode("forgot"); setError(""); setSuccessMsg(""); }} className="text-xs font-medium hover:underline" style={{ color: F.primary }}>Forgot password?</button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="Your password"
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
            </>
          )}

          {viewMode === "forgot" && (
            <>
              <button onClick={() => { setViewMode("signin"); setError(""); }} className="flex items-center gap-1.5 text-xs mb-4 hover:underline" style={{ color: F.muted }}>
                <ArrowLeft size={14} /> Back to Sign In
              </button>
              <h2 style={{ color: F.text, fontSize: "1.5rem", letterSpacing: "-0.3px" }}>Forgot Password</h2>
              <p className="text-sm mt-1.5 mb-8" style={{ color: F.muted }}>
                Enter your registered administrator email address to generate a password reset token.
              </p>

              <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: F.text }}>Registered Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="e.g. superadmin@example.com"
                      autoFocus
                      className="w-full px-3.5 py-3 pr-10 text-sm rounded-lg outline-none transition-shadow"
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: F.muted }} />
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
                  }}
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Requesting Token…</>
                    : <><Mail size={15} /> Send Reset Instructions</>
                  }
                </button>
              </form>
            </>
          )}

          {viewMode === "reset" && (
            <>
              <button onClick={() => { setViewMode("signin"); setError(""); }} className="flex items-center gap-1.5 text-xs mb-4 hover:underline" style={{ color: F.muted }}>
                <ArrowLeft size={14} /> Back to Sign In
              </button>
              <h2 style={{ color: F.text, fontSize: "1.5rem", letterSpacing: "-0.3px" }}>Reset Password</h2>
              <p className="text-sm mt-1.5 mb-8" style={{ color: F.muted }}>
                Enter the reset token generated for your account and set your new password.
              </p>

              <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: F.text }}>Reset Token</label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => { setResetToken(e.target.value); setError(""); }}
                    placeholder="Enter reset token UUID"
                    className="w-full px-3.5 py-3 text-sm rounded-lg outline-none font-mono transition-shadow"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: F.text }}>New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                      placeholder="Enter new strong password"
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
                  }}
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting Password…</>
                    : <><Lock size={15} /> Update Password</>
                  }
                </button>
              </form>
            </>
          )}

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
