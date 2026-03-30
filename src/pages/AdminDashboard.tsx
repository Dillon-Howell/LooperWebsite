/**
 * Admin analytics dashboard — overview, daily trends, top content, retention.
 * Only accessible to authenticated admin users.
 */

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import StripeAccent from "../components/StripeAccent";
import { usePageMeta } from "../hooks/usePageMeta";
import {
  isLoggedIn,
  getAnalyticsOverview,
  getAnalyticsDaily,
  getAnalyticsRetention,
  getAnalyticsTopPosts,
} from "../services/api";
import type { AnalyticsOverview, DailyMetric } from "../services/api";

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

type Tab = "overview" | "trends" | "content" | "retention";

export default function AdminDashboard() {
  usePageMeta({ title: "Dashboard — Looper Studio", description: "Admin analytics dashboard." });

  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Overview state
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);

  // Trends state
  const [daily, setDaily] = useState<DailyMetric[]>([]);
  const [trendRange, setTrendRange] = useState(30);

  // Retention state
  const [retention, setRetention] = useState<{ d1: number; d7: number; d30: number } | null>(null);

  // Top posts state
  const [topPosts, setTopPosts] = useState<AnalyticsOverview["topPosts"]>([]);
  const [topSortBy, setTopSortBy] = useState("plays");

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

  const loadTrends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const from = daysAgoStr(trendRange);
      const to = daysAgoStr(0);
      const data = await getAnalyticsDaily(from, to);
      setDaily(data.daily);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [trendRange]);

  const loadRetention = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalyticsRetention();
      setRetention(data.retention);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTopPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalyticsTopPosts(20, topSortBy);
      setTopPosts(data.posts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [topSortBy]);

  useEffect(() => {
    if (!isLoggedIn()) {
      setError("Please sign in to access the dashboard.");
      setLoading(false);
      return;
    }
    if (tab === "overview") loadOverview();
    else if (tab === "trends") loadTrends();
    else if (tab === "retention") loadRetention();
    else if (tab === "content") loadTopPosts();
  }, [tab, loadOverview, loadTrends, loadRetention, loadTopPosts]);

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

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>
          <StripeAccent style={{ width: 50, marginRight: 10 }} />
          Analytics Dashboard
        </h1>

        {/* Tabs */}
        <div style={styles.tabRow}>
          {(["overview", "trends", "content", "retention"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
            >
              {t === "overview" ? "Overview" : t === "trends" ? "Trends" : t === "content" ? "Top Content" : "Retention"}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {tab === "overview" && overview && (
              <div>
                {/* Key metrics */}
                <div style={styles.metricsGrid}>
                  <MetricCard label="DAU" value={overview.dau} accent="var(--accent-red)" />
                  <MetricCard label="MAU" value={overview.mau} accent="var(--accent-green)" />
                  <MetricCard label="Total Users" value={overview.totalUsers} accent="var(--accent-yellow)" />
                  <MetricCard label="Total Posts" value={overview.totalPosts} accent="var(--text-muted)" />
                </div>

                {/* Today's activity */}
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

                {/* Top posts */}
                {overview.topPosts.length > 0 && (
                  <>
                    <h3 style={styles.sectionTitle}>
                      <StripeAccent style={{ width: 36, marginRight: 8 }} />
                      Top Posts
                    </h3>
                    <div style={styles.postList}>
                      {overview.topPosts.map((p) => (
                        <Link key={p.postId} to={`/looper/post/${p.postId}`} style={styles.postRow}>
                          <div style={styles.postInfo}>
                            <span style={styles.postSong}>{p.songName}</span>
                            <span style={styles.postAuthor}>@{p.authorUsername}</span>
                          </div>
                          <div style={styles.postStats}>
                            <span>{formatNum(p.plays)} plays</span>
                            <span>{formatNum(p.likes)} likes</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TRENDS TAB */}
            {tab === "trends" && (
              <div>
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

                {/* Simple bar chart for DAU */}
                <h3 style={styles.sectionTitle}>
                  <StripeAccent style={{ width: 36, marginRight: 8 }} />
                  Daily Active Users
                </h3>
                <BarChart data={daily.map((d) => ({ label: d.date?.slice(5) ?? "", value: d.dau ?? 0 }))} color="var(--accent-red)" />

                {/* Activity breakdown */}
                <h3 style={styles.sectionTitle}>
                  <StripeAccent style={{ width: 36, marginRight: 8 }} />
                  Daily Plays
                </h3>
                <BarChart data={daily.map((d) => ({ label: d.date?.slice(5) ?? "", value: (d as any).post_play ?? 0 }))} color="var(--accent-green)" />

                <h3 style={styles.sectionTitle}>
                  <StripeAccent style={{ width: 36, marginRight: 8 }} />
                  Daily Signups
                </h3>
                <BarChart data={daily.map((d) => ({ label: d.date?.slice(5) ?? "", value: d.signup ?? 0 }))} color="var(--accent-yellow)" />

                {/* Data table */}
                <h3 style={styles.sectionTitle}>
                  <StripeAccent style={{ width: 36, marginRight: 8 }} />
                  Raw Data
                </h3>
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
              </div>
            )}

            {/* TOP CONTENT TAB */}
            {tab === "content" && (
              <div>
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
                        <span>{formatNum(p.comments)} comments</span>
                        <span>{formatNum(p.remixes)} remixes</span>
                      </div>
                    </Link>
                  ))}
                  {topPosts.length === 0 && <p style={styles.emptyText}>No posts yet.</p>}
                </div>
              </div>
            )}

            {/* RETENTION TAB */}
            {tab === "retention" && retention && (
              <div>
                <div style={styles.retentionGrid}>
                  <RetentionCard label="D1 Retention" value={retention.d1} desc="Users from yesterday active today" />
                  <RetentionCard label="D7 Retention" value={retention.d7} desc="Users from 7 days ago active today" />
                  <RetentionCard label="D30 Retention" value={retention.d30} desc="Users from 30 days ago active today" />
                </div>
                <p style={styles.retentionNote}>
                  Retention = % of users active on day X who are also active today.
                  Data begins accumulating from deployment of analytics tracking.
                </p>
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
  container: { maxWidth: 960, margin: "0 auto", padding: "0 24px" },
  pageTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "var(--text)",
    display: "flex",
    alignItems: "center",
    marginBottom: 24,
  },
  backLink: { color: "var(--accent-red)", textDecoration: "none", fontSize: "0.9rem" },

  /* Tabs */
  tabRow: { display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid var(--border)", paddingBottom: 0 },
  tab: {
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    padding: "10px 18px",
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "all 0.2s",
  },
  tabActive: {
    color: "var(--accent-red)",
    borderBottomColor: "var(--accent-red)",
  },

  /* Metrics */
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 32 },
  metricCard: {
    backgroundColor: "var(--bg-light)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "20px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    position: "relative",
    overflow: "hidden",
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
  activityGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10,
    marginBottom: 24,
  },
  activityItem: {
    backgroundColor: "var(--surface)",
    borderRadius: 10,
    padding: "12px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  activityValue: { fontSize: "1.3rem", fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" },
  activityLabel: { fontSize: "0.7rem", color: "var(--text-subtle)", textTransform: "capitalize" as const },

  /* Post list */
  postList: { display: "flex", flexDirection: "column", gap: 6 },
  postRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    backgroundColor: "var(--bg-light)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    textDecoration: "none",
    transition: "border-color 0.2s",
  },
  postRank: { color: "var(--text-subtle)", fontWeight: 700, fontSize: "0.9rem", minWidth: 28 },
  postInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  postSong: { color: "var(--text)", fontWeight: 600, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  postAuthor: { color: "var(--text-subtle)", fontSize: "0.78rem" },
  postStats: { display: "flex", gap: 12, color: "var(--text-muted)", fontSize: "0.78rem", flexShrink: 0 },

  /* Trend controls */
  trendControls: { display: "flex", gap: 6, marginBottom: 20 },
  rangeChip: {
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "5px 14px",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-subtle)",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "all 0.2s",
    textTransform: "capitalize" as const,
  },
  rangeChipActive: {
    backgroundColor: "var(--accent-red)",
    borderColor: "var(--accent-red)",
    color: "#fff",
  },

  /* Chart */
  chartContainer: {
    display: "flex",
    gap: 8,
    backgroundColor: "var(--surface)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    minHeight: 160,
  },
  chartBars: {
    flex: 1,
    display: "flex",
    alignItems: "flex-end",
    gap: 2,
    height: 140,
  },
  chartBarWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  chartBar: {
    width: "100%",
    borderRadius: "3px 3px 0 0",
    minHeight: 2,
    transition: "height 0.3s ease",
  },
  chartLabel: { fontSize: "0.6rem", color: "var(--text-subtle)", marginTop: 4, whiteSpace: "nowrap" as const },
  chartYAxis: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: 40,
    textAlign: "right" as const,
    paddingBottom: 0,
  },
  chartYLabel: { fontSize: "0.65rem", color: "var(--text-subtle)", fontVariantNumeric: "tabular-nums" },

  /* Table */
  tableWrap: { overflowX: "auto" as const, borderRadius: 12, border: "1px solid var(--border)", marginBottom: 24 },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.8rem",
    fontFamily: "var(--font-body)",
  },
  th: {
    textAlign: "left" as const,
    padding: "10px 12px",
    backgroundColor: "var(--surface)",
    color: "var(--text-subtle)",
    fontWeight: 600,
    borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap" as const,
  },
  td: {
    padding: "8px 12px",
    color: "var(--text-muted)",
    borderBottom: "1px solid var(--border)",
    fontVariantNumeric: "tabular-nums",
  },

  /* Retention */
  retentionGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 },
  retentionCard: {
    backgroundColor: "var(--bg-light)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    textAlign: "center" as const,
  },
  retentionValue: { fontSize: "2.4rem", fontWeight: 700, fontFamily: "var(--font-display)" },
  retentionLabel: { fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" },
  retentionDesc: { fontSize: "0.75rem", color: "var(--text-subtle)" },
  retentionNote: { color: "var(--text-subtle)", fontSize: "0.8rem", textAlign: "center" as const, marginTop: 12 },

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
