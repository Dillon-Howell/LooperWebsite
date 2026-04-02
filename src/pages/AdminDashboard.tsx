/**
 * Admin analytics dashboard — overview, daily trends, top content, retention,
 * Looper app stats, and user management.
 */

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import StripeAccent from "../components/StripeAccent";
import { usePageMeta } from "../hooks/usePageMeta";
import {
  isLoggedIn,
  getAnalyticsOverview,
  getAnalyticsDaily,
  getAnalyticsRetention,
  getAnalyticsTopPosts,
  getAdminUsers,
} from "../services/api";
import type { AnalyticsOverview, DailyMetric, AdminUser } from "../services/api";
import looperIcon from "../assets/looper-icon.png";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatDate(ts: number | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString();
}

type Tab = "overview" | "looper" | "users";

export default function AdminDashboard() {
  usePageMeta({ title: "Dashboard — Archald Studio", description: "Admin analytics dashboard." });
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Overview
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);

  // Trends
  const [daily, setDaily] = useState<DailyMetric[]>([]);
  const [trendRange, setTrendRange] = useState(30);

  // Retention
  const [retention, setRetention] = useState<{ d1: number; d7: number; d30: number } | null>(null);

  // Top posts (Looper tab)
  const [topPosts, setTopPosts] = useState<AnalyticsOverview["topPosts"]>([]);
  const [topSortBy, setTopSortBy] = useState("plays");

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersCursor, setUsersCursor] = useState<string | undefined>();
  const [usersSearch, setUsersSearch] = useState("");
  const [usersSearchInput, setUsersSearchInput] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalyticsOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err.message?.includes("403") ? "Access denied. Admin only." : err.message);
    } finally {
      setLoading(false);
    }
  }, []);


  const loadLooper = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewData, postsData, trendsData, retentionData] = await Promise.all([
        getAnalyticsOverview(),
        getAnalyticsTopPosts(20, topSortBy),
        getAnalyticsDaily(daysAgoStr(trendRange), daysAgoStr(0)),
        getAnalyticsRetention(),
      ]);
      setOverview(overviewData);
      setTopPosts(postsData.posts);
      setDaily(trendsData.daily);
      setRetention(retentionData.retention);
    } catch (err: any) {
      setError(err.message?.includes("403") ? "Access denied. Admin only." : err.message);
    } finally {
      setLoading(false);
    }
  }, [topSortBy, trendRange]);

  const loadUsers = useCallback(async (reset = true) => {
    try {
      if (reset) { setLoading(true); setUsers([]); setUsersCursor(undefined); }
      else setLoadingMore(true);
      setError(null);
      const data = await getAdminUsers({
        limit: 25,
        cursor: reset ? undefined : usersCursor,
        search: usersSearch || undefined,
      });
      setUsers((prev) => reset ? data.users : [...prev, ...data.users]);
      setUsersCursor(data.nextCursor);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [usersSearch, usersCursor]);

  useEffect(() => {
    if (!isLoggedIn()) {
      setError("Please sign in to access the dashboard.");
      setLoading(false);
      return;
    }
    if (tab === "overview") loadOverview();
    else if (tab === "looper") loadLooper();
    else if (tab === "users") loadUsers(true);
  }, [tab, loadOverview, loadLooper]);

  // Reload users when search changes
  useEffect(() => {
    if (tab === "users") loadUsers(true);
  }, [usersSearch]);

  // Reload top posts when sort changes (without full reload)
  useEffect(() => {
    if (tab === "looper") {
      getAnalyticsTopPosts(20, topSortBy).then((data) => setTopPosts(data.posts)).catch(() => {});
    }
  }, [topSortBy]);

  // Reload trends when range changes (without full reload)
  useEffect(() => {
    if (tab === "looper") {
      getAnalyticsDaily(daysAgoStr(trendRange), daysAgoStr(0)).then((data) => setDaily(data.daily)).catch(() => {});
    }
  }, [trendRange]);

  // Users are managed via detail page now

  if (error) {
    return (
      <div style={styles.root}>
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <h2 style={styles.errorTitle}>Dashboard</h2>
            <p style={styles.errorText}>{error}</p>
            <Link to="/looper/community" style={styles.backLink}>Back to community</Link>
          </div>
        </div>
      </div>
    );
  }

  const tabLabels: Record<Tab, string> = {
    overview: "Overview",
    looper: "Looper",
    users: "Users",
  };

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>
          <StripeAccent style={{ width: 50, marginRight: 10 }} />
          Admin Dashboard
        </h1>

        {/* Tabs */}
        <div style={styles.tabRow}>
          {(Object.keys(tabLabels) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
            >
              {t === "looper" && (
                <img src={looperIcon} alt="" style={{ width: 16, height: 16, borderRadius: 3, marginRight: 6, verticalAlign: "middle" }} />
              )}
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Loading...</p>
          </div>
        ) : (
          <>
            {/* ══ OVERVIEW TAB ══ */}
            {tab === "overview" && overview && (
              <div>
                <div style={styles.metricsGrid}>
                  <MetricCard label="Total Users" value={overview.totalUsers} accent="var(--accent-yellow)" />
                  <MetricCard label="DAU" value={overview.dau} accent="var(--accent-red)" />
                  <MetricCard label="MAU" value={overview.mau} accent="var(--accent-green)" />
                </div>

                <h3 style={styles.sectionTitle}>
                  <StripeAccent style={{ width: 36, marginRight: 8 }} />
                  Apps
                </h3>
                <div
                  style={{ ...styles.postRow, cursor: "pointer" }}
                  onClick={() => setTab("looper")}
                >
                  <img src={looperIcon} alt="Looper" style={{ width: 40, height: 40, borderRadius: 10 }} />
                  <div style={styles.postInfo}>
                    <span style={styles.postSong}>Looper Studio</span>
                    <span style={styles.postAuthor}>{formatNum(overview.totalPosts)} posts</span>
                  </div>
                  <span style={{ color: "var(--text-subtle)", fontSize: "0.85rem" }}>→</span>
                </div>
              </div>
            )}

            {/* ══ LOOPER TAB ══ */}
            {tab === "looper" && (
              <div>
                <div style={styles.appHeader}>
                  <img src={looperIcon} alt="Looper" style={{ width: 48, height: 48, borderRadius: 12 }} />
                  <div>
                    <h2 style={{ margin: 0, fontFamily: "var(--font-display)", color: "var(--text)" }}>Looper Studio</h2>
                    <p style={{ margin: "4px 0 0", color: "var(--text-subtle)", fontSize: "0.82rem" }}>Music loop station app</p>
                  </div>
                </div>

                {/* Looper metrics */}
                {overview && (
                  <div style={styles.metricsGrid}>
                    <MetricCard label="Total Posts" value={overview.totalPosts} accent="var(--accent-red)" />
                    <MetricCard label="DAU" value={overview.dau} accent="var(--accent-green)" />
                    <MetricCard label="MAU" value={overview.mau} accent="var(--accent-yellow)" />
                  </div>
                )}

                {/* Today's Activity */}
                {overview && (
                  <>
                    <h3 style={styles.sectionTitle}>
                      <StripeAccent style={{ width: 36, marginRight: 8 }} />
                      Today's Activity
                    </h3>
                    <div style={styles.activityGrid}>
                      {Object.entries(overview.today).map(([key, val]) => (
                        <div key={key} style={styles.activityItem}>
                          <span style={styles.activityValue}>{formatNum(val)}</span>
                          <span style={styles.activityLabel}>{key}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Top Content */}
                <h3 style={styles.sectionTitle}>
                  <StripeAccent style={{ width: 36, marginRight: 8 }} />
                  Top Content
                </h3>
                <div style={styles.trendControls}>
                  {["plays", "likes", "comments", "remixes"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setTopSortBy(s)}
                      style={{ ...styles.rangeChip, ...(topSortBy === s ? styles.rangeChipActive : {}) }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div style={styles.postList}>
                  {topPosts.map((p, i) => (
                    <Link key={p.postId} to={`/looper/post/${p.postId}`} style={styles.postRow}>
                      <span style={styles.postRank}>#{i + 1}</span>
                      <div style={styles.postInfo}>
                        <span style={styles.postSong}>{p.songName}</span>
                        <span style={styles.postAuthor}>@{p.authorUsername}</span>
                      </div>
                      <div style={styles.postStats}>
                        <span>{formatNum(p.plays)} plays</span>
                        <span>{formatNum(p.likes)} likes</span>
                        <span>{formatNum(p.comments)} cmts</span>
                        <span>{formatNum(p.remixes)} rmx</span>
                      </div>
                    </Link>
                  ))}
                  {topPosts.length === 0 && <p style={styles.emptyText}>No posts yet.</p>}
                </div>

                {/* Trends */}
                <h3 style={styles.sectionTitle}>
                  <StripeAccent style={{ width: 36, marginRight: 8 }} />
                  Trends
                </h3>
                <div style={styles.trendControls}>
                  {[7, 14, 30, 90].map((d) => (
                    <button
                      key={d}
                      onClick={() => setTrendRange(d)}
                      style={{ ...styles.rangeChip, ...(trendRange === d ? styles.rangeChipActive : {}) }}
                    >
                      {d}d
                    </button>
                  ))}
                </div>

                <h4 style={{ ...styles.sectionTitle, fontSize: "0.92rem", marginTop: 16 }}>Daily Active Users</h4>
                <BarChart data={daily.map((d) => ({ label: d.date?.slice(5) ?? "", value: d.dau ?? 0 }))} color="var(--accent-red)" />

                <h4 style={{ ...styles.sectionTitle, fontSize: "0.92rem", marginTop: 16 }}>Daily Plays</h4>
                <BarChart data={daily.map((d) => ({ label: d.date?.slice(5) ?? "", value: (d as any).post_play ?? 0 }))} color="var(--accent-green)" />

                <h4 style={{ ...styles.sectionTitle, fontSize: "0.92rem", marginTop: 16 }}>Daily Signups</h4>
                <BarChart data={daily.map((d) => ({ label: d.date?.slice(5) ?? "", value: d.signup ?? 0 }))} color="var(--accent-yellow)" />

                <h4 style={{ ...styles.sectionTitle, fontSize: "0.92rem", marginTop: 16 }}>Raw Data</h4>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>DAU</th>
                        <th style={styles.th}>Signups</th>
                        <th style={styles.th}>Plays</th>
                        <th style={styles.th}>Likes</th>
                        <th style={styles.th}>Posts</th>
                        <th style={styles.th}>Comments</th>
                        <th style={styles.th}>Follows</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...daily].reverse().map((d) => (
                        <tr key={d.date}>
                          <td style={styles.td}>{d.date}</td>
                          <td style={styles.td}>{d.dau ?? 0}</td>
                          <td style={styles.td}>{d.signup ?? 0}</td>
                          <td style={styles.td}>{(d as any).post_play ?? 0}</td>
                          <td style={styles.td}>{(d as any).post_like ?? 0}</td>
                          <td style={styles.td}>{d.post_create ?? 0}</td>
                          <td style={styles.td}>{d.comment_create ?? 0}</td>
                          <td style={styles.td}>{d.follow ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Retention */}
                {retention && (
                  <>
                    <h3 style={styles.sectionTitle}>
                      <StripeAccent style={{ width: 36, marginRight: 8 }} />
                      Retention
                    </h3>
                    <div style={styles.retentionGrid}>
                      <RetentionCard label="D1 Retention" value={retention.d1} desc="Users from yesterday active today" />
                      <RetentionCard label="D7 Retention" value={retention.d7} desc="Users from 7 days ago active today" />
                      <RetentionCard label="D30 Retention" value={retention.d30} desc="Users from 30 days ago active today" />
                    </div>
                    <p style={styles.retentionNote}>
                      Retention = % of users active on day X who are also active today.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* ══ USERS TAB ══ */}
            {tab === "users" && (
              <div>
                {/* Search bar */}
                <form
                  onSubmit={(e) => { e.preventDefault(); setUsersSearch(usersSearchInput); }}
                  style={styles.searchRow}
                >
                  <input
                    type="text"
                    placeholder="Search by username, email, or name..."
                    value={usersSearchInput}
                    onChange={(e) => setUsersSearchInput(e.target.value)}
                    style={styles.searchInput}
                  />
                  <button type="submit" style={styles.searchBtn}>Search</button>
                  {usersSearch && (
                    <button
                      type="button"
                      onClick={() => { setUsersSearchInput(""); setUsersSearch(""); }}
                      style={{ ...styles.searchBtn, backgroundColor: "transparent", color: "var(--text-subtle)", border: "1px solid var(--border)" }}
                    >
                      Clear
                    </button>
                  )}
                </form>

                {usersSearch && (
                  <p style={{ color: "var(--text-subtle)", fontSize: "0.82rem", marginBottom: 12 }}>
                    Showing results for "{usersSearch}"
                  </p>
                )}

                {/* Users table */}
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>User</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Joined</th>
                        <th style={styles.th}>Posts</th>
                        <th style={styles.th}>Followers</th>
                        <th style={styles.th}>Apps</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr
                          key={u.userId}
                          onClick={() => navigate(`/admin/user/${u.userId}`)}
                          style={{ cursor: "pointer" }}
                        >
                          <td style={styles.td}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: "50%",
                                backgroundColor: u.avatarColor || "var(--accent-red)",
                                color: "#fff", display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: "0.7rem", fontWeight: 700,
                                flexShrink: 0,
                              }}>
                                {(u.displayName || u.username || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--accent-red)" }}>{u.displayName || u.username || "—"}</div>
                                {u.username && <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>@{u.username}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ ...styles.td, fontSize: "0.78rem" }}>{u.email || "—"}</td>
                          <td style={styles.td}>{formatDate(u.createdAt)}</td>
                          <td style={styles.td}>{u.postCount ?? 0}</td>
                          <td style={styles.td}>{u.followerCount ?? 0}</td>
                          <td style={styles.td}>
                            <div style={{ display: "flex", gap: 4 }}>
                              <img src={looperIcon} alt="Looper" style={{ width: 20, height: 20, borderRadius: 4 }} title="Looper Studio" />
                            </div>
                          </td>
                          <td style={styles.td}>
                            {u.isPro || (u.proUntil && u.proUntil > Date.now()) ? (
                              <span style={styles.badge}>PRO</span>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>Free</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {users.length === 0 && !loading && (
                  <p style={styles.emptyText}>No users found.</p>
                )}

                {usersCursor && (
                  <div style={{ textAlign: "center" as const, marginTop: 16 }}>
                    <button
                      onClick={() => loadUsers(false)}
                      disabled={loadingMore}
                      style={styles.loadMoreBtn}
                    >
                      {loadingMore ? "Loading..." : "Load more"}
                    </button>
                  </div>
                )}
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──

function MetricCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={{ ...styles.metricAccent, backgroundColor: accent }} />
      <span style={styles.metricValue}>{formatNum(value)}</span>
      <span style={styles.metricLabel}>{label}</span>
    </div>
  );
}

function RetentionCard({ label, value, desc }: { label: string; value: number; desc: string }) {
  const color = value >= 40 ? "var(--accent-green)" : value >= 20 ? "var(--accent-yellow)" : "var(--accent-red)";
  return (
    <div style={styles.retentionCard}>
      <span style={{ ...styles.retentionValue, color }}>{value}%</span>
      <span style={styles.retentionLabel}>{label}</span>
      <span style={styles.retentionDesc}>{desc}</span>
    </div>
  );
}

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const showLabels = data.length <= 31;

  return (
    <div style={styles.chartContainer}>
      <div style={styles.chartBars}>
        {data.map((d, i) => (
          <div key={i} style={styles.chartBarWrap} title={`${d.label}: ${d.value}`}>
            <div
              style={{
                ...styles.chartBar,
                backgroundColor: color,
                height: `${Math.max((d.value / max) * 100, 2)}%`,
              }}
            />
            {showLabels && data.length <= 14 && (
              <span style={styles.chartLabel}>{d.label}</span>
            )}
          </div>
        ))}
      </div>
      <div style={styles.chartYAxis}>
        <span style={styles.chartYLabel}>{formatNum(max)}</span>
        <span style={styles.chartYLabel}>{formatNum(Math.round(max / 2))}</span>
        <span style={styles.chartYLabel}>0</span>
      </div>
    </div>
  );
}

// ── Styles ──

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: "80vh", padding: "32px 0 80px" },
  container: { maxWidth: 1060, margin: "0 auto", padding: "0 24px" },
  pageTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700,
    color: "var(--text)", display: "flex", alignItems: "center", marginBottom: 24,
  },
  backLink: { color: "var(--accent-red)", textDecoration: "none", fontSize: "0.9rem" },

  /* Tabs */
  tabRow: { display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid var(--border)", paddingBottom: 0, overflowX: "auto" as const },
  tab: {
    background: "none", border: "none", borderBottom: "2px solid transparent",
    padding: "10px 18px", fontSize: "0.88rem", fontWeight: 600,
    color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-body)",
    transition: "all 0.2s", whiteSpace: "nowrap" as const, display: "flex", alignItems: "center",
  },
  tabActive: { color: "var(--accent-red)", borderBottomColor: "var(--accent-red)" },

  /* App header */
  appHeader: { display: "flex", alignItems: "center", gap: 14, marginBottom: 28 },

  /* Metrics */
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 32 },
  metricCard: {
    backgroundColor: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 14,
    padding: "20px 18px", display: "flex", flexDirection: "column", gap: 4,
    position: "relative", overflow: "hidden",
  },
  metricAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "14px 14px 0 0" },
  metricValue: { fontSize: "2rem", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text)" },
  metricLabel: { fontSize: "0.82rem", color: "var(--text-subtle)", fontWeight: 500 },

  /* Section titles */
  sectionTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 700,
    color: "var(--text)", display: "flex", alignItems: "center", marginTop: 28, marginBottom: 14,
  },

  /* Activity grid */
  activityGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10, marginBottom: 24 },
  activityItem: {
    backgroundColor: "var(--surface)", borderRadius: 10, padding: "12px 10px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  },
  activityValue: { fontSize: "1.3rem", fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" },
  activityLabel: { fontSize: "0.7rem", color: "var(--text-subtle)", textTransform: "capitalize" as const },

  /* Post list */
  postList: { display: "flex", flexDirection: "column", gap: 6 },
  postRow: {
    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
    backgroundColor: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 10,
    textDecoration: "none", transition: "border-color 0.2s",
  },
  postRank: { color: "var(--text-subtle)", fontWeight: 700, fontSize: "0.9rem", minWidth: 28 },
  postInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  postSong: { color: "var(--text)", fontWeight: 600, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  postAuthor: { color: "var(--text-subtle)", fontSize: "0.78rem" },
  postStats: { display: "flex", gap: 12, color: "var(--text-muted)", fontSize: "0.78rem", flexShrink: 0 },

  /* Trend controls */
  trendControls: { display: "flex", gap: 6, marginBottom: 20 },
  rangeChip: {
    background: "none", border: "1px solid var(--border)", borderRadius: 14,
    padding: "5px 14px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-subtle)",
    cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s", textTransform: "capitalize" as const,
  },
  rangeChipActive: { backgroundColor: "var(--accent-red)", borderColor: "var(--accent-red)", color: "#fff" },

  /* Chart */
  chartContainer: {
    display: "flex", gap: 8, backgroundColor: "var(--surface)", borderRadius: 12,
    padding: 16, marginBottom: 24, minHeight: 160,
  },
  chartBars: { flex: 1, display: "flex", alignItems: "flex-end", gap: 2, height: 140 },
  chartBarWrap: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" },
  chartBar: { width: "100%", borderRadius: "3px 3px 0 0", minHeight: 2, transition: "height 0.3s ease" },
  chartLabel: { fontSize: "0.6rem", color: "var(--text-subtle)", marginTop: 4, whiteSpace: "nowrap" as const },
  chartYAxis: { display: "flex", flexDirection: "column", justifyContent: "space-between", width: 40, textAlign: "right" as const },
  chartYLabel: { fontSize: "0.65rem", color: "var(--text-subtle)", fontVariantNumeric: "tabular-nums" },

  /* Table */
  tableWrap: { overflowX: "auto" as const, borderRadius: 12, border: "1px solid var(--border)", marginBottom: 24 },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "0.8rem", fontFamily: "var(--font-body)" },
  th: {
    textAlign: "left" as const, padding: "10px 12px", backgroundColor: "var(--surface)",
    color: "var(--text-subtle)", fontWeight: 600, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" as const,
  },
  td: { padding: "8px 12px", color: "var(--text-muted)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" },

  /* Retention */
  retentionGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 },
  retentionCard: {
    backgroundColor: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 14,
    padding: "24px 18px", display: "flex", flexDirection: "column", alignItems: "center",
    gap: 6, textAlign: "center" as const,
  },
  retentionValue: { fontSize: "2.4rem", fontWeight: 700, fontFamily: "var(--font-display)" },
  retentionLabel: { fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" },
  retentionDesc: { fontSize: "0.75rem", color: "var(--text-subtle)" },
  retentionNote: { color: "var(--text-subtle)", fontSize: "0.8rem", textAlign: "center" as const, marginTop: 12 },

  /* Search */
  searchRow: { display: "flex", gap: 8, marginBottom: 20 },
  searchInput: {
    flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)",
    backgroundColor: "var(--surface)", color: "var(--text)", fontSize: "0.88rem",
    fontFamily: "var(--font-body)", outline: "none",
  },
  searchBtn: {
    padding: "10px 20px", borderRadius: 10, border: "none",
    backgroundColor: "var(--accent-red)", color: "#fff", fontSize: "0.85rem",
    fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
  },

  /* Badges & actions */
  badge: {
    display: "inline-block", padding: "2px 8px", borderRadius: 6,
    fontSize: "0.65rem", fontWeight: 700, backgroundColor: "var(--accent-red)", color: "#fff",
    textTransform: "uppercase" as const, letterSpacing: "0.04em",
  },
  actionBtn: {
    padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)",
    backgroundColor: "transparent", color: "var(--text-subtle)", fontSize: "0.7rem",
    fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.2s",
  },
  actionBtnActive: { backgroundColor: "var(--accent-red)", borderColor: "var(--accent-red)", color: "#fff" },
  loadMoreBtn: {
    padding: "10px 28px", borderRadius: 10, border: "1px solid var(--border)",
    backgroundColor: "transparent", color: "var(--text)", fontSize: "0.85rem",
    fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
  },

  /* Loading / Error */
  loadingContainer: { textAlign: "center" as const, padding: "80px 0" },
  spinner: {
    width: 32, height: 32, border: "3px solid var(--border)",
    borderTopColor: "var(--accent-red)", borderRadius: "50%",
    animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
  },
  loadingText: { color: "var(--text-muted)" },
  errorCard: {
    textAlign: "center" as const, padding: "80px 24px",
    backgroundColor: "var(--bg-light)", borderRadius: 16, border: "1px solid var(--border)",
  },
  errorTitle: { fontFamily: "var(--font-display)", color: "var(--text)", marginBottom: 12 },
  errorText: { color: "var(--text-muted)", marginBottom: 16 },
  emptyText: { color: "var(--text-subtle)", textAlign: "center" as const, padding: "32px 0" },
};
