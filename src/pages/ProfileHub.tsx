/**
 * Profile hub — Archald Studio platform profile page.
 * Shows account info, editable username/displayName, and app selector.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { usePageMeta } from "../hooks/usePageMeta";
import StripeAccent from "../components/StripeAccent";
import looperIcon from "../assets/looper-icon.png";
import { getMyProfile, setUsername, updateMyProfile, type PublicUserProfile } from "../services/api";

const apps = [
  {
    id: "looper",
    name: "Looper Studio",
    icon: looperIcon,
    path: (userId: string) => `/looper/user/${userId}`,
  },
];

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function ProfileHub() {
  usePageMeta({ title: "My Profile — Archald Studio", description: "Your Archald Studio profile" });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getMyProfile()
      .then((p) => { setProfile(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <section className="container" style={{ paddingTop: 80, textAlign: "center" }}>
        <StripeAccent />
        <h1 style={styles.heading}>Sign in or sign up to view your profile</h1>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => navigate("/auth/signin")} style={styles.signInBtn}>Sign In</button>
          <button onClick={() => navigate("/auth/signup")} style={{ ...styles.signInBtn, backgroundColor: "transparent", border: "1px solid var(--accent-red)", color: "var(--accent-red)" }}>Sign Up</button>
        </div>
      </section>
    );
  }

  const startEditing = () => {
    setEditUsername(profile?.username || "");
    setEditDisplayName(profile?.displayName || "");
    setEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    const trimmedUsername = editUsername.trim();
    const trimmedDisplayName = editDisplayName.trim();

    if (trimmedUsername && !USERNAME_REGEX.test(trimmedUsername)) {
      setError("Username: 3-20 characters, letters, numbers, underscores only");
      return;
    }
    if (trimmedDisplayName.length > 50) {
      setError("Display name must be 50 characters or less");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Update username if changed
      if (trimmedUsername && trimmedUsername !== profile?.username) {
        await setUsername(trimmedUsername);
      }
      // Update display name if changed
      if (trimmedDisplayName !== (profile?.displayName || "")) {
        await updateMyProfile({ displayName: trimmedDisplayName });
      }
      // Refresh profile
      const updated = await getMyProfile();
      setProfile(updated);
      setEditing(false);
      setSuccess("Profile updated");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message?.includes("409") ? "Username already taken" : err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const initial = (profile?.displayName || profile?.username || user.email || "U")[0].toUpperCase();

  return (
    <section className="container" style={{ paddingTop: 80, maxWidth: 600, margin: "0 auto" }}>
      <StripeAccent />

      {/* Profile card */}
      <div style={styles.profileCard}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>{initial}</div>
          <div style={{ flex: 1 }}>
            {!editing ? (
              <>
                <h1 style={styles.displayName}>{profile?.displayName || "No display name"}</h1>
                {profile?.username ? (
                  <p style={styles.username}>@{profile.username}</p>
                ) : (
                  <p style={{ ...styles.username, color: "var(--accent-red)" }}>No username set</p>
                )}
                <p style={styles.email}>{user.email}</p>
              </>
            ) : (
              <div style={styles.editFields}>
                <div>
                  <label style={styles.editLabel}>Username</label>
                  <div style={styles.editInputWrap}>
                    <span style={styles.atPrefix}>@</span>
                    <input
                      value={editUsername}
                      onChange={(e) => { setEditUsername(e.target.value); setError(null); }}
                      placeholder="username"
                      maxLength={20}
                      style={styles.editInput}
                    />
                  </div>
                </div>
                <div>
                  <label style={styles.editLabel}>Display Name</label>
                  <input
                    value={editDisplayName}
                    onChange={(e) => { setEditDisplayName(e.target.value); setError(null); }}
                    placeholder="Display name"
                    maxLength={50}
                    style={{ ...styles.editInput, ...styles.editInputFull }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <div style={styles.profileActions}>
          {!editing ? (
            <button onClick={startEditing} style={styles.editBtn} disabled={loading}>
              Edit Profile
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => { setEditing(false); setError(null); }} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account info */}
      <div style={styles.infoCard}>
        <h3 style={styles.infoTitle}>Account</h3>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Email</span>
          <span style={styles.infoValue}>{user.email}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>User ID</span>
          <span style={{ ...styles.infoValue, fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem" }}>
            {user.userId}
          </span>
        </div>
        {profile?.createdAt && (
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Joined</span>
            <span style={styles.infoValue}>
              {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
          </div>
        )}
      </div>

      {/* App selector */}
      <h2 style={styles.sectionTitle}>Your Apps</h2>
      <div style={styles.appGrid}>
        {apps.map((app) => (
          <button
            key={app.id}
            onClick={() => navigate(app.path(user.userId))}
            style={styles.appCard}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-4px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "none";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
            }}
          >
            <img src={app.icon} alt={app.name} style={styles.appIcon} />
            <span style={styles.appName}>{app.name}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button onClick={signOut} style={styles.signOutBtn}>Sign out</button>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: {
    fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "var(--text)", marginBottom: 16,
  },
  signInBtn: {
    padding: "10px 24px", borderRadius: 10, border: "none",
    backgroundColor: "var(--accent-red)", color: "#fff", fontSize: "0.9rem",
    fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
  },
  profileCard: {
    backgroundColor: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 16,
    padding: 24, marginBottom: 24,
  },
  profileHeader: { display: "flex", alignItems: "flex-start", gap: 16 },
  avatar: {
    width: 64, height: 64, borderRadius: "50%", backgroundColor: "var(--accent-red)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-display)", flexShrink: 0,
  },
  displayName: {
    fontFamily: "var(--font-display)", fontSize: "1.3rem", color: "var(--text)", margin: 0,
  },
  username: { fontSize: "0.88rem", color: "var(--text-subtle)", margin: "4px 0 0" },
  email: { fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0" },
  editFields: { display: "flex", flexDirection: "column" as const, gap: 10, flex: 1 },
  editLabel: {
    fontSize: "0.7rem", fontWeight: 600, color: "var(--text-subtle)",
    textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 2, display: "block",
  },
  editInputWrap: {
    display: "flex", alignItems: "center", backgroundColor: "var(--surface)",
    border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden",
  },
  atPrefix: {
    padding: "8px 0 8px 10px", color: "var(--text-subtle)", fontSize: "0.9rem", fontWeight: 600,
  },
  editInput: {
    flex: 1, padding: "8px 10px 8px 4px", border: "none", backgroundColor: "transparent",
    color: "var(--text)", fontSize: "0.9rem", fontFamily: "var(--font-body)", outline: "none",
  },
  editInputFull: {
    padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8,
    backgroundColor: "var(--surface)", width: "100%",
  },
  profileActions: { marginTop: 16 },
  editBtn: {
    padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)",
    backgroundColor: "transparent", color: "var(--text)", fontSize: "0.82rem",
    fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s",
  },
  saveBtn: {
    padding: "8px 20px", borderRadius: 8, border: "none",
    backgroundColor: "var(--accent-red)", color: "#fff", fontSize: "0.82rem",
    fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
  },
  cancelBtn: {
    padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)",
    backgroundColor: "transparent", color: "var(--text-subtle)", fontSize: "0.82rem",
    cursor: "pointer", fontFamily: "var(--font-body)",
  },
  error: { color: "var(--accent-red)", fontSize: "0.82rem", margin: "12px 0 0" },
  success: { color: "#22c55e", fontSize: "0.82rem", margin: "12px 0 0" },
  infoCard: {
    backgroundColor: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 16,
    padding: 24, marginBottom: 32,
  },
  infoTitle: {
    fontFamily: "var(--font-display)", fontSize: "0.9rem", color: "var(--text)",
    margin: "0 0 16px", textTransform: "uppercase" as const, letterSpacing: "0.06em",
  },
  infoRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 0", borderBottom: "1px solid var(--border)",
  },
  infoLabel: { fontSize: "0.82rem", color: "var(--text-subtle)" },
  infoValue: { fontSize: "0.82rem", color: "var(--text)", fontWeight: 500 },
  sectionTitle: {
    fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--text-subtle)",
    textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 16,
  },
  appGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 16, marginBottom: 40,
  },
  appCard: {
    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 12,
    padding: "24px 16px", backgroundColor: "var(--bg-light)", border: "1px solid var(--border)",
    borderRadius: 16, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontFamily: "var(--font-body)",
  },
  appIcon: { width: 64, height: 64, borderRadius: 14, objectFit: "cover" as const },
  appName: { fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" },
  actions: { paddingTop: 16, borderTop: "1px solid var(--border)" },
  signOutBtn: {
    background: "none", border: "1px solid var(--border)", borderRadius: 8,
    padding: "8px 20px", fontSize: "0.85rem", color: "var(--text-subtle)",
    cursor: "pointer", fontFamily: "var(--font-body)", transition: "border-color 0.2s",
  },
};
