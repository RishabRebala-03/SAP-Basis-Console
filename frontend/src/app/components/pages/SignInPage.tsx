<<<<<<< Updated upstream
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
=======
import { useState, useEffect } from "react";
import {
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Lock,
} from "lucide-react";

import logoImage from "../../../imports/image.png";

import {
  loginApi,
  forgotPasswordApi,
  resetPasswordAuthApi,
  User,
} from "../../../api/authApi";

const F = {
  primary: "#0070f2",
  primaryDark: "#0057d2",
  error: "#bb0000",
  success: "#107e3e",
  text: "#1a2733",
  muted: "#5b738b",
  border: "#d9d9d9",
  bg: "#f7f8fa",
  white: "#ffffff",
};

export function SignInPage({
  onSignIn,
}: {
  onSignIn: (user?: User) => void;
}) {
  /* =========================================================
     FORCE LOGIN PAGE TO LIGHT MODE
     ========================================================= */

  useEffect(() => {
    const root = document.documentElement;

    const previousTheme = root.dataset.theme;
    const previousDark = root.classList.contains("dark");

    root.dataset.theme = "light";
    root.classList.remove("dark");

    return () => {
      if (previousTheme) {
        root.dataset.theme = previousTheme;
      } else {
        delete root.dataset.theme;
      }

      if (previousDark) {
        root.classList.add("dark");
      }
    };
  }, []);

  /* =========================================================
     STATE
     ========================================================= */

  const [viewMode, setViewMode] = useState<
    "signin" | "forgot" | "reset"
  >("signin");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

>>>>>>> Stashed changes
  const [showPw, setShowPw] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* =========================================================
     SIGN IN
     ========================================================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }

    setError("");
    setLoading(true);
<<<<<<< Updated upstream
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    onSignIn();
=======

    try {
      const data = await loginApi({
        username: username.trim(),
        password,
      });

      setLoading(false);

      onSignIn(data.user);
    } catch (err: any) {
      setLoading(false);

      setError(
        err.message ||
          "Invalid credentials. Please check username and password."
      );
    }
  };

  /* =========================================================
     FORGOT PASSWORD
     ========================================================= */

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

      setSuccessMsg(
        res.message || "Password reset instructions sent."
      );

      if (res.dev_reset_token) {
        setResetToken(res.dev_reset_token);
      }

      setViewMode("reset");
    } catch (err: any) {
      setLoading(false);

      setError(
        err.message ||
          "Failed to process request. Please check email address."
      );
    }
  };

  /* =========================================================
     RESET PASSWORD
     ========================================================= */

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetToken.trim() || !newPassword.trim()) {
      setError(
        "Please enter the reset token and your new password."
      );
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await resetPasswordAuthApi(
        resetToken.trim(),
        newPassword.trim()
      );

      setLoading(false);

      setSuccessMsg(
        res.message ||
          "Password reset successfully! You can now sign in."
      );

      setViewMode("signin");
      setPassword(newPassword);
    } catch (err: any) {
      setLoading(false);

      setError(
        err.message ||
          "Password reset failed. Invalid or expired token."
      );
    }
>>>>>>> Stashed changes
  };

  /* =========================================================
     COMMON INPUT STYLES
     ========================================================= */

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "52px",
    boxSizing: "border-box",
    border: `1px solid ${error ? F.error : F.border}`,
    borderRadius: "9px",
    background: F.white,
    color: F.text,
    outline: "none",
    fontSize: "14px",
    lineHeight: "20px",
    padding: "0 14px",
    transition:
      "border-color 0.15s ease, box-shadow 0.15s ease",
  };

  const onFocus = (
    e: React.FocusEvent<HTMLInputElement>
  ) => {
    e.currentTarget.style.borderColor = F.primary;

    e.currentTarget.style.boxShadow =
      "0 0 0 3px rgba(0,112,242,0.12)";
  };

  const onBlur = (
    e: React.FocusEvent<HTMLInputElement>
  ) => {
    e.currentTarget.style.borderColor =
      error ? F.error : F.border;

    e.currentTarget.style.boxShadow = "none";
  };

  /* =========================================================
     COMMON BUTTON STYLE
     ========================================================= */

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    height: "50px",
    boxSizing: "border-box",
    border: "none",
    borderRadius: "9px",
    color: F.white,
    fontSize: "14px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: loading ? "not-allowed" : "pointer",
  };

  /* =========================================================
     ERROR MESSAGE
     ========================================================= */

  const ErrorMessage = () => {
    if (!error) return null;

    return (
      <div
        style={{
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "#fff2f2",
          border: "1px solid #bb000030",
          color: F.error,
          fontSize: "12px",
          lineHeight: "18px",
        }}
      >
        <AlertCircle
          size={14}
          style={{ flexShrink: 0 }}
        />

        <span>{error}</span>
      </div>
    );
  };

  /* =========================================================
     LOADING SPINNER
     ========================================================= */

  const LoadingSpinner = () => (
    <span
      style={{
        width: "16px",
        height: "16px",
        border: "2px solid rgba(255,255,255,0.9)",
        borderTopColor: "transparent",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <>
      {/* Spinner animation */}
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          * {
            box-sizing: border-box;
          }
        `}
      </style>

      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          fontFamily:
            "'72', '72full', Arial, Helvetica, sans-serif",
          background: F.bg,
          overflow: "hidden",
        }}
      >
<<<<<<< Updated upstream
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
=======
        {/* =====================================================
            LEFT BRAND PANEL
            ===================================================== */}

        <div
          className="hidden lg:flex"
          style={{
            width: "50%",
            minWidth: "50%",
            height: "100vh",
            position: "relative",
            overflow: "hidden",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(145deg, #06091a 0%, #0c1230 45%, #160826 100%)",
          }}
        >
          {/* BLUE GLOW */}

          <div
>>>>>>> Stashed changes
            style={{
              position: "absolute",
              pointerEvents: "none",
              top: "18%",
              left: "-10%",
              width: "520px",
              height: "520px",
              background:
                "radial-gradient(circle, rgba(64,178,240,0.18) 0%, transparent 68%)",
              filter: "blur(8px)",
            }}
          />

<<<<<<< Updated upstream
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
=======
          {/* PURPLE GLOW */}
>>>>>>> Stashed changes

          {/* Divider */}
          <div
            style={{
              position: "absolute",
              pointerEvents: "none",
              bottom: "10%",
              right: "-14%",
              width: "480px",
              height: "480px",
              background:
                "radial-gradient(circle, rgba(138,62,210,0.22) 0%, transparent 68%)",
              filter: "blur(8px)",
            }}
          />

<<<<<<< Updated upstream
          {/* Subtitle — SAP Horizon caption style */}
=======
          {/* GRID */}

>>>>>>> Stashed changes
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.035,
              pointerEvents: "none",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
            }}
          />

          {/* BRAND CONTENT */}

          <div
            style={{
              position: "relative",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "0 56px",
              userSelect: "none",
            }}
          >
            {/* LOGO */}

            <img
              src={logoImage}
              alt="Naxrita"
              style={{
                width: "200px",
                height: "200px",
                objectFit: "contain",
                filter:
                  "drop-shadow(0 4px 32px rgba(64,178,240,0.38)) drop-shadow(0 2px 12px rgba(138,62,210,0.28))",
              }}
            />

            {/* NAXRITA */}

            <div
              style={{
                fontFamily:
                  "'Times New Roman', Times, serif",
                fontSize: "3.5rem",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#ffffff",
                lineHeight: 1,
                textAlign: "center",
                marginTop: "-10px",
                marginBottom: "20px",
                whiteSpace: "nowrap",
              }}
            >
              NAXRITA
            </div>

            {/* TAGLINE */}

            <div
              style={{
                fontFamily:
                  "Arial, Helvetica, sans-serif",
                fontSize: "1rem",
                fontWeight: 400,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "#aaaaaa",
                textAlign: "center",
              }}
            >
              WE COMMIT, WE DELIVER
            </div>

            {/* DIVIDER */}

            <div
              style={{
                width: "48px",
                height: "1px",
                margin: "24px auto",
                background:
                  "linear-gradient(90deg, transparent, rgba(64,178,240,0.6), rgba(138,62,210,0.6), transparent)",
              }}
            />

            {/* CONSOLE TITLE */}

            <div
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "10px",
                fontWeight: 400,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                paddingLeft: "0.32em",
              }}
            >
              SAP Basis Provisioning Console
            </div>

            {/* DESCRIPTION */}

            <p
              style={{
                marginTop: "36px",
                marginBottom: 0,
                maxWidth: "280px",
                color: "rgba(255,255,255,0.25)",
                fontSize: "12px",
                fontWeight: 300,
                lineHeight: 1.8,
                letterSpacing: "0.015em",
                textAlign: "center",
              }}
            >
              Enterprise user lifecycle management
              across your SAP landscape — unified,
              auditable, and secure.
            </p>
          </div>

<<<<<<< Updated upstream
          {/* Tagline */}
=======
          {/* COPYRIGHT */}

          <div
            style={{
              position: "absolute",
              bottom: "32px",
              left: 0,
              right: 0,
              textAlign: "center",
              color: "rgba(255,255,255,0.18)",
              fontSize: "10px",
              letterSpacing: "0.12em",
            }}
          >
            © 2026 NAXRITA · ENTERPRISE EDITION
          </div>
        </div>

        {/* =====================================================
            RIGHT FORM PANEL
            ===================================================== */}

        <div
          style={{
            width: "50%",
            minWidth: 0,
            height: "100vh",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 32px",
            background: F.bg,
            overflowY: "auto",
          }}
        >
          {/* =================================================
              FORM WRAPPER
              ================================================= */}

          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              margin: "0 auto",
            }}
          >
            {/* =================================================
                MOBILE LOGO
                ================================================= */}

            <div
              className="lg:hidden"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "32px",
              }}
            >
              

              <div>
                
              </div>
            </div>

            {/* =================================================
                SUCCESS MESSAGE
                ================================================= */}

            {successMsg && (
              <div
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  background: "#f1fdf6",
                  border: `1px solid ${F.success}40`,
                  color: F.success,
                  fontSize: "12px",
                  lineHeight: "18px",
                }}
              >
                <CheckCircle2
                  size={16}
                  style={{
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                />

                <span>{successMsg}</span>
              </div>
            )}

            {/* =================================================
                SIGN IN
                ================================================= */}

            {viewMode === "signin" && (
              <>
                {/* HEADING */}

                <div
                  style={{
                    width: "100%",
                    marginBottom: "30px",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      color: F.text,
                      fontFamily:
                  "'Times New Roman', Times, serif",
                      fontSize: "28px",
                      lineHeight: "36px",
                      fontWeight: 900,
                      letterSpacing: "-0.4px",
                    }}
                  >
                    Welcome Back
                  </h2>

                  <p
                    style={{
                      margin: "8px 0 0 0",
                      color: F.muted,
                      fontSize: "14px",
                      lineHeight: "21px",
                    }}
                  >
                    Sign in with your SAP administrator
                    credentials to continue.
                  </p>
                </div>

                {/* FORM */}

                <form
                  onSubmit={handleSubmit}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {/* USERNAME */}

                  <div style={{ width: "100%" }}>
                    <label
                      style={{
                        display: "block",
                        color: F.text,
                        fontSize: "13px",
                        fontWeight: 500,
                        marginBottom: "7px",
                      }}
                    >
                      Username
                    </label>

                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError("");
                      }}
                      placeholder="e.g. admin"
                      autoFocus
                      className="login-input"
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>

                  {/* PASSWORD */}

                  <div style={{ width: "100%" }}>
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "7px",
                      }}
                    >
                      <label
                        style={{
                          color: F.text,
                          fontSize: "13px",
                          fontWeight: 500,
                        }}
                      >
                        Password
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setViewMode("forgot");
                          setError("");
                          setSuccessMsg("");
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          color: F.primary,
                          fontSize: "12px",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        position: "relative",
                      }}
                    >
                      <input
                        type={
                          showPw ? "text" : "password"
                        }
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Your password"
                        className="login-input"
                        style={{
                          ...inputStyle,
                          paddingRight: "48px",
                        }}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPw(!showPw)
                        }
                        style={{
                          position: "absolute",
                          right: "14px",
                          top: "50%",
                          transform:
                            "translateY(-50%)",
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                          background: "transparent",
                          color: F.muted,
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        {showPw ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ERROR */}

                  <ErrorMessage />

                  {/* SIGN IN BUTTON */}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      ...buttonStyle,
                      marginTop: "2px",
                      background: loading
                        ? "#74a8f5"
                        : `linear-gradient(
                            180deg,
                            ${F.primary} 0%,
                            ${F.primaryDark} 100%
                          )`,
                      boxShadow: loading
                        ? "none"
                        : "0 6px 16px rgba(0,112,242,0.28)",
                      opacity: loading ? 0.9 : 1,
                    }}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner />
                        <span>Signing in…</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* =================================================
                FORGOT PASSWORD
                ================================================= */}

            {viewMode === "forgot" && (
              <>
                {/* BACK */}

                <button
                  type="button"
                  onClick={() => {
                    setViewMode("signin");
                    setError("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    marginBottom: "18px",
                    color: F.muted,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={14} />
                  Back to Sign In
                </button>

                {/* HEADING */}

                <div
                  style={{
                    width: "100%",
                    marginBottom: "30px",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      color: F.text,
                      fontSize: "28px",
                      lineHeight: "36px",
                      fontWeight: 500,
                      letterSpacing: "-0.4px",
                    }}
                  >
                    Forgot Password
                  </h2>

                  <p
                    style={{
                      margin: "8px 0 0 0",
                      color: F.muted,
                      fontSize: "14px",
                      lineHeight: "21px",
                    }}
                  >
                    Enter your registered administrator
                    email address to generate a password
                    reset token.
                  </p>
                </div>

                {/* FORM */}

                <form
                  onSubmit={handleForgotPassword}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {/* EMAIL */}

                  <div style={{ width: "100%" }}>
                    <label
                      style={{
                        display: "block",
                        color: F.text,
                        fontSize: "13px",
                        fontWeight: 500,
                        marginBottom: "7px",
                      }}
                    >
                      Registered Email
                    </label>

                    <div
                      style={{
                        width: "100%",
                        position: "relative",
                      }}
                    >
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="e.g. superadmin@example.com"
                        autoFocus
                        className="login-input"
                        style={{
                          ...inputStyle,
                          paddingRight: "48px",
                        }}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />

                      <Mail
                        size={17}
                        style={{
                          position: "absolute",
                          right: "14px",
                          top: "50%",
                          transform:
                            "translateY(-50%)",
                          color: F.muted,
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  </div>

                  {/* ERROR */}

                  <ErrorMessage />

                  {/* SEND BUTTON */}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      ...buttonStyle,
                      background: loading
                        ? "#74a8f5"
                        : `linear-gradient(
                            180deg,
                            ${F.primary} 0%,
                            ${F.primaryDark} 100%
                          )`,
                      boxShadow: loading
                        ? "none"
                        : "0 6px 16px rgba(0,112,242,0.28)",
                    }}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner />
                        <span>
                          Requesting Token…
                        </span>
                      </>
                    ) : (
                      <>
                        <Mail size={16} />
                        <span>
                          Send Reset Instructions
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* =================================================
                RESET PASSWORD
                ================================================= */}

            {viewMode === "reset" && (
              <>
                {/* BACK */}

                <button
                  type="button"
                  onClick={() => {
                    setViewMode("signin");
                    setError("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    marginBottom: "18px",
                    color: F.muted,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={14} />
                  Back to Sign In
                </button>

                {/* HEADING */}

                <div
                  style={{
                    width: "100%",
                    marginBottom: "30px",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      color: F.text,
                      fontSize: "28px",
                      lineHeight: "36px",
                      fontWeight: 500,
                      letterSpacing: "-0.4px",
                    }}
                  >
                    Reset Password
                  </h2>

                  <p
                    style={{
                      margin: "8px 0 0 0",
                      color: F.muted,
                      fontSize: "14px",
                      lineHeight: "21px",
                    }}
                  >
                    Enter the reset token generated for
                    your account and set your new password.
                  </p>
                </div>

                {/* FORM */}

                <form
                  onSubmit={handleResetPassword}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {/* RESET TOKEN */}

                  <div style={{ width: "100%" }}>
                    <label
                      style={{
                        display: "block",
                        color: F.text,
                        fontSize: "13px",
                        fontWeight: 500,
                        marginBottom: "7px",
                      }}
                    >
                      Reset Token
                    </label>

                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => {
                        setResetToken(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter reset token UUID"
                      className="login-input"
                      style={{
                        ...inputStyle,
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        fontSize: "13px",
                      }}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>

                  {/* NEW PASSWORD */}

                  <div style={{ width: "100%" }}>
                    <label
                      style={{
                        display: "block",
                        color: F.text,
                        fontSize: "13px",
                        fontWeight: 500,
                        marginBottom: "7px",
                      }}
                    >
                      New Password
                    </label>

                    <div
                      style={{
                        width: "100%",
                        position: "relative",
                      }}
                    >
                      <input
                        type={
                          showPw ? "text" : "password"
                        }
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(
                            e.target.value
                          );
                          setError("");
                        }}
                        placeholder="Enter new strong password"
                        className="login-input"
                        style={{
                          ...inputStyle,
                          paddingRight: "48px",
                        }}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPw(!showPw)
                        }
                        style={{
                          position: "absolute",
                          right: "14px",
                          top: "50%",
                          transform:
                            "translateY(-50%)",
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                          background: "transparent",
                          color: F.muted,
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        {showPw ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ERROR */}

                  <ErrorMessage />

                  {/* RESET BUTTON */}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      ...buttonStyle,
                      background: loading
                        ? "#74a8f5"
                        : `linear-gradient(
                            180deg,
                            ${F.primary} 0%,
                            ${F.primaryDark} 100%
                          )`,
                      boxShadow: loading
                        ? "none"
                        : "0 6px 16px rgba(0,112,242,0.28)",
                    }}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner />
                        <span>
                          Resetting Password…
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>
                          Update Password
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* =================================================
                SECURITY MESSAGE
                ================================================= */}

            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: "8px",
                marginTop: "30px",
              }}
            >
              <Shield
                size={14}
                style={{
                  color: F.muted,
                  flexShrink: 0,
                }}
              />

              <span
                style={{
                  color: F.muted,
                  fontSize: "12px",
                  lineHeight: "18px",
                }}
              >
                Secured connection · Session encrypted
                end-to-end
              </span>
            </div>
          </div>

          {/* =================================================
              FOOTER
              ================================================= */}

>>>>>>> Stashed changes
          <p
            style={{
              position: "absolute",
              bottom: "24px",
              left: "32px",
              right: "32px",
              margin: 0,
              color: F.muted,
              fontSize: "11px",
              lineHeight: "18px",
              textAlign: "center",
            }}
          >
            © 2026 Naxrita SAP Basis Provisioning Console
          </p>
        </div>
<<<<<<< Updated upstream

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
=======
      </div>
    </>
>>>>>>> Stashed changes
  );
}