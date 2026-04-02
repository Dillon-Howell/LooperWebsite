/**
 * Sign-in page — clean layout with email/password + social providers.
 * Separate from the sign-up page.
 */

import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import StripeAccent from "../components/StripeAccent";
import { usePageMeta } from "../hooks/usePageMeta";
import { useAuth } from "../contexts/AuthContext";
import { emailSignIn, forgotPassword, confirmForgotPassword, getMyProfile } from "../services/api";

const GOOGLE_CLIENT_ID = "1002957418099-uj0c535pn5096raeiq1b8dm8rj04lvns.apps.googleusercontent.com";

export default function SignIn() {
  usePageMeta({ title: "Log In — Archald Studio", description: "Log in to your Archald Studio account" });
  const { user, signInWithGoogle, signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const redirectUri = searchParams.get("redirect_uri");
  const isAppFlow = !!redirectUri;

  useEffect(() => {
    // Only allow our app's custom scheme as a redirect target
    if (redirectUri && redirectUri.startsWith("looperstudio://")) {
      sessionStorage.setItem("looper_app_redirect_uri", redirectUri);
    }
  }, [redirectUri]);

  if (user && !isAppFlow) {
    navigate("/profile", { replace: true });
    return null;
  }

  const handleGoogleClick = () => {
    if (isAppFlow) {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/callback")}` +
        `&response_type=id_token` +
        `&scope=email+profile+openid` +
        `&nonce=${Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, "0")).join("")}` +
        `&prompt=select_account`;
      window.location.href = authUrl;
    } else {
      signInWithGoogle();
    }
  };

  const handleLogin = async () => {
    if (!email || !password) { setError("Email and password are required"); return; }
    setLoading(true); setError("");
    try {
      const result = await emailSignIn(email, password);
      if (isAppFlow) {
        const { generateAuthCode } = await import("../services/api");
        const code = await generateAuthCode();
        const uri = sessionStorage.getItem("looper_app_redirect_uri") || "";
        sessionStorage.removeItem("looper_app_redirect_uri");
        if (!uri.startsWith("looperstudio://")) { navigate("/profile", { replace: true }); return; }
        window.location.href = `${uri}${uri.includes("?") ? "&" : "?"}code=${encodeURIComponent(code)}`;
      } else {
        signInWithEmail(result.userId, result.email);
        try {
          const profile = await getMyProfile();
          navigate(profile.username ? "/profile" : "/auth/username", { replace: true });
        } catch { navigate("/auth/username", { replace: true }); }
      }
    } catch (err: any) {
      if (err.message?.includes("UserNotConfirmedException")) {
        setError("Please verify your email first. Check your inbox.");
      } else {
        setError(err.message || "Incorrect email or password.");
      }
    } finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!email) { setError("Enter your email above"); return; }
    setLoading(true); setError("");
    try {
      await forgotPassword(email);
      setMode("reset");
      setMessage("Check your email for a reset code.");
    } catch (err: any) { setError(err.message || "Failed to send reset code"); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!resetCode || !newPassword) { setError("Code and new password are required"); return; }
    setLoading(true); setError("");
    try {
      await confirmForgotPassword(email, resetCode, newPassword);
      setMessage("Password reset! You can now log in.");
      setPassword(newPassword);
      setMode("login");
    } catch (err: any) { setError(err.message || "Reset failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.root}>
      <div style={s.card}>
        <StripeAccent />
        <h1 style={s.heading}>Log in</h1>

        {error && <p style={s.error}>{error}</p>}
        {message && <p style={s.success}>{message}</p>}

        {mode === "login" && (
          <>
            {/* Email & Password */}
            <label style={s.label}>Email or username</label>
            <input
              type="email" placeholder="Email or username" value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              style={s.input} autoFocus
            />

            <label style={s.label}>Password</label>
            <div style={s.passwordWrap}>
              <input
                type={showPassword ? "text" : "password"} placeholder="Password" value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                style={{ ...s.input, paddingRight: 40 }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
              <button onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn} type="button" tabIndex={-1}>
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                )}
              </button>
            </div>

            <button onClick={() => { setMode("forgot"); setError(""); setMessage(""); }} style={s.forgotLink}>
              Forgot your password?
            </button>

            {/* Login Button */}
            <button onClick={handleLogin} disabled={loading} style={{ ...s.primaryBtn, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Logging in..." : "Log in"}
            </button>

            {/* Social Providers */}
            <button onClick={handleGoogleClick} style={s.socialBtn}>
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button style={{ ...s.socialBtn, opacity: 0.5, cursor: "not-allowed" }} disabled>
              <svg width="18" height="18" viewBox="0 0 18 22" style={{ flexShrink: 0 }}>
                <path d="M14.94 11.58c-.02-2.12 1.73-3.14 1.81-3.19-1-1.45-2.53-1.65-3.07-1.67-1.3-.14-2.56.77-3.22.77-.67 0-1.7-.76-2.8-.74-1.44.02-2.77.84-3.51 2.13-1.5 2.6-.38 6.46 1.08 8.57.71 1.03 1.56 2.19 2.68 2.15 1.08-.04 1.49-.7 2.79-.7 1.3 0 1.67.7 2.79.67 1.16-.02 1.89-1.05 2.6-2.08.82-1.19 1.16-2.35 1.18-2.41-.03-.01-2.26-.87-2.28-3.45v-.05zM12.82 4.44c.6-.72.99-1.72.89-2.72-.86.04-1.89.57-2.51 1.3-.55.64-1.04 1.66-.91 2.64.96.07 1.93-.49 2.53-1.22z" fill="currentColor"/>
              </svg>
              <span>Continue with Apple</span>
            </button>

            {/* Divider + Sign Up Link */}
            <div style={s.divider}>
              <div style={s.dividerLine} />
              <span style={s.dividerText}>or</span>
              <div style={s.dividerLine} />
            </div>

            <p style={s.switchText}>Don't have a free account yet?</p>
            <Link to={`/auth/signup${isAppFlow ? `?redirect_uri=${encodeURIComponent(redirectUri!)}` : ""}`} style={s.switchBtn}>
              Create your account
            </Link>
          </>
        )}

        {mode === "forgot" && (
          <>
            <label style={s.label}>Email</label>
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} style={s.input} autoFocus />
            <button onClick={handleForgot} disabled={loading} style={{ ...s.primaryBtn, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
            <button onClick={() => { setMode("login"); setError(""); setMessage(""); }} style={s.forgotLink}>Back to log in</button>
          </>
        )}

        {mode === "reset" && (
          <>
            <label style={s.label}>Reset Code</label>
            <input type="text" placeholder="Enter code from email" value={resetCode}
              onChange={e => setResetCode(e.target.value)} style={s.input} autoFocus />
            <label style={s.label}>New Password</label>
            <input type="password" placeholder="New password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} style={s.input} />
            <button onClick={handleReset} disabled={loading} style={{ ...s.primaryBtn, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button onClick={() => { setMode("login"); setError(""); setMessage(""); }} style={s.forgotLink}>Back to log in</button>
          </>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" },
  card: {
    maxWidth: 400, width: "100%", backgroundColor: "var(--bg-light)",
    border: "1px solid var(--border)", borderRadius: 20, padding: "36px 32px",
    display: "flex", flexDirection: "column" as const, gap: 0,
  },
  heading: {
    fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800,
    color: "var(--text)", margin: "12px 0 20px",
  },
  label: {
    fontSize: "0.82rem", fontWeight: 600, color: "var(--text)",
    marginBottom: 6, marginTop: 14,
  },
  input: {
    width: "100%", padding: "12px 14px", borderRadius: 6,
    border: "1px solid var(--border)", backgroundColor: "var(--surface)",
    color: "var(--text)", fontSize: "0.9rem", fontFamily: "var(--font-body)",
    outline: "none", boxSizing: "border-box" as const,
  },
  passwordWrap: { position: "relative" as const },
  eyeBtn: {
    position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", color: "var(--text-subtle)",
    padding: 4, display: "flex",
  },
  forgotLink: {
    background: "none", border: "none", color: "var(--accent-red)", fontSize: "0.82rem",
    cursor: "pointer", fontFamily: "var(--font-body)", padding: 0,
    textAlign: "left" as const, marginTop: 8, marginBottom: 4,
    textDecoration: "underline",
  },
  primaryBtn: {
    width: "100%", padding: "14px 16px", borderRadius: 9999,
    border: "none", backgroundColor: "#1a1a1a", color: "#fff",
    fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
    fontFamily: "var(--font-body)", marginTop: 16, transition: "opacity 0.2s",
  },
  socialBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    width: "100%", padding: "12px 16px", borderRadius: 9999,
    border: "1px solid var(--border)", backgroundColor: "transparent",
    color: "var(--text)", fontSize: "0.88rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "var(--font-body)", marginTop: 8,
    transition: "background-color 0.2s",
  },
  divider: { display: "flex", alignItems: "center", gap: 12, margin: "20px 0 12px" },
  dividerLine: { flex: 1, height: 1, backgroundColor: "var(--border)" },
  dividerText: { color: "var(--text-subtle)", fontSize: "0.8rem", fontWeight: 500 },
  switchText: {
    color: "var(--text-subtle)", fontSize: "0.88rem", margin: "0 0 8px", textAlign: "center" as const,
  },
  switchBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", padding: "12px 16px", borderRadius: 9999,
    border: "1px solid var(--border)", backgroundColor: "transparent",
    color: "var(--text)", fontSize: "0.88rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "var(--font-body)", textDecoration: "none",
  },
  error: {
    color: "#EF4444", fontSize: "0.85rem", margin: "0 0 4px", padding: "8px 12px",
    backgroundColor: "#EF444412", borderRadius: 8, border: "1px solid #EF444430",
  },
  success: {
    color: "#10B981", fontSize: "0.85rem", margin: "0 0 4px", padding: "8px 12px",
    backgroundColor: "#10B98112", borderRadius: 8, border: "1px solid #10B98130",
  },
};
