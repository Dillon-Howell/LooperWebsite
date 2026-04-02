/**
 * Admin user detail page — shows Archald Studio profile and per-app admin options.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import StripeAccent from "../components/StripeAccent";
import { usePageMeta } from "../hooks/usePageMeta";
import { getAdminUserDetail, grantPro, revokePro } from "../services/api";
import type { AdminUser, FeedPost } from "../services/api";
import looperIcon from "../assets/looper-icon.png";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function formatDate(ts: number | undefined): string {
  if (!ts) return "Unknown";
  return new Date(ts).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(ts: number | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function proTimeRemaining(proUntil: number | undefined): string {
  if (!proUntil || proUntil <= Date.now()) return "Inactive";
  const diff = proUntil - Date.now();
  const days = Math.floor(diff / 86400000);
  if (days > 365) return `${Math.floor(days / 365)}y ${days % 365}d remaining`;
  if (days > 0) return `${days}d remaining`;
  const hours = Math.floor(diff / 3600000);
  return `${hours}h remaining`;
}

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  usePageMeta({ title: "User Admin — Archald Studio" });

  const [user, setUser] = useState<AdminUser | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [customDays, setCustomDays] = useState("");

  const loadUser = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminUserDetail(userId);
      setUser(data.user);
      setPosts(data.recentPosts ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadUser(); }, [loadUser]);

  const handleGrantPro = async (days: number) => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await grantPro(userId, "looper", days);
      // Update local state
      setUser((prev) => prev ? { ...prev, proUntil: Date.now() + days * 86400000, isPro: true } : prev);
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokePro = async () => {
    if (!userId || !confirm("Remove Pro access for this user?")) return;
    setActionLoading(true);
    try {
      await revokePro(userId);
      setUser((prev) => prev ? { ...prev, proUntil: 0, isPro: false } : prev);
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.root}>
        <div style={styles.container}>
          <div style={styles.spinner} />
          <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Loading user...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={styles.root}>
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <p style={{ color: "var(--text-muted)" }}>{error || "User not found"}</p>
            <Link to="/admin/analytics" style={styles.backLink}>Back to dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const isProActive = user.proUntil ? user.proUntil > Date.now() : false;

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        <Link to="/admin/analytics" style={styles.backLink}>Back to Dashboard</Link>

        {/* ── Archald Studio Profile ── */}
        <div style={styles.profileCard}>
          <div style={styles.avatarLg}>
            {(user.displayName || user.username || "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={styles.userName}>{user.displayName || user.username || "Unknown"}</h1>
            {user.username && <p style={styles.userHandle}>@{user.username}</p>}
            <p style={styles.userEmail}>{user.email || "No email"}</p>
            <p style={styles.userMeta}>
              User ID: <code style={styles.code}>{user.userId}</code>
            </p>
            <p style={styles.userMeta}>Joined: {formatDate(user.createdAt)}</p>
          </div>
        </div>

        {/* ── Overall Stats ── */}
        <h2 style={styles.sectionTitle}>
          <StripeAccent style={{ width: 36, marginRight: 8 }} />
          Archald Studio Account
        </h2>
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{formatNum(user.postCount ?? 0)}</span>
            <span style={styles.statLabel}>Posts</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{formatNum(user.followerCount ?? 0)}</span>
            <span style={styles.statLabel}>Followers</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{formatNum(user.followingCount ?? 0)}</span>
            <span style={styles.statLabel}>Following</span>
          </div>
        </div>

        {/* ── App-Specific Settings ── */}
        <h2 style={styles.sectionTitle}>
          <StripeAccent style={{ width: 36, marginRight: 8 }} />
          App Settings
        </h2>

        {/* Looper Card */}
        <div style={styles.appCard}>
          <div style={styles.appCardHeader}>
            <img src={looperIcon} alt="Looper" style={{ width: 40, height: 40, borderRadius: 10 }} />
            <div>
              <h3 style={styles.appName}>Looper Studio</h3>
              <p style={styles.appDesc}>Music loop station</p>
            </div>
            <div style={{ marginLeft: "auto" }}>
              {isProActive ? (
                <span style={styles.proBadge}>PRO</span>
              ) : (
                <span style={styles.freeBadge}>FREE</span>
              )}
            </div>
          </div>

          {/* Pro Status */}
          <div style={styles.proSection}>
            <h4 style={styles.proTitle}>Pro Subscription</h4>
            <div style={styles.proStatus}>
              <div>
                <p style={styles.proStatusText}>
                  Status: <strong style={{ color: isProActive ? "var(--accent-green)" : "var(--text-muted)" }}>
                    {isProActive ? "Active" : "Inactive"}
                  </strong>
                </p>
                {isProActive && user.proUntil && (
                  <>
                    <p style={styles.proStatusDetail}>Expires: {formatDateTime(user.proUntil)}</p>
                    <p style={styles.proStatusDetail}>{proTimeRemaining(user.proUntil)}</p>
                  </>
                )}
              </div>
            </div>

            {/* Grant Pro */}
            <div style={styles.proActions}>
              <p style={styles.proActionsLabel}>Grant Pro Access:</p>
              <div style={styles.proBtnRow}>
                {[
                  { label: "7 days", days: 7 },
                  { label: "30 days", days: 30 },
                  { label: "90 days", days: 90 },
                  { label: "1 year", days: 365 },
                  { label: "Lifetime", days: 36500 },
                ].map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => handleGrantPro(opt.days)}
                    disabled={actionLoading}
                    style={styles.grantBtn}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Custom duration */}
              <div style={styles.customRow}>
                <input
                  type="number"
                  placeholder="Custom days"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  style={styles.customInput}
                  min={1}
                />
                <button
                  onClick={() => {
                    const d = parseInt(customDays);
                    if (d > 0) handleGrantPro(d);
                  }}
                  disabled={actionLoading || !customDays}
                  style={styles.grantBtn}
                >
                  Grant
                </button>
              </div>

              {/* Revoke */}
              {isProActive && (
                <button
                  onClick={handleRevokePro}
                  disabled={actionLoading}
                  style={styles.revokeBtn}
                >
                  Revoke Pro Access
                </button>
              )}
            </div>
          </div>

          {/* Looper Stats */}
          <div style={styles.appStats}>
            <h4 style={styles.proTitle}>Looper Activity</h4>
            <div style={styles.statsRow}>
              <div style={styles.statCardSmall}>
                <span style={styles.statValueSm}>{formatNum(user.postCount ?? 0)}</span>
                <span style={styles.statLabelSm}>Songs</span>
              </div>
              <div style={styles.statCardSmall}>
                <span style={styles.statValueSm}>{formatNum(user.followerCount ?? 0)}</span>
                <span style={styles.statLabelSm}>Followers</span>
              </div>
              <div style={styles.statCardSmall}>
                <span style={styles.statValueSm}>{formatNum(user.followingCount ?? 0)}</span>
                <span style={styles.statLabelSm}>Following</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Posts ── */}
        {posts.length > 0 && (
          <>
            <h2 style={styles.sectionTitle}>
              <StripeAccent style={{ width: 36, marginRight: 8 }} />
              Recent Posts
            </h2>
            <div style={styles.postList}>
              {posts.map((p) => (
                <Link key={p.postId} to={`/looper/post/${p.postId}`} style={styles.postRow}>
                  <div style={{ flex: 1 }}>
                    <span style={styles.postSong}>{p.songName}</span>
                    <span style={styles.postMeta}>
                      {formatNum(p.plays ?? 0)} plays / {formatNum(p.likes ?? 0)} likes / {formatNum(p.comments ?? 0)} comments
                    </span>
                  </div>
                  <span style={styles.postDate}>{formatDate(p.createdAt)}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* View public profile link */}
        <div style={{ marginTop: 32, textAlign: "center" as const }}>
          <Link to={`/looper/user/${user.userId}`} style={styles.viewProfileLink}>
            View Public Looper Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: "80vh", padding: "32px 0 80px" },
  container: { maxWidth: 800, margin: "0 auto", padding: "0 24px" },
  backLink: {
    color: "var(--accent-red)", textDecoration: "none", fontSize: "0.85rem",
    display: "inline-block", marginBottom: 20,
  },

  /* Profile */
  profileCard: {
    display: "flex", gap: 20, alignItems: "flex-start",
    padding: 24, backgroundColor: "var(--bg-light)", border: "1px solid var(--border)",
    borderRadius: 16, marginBottom: 32,
  },
  avatarLg: {
    width: 72, height: 72, borderRadius: "50%", backgroundColor: "var(--accent-red)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.8rem", fontWeight: 700, fontFamily: "var(--font-display)", flexShrink: 0,
  },
  userName: { fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--text)", margin: 0 },
  userHandle: { color: "var(--text-subtle)", fontSize: "0.88rem", margin: "2px 0 0" },
  userEmail: { color: "var(--text-muted)", fontSize: "0.82rem", margin: "4px 0 0" },
  userMeta: { color: "var(--text-subtle)", fontSize: "0.78rem", margin: "4px 0 0" },
  code: { fontFamily: "var(--font-mono, monospace)", fontSize: "0.72rem", backgroundColor: "var(--surface)", padding: "2px 6px", borderRadius: 4 },

  /* Section */
  sectionTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 700,
    color: "var(--text)", display: "flex", alignItems: "center", marginTop: 28, marginBottom: 14,
  },

  /* Stats */
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 24 },
  statCard: {
    backgroundColor: "var(--surface)", borderRadius: 12, padding: "16px 12px",
    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2,
  },
  statValue: { fontSize: "1.6rem", fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" },
  statLabel: { fontSize: "0.75rem", color: "var(--text-subtle)" },
  statCardSmall: {
    backgroundColor: "var(--surface)", borderRadius: 10, padding: "12px 10px",
    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2,
  },
  statValueSm: { fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" },
  statLabelSm: { fontSize: "0.7rem", color: "var(--text-subtle)" },

  /* App card */
  appCard: {
    backgroundColor: "var(--bg-light)", border: "1px solid var(--border)",
    borderRadius: 16, padding: 24, marginBottom: 24,
  },
  appCardHeader: { display: "flex", alignItems: "center", gap: 14, marginBottom: 20 },
  appName: { fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--text)", margin: 0 },
  appDesc: { color: "var(--text-subtle)", fontSize: "0.78rem", margin: "2px 0 0" },
  proBadge: {
    display: "inline-block", padding: "4px 14px", borderRadius: 8,
    fontSize: "0.75rem", fontWeight: 700, backgroundColor: "var(--accent-red)", color: "#fff",
    letterSpacing: "0.06em",
  },
  freeBadge: {
    display: "inline-block", padding: "4px 14px", borderRadius: 8,
    fontSize: "0.75rem", fontWeight: 700, backgroundColor: "var(--surface)", color: "var(--text-muted)",
    letterSpacing: "0.06em", border: "1px solid var(--border)",
  },

  /* Pro section */
  proSection: {
    borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 16,
  },
  proTitle: { fontFamily: "var(--font-display)", fontSize: "0.92rem", color: "var(--text)", margin: "0 0 10px" },
  proStatus: { marginBottom: 16 },
  proStatusText: { color: "var(--text)", fontSize: "0.88rem", margin: "0 0 4px" },
  proStatusDetail: { color: "var(--text-subtle)", fontSize: "0.8rem", margin: "2px 0" },
  proActions: {},
  proActionsLabel: { color: "var(--text-subtle)", fontSize: "0.82rem", marginBottom: 8 },
  proBtnRow: { display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 10 },
  grantBtn: {
    padding: "7px 16px", borderRadius: 8, border: "1px solid var(--border)",
    backgroundColor: "var(--surface)", color: "var(--text)", fontSize: "0.8rem",
    fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s",
  },
  customRow: { display: "flex", gap: 8, marginBottom: 12 },
  customInput: {
    width: 120, padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)",
    backgroundColor: "var(--surface)", color: "var(--text)", fontSize: "0.82rem",
    fontFamily: "var(--font-body)", outline: "none",
  },
  revokeBtn: {
    padding: "7px 16px", borderRadius: 8, border: "1px solid #c0392b",
    backgroundColor: "transparent", color: "#c0392b", fontSize: "0.8rem",
    fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", marginTop: 8,
  },

  /* App stats */
  appStats: { borderTop: "1px solid var(--border)", paddingTop: 16 },

  /* Posts */
  postList: { display: "flex", flexDirection: "column" as const, gap: 6 },
  postRow: {
    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
    backgroundColor: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 10,
    textDecoration: "none", transition: "border-color 0.2s",
  },
  postSong: { display: "block", color: "var(--text)", fontWeight: 600, fontSize: "0.9rem" },
  postMeta: { display: "block", color: "var(--text-subtle)", fontSize: "0.75rem", marginTop: 2 },
  postDate: { color: "var(--text-muted)", fontSize: "0.78rem", flexShrink: 0 },
  viewProfileLink: {
    color: "var(--accent-red)", textDecoration: "none", fontSize: "0.88rem", fontWeight: 600,
  },

  /* Loading */
  spinner: {
    width: 32, height: 32, border: "3px solid var(--border)",
    borderTopColor: "var(--accent-red)", borderRadius: "50%",
    animation: "spin 0.8s linear infinite", margin: "80px auto 12px",
  },
  errorCard: { textAlign: "center" as const, padding: "80px 24px" },
};
