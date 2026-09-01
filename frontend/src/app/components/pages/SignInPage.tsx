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
  text: "#172b4d",
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
  /* -------------------------------------------------------
     FORCE LIGHT MODE
  ------------------------------------------------------- */
  useEffect(() => {
    const root = document.documentElement;

    const prevTheme = root.dataset.theme;
    const prevClass = root.classList.contains("dark");

    root.dataset.theme = "light";
    root.classList.remove("dark");

    return () => {
      if (prevTheme) {
        root.dataset.theme = prevTheme;
      }

      if (prevClass) {
        root.classList.add("dark");
      }
    };
  }, []);

  /* -------------------------------------------------------
     STATES
  ------------------------------------------------------- */
  const [viewMode, setViewMode] = useState<
    "signin" | "forgot" | "reset"
  >("signin");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showPw, setShowPw] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [loading, setLoading] = useState(false);

  /* -------------------------------------------------------
     SIGN IN
  ------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }

    setError("");
    setLoading(true);

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

  /* -------------------------------------------------------
     FORGOT PASSWORD
  ------------------------------------------------------- */
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

  /* -------------------------------------------------------
     RESET PASSWORD
  ------------------------------------------------------- */
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
  };

  /* -------------------------------------------------------
     INPUT STYLES
  ------------------------------------------------------- */
  const inputStyle = {
    border: `1px solid ${error ? F.error : F.border}`,
    background: F.white,
    color: F.text,
  };

  const onFocus = (
    e: React.FocusEvent<HTMLInputElement>
  ) => {
    e.target.style.borderColor = F.primary;

    e.target.style.boxShadow =
      "0 0 0 4px rgba(0,112,242,0.12), 0 4px 14px rgba(0,112,242,0.08)";
  };

  const onBlur = (
    e: React.FocusEvent<HTMLInputElement>
  ) => {
    e.target.style.borderColor = error
      ? F.error
      : F.border;

    e.target.style.boxShadow = "none";
  };

  return (
    <>
      {/* =====================================================
          PROFESSIONAL ANIMATIONS
      ====================================================== */}
      <style>
        {`
          @keyframes brandFloat {
            0%, 100% {
              transform: translateY(0px);
            }

            50% {
              transform: translateY(-8px);
            }
          }

          @keyframes logoGlow {
            0%, 100% {
              filter:
                drop-shadow(0 4px 24px rgba(64,178,240,0.25))
                drop-shadow(0 2px 12px rgba(138,62,210,0.18));
            }

            50% {
              filter:
                drop-shadow(0 8px 40px rgba(64,178,240,0.55))
                drop-shadow(0 4px 22px rgba(138,62,210,0.42));
            }
          }

          @keyframes glowMove {
            0%, 100% {
              transform: translate(0, 0) scale(1);
              opacity: 0.7;
            }

            50% {
              transform: translate(35px, -25px) scale(1.08);
              opacity: 1;
            }
          }

          @keyframes glowMoveReverse {
            0%, 100% {
              transform: translate(0, 0) scale(1);
              opacity: 0.65;
            }

            50% {
              transform: translate(-30px, 25px) scale(1.1);
              opacity: 1;
            }
          }

          @keyframes leftContentIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes rightContentIn {
            from {
              opacity: 0;
              transform: translateX(25px);
            }

            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes lineExpand {
            from {
              width: 0;
              opacity: 0;
            }

            to {
              width: 55px;
              opacity: 1;
            }
          }

          @keyframes shimmer {
            0% {
              background-position: 200% 0;
            }

            100% {
              background-position: -200% 0;
            }
          }

          @keyframes pulseGlow {
            0%, 100% {
              box-shadow:
                0 8px 22px rgba(0,112,242,0.25);
            }

            50% {
              box-shadow:
                0 10px 30px rgba(0,112,242,0.40);
            }
          }

          @keyframes securityPulse {
            0%, 100% {
              opacity: 0.75;
            }

            50% {
              opacity: 1;
            }
          }

          .brand-animation {
            animation:
              leftContentIn 0.9s ease-out both;
          }

          .logo-animation {
            animation:
              brandFloat 4s ease-in-out infinite,
              logoGlow 3s ease-in-out infinite;
          }

          .brand-title-animation {
            animation:
              leftContentIn 1s ease-out 0.15s both;
          }

          .brand-subtitle-animation {
            animation:
              leftContentIn 1s ease-out 0.3s both;
          }

          .brand-description-animation {
            animation:
              leftContentIn 1s ease-out 0.45s both;
          }

          .right-animation {
            animation:
              rightContentIn 0.8s ease-out both;
          }

          .animated-line {
            animation:
              lineExpand 0.8s ease-out 0.35s both;
          }

          .login-button {
            background:
              linear-gradient(
                110deg,
                #0070f2 0%,
                #126cf2 30%,
                #6b2ff2 65%,
                #0070f2 100%
              );

            background-size: 250% 100%;

            transition:
              transform 0.25s ease,
              box-shadow 0.25s ease,
              background-position 0.5s ease;

            animation:
              pulseGlow 3s ease-in-out infinite;
          }

          .login-button:hover:not(:disabled) {
            transform: translateY(-2px);
            background-position: 100% 0;
            box-shadow:
              0 12px 28px rgba(0,112,242,0.38);
          }

          .login-button:active:not(:disabled) {
            transform: translateY(0);
          }

          .login-button:disabled {
            cursor: not-allowed;
          }

          .security-animation {
            animation:
              securityPulse 2.5s ease-in-out infinite;
          }

          .mobile-logo-animation {
            animation:
              leftContentIn 0.7s ease-out both;
          }

          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}
      </style>

      {/* =====================================================
          MAIN PAGE
      ====================================================== */}
      <div
        className="min-h-screen w-full flex"
        style={{
          fontFamily:
            "'Georgia', 'Times New Roman', serif",
          background: F.bg,
        }}
      >

        {/* ===================================================
            LEFT BRAND PANEL
        ==================================================== */}
        <div
          className="hidden lg:flex flex-col items-center justify-center w-1/2 relative overflow-hidden"
          style={{
            /*
              KEEPING YOUR PREVIOUS BACKGROUND
              --------------------------------
              Dark blue / purple gradient + grid
            */
            background:
              "linear-gradient(145deg, #06091a 0%, #0c1230 45%, #160826 100%)",
          }}
        >

          {/* -----------------------------------------------
              ORIGINAL BLUE GLOW
          ------------------------------------------------ */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "18%",
              left: "-10%",
              width: "520px",
              height: "520px",

              background:
                "radial-gradient(circle, rgba(64,178,240,0.18) 0%, transparent 68%)",

              filter: "blur(8px)",

              animation:
                "glowMove 7s ease-in-out infinite",
            }}
          />

          {/* -----------------------------------------------
              ORIGINAL PURPLE GLOW
          ------------------------------------------------ */}
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: "10%",
              right: "-14%",
              width: "480px",
              height: "480px",

              background:
                "radial-gradient(circle, rgba(138,62,210,0.22) 0%, transparent 68%)",

              filter: "blur(8px)",

              animation:
                "glowMoveReverse 8s ease-in-out infinite",
            }}
          />

          {/* -----------------------------------------------
              ORIGINAL GRID
          ------------------------------------------------ */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.035,

              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",

              backgroundSize: "52px 52px",
            }}
          />

          {/* -----------------------------------------------
              BRAND CONTENT
          ------------------------------------------------ */}
          <div
            className="relative z-10 flex flex-col items-center text-center px-14 select-none brand-animation"
          >

            {/* LOGO */}
            <img
              src={logoImage}
              alt="Naxrita"
              className="logo-animation"
              style={{
                width: "200px",
                height: "auto",
                marginBottom: "2.1rem",
              }}
            />

            {/* NAXRITA */}
            <div
              className="brand-title-animation"
              style={{
                fontFamily:
                  "'Georgia', 'Times New Roman', serif",

                fontSize: "2.35rem",

                fontWeight: 700,

                letterSpacing: "0.48em",

                textTransform: "uppercase",

                color: "#ffffff",

                lineHeight: 1,

                paddingLeft: "0.48em",

                textShadow:
                  "0 2px 18px rgba(255,255,255,0.12)",
              }}
            >
              NAXRITA
            </div>

            {/* -------------------------------------------
                MOTO
            -------------------------------------------- */}
            <div
              className="brand-subtitle-animation"
              style={{
                marginTop: "0.9rem",

                fontFamily:
                  "'Georgia', 'Times New Roman', serif",

                fontSize: "0.82rem",

                fontWeight: 700,

                letterSpacing: "0.32em",

                textTransform: "uppercase",

                color: "rgba(255,255,255,0.82)",

                paddingLeft: "0.32em",

                textShadow:
                  "0 2px 10px rgba(0,0,0,0.25)",
              }}
            >
              WE COMMIT, WE DELIVER
            </div>

            {/* -------------------------------------------
                GRADIENT DIVIDER
            -------------------------------------------- */}
            <div
              className="animated-line"
              style={{
                height: "2px",

                margin:
                  "1.65rem auto 1.4rem",

                background:
                  "linear-gradient(90deg, #20d4ff, #8a3ed2)",

                borderRadius: "20px",

                boxShadow:
                  "0 0 14px rgba(64,178,240,0.35)",
              }}
            />

            {/* -------------------------------------------
                PRODUCT TITLE
            -------------------------------------------- */}
            <div
              className="brand-subtitle-animation"
              style={{
                fontFamily:
                  "'Georgia', 'Times New Roman', serif",

                color:
                  "rgba(255,255,255,0.58)",

                fontSize: "0.7rem",

                fontWeight: 700,

                letterSpacing: "0.30em",

                textTransform: "uppercase",

                paddingLeft: "0.30em",
              }}
            >
              SAP BASIS PROVISIONING CONSOLE
            </div>

            {/* -------------------------------------------
                DESCRIPTION
            -------------------------------------------- */}
            <p
              className="brand-description-animation"
              style={{
                marginTop: "2rem",

                maxWidth: "310px",

                color:
                  "rgba(255,255,255,0.45)",

                fontFamily:
                  "'Georgia', 'Times New Roman', serif",

                fontSize: "0.86rem",

                fontWeight: 400,

                lineHeight: 1.8,

                letterSpacing: "0.01em",

                textAlign: "center",
              }}
            >
              Enterprise user lifecycle management
              across your SAP landscape — unified,
              auditable, and secure.
            </p>
          </div>

          {/* =================================================
              LEFT FOOTER
          ================================================== */}
          <div
  className="absolute bottom-6 left-1/2 -translate-x-1/2"
  style={{
    color: "rgba(255,255,255,0.30)",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: "0.68rem",
    fontWeight: 600,
    letterSpacing: "0.10em",
    borderLeft: "2px solid rgba(64,178,240,0.7)",
    paddingLeft: "10px",
    textAlign: "center",
    whiteSpace: "nowrap",
  }}
>
  © 2026 NAXRITA · ENTERPRISE EDITION
</div>
        </div>

        {/* ===================================================
            RIGHT LOGIN PANEL
        ==================================================== */}
        <div
          className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden"
          style={{
            background: "#f7f9fc",
          }}
        >

          {/* -----------------------------------------------
              SUBTLE RIGHT BACKGROUND LIGHT
          ------------------------------------------------ */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "-180px",
              right: "-180px",

              width: "450px",
              height: "450px",

              borderRadius: "50%",

              background:
                "radial-gradient(circle, rgba(0,112,242,0.06), transparent 68%)",

              animation:
                "glowMove 9s ease-in-out infinite",
            }}
          />

          {/* -----------------------------------------------
              FORM CONTENT
          ------------------------------------------------ */}
          <div
            className="w-full max-w-sm relative z-10 right-animation"
          >

            {/* MOBILE LOGO */}
            <div className="lg:hidden flex items-center gap-3 mb-8 mobile-logo-animation">

              <img
                src={logoImage}
                alt="Naxrita"
                style={{
                  width: "42px",
                  height: "auto",
                }}
              />

              <div>
                <div
                  style={{
                    color: F.text,
                    fontFamily:
                      "'Georgia', 'Times New Roman', serif",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                  }}
                >
                  NAXRITA
                </div>

                <div
                  className="text-xs"
                  style={{
                    color: F.muted,
                  }}
                >
                  SAP Basis Provisioning Console
                </div>
              </div>
            </div>

            {/* SUCCESS MESSAGE */}
            {successMsg && (
              <div
                className="flex items-start gap-2 px-3.5 py-3 rounded-lg text-xs mb-5"
                style={{
                  background: "#f1fdf6",
                  border:
                    `1px solid ${F.success}40`,
                  color: F.success,
                }}
              >
                <CheckCircle2
                  size={16}
                  className="flex-shrink-0 mt-0.5"
                />

                <div>{successMsg}</div>
              </div>
            )}

            {/* =================================================
                SIGN IN VIEW
            ================================================== */}
            {viewMode === "signin" && (
              <>
                <div className="text-center">

                  <h2
                    style={{
                      color: "#172b4d",

                      fontFamily:
                        "'Georgia', 'Times New Roman', serif",

                      fontSize: "2rem",

                      letterSpacing: "-0.5px",

                      fontWeight: 700,

                      margin: 0,
                    }}
                  >
                    Welcome Back
                  </h2>

                  <p
                    className="text-sm mt-2"
                    style={{
                      color: F.muted,

                      fontFamily:
                        "Arial, Helvetica, sans-serif",

                      fontSize: "0.9rem",
                    }}
                  >
                    Sign in with your SAP administrator
                    credentials to continue.
                  </p>

                  {/* BLUE/PURPLE LINE */}
                  <div
                    className="animated-line"
                    style={{
                      height: "3px",

                      width: "55px",

                      margin:
                        "1.4rem auto 2.5rem",

                      borderRadius: "20px",

                      background:
                        "linear-gradient(90deg, #20a8ff, #7135e8)",

                      boxShadow:
                        "0 0 12px rgba(0,112,242,0.2)",
                    }}
                  />
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-5"
                >

                  {/* USERNAME */}
                  <div>
                    <label
                      className="block text-xs mb-1.5"
                      style={{
                        color: F.text,
                        fontFamily:
                          "Arial, Helvetica, sans-serif",
                        fontWeight: 700,
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
                      className="w-full px-3.5 py-3 text-sm rounded-lg outline-none transition-all"
                      style={{
                        ...inputStyle,
                        fontFamily:
                          "Arial, Helvetica, sans-serif",
                      }}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>

                  {/* PASSWORD */}
                  <div>

                    <div className="flex items-center justify-between mb-1.5">

                      <label
                        className="block text-xs"
                        style={{
                          color: F.text,
                          fontFamily:
                            "Arial, Helvetica, sans-serif",
                          fontWeight: 700,
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
                        className="text-xs font-medium hover:underline"
                        style={{
                          color: F.primary,
                          fontFamily:
                            "Arial, Helvetica, sans-serif",
                        }}
                      >
                        Forgot password?
                      </button>

                    </div>

                    <div className="relative">

                      <input
                        type={
                          showPw
                            ? "text"
                            : "password"
                        }
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Your password"
                        className="w-full px-3.5 py-3 pr-11 text-sm rounded-lg outline-none transition-all"
                        style={{
                          ...inputStyle,
                          fontFamily:
                            "Arial, Helvetica, sans-serif",
                        }}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPw(!showPw)
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{
                          color: F.muted,
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
                  {error && (
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
                      style={{
                        background: "#fff2f2",
                        border:
                          "1px solid #bb000030",
                        color: F.error,
                      }}
                    >
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  )}

                  {/* SIGN IN BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="login-button w-full py-3.5 rounded-lg text-sm text-white flex items-center justify-center gap-2"
                    style={{
                      fontFamily:
                        "Arial, Helvetica, sans-serif",

                      fontWeight: 700,

                      border: "none",

                      opacity:
                        loading ? 0.85 : 1,
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />

                        Signing in…
                      </>
                    ) : (
                      <>
                        <KeyRound size={17} />

                        Sign In
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* =================================================
                FORGOT PASSWORD
            ================================================== */}
            {viewMode === "forgot" && (
              <>
                <button
                  onClick={() => {
                    setViewMode("signin");
                    setError("");
                  }}
                  className="flex items-center gap-1.5 text-xs mb-4 hover:underline"
                  style={{
                    color: F.muted,
                  }}
                >
                  <ArrowLeft size={14} />
                  Back to Sign In
                </button>

                <h2
                  style={{
                    color: F.text,
                    fontFamily:
                      "'Georgia', 'Times New Roman', serif",
                    fontSize: "1.7rem",
                    fontWeight: 700,
                  }}
                >
                  Forgot Password
                </h2>

                <p
                  className="text-sm mt-1.5 mb-8"
                  style={{
                    color: F.muted,
                    fontFamily:
                      "Arial, Helvetica, sans-serif",
                  }}
                >
                  Enter your registered administrator
                  email address to generate a password
                  reset token.
                </p>

                <form
                  onSubmit={handleForgotPassword}
                  className="flex flex-col gap-5"
                >

                  <div>

                    <label
                      className="block text-xs mb-1.5"
                      style={{
                        color: F.text,
                        fontWeight: 700,
                      }}
                    >
                      Registered Email
                    </label>

                    <div className="relative">

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="e.g. superadmin@example.com"
                        autoFocus
                        className="w-full px-3.5 py-3 pr-10 text-sm rounded-lg outline-none transition-all"
                        style={inputStyle}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />

                      <Mail
                        size={16}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{
                          color: F.muted,
                        }}
                      />

                    </div>
                  </div>

                  {error && (
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
                      style={{
                        background: "#fff2f2",
                        border:
                          "1px solid #bb000030",
                        color: F.error,
                      }}
                    >
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="login-button w-full py-3.5 rounded-lg text-sm text-white flex items-center justify-center gap-2"
                    style={{
                      fontWeight: 700,
                      border: "none",
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Requesting Token…
                      </>
                    ) : (
                      <>
                        <Mail size={15} />
                        Send Reset Instructions
                      </>
                    )}
                  </button>

                </form>
              </>
            )}

            {/* =================================================
                RESET PASSWORD
            ================================================== */}
            {viewMode === "reset" && (
              <>
                <button
                  onClick={() => {
                    setViewMode("signin");
                    setError("");
                  }}
                  className="flex items-center gap-1.5 text-xs mb-4 hover:underline"
                  style={{
                    color: F.muted,
                  }}
                >
                  <ArrowLeft size={14} />
                  Back to Sign In
                </button>

                <h2
                  style={{
                    color: F.text,
                    fontFamily:
                      "'Georgia', 'Times New Roman', serif",
                    fontSize: "1.7rem",
                    fontWeight: 700,
                  }}
                >
                  Reset Password
                </h2>

                <p
                  className="text-sm mt-1.5 mb-8"
                  style={{
                    color: F.muted,
                  }}
                >
                  Enter the reset token generated for your
                  account and set your new password.
                </p>

                <form
                  onSubmit={handleResetPassword}
                  className="flex flex-col gap-5"
                >

                  {/* TOKEN */}
                  <div>

                    <label
                      className="block text-xs mb-1.5"
                      style={{
                        color: F.text,
                        fontWeight: 700,
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
                      className="w-full px-3.5 py-3 text-sm rounded-lg outline-none font-mono transition-all"
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />

                  </div>

                  {/* NEW PASSWORD */}
                  <div>

                    <label
                      className="block text-xs mb-1.5"
                      style={{
                        color: F.text,
                        fontWeight: 700,
                      }}
                    >
                      New Password
                    </label>

                    <div className="relative">

                      <input
                        type={
                          showPw
                            ? "text"
                            : "password"
                        }
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(
                            e.target.value
                          );
                          setError("");
                        }}
                        placeholder="Enter new strong password"
                        className="w-full px-3.5 py-3 pr-11 text-sm rounded-lg outline-none transition-all"
                        style={inputStyle}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPw(!showPw)
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{
                          color: F.muted,
                        }}
                      >
                        {showPw ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>

                    </div>
                  </div>

                  {/* ERROR */}
                  {error && (
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
                      style={{
                        background: "#fff2f2",
                        border:
                          "1px solid #bb000030",
                        color: F.error,
                      }}
                    >
                      <AlertCircle size={14} />
                      {error}
                    </div>
                  )}

                  {/* UPDATE BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="login-button w-full py-3.5 rounded-lg text-sm text-white flex items-center justify-center gap-2"
                    style={{
                      fontWeight: 700,
                      border: "none",
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Resetting Password…
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        Update Password
                      </>
                    )}
                  </button>

                </form>
              </>
            )}

            {/* =================================================
                SECURITY MESSAGE
            ================================================== */}
            <div
              className="flex items-center gap-2 mt-8 security-animation"
            >
              <Shield
                size={14}
                style={{
                  color: F.muted,
                }}
              />

              <span
                className="text-xs"
                style={{
                  color: F.muted,
                  fontFamily:
                    "Arial, Helvetica, sans-serif",
                }}
              >
                Secured connection · Session encrypted
                end-to-end
              </span>
            </div>

          </div>

          {/* =================================================
              RIGHT FOOTER
          ================================================== */}
          <p
            className="text-xs absolute bottom-6"
            style={{
              color: F.muted,

              fontFamily:
                "Arial, Helvetica, sans-serif",

              fontWeight: 500,

              letterSpacing: "0.01em",
            }}
          >
            © 2026 Naxrita SAP Basis Provisioning Console
          </p>

        </div>
      </div>
    </>
  );
}