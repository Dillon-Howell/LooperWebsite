/**
 * User profile page — view user info and their posts.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import PostCard from "../components/PostCard";
import StripeAccent from "../components/StripeAccent";
import { usePageMeta } from "../hooks/usePageMeta";
import type { PublicUserProfile as UserProfileType, FeedPost } from "../services/api";
import { getUserProfile, getUserPosts, toggleFollow, isLoggedIn } from "../services/api";

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserProfileType | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  usePageMeta({
    title: user ? `${user.displayName} (@${user.username}) — Looper Studio` : "Profile — Looper Studio",
    description: user?.bio || "Looper Studio user profile",
  });

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    Promise.all([
      getUserProfile(userId),
      getUserPosts(userId),
    ]).then(([profileData, postsData]) => {
      setUser(profileData);
      setIsFollowing(profileData.isFollowing ?? false);
      setFollowerCount(profileData.followerCount);
      setPosts(postsData.posts);
    }).catch((e) => {
      console.error("Failed to load profile:", e);
    }).finally(() => setLoading(false));
  }, [userId]);

  const handleFollow = useCallback(async () => {
    if (!userId || !isLoggedIn()) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    setFollowerCount((c) => c + (prev ? -1 : 1));
    try {
      const result = await toggleFollow(userId);
      setIsFollowing(result.following);
      setFollowerCount(result.followerCount);
    } catch {
      setIsFollowing(prev);
      setFollowerCount((c) => c + (prev ? 1 : -1));
    }
  }, [userId, isFollowing]);

  if (loading) {
    return (
      <div style={styles.root}>
        <div style={styles.container}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.root}>
        <div style={styles.container}>
          <div style={styles.notFound}>
            <h2>User not found</h2>
            <Link to="/looper/community" className="btn-secondary" style={{ marginTop: 16, display: "inline-block" }}>
              Back to Community
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        {/* Back link */}
        <Link to="/looper/community" style={styles.backLink}>← Community</Link>

        {/* Profile card */}
        <div style={styles.profileCard}>
          {/* Avatar */}
          <div style={styles.avatarSection}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" style={{ ...styles.avatar, backgroundColor: user.avatarColor }} />
            ) : (
              <div style={{ ...styles.avatar, backgroundColor: user.avatarColor }}>
                <span style={styles.avatarInitial}>
                  {(user.displayName || user.username || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={styles.nameRow}>
            <h1 style={styles.displayName}>
              {user.displayName}
              {user.isPro && <span style={styles.proBadge}>PRO</span>}
            </h1>
            <span style={styles.username}>@{user.username}</span>
          </div>

          {user.bio && <p style={styles.bio}>{user.bio}</p>}

          {/* Stats */}
          <div style={styles.statsRow}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{formatCount(user.postCount)}</span>
              <span style={styles.statLabel}>Posts</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{formatCount(followerCount)}</span>
              <span style={styles.statLabel}>Followers</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{formatCount(user.followingCount)}</span>
              <span style={styles.statLabel}>Following</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{formatCount(user.totalPlays)}</span>
              <span style={styles.statLabel}>Plays</span>
            </div>
          </div>

          {/* Follow button */}
          {isLoggedIn() && (
            <button
              onClick={handleFollow}
              style={{
                ...styles.followBtn,
                ...(isFollowing ? styles.followBtnFollowing : {}),
              }}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {/* Posts */}
        <div style={styles.postsSection}>
          <h3 style={styles.postsTitle}>
            <StripeAccent style={{ width: 40, marginRight: 8 }} />
            Posts ({posts.length})
          </h3>

          {posts.length === 0 ? (
            <p style={styles.noPosts}>No posts yet</p>
          ) : (
            <div style={styles.postsList}>
              {posts.map((post) => (
                <PostCard key={post.postId} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: "80vh", padding: "32px 0 80px" },
  container: { maxWidth: 640, margin: "0 auto", padding: "0 24px" },
  backLink: {
    display: "inline-block", color: "var(--text-muted)", fontSize: "0.85rem",
    textDecoration: "none", marginBottom: 20,
  },
  profileCard: {
    backgroundColor: "var(--bg-light)", border: "1px solid var(--border)",
    borderRadius: 16, padding: 28, textAlign: "center" as const,
  },
  avatarSection: { marginBottom: 16 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, margin: "0 auto",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", objectFit: "cover" as const,
  },
  avatarInitial: {
    color: "#fff", fontWeight: 800, fontSize: "2rem", fontFamily: "var(--font-display)",
  },
  nameRow: { marginBottom: 8 },
  displayName: {
    fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800,
    color: "var(--text)", margin: 0, display: "flex", alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  username: { color: "var(--text-subtle)", fontSize: "0.9rem" },
  proBadge: {
    fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-yellow)",
    border: "1px solid var(--accent-yellow)", borderRadius: 4, padding: "2px 6px",
    letterSpacing: "0.05em",
  },
  bio: {
    color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.5,
    marginTop: 8, marginBottom: 0, maxWidth: 400, margin: "8px auto 0",
  },
  statsRow: {
    display: "flex", justifyContent: "center", gap: 32, marginTop: 20,
  },
  statItem: {
    display: "flex", flexDirection: "column" as const, alignItems: "center",
  },
  statValue: { color: "var(--text)", fontWeight: 700, fontSize: "1.1rem" },
  statLabel: { color: "var(--text-subtle)", fontSize: "0.75rem", marginTop: 2 },
  followBtn: {
    marginTop: 20, padding: "10px 32px", borderRadius: 10,
    border: "2px solid var(--accent-red)", backgroundColor: "var(--accent-red)",
    color: "#fff", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
    transition: "all 0.2s ease", fontFamily: "var(--font-body)",
  },
  followBtnFollowing: {
    backgroundColor: "transparent", color: "var(--accent-red)",
  },
  postsSection: { marginTop: 32 },
  postsTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700,
    color: "var(--text)", marginBottom: 16, display: "flex", alignItems: "center",
  },
  postsList: {},
  noPosts: {
    color: "var(--text-subtle)", fontSize: "0.9rem",
    textAlign: "center" as const, padding: "32px 0",
  },
  loadingContainer: { textAlign: "center" as const, padding: "100px 0" },
  spinner: {
    width: 32, height: 32, border: "3px solid var(--border)",
    borderTopColor: "var(--accent-red)", borderRadius: "50%",
    animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
  },
  loadingText: { color: "var(--text-muted)" },
  notFound: { textAlign: "center" as const, padding: "100px 0", color: "var(--text-muted)" },
};
