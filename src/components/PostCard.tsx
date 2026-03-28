/**
 * Social feed post card component.
 */

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { FeedPost } from "../services/api";
import { toggleLike, incrementPlays, isLoggedIn } from "../services/api";
import { playPreview, stopPreview, isPreviewPlaying } from "../services/audioPlayer";

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

interface PostCardProps {
  post: FeedPost;
  onPlayStateChange?: () => void;
}

export default function PostCard({ post, onPlayStateChange }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [playCount, setPlayCount] = useState(post.plays);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = useCallback(async () => {
    if (isLoading) return;

    if (isPreviewPlaying(post.postId)) {
      stopPreview();
      setIsPlaying(false);
      onPlayStateChange?.();
      return;
    }

    setIsLoading(true);
    try {
      incrementPlays(post.postId).then(({ plays }) => setPlayCount(plays)).catch(() => {});
      await playPreview(post.s3Key, post.postId, () => {
        setIsPlaying(false);
        onPlayStateChange?.();
      });
      setIsPlaying(true);
      onPlayStateChange?.();
    } catch (e) {
      console.error("Play failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, [post.postId, post.s3Key, isLoading, onPlayStateChange]);

  const handleLike = useCallback(async () => {
    if (!isLoggedIn()) return;
    const prev = isLiked;
    setIsLiked(!prev);
    setLikeCount((c) => c + (prev ? -1 : 1));
    try {
      const result = await toggleLike(post.postId);
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setIsLiked(prev);
      setLikeCount((c) => c + (prev ? 1 : -1));
    }
  }, [post.postId, isLiked]);

  return (
    <div style={styles.card} className="card-hover">
      {/* Repost banner */}
      {post.reposterUsername && (
        <div style={styles.repostBanner}>
          <span style={styles.repostIcon}>⟳</span>
          <Link to={`/looper/user/${post.reposterId}`} style={styles.repostLink}>
            {post.reposterDisplayName || post.reposterUsername}
          </Link>
          <span style={styles.repostText}> reposted</span>
        </div>
      )}

      {/* Header: avatar + author info */}
      <div style={styles.header}>
        <Link to={`/looper/user/${post.authorId}`} style={styles.avatarLink}>
          {post.authorAvatarUrl ? (
            <img src={post.authorAvatarUrl} alt="" style={{ ...styles.avatar, backgroundColor: post.authorAvatarColor }} />
          ) : (
            <div style={{ ...styles.avatar, backgroundColor: post.authorAvatarColor }}>
              <span style={styles.avatarInitial}>
                {(post.authorDisplayName || post.authorUsername || "?")[0].toUpperCase()}
              </span>
            </div>
          )}
        </Link>
        <div style={styles.authorInfo}>
          <div style={styles.authorRow}>
            <Link to={`/looper/user/${post.authorId}`} style={styles.authorName}>
              {post.authorDisplayName || post.authorUsername}
            </Link>
            {post.authorIsPro && <span style={styles.proBadge}>PRO</span>}
          </div>
          <span style={styles.authorMeta}>
            @{post.authorUsername} · {timeAgo(post.createdAt)}
          </span>
        </div>
      </div>

      {/* Song info card */}
      <Link to={`/looper/post/${post.postId}`} style={styles.songCard}>
        <div style={styles.songInfo}>
          <div style={styles.songName}>{post.songName}</div>
          <div style={styles.songMeta}>
            {post.bpm} BPM · {formatDuration(post.duration)} · {post.trackCount} track{post.trackCount !== 1 ? "s" : ""}
          </div>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePlay(); }}
          style={{
            ...styles.playBtn,
            ...(isPlaying ? styles.playBtnActive : {}),
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <span style={styles.spinner} />
          ) : isPlaying ? (
            "■"
          ) : (
            "▶"
          )}
        </button>
      </Link>

      {/* Description */}
      {post.description && (
        <p style={styles.description}>{post.description}</p>
      )}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div style={styles.hashtagRow}>
          {post.hashtags.map((tag) => (
            <Link key={tag} to={`/looper/community?tag=${tag}`} style={styles.hashtag}>
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Remix lineage */}
      {post.remixOfPostId && (
        <div style={styles.remixBanner}>
          <span style={styles.remixIcon}>⭯</span>
          <span style={styles.remixText}>Remix</span>
          {post.remixHistory && post.remixHistory.length > 0 && (
            <span style={styles.remixOf}>
              {" of "}
              <Link to={`/looper/post/${post.remixHistory[post.remixHistory.length - 1].postId}`} style={styles.remixLink}>
                {post.remixHistory[post.remixHistory.length - 1].songName}
              </Link>
              {" by @" + post.remixHistory[post.remixHistory.length - 1].authorUsername}
            </span>
          )}
        </div>
      )}

      {/* Action bar */}
      <div style={styles.actionBar}>
        <button onClick={handleLike} style={styles.actionBtn}>
          <span style={{ color: isLiked ? "var(--accent-red)" : "var(--text-muted)" }}>
            {isLiked ? "♥" : "♡"}
          </span>
          <span style={styles.actionCount}>{formatCount(likeCount)}</span>
        </button>
        <Link to={`/looper/post/${post.postId}`} style={styles.actionBtn}>
          <span style={{ color: "var(--text-muted)" }}>💬</span>
          <span style={styles.actionCount}>{formatCount(post.comments)}</span>
        </Link>
        <span style={styles.actionBtn}>
          <span style={{ color: "var(--text-muted)" }}>⭯</span>
          <span style={styles.actionCount}>{formatCount(post.remixes)}</span>
        </span>
        <span style={{ ...styles.actionBtn, marginLeft: "auto" }}>
          <span style={{ color: "var(--text-muted)" }}>▶</span>
          <span style={styles.actionCount}>{formatCount(playCount)}</span>
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: "var(--bg-light)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "20px",
    marginBottom: 16,
  },
  repostBanner: {
    display: "flex",
    alignItems: "center",
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    marginBottom: 12,
    gap: 4,
  },
  repostIcon: { fontSize: "0.9rem" },
  repostLink: {
    color: "var(--text-muted)",
    fontWeight: 600,
    textDecoration: "none",
  },
  repostText: { fontWeight: 300 },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  avatarLink: { textDecoration: "none", flexShrink: 0 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    objectFit: "cover",
  },
  avatarInitial: {
    color: "#fff",
    fontWeight: 700,
    fontSize: "1rem",
    fontFamily: "var(--font-display)",
  },
  authorInfo: { flex: 1, minWidth: 0 },
  authorRow: { display: "flex", alignItems: "center", gap: 6 },
  authorName: {
    color: "var(--text)",
    fontWeight: 600,
    fontSize: "0.95rem",
    textDecoration: "none",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  proBadge: {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "var(--accent-yellow)",
    border: "1px solid var(--accent-yellow)",
    borderRadius: 4,
    padding: "1px 5px",
    letterSpacing: "0.05em",
    flexShrink: 0,
  },
  authorMeta: {
    color: "var(--text-subtle)",
    fontSize: "0.8rem",
  },
  songCard: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "var(--surface)",
    borderRadius: 12,
    padding: "14px 16px",
    textDecoration: "none",
    gap: 12,
    transition: "background-color 0.2s ease",
  },
  songInfo: { flex: 1, minWidth: 0 },
  songName: {
    color: "var(--text)",
    fontWeight: 600,
    fontSize: "0.95rem",
    fontFamily: "var(--font-display)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  songMeta: {
    color: "var(--text-subtle)",
    fontSize: "0.78rem",
    marginTop: 2,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    border: "2px solid var(--accent-red)",
    backgroundColor: "transparent",
    color: "var(--accent-red)",
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    flexShrink: 0,
  },
  playBtnActive: {
    backgroundColor: "var(--accent-red)",
    color: "#fff",
  },
  spinner: {
    display: "inline-block",
    width: 14,
    height: 14,
    border: "2px solid var(--accent-red)",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
  description: {
    color: "var(--text-muted)",
    fontSize: "0.88rem",
    lineHeight: 1.5,
    marginTop: 12,
    marginBottom: 0,
  },
  hashtagRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  hashtag: {
    fontSize: "0.78rem",
    color: "var(--accent-red)",
    textDecoration: "none",
    fontWeight: 500,
  },
  remixBanner: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    fontSize: "0.8rem",
    color: "var(--text-subtle)",
  },
  remixIcon: { fontSize: "0.9rem", color: "var(--accent-green)" },
  remixText: { fontWeight: 600, color: "var(--accent-green)" },
  remixOf: { color: "var(--text-muted)" },
  remixLink: {
    color: "var(--text)",
    fontWeight: 500,
    textDecoration: "none",
  },
  actionBar: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    marginTop: 14,
    paddingTop: 12,
    borderTop: "1px solid var(--border)",
  },
  actionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    fontSize: "0.88rem",
    textDecoration: "none",
    color: "inherit",
  },
  actionCount: {
    color: "var(--text-muted)",
    fontSize: "0.8rem",
  },
};
