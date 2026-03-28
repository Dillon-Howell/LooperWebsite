/**
 * Post detail page — full post view with comments and remix chain.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import StripeAccent from "../components/StripeAccent";
import { usePageMeta } from "../hooks/usePageMeta";
import type { FeedPost, Comment as CommentType, RemixChainEntry } from "../services/api";
import {
  getPost,
  getComments,
  createComment,
  toggleLike,
  incrementPlays,
  getRemixChain,
  isLoggedIn,
} from "../services/api";
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
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [chain, setChain] = useState<RemixChainEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [playCount, setPlayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingPlay, setIsLoadingPlay] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  usePageMeta({
    title: post ? `${post.songName} by ${post.authorDisplayName} — Looper Studio` : "Post — Looper Studio",
    description: post?.description || "Listen on Looper Studio",
  });

  useEffect(() => {
    if (!postId) return;
    setLoading(true);

    Promise.all([
      getPost(postId),
      getComments(postId),
      getRemixChain(postId).catch(() => null),
    ]).then(([postData, commentsData, chainData]) => {
      setPost(postData);
      setIsLiked(postData.isLiked ?? false);
      setLikeCount(postData.likes);
      setPlayCount(postData.plays);
      setComments(commentsData.comments);
      if (chainData?.chain) setChain(chainData.chain);
    }).catch((e) => {
      console.error("Failed to load post:", e);
    }).finally(() => setLoading(false));
  }, [postId]);

  const handlePlay = useCallback(async () => {
    if (!post || isLoadingPlay) return;

    if (isPreviewPlaying(post.postId)) {
      stopPreview();
      setIsPlaying(false);
      return;
    }

    setIsLoadingPlay(true);
    try {
      incrementPlays(post.postId).then(({ plays }) => setPlayCount(plays)).catch(() => {});
      await playPreview(post.s3Key, post.postId, () => setIsPlaying(false));
      setIsPlaying(true);
    } catch (e) {
      console.error("Play failed:", e);
    } finally {
      setIsLoadingPlay(false);
    }
  }, [post, isLoadingPlay]);

  const handleLike = useCallback(async () => {
    if (!post || !isLoggedIn()) return;
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
  }, [post, isLiked]);

  const handleSubmitComment = useCallback(async () => {
    if (!post || !commentText.trim() || submittingComment || !isLoggedIn()) return;
    setSubmittingComment(true);
    try {
      const comment = await createComment(post.postId, commentText.trim());
      setComments((prev) => [comment, ...prev]);
      setCommentText("");
    } catch (e) {
      console.error("Failed to comment:", e);
    } finally {
      setSubmittingComment(false);
    }
  }, [post, commentText, submittingComment]);

  if (loading) {
    return (
      <div style={styles.root}>
        <div style={styles.container}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={styles.root}>
        <div style={styles.container}>
          <div style={styles.notFound}>
            <h2>Post not found</h2>
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

        {/* Post card */}
        <div style={styles.postCard}>
          {/* Author header */}
          <div style={styles.header}>
            <Link to={`/looper/user/${post.authorId}`} style={styles.avatarLink}>
              {post.authorAvatarUrl ? (
                <img src={post.authorAvatarUrl} alt="" style={{ ...styles.avatar, backgroundColor: post.authorAvatarColor }} />
              ) : (
                <div style={{ ...styles.avatar, backgroundColor: post.authorAvatarColor }}>
                  <span style={styles.avatarInitial}>
                    {(post.authorDisplayName || "?")[0].toUpperCase()}
                  </span>
                </div>
              )}
            </Link>
            <div style={styles.authorInfo}>
              <div style={styles.authorRow}>
                <Link to={`/looper/user/${post.authorId}`} style={styles.authorName}>
                  {post.authorDisplayName}
                </Link>
                {post.authorIsPro && <span style={styles.proBadge}>PRO</span>}
              </div>
              <span style={styles.authorMeta}>@{post.authorUsername} · {timeAgo(post.createdAt)}</span>
            </div>
          </div>

          {/* Song player */}
          <div style={styles.songPlayer}>
            <div style={styles.songDetails}>
              <h2 style={styles.songName}>{post.songName}</h2>
              <div style={styles.songMeta}>
                {post.bpm} BPM · {formatDuration(post.duration)} · {post.trackCount} track{post.trackCount !== 1 ? "s" : ""}
              </div>
            </div>
            <button
              onClick={handlePlay}
              disabled={isLoadingPlay}
              style={{
                ...styles.playBtn,
                ...(isPlaying ? styles.playBtnActive : {}),
              }}
            >
              {isLoadingPlay ? "..." : isPlaying ? "■ Stop" : "▶ Play"}
            </button>
          </div>

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

          {/* Stats */}
          <div style={styles.statsRow}>
            <button onClick={handleLike} style={styles.statBtn}>
              <span style={{ color: isLiked ? "var(--accent-red)" : "var(--text-muted)", fontSize: "1.1rem" }}>
                {isLiked ? "♥" : "♡"}
              </span>
              <span>{formatCount(likeCount)} likes</span>
            </button>
            <span style={styles.stat}>💬 {formatCount(post.comments)} comments</span>
            <span style={styles.stat}>⭯ {formatCount(post.remixes)} remixes</span>
            <span style={styles.stat}>▶ {formatCount(playCount)} plays</span>
          </div>
        </div>

        {/* Remix lineage */}
        {post.remixOfPostId && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <StripeAccent style={{ width: 40, marginRight: 8 }} />
              Remix Lineage
            </h3>
            {post.remixHistory && post.remixHistory.length > 0 && (
              <div style={styles.lineageList}>
                {post.remixHistory.map((entry, i) => (
                  <Link
                    key={entry.postId}
                    to={`/looper/post/${entry.postId}`}
                    style={styles.lineageItem}
                  >
                    <span style={styles.lineageIcon}>{i === 0 ? "♫" : "↳"}</span>
                    <span style={styles.lineageSong}>{entry.songName}</span>
                    <span style={styles.lineageAuthor}>by @{entry.authorUsername}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Remix chain (descendants) */}
        {chain.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <StripeAccent style={{ width: 40, marginRight: 8 }} />
              Remix Chain ({chain.length})
            </h3>
            <div style={styles.lineageList}>
              {chain.map((entry) => (
                <Link
                  key={entry.postId}
                  to={`/looper/post/${entry.postId}`}
                  style={styles.lineageItem}
                >
                  <span style={styles.lineageIcon}>
                    {"  ".repeat(entry.remixDepth)}↳
                  </span>
                  <span style={styles.lineageSong}>{entry.songName}</span>
                  <span style={styles.lineageAuthor}>by @{entry.authorUsername}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <StripeAccent style={{ width: 40, marginRight: 8 }} />
            Comments ({comments.length})
          </h3>

          {/* Comment input */}
          {isLoggedIn() && (
            <div style={styles.commentInput}>
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                style={styles.commentField}
                maxLength={500}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || submittingComment}
                style={styles.commentSubmitBtn}
                className="btn-primary"
              >
                {submittingComment ? "..." : "Post"}
              </button>
            </div>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <p style={styles.noComments}>No comments yet. Be the first!</p>
          ) : (
            <div style={styles.commentList}>
              {comments.map((comment) => (
                <div key={comment.commentId} style={styles.commentCard}>
                  <Link to={`/looper/user/${comment.authorId}`} style={styles.commentAvatarLink}>
                    <div style={{ ...styles.commentAvatar, backgroundColor: comment.authorAvatarColor }}>
                      {comment.authorAvatarUrl ? (
                        <img src={comment.authorAvatarUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <span style={styles.commentAvatarInitial}>
                          {(comment.authorDisplayName || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div style={styles.commentBody}>
                    <div style={styles.commentHeader}>
                      <Link to={`/looper/user/${comment.authorId}`} style={styles.commentAuthor}>
                        {comment.authorDisplayName}
                      </Link>
                      {comment.authorIsPro && <span style={styles.proBadgeSm}>PRO</span>}
                      <span style={styles.commentTime}>{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p style={styles.commentText}>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Download CTA */}
        <div style={styles.cta}>
          <p style={styles.ctaText}>
            Want to remix this song? <strong>Download Looper Studio</strong> to remix, record, and create your own music.
          </p>
          <a href="https://apps.apple.com/app/looper-studio/id6742196498" className="btn-primary" style={{ display: "inline-block", marginTop: 12 }}>
            Get the App
          </a>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: "80vh", padding: "32px 0 80px" },
  container: { maxWidth: 640, margin: "0 auto", padding: "0 24px" },
  backLink: {
    display: "inline-block",
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    textDecoration: "none",
    marginBottom: 20,
    transition: "color 0.2s",
  },
  postCard: {
    backgroundColor: "var(--bg-light)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: 24,
  },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  avatarLink: { textDecoration: "none", flexShrink: 0 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", objectFit: "cover" as const,
  },
  avatarInitial: { color: "#fff", fontWeight: 700, fontSize: "1.2rem", fontFamily: "var(--font-display)" },
  authorInfo: { flex: 1 },
  authorRow: { display: "flex", alignItems: "center", gap: 6 },
  authorName: { color: "var(--text)", fontWeight: 600, fontSize: "1.05rem", textDecoration: "none" },
  proBadge: {
    fontSize: "0.65rem", fontWeight: 700, color: "var(--accent-yellow)",
    border: "1px solid var(--accent-yellow)", borderRadius: 4, padding: "1px 5px", letterSpacing: "0.05em",
  },
  proBadgeSm: {
    fontSize: "0.55rem", fontWeight: 700, color: "var(--accent-yellow)",
    border: "1px solid var(--accent-yellow)", borderRadius: 3, padding: "0px 4px", letterSpacing: "0.05em",
  },
  authorMeta: { color: "var(--text-subtle)", fontSize: "0.82rem" },

  songPlayer: {
    display: "flex", alignItems: "center", gap: 16,
    backgroundColor: "var(--surface)", borderRadius: 14, padding: "18px 20px",
  },
  songDetails: { flex: 1 },
  songName: {
    fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700,
    color: "var(--text)", margin: 0,
  },
  songMeta: { color: "var(--text-subtle)", fontSize: "0.85rem", marginTop: 4 },
  playBtn: {
    padding: "10px 24px", borderRadius: 10, border: "2px solid var(--accent-red)",
    backgroundColor: "transparent", color: "var(--accent-red)",
    fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
    transition: "all 0.2s ease", fontFamily: "var(--font-body)",
    whiteSpace: "nowrap" as const,
  },
  playBtnActive: { backgroundColor: "var(--accent-red)", color: "#fff" },

  description: { color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6, marginTop: 16 },
  hashtagRow: { display: "flex", flexWrap: "wrap" as const, gap: 8, marginTop: 10 },
  hashtag: { fontSize: "0.82rem", color: "var(--accent-red)", textDecoration: "none", fontWeight: 500 },

  statsRow: {
    display: "flex", flexWrap: "wrap" as const, gap: 20, marginTop: 18, paddingTop: 16,
    borderTop: "1px solid var(--border)", alignItems: "center",
  },
  statBtn: {
    display: "flex", alignItems: "center", gap: 5,
    background: "none", border: "none", cursor: "pointer", padding: 0,
    color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "var(--font-body)",
  },
  stat: { color: "var(--text-muted)", fontSize: "0.85rem" },

  section: { marginTop: 32 },
  sectionTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700,
    color: "var(--text)", marginBottom: 16, display: "flex", alignItems: "center",
  },

  lineageList: { display: "flex", flexDirection: "column" as const, gap: 6 },
  lineageItem: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 14px", backgroundColor: "var(--bg-light)",
    border: "1px solid var(--border)", borderRadius: 10, textDecoration: "none",
    transition: "border-color 0.2s ease",
  },
  lineageIcon: { color: "var(--accent-green)", fontWeight: 600, flexShrink: 0, whiteSpace: "pre" as const },
  lineageSong: { color: "var(--text)", fontWeight: 500, fontSize: "0.9rem" },
  lineageAuthor: { color: "var(--text-subtle)", fontSize: "0.8rem", marginLeft: "auto" },

  commentInput: { display: "flex", gap: 10, marginBottom: 20 },
  commentField: {
    flex: 1, padding: "10px 14px", backgroundColor: "var(--surface)",
    border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)",
    fontSize: "0.9rem", fontFamily: "var(--font-body)", outline: "none",
  },
  commentSubmitBtn: { padding: "10px 20px", fontSize: "0.85rem", fontFamily: "var(--font-body)" },

  commentList: { display: "flex", flexDirection: "column" as const, gap: 12 },
  noComments: { color: "var(--text-subtle)", fontSize: "0.9rem", textAlign: "center" as const, padding: "24px 0" },
  commentCard: {
    display: "flex", gap: 12, padding: "14px 16px",
    backgroundColor: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: 12,
  },
  commentAvatarLink: { textDecoration: "none", flexShrink: 0 },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16,
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  commentAvatarInitial: { color: "#fff", fontWeight: 700, fontSize: "0.75rem", fontFamily: "var(--font-display)" },
  commentBody: { flex: 1, minWidth: 0 },
  commentHeader: { display: "flex", alignItems: "center", gap: 6 },
  commentAuthor: { color: "var(--text)", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none" },
  commentTime: { color: "var(--text-subtle)", fontSize: "0.75rem", marginLeft: "auto" },
  commentText: { color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.5, marginTop: 4 },

  loadingContainer: { textAlign: "center" as const, padding: "100px 0" },
  spinner: {
    width: 32, height: 32, border: "3px solid var(--border)",
    borderTopColor: "var(--accent-red)", borderRadius: "50%",
    animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
  },
  loadingText: { color: "var(--text-muted)" },
  notFound: { textAlign: "center" as const, padding: "100px 0", color: "var(--text-muted)" },

  cta: {
    textAlign: "center" as const, marginTop: 48, padding: "32px 24px",
    backgroundColor: "var(--bg-light)", borderRadius: 16, border: "1px solid var(--border)",
  },
  ctaText: { color: "var(--text-muted)", fontSize: "0.95rem" },
};
