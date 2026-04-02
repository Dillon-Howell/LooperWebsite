/**
 * Account setup page — shown after first sign-in.
 * Sets username (shared across all Archald Studio apps) and display name.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StripeAccent from "../components/StripeAccent";
import { usePageMeta } from "../hooks/usePageMeta";
import { setUsername, updateMyProfile } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function UsernameSetup() {
  usePageMeta({ title: "Set Up Your Account — Archald Studio", description: "Set up your username and display name" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsernameVal] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) {
    navigate("/auth/signin", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedDisplayName = displayName.trim();

    if (!USERNAME_REGEX.test(trimmedUsername)) {
      setError("Username: 3-20 characters, letters, numbers, and underscores only");
      return;
    }
    if (!trimmedDisplayName) {
      setError("Display name is required");
      return;
    }
    if (trimmedDisplayName.length > 50) {
      setError("Display name must be 50 characters or less");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await setUsername(trimmedUsername);
      await updateMyProfile({ displayName: trimmedDisplayName });
      navigate("/profile", { replace: true });
    } catch (err: any) {
      setError(err.message?.includes("409") || err.message?.includes("taken") ? "Username already taken" : err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        <StripeAccent />
        <h1 style={styles.heading}>Set up your account</h1>
        <p style={styles.subtitle}>
          Choose a unique username and display name for your Archald Studio account. These are shared across all apps, including Looper. You can change them later.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Username */}
          <label style={styles.label}>Username</label>
          <div style={styles.inputWrap}>
            <span style={styles.atSign}>@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsernameVal(e.target.value); setError(null); }}
              placeholder="username"
              maxLength={20}
              autoFocus
              style={styles.input}
            />
          </div>
          <p style={styles.hint}>3-20 characters. Letters, numbers, underscores.</p>

          {/* Display Name */}
          <label style={{ ...styles.label, marginTop: 16 }}>Display Name</label>
          <div style={styles.inputWrap}>
            <input
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setError(null); }}
              placeholder="Your name"
              maxLength={50}
              style={{ ...styles.input, paddingLeft: 14 }}
            />
          </div>
          <p style={styles.hint}>How you appear on posts and comments across all Archald Studio apps.</p>

          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={saving || !username.trim() || !displayName.trim()} style={styles.submitBtn}>
            {saving ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" },
  container: { maxWidth: 400, width: "100%", textAlign: "center" as const },
  heading: {
    fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800,
    color: "var(--text)", margin: "16px 0 8px",
  },
  subtitle: { color: "var(--text-subtle)", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: 32 },
  form: { display: "flex", flexDirection: "column" as const, gap: 6, textAlign: "left" as const },
  label: {
    fontSize: "0.78rem", fontWeight: 600, color: "var(--text-subtle)",
    textTransform: "uppercase" as const, letterSpacing: "0.04em",
  },
  inputWrap: {
    display: "flex", alignItems: "center", backgroundColor: "var(--surface)",
    border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden",
  },
  atSign: {
    padding: "12px 0 12px 14px", color: "var(--text-subtle)", fontSize: "1rem",
    fontWeight: 600, fontFamily: "var(--font-body)",
  },
  input: {
    flex: 1, padding: "12px 14px 12px 4px", border: "none", backgroundColor: "transparent",
    color: "var(--text)", fontSize: "1rem", fontFamily: "var(--font-body)", outline: "none",
  },
  hint: { color: "var(--text-subtle)", fontSize: "0.72rem", margin: "2px 0 0" },
  error: { color: "var(--accent-red)", fontSize: "0.82rem", margin: "8px 0 0", textAlign: "center" as const },
  submitBtn: {
    padding: "12px 24px", borderRadius: 10, border: "none",
    backgroundColor: "var(--accent-red)", color: "#fff", fontSize: "0.9rem",
    fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
    transition: "opacity 0.2s", marginTop: 12,
  },
};
