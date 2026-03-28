/**
 * Community page — social feed, search, popular posts.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PostCard from "../components/PostCard";
import StripeAccent from "../components/StripeAccent";
import { usePageMeta } from "../hooks/usePageMeta";
import type { FeedPost, PublicUserProfile } from "../services/api";
import {
  getFeed,
  getPopularFeed,
  searchPosts,
  searchUsers,
  searchHashtag,
} from "../services/api";

type Tab = "recent" | "popular" | "search";

export default function Community() {
  usePageMeta({
    title: "Community — Looper Studio",
    description: "Discover and listen to music created with Looper Studio.",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTag = searchParams.get("tag");
  const [tab, setTab] = useState<Tab>(initialTag ? "search" : "recent");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [users, setUsers] = useState<PublicUserProfile[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialTag ? `#${initialTag}` : "");
  const [searchType, setSearchType] = useState<"posts" | "users">("posts");
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const loadFeed = useCallback(async (feedTab: Tab, cursor?: string, query?: string) => {
    try {
      let result: { posts: FeedPost[]; nextCursor?: string };

      if (feedTab === "search" && query) {
        if (query.startsWith("#")) {
          result = await searchHashtag(query.slice(1), cursor);
        } else {
          const data = await searchPosts(query);
          result = { posts: data.posts };
        }
      } else if (feedTab === "popular") {
        result = await getPopularFeed(cursor);
      } else {
        result = await getFeed(cursor);
      }

      if (cursor) {
        setPosts((prev) => [...prev, ...result.posts]);
      } else {
        setPosts(result.posts);
      }
      setNextCursor(result.nextCursor);
    } catch (e) {
      console.error("Failed to load feed:", e);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    const query = initialTag ? `#${initialTag}` : searchQuery;
    loadFeed(tab, undefined, query).finally(() => setLoading(false));
  }, [tab]);

  // Search with debounce
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!value.trim()) {
      setTab("recent");
      setSearchParams({});
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setTab("search");
      setLoading(true);

      if (value.startsWith("#")) {
        setSearchParams({ tag: value.slice(1) });
      } else {
        setSearchParams({ q: value });
      }

      if (searchType === "users" && !value.startsWith("#")) {
        try {
          const data = await searchUsers(value);
          setUsers(data.users);
          setPosts([]);
        } catch (e) {
          console.error("Search failed:", e);
        }
      } else {
        setUsers([]);
        await loadFeed("search", undefined, value);
      }
      setLoading(false);
    }, 400);
  }, [searchType, loadFeed, setSearchParams]);

  // Load more
  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await loadFeed(tab, nextCursor, searchQuery);
    setLoadingMore(false);
  }, [nextCursor, loadingMore, tab, searchQuery, loadFeed]);

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <StripeAccent style={{ marginBottom: 16 }} />
          <h1 style={styles.title}>
            <span style={{ color: "var(--accent-red)" }}>Community</span>
          </h1>
          <p style={styles.subtitle}>
            Discover music created with Looper Studio
          </p>
        </div>

        {/* Search bar */}
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Search songs, users, or #hashtags..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && !searchQuery.startsWith("#") && (
            <div style={styles.searchTypeToggle}>
              <button
                onClick={() => { setSearchType("posts"); handleSearch(searchQuery); }}
                style={{
                  ...styles.searchTypeBtn,
                  ...(searchType === "posts" ? styles.searchTypeBtnActive : {}),
                }}
              >
                Songs
              </button>
              <button
                onClick={() => { setSearchType("users"); handleSearch(searchQuery); }}
                style={{
                  ...styles.searchTypeBtn,
                  ...(searchType === "users" ? styles.searchTypeBtnActive : {}),
                }}
              >
                Users
              </button>
            </div>
          )}
        </div>

        {/* Tab bar */}
        {!searchQuery && (
          <div style={styles.tabBar}>
            <button
              onClick={() => setTab("recent")}
              style={{
                ...styles.tabBtn,
                ...(tab === "recent" ? styles.tabBtnActive : {}),
              }}
            >
              Recent
            </button>
            <button
              onClick={() => setTab("popular")}
              style={{
                ...styles.tabBtn,
                ...(tab === "popular" ? styles.tabBtnActive : {}),
              }}
            >
              Popular
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner} />
            <p style={styles.loadingText}>Loading...</p>
          </div>
        ) : searchType === "users" && users.length > 0 ? (
          <div style={styles.userGrid}>
            {users.map((user) => (
              <Link
                key={user.userId}
                to={`/looper/user/${user.userId}`}
                style={styles.userCard}
                className="card-hover"
              >
                <div style={{ ...styles.userAvatar, backgroundColor: user.avatarColor }}>
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" style={styles.userAvatarImg} />
                  ) : (
                    <span style={styles.userAvatarInitial}>
                      {(user.displayName || user.username || "?")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={styles.userInfo}>
                  <div style={styles.userDisplayName}>
                    {user.displayName}
                    {user.isPro && <span style={styles.proBadge}>PRO</span>}
                  </div>
                  <div style={styles.userUsername}>@{user.username}</div>
                  <div style={styles.userStats}>
                    {user.postCount} posts · {user.followerCount} followers
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>
              {searchQuery ? "No results found" : "No posts yet"}
            </p>
          </div>
        ) : (
          <>
            <div style={styles.feed}>
              {posts.map((post) => (
                <PostCard key={post.postId} post={post} />
              ))}
            </div>
            {nextCursor && (
              <div style={styles.loadMoreContainer}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={styles.loadMoreBtn}
                  className="btn-secondary"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Download CTA */}
        <div style={styles.cta}>
          <h3 style={styles.ctaTitle}>Want to create your own loops?</h3>
          <p style={styles.ctaText}>
            Download Looper Studio to record, remix, and share music.
          </p>
          <a
            href="https://apps.apple.com/app/looper-studio/id6742196498"
            className="btn-primary"
            style={{ display: "inline-block", marginTop: 16 }}
          >
            Download Looper Studio
          </a>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "80vh",
    padding: "40px 0 80px",
  },
  container: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "0 24px",
  },
  header: {
    textAlign: "center",
    marginBottom: 32,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
    fontWeight: 800,
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "1rem",
    fontWeight: 300,
    marginTop: 8,
  },
  searchBar: {
    marginBottom: 20,
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    color: "var(--text)",
    fontSize: "0.95rem",
    fontFamily: "var(--font-body)",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  searchTypeToggle: {
    display: "flex",
    gap: 8,
    marginTop: 8,
  },
  searchTypeBtn: {
    padding: "6px 14px",
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "var(--text-muted)",
    backgroundColor: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "var(--font-body)",
  },
  searchTypeBtnActive: {
    color: "var(--text)",
    borderColor: "var(--accent-red)",
    backgroundColor: "rgba(217, 72, 67, 0.1)",
  },
  tabBar: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
  },
  tabBtn: {
    padding: "8px 20px",
    fontSize: "0.85rem",
    fontWeight: 600,
    fontFamily: "var(--font-body)",
    color: "var(--text-muted)",
    backgroundColor: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 10,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  tabBtnActive: {
    color: "var(--text)",
    borderColor: "var(--accent-red)",
    backgroundColor: "rgba(217, 72, 67, 0.1)",
  },
  feed: {},
  loadingContainer: {
    textAlign: "center",
    padding: "60px 0",
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    border: "3px solid var(--border)",
    borderTopColor: "var(--accent-red)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto 12px",
  },
  loadingText: {
    color: "var(--text-muted)",
    fontSize: "0.9rem",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 0",
  },
  emptyText: {
    color: "var(--text-muted)",
    fontSize: "1rem",
  },
  userGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px",
    backgroundColor: "var(--bg-light)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    textDecoration: "none",
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  userAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  userAvatarInitial: {
    color: "#fff",
    fontWeight: 700,
    fontSize: "1.1rem",
    fontFamily: "var(--font-display)",
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userDisplayName: {
    color: "var(--text)",
    fontWeight: 600,
    fontSize: "0.95rem",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  userUsername: {
    color: "var(--text-subtle)",
    fontSize: "0.8rem",
  },
  userStats: {
    color: "var(--text-muted)",
    fontSize: "0.78rem",
    marginTop: 2,
  },
  proBadge: {
    fontSize: "0.6rem",
    fontWeight: 700,
    color: "var(--accent-yellow)",
    border: "1px solid var(--accent-yellow)",
    borderRadius: 4,
    padding: "1px 4px",
    letterSpacing: "0.05em",
  },
  loadMoreContainer: {
    textAlign: "center",
    padding: "20px 0",
  },
  loadMoreBtn: {
    fontFamily: "var(--font-body)",
  },
  cta: {
    textAlign: "center",
    marginTop: 60,
    padding: "40px 24px",
    backgroundColor: "var(--bg-light)",
    borderRadius: 16,
    border: "1px solid var(--border)",
  },
  ctaTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "var(--text)",
  },
  ctaText: {
    color: "var(--text-muted)",
    fontSize: "0.95rem",
    marginTop: 8,
  },
};
