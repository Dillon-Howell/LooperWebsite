/**
 * Post detail page — full post view with comments, remix chain, and timed comments.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import StripeAccent from "../components/StripeAccent";
import { usePageMeta } from "../hooks/usePageMeta";
import type { FeedPost, Comment as CommentType, RemixChainEntry } from "../services/api";
import {
  getPost,
  getComments,
  createComment,
  toggleLike,
  toggleCommentLike,
  incrementPlays,
  getRemixChain,
  getReplies,
  isLoggedIn,
} from "../services/api";
import {
  playPreview,
  stopPreview,
  isPreviewPlaying,
  getPlaybackTime,
  getMixDuration,
  seekTo,
} from "../services/audioPlayer";

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

/** Deterministic waveform bars from a seed string */
function generateWaveform(seed: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const vals: number[] = [];
  for (let i = 0; i < count; i++) {
    hash = ((hash * 1103515245 + 12345) & 0x7fffffff);
    vals.push(0.2 + ((hash % 100) / 100) * 0.8);
  }
  // Smooth
  return vals.map((_, i) => {
    const prev = vals[Math.max(0, i - 1)];
    const curr = vals[i];
    const next = vals[Math.min(vals.length - 1, i + 1)];
    return (prev + curr + next) / 3;
  });
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
  const [commentTimestamp, setCommentTimestamp] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [scrubberVisible, setScrubberVisible] = useState(false);
  const [commentSort, setCommentSort] = useState<"popular" | "recent">("popular");
  const [commentsCursor, setCommentsCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommentType | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, CommentType[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  usePageMeta({
    title: post ? `${post.songName} by ${post.authorDisplayName} — Looper Studio` : "Post — Looper Studio",
    description: post?.description || "Listen on Looper Studio",
  });

  useEffect(() => {
    if (!postId) return;
    setLoading(true);

    Promise.all([
      getPost(postId),
      getComments(postId, { limit: 25, sort: "popular" }),
      getRemixChain(postId).catch(() => null),
    ]).then(([postData, commentsData, chainData]) => {
      setPost(postData);
      setIsLiked(postData.isLiked ?? false);
      setLikeCount(postData.likes);
      setPlayCount(postData.plays);
      setComments(commentsData.comments);
      setCommentsCursor(commentsData.nextCursor);
      if (chainData?.chain) setChain(chainData.chain);
    }).catch((e) => {
      console.error("Failed to load post:", e);
    }).finally(() => setLoading(false));

    return () => {
      stopPreview();
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [postId]);

  const startProgressTracking = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      const dur = getMixDuration();
      if (dur > 0) {
        setProgress(Math.min(1, getPlaybackTime() / dur));
      }
    }, 50);
    setScrubberVisible(true);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  const handlePlay = useCallback(async () => {
    if (!post || isLoadingPlay) return;

    if (isPreviewPlaying(post.postId)) {
      stopPreview();
      setIsPlaying(false);
      stopProgressTracking();
      setProgress(0);
      setScrubberVisible(false);
      return;
    }

    setIsLoadingPlay(true);
    setScrubberVisible(true);
    try {
      incrementPlays(post.postId).then(({ plays }) => setPlayCount(plays)).catch(() => {});
      await playPreview(post.s3Key, post.postId, () => {
        setIsPlaying(false);
        stopProgressTracking();
        setProgress(0);
        setScrubberVisible(false);
      });
      setIsPlaying(true);
      startProgressTracking();
    } catch (e) {
      console.error("Play failed:", e);
      setScrubberVisible(false);
    } finally {
      setIsLoadingPlay(false);
    }
  }, [post, isLoadingPlay, startProgressTracking, stopProgressTracking]);

  const handleWaveformClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current || !post?.duration) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const sec = Math.round(fraction * post.duration);

    if (isPlaying) {
      seekTo(sec);
    } else {
      setCommentTimestamp(sec);
    }
    setScrubberVisible(true);
  }, [post, isPlaying]);

  const handleTimestampClick = useCallback((sec: number) => {
    if (!post) return;
    if (isPlaying) {
      seekTo(sec);
    } else {
      // Start playback from that point
      (async () => {
        setIsLoadingPlay(true);
        setScrubberVisible(true);
        try {
          incrementPlays(post.postId).then(({ plays }) => setPlayCount(plays)).catch(() => {});
          await playPreview(post.s3Key, post.postId, () => {
            setIsPlaying(false);
            stopProgressTracking();
            setProgress(0);
            setScrubberVisible(false);
          });
          setIsPlaying(true);
          startProgressTracking();
          // Seek after short delay to let buffer load
          setTimeout(() => seekTo(sec), 100);
        } catch (e) {
          console.error("Play failed:", e);
        } finally {
          setIsLoadingPlay(false);
        }
      })();
    }
  }, [post, isPlaying, startProgressTracking, stopProgressTracking]);

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
      const comment = await createComment(
        post.postId,
        commentText.trim(),
        commentTimestamp ?? undefined,
        replyingTo?.commentId
      );
      if (replyingTo) {
        setExpandedReplies((prev) => ({
          ...prev,
          [replyingTo.commentId]: [...(prev[replyingTo.commentId] ?? []), comment],
        }));
        setComments((prev) =>
          prev.map((c) =>
            c.commentId === replyingTo.commentId
              ? { ...c, replyCount: (c.replyCount ?? 0) + 1 }
              : c
          )
        );
        setReplyingTo(null);
      } else {
        setComments((prev) => [comment, ...prev]);
      }
      setCommentText("");
      setCommentTimestamp(null);
    } catch (e) {
      console.error("Failed to comment:", e);
    } finally {
      setSubmittingComment(false);
    }
  }, [post, commentText, commentTimestamp, submittingComment, replyingTo]);

  const handleCommentLike = useCallback(async (comment: CommentType) => {
    if (!post || !isLoggedIn()) return;
    const updateFn = (c: CommentType) =>
      c.commentId === comment.commentId
        ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? Math.max(0, (c.likes ?? 0) - 1) : (c.likes ?? 0) + 1 }
        : c;
    setComments((prev) => prev.map(updateFn));
    setExpandedReplies((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) updated[key] = updated[key].map(updateFn);
      return updated;
    });
    try {
      const result = await toggleCommentLike(post.postId, comment.commentId);
      const applyResult = (c: CommentType) =>
        c.commentId === comment.commentId ? { ...c, isLiked: result.liked, likes: result.likeCount } : c;
      setComments((prev) => prev.map(applyResult));
      setExpandedReplies((prev) => {
        const updated = { ...prev };
        for (const key of Object.keys(updated)) updated[key] = updated[key].map(applyResult);
        return updated;
      });
    } catch {}
  }, [post]);

  const handleLoadReplies = useCallback(async (commentId: string) => {
    if (!post) return;
    setLoadingReplies((p) => ({ ...p, [commentId]: true }));
    try {
      const data = await getReplies(post.postId, commentId, { limit: 10 });
      setExpandedReplies((prev) => ({ ...prev, [commentId]: data.replies }));
    } catch {} finally {
      setLoadingReplies((p) => ({ ...p, [commentId]: false }));
    }
  }, [post]);

  const handleSortChange = useCallback(async (sort: "popular" | "recent") => {
    if (!post) return;
    setCommentSort(sort);
    setComments([]);
    try {
      const data = await getComments(post.postId, { limit: 25, sort });
      setComments(data.comments);
      setCommentsCursor(data.nextCursor);
      setExpandedReplies({});
    } catch {}
  }, [post]);

  const handleLoadMore = useCallback(async () => {
    if (!post || !commentsCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await getComments(post.postId, { cursor: commentsCursor, limit: 25, sort: commentSort });
      setComments((prev) => [...prev, ...data.comments]);
      setCommentsCursor(data.nextCursor);
    } catch {} finally {
      setLoadingMore(false);
    }
  }, [post, commentsCursor, commentSort, loadingMore]);

  const waveformBars = post ? generateWaveform(post.postId, 60) : [];
  const timedComments = comments.filter((c) => c.timestampSec != null);

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

          {/* Song player — redesigned with waveform scrubber */}
          <div style={styles.playerContainer}>
            <div style={styles.playerTop}>
              <button
                onClick={handlePlay}
                disabled={isLoadingPlay}
                style={{
                  ...styles.playBtnCircle,
                  ...(isPlaying ? styles.playBtnCircleActive : {}),
                }}
              >
                {isLoadingPlay ? (
                  <span style={styles.playBtnSpinner} />
                ) : isPlaying ? (
                  <span style={{ fontSize: 14 }}>■</span>
                ) : (
                  <span style={{ fontSize: 16, marginLeft: 2 }}>▶</span>
                )}
              </button>
              <div style={styles.playerInfo}>
                <h2 style={styles.songName}>{post.songName}</h2>
                <div style={styles.songMeta}>
                  {post.bpm} BPM · {formatDuration(post.duration)} · {post.trackCount} track{post.trackCount !== 1 ? "s" : ""}
                </div>
              </div>
              {(isPlaying || scrubberVisible) && (
                <span style={styles.timeDisplay}>
                  {formatDuration(progress * post.duration)} / {formatDuration(post.duration)}
                </span>
              )}
            </div>

            {/* Waveform scrubber */}
            <div
              ref={waveformRef}
              onClick={handleWaveformClick}
              style={styles.waveformContainer}
              title="Click to set timestamp or seek"
            >
              {/* Bars */}
              <div style={styles.waveformBars}>
                {waveformBars.map((h, i) => {
                  const barProgress = (i + 1) / waveformBars.length;
                  const isPast = barProgress <= progress && isPlaying;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${h * 100}%`,
                        backgroundColor: isPast
                          ? "var(--accent-red)"
                          : "var(--border)",
                        borderRadius: 1,
                        transition: "background-color 0.1s",
                        minWidth: 2,
                      }}
                    />
                  );
                })}
              </div>

              {/* Playhead */}
              {(isPlaying || scrubberVisible) && progress > 0 && (
                <div style={{
                  ...styles.playhead,
                  left: `${progress * 100}%`,
                }} />
              )}

              {/* Timed comment markers */}
              {post.duration > 0 && timedComments.map((c) => (
                <div
                  key={c.commentId}
                  style={{
                    ...styles.commentDot,
                    left: `${((c.timestampSec ?? 0) / post.duration) * 100}%`,
                  }}
                  title={`${formatDuration(c.timestampSec ?? 0)} — ${c.authorDisplayName}: ${c.text.slice(0, 40)}`}
                />
              ))}
            </div>
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
                    {"  ".repeat((entry as any).remixDepth ?? (entry as any).depth ?? 1)}↳
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ ...styles.sectionTitle, marginBottom: 0 }}>
              <StripeAccent style={{ width: 40, marginRight: 8 }} />
              Comments ({post.comments})
            </h3>
            <div style={{ display: "flex", gap: 6 }}>
              {(["popular", "recent"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSortChange(s)}
                  style={{
                    ...styles.sortChip,
                    ...(commentSort === s ? styles.sortChipActive : {}),
                  }}
                >
                  {s === "popular" ? "Top" : "New"}
                </button>
              ))}
            </div>
          </div>

          {/* Comment input */}
          {isLoggedIn() && (
            <div style={styles.commentInputWrap}>
              {replyingTo && (
                <div style={styles.timestampRow}>
                  <span style={{ ...styles.timestampChip, backgroundColor: "rgba(239, 68, 68, 0.08)" }}>
                    Replying to @{replyingTo.authorUsername}
                    <button onClick={() => setReplyingTo(null)} style={styles.timestampRemove}>✕</button>
                  </span>
                </div>
              )}
              {commentTimestamp != null && !replyingTo && (
                <div style={styles.timestampRow}>
                  <span style={styles.timestampChip}>
                    {formatDuration(commentTimestamp)}
                    <button onClick={() => setCommentTimestamp(null)} style={styles.timestampRemove}>✕</button>
                  </span>
                  <span style={styles.timestampHint}>Click waveform to change time</span>
                </div>
              )}
              <div style={styles.commentInput}>
                <input
                  type="text"
                  placeholder={
                    replyingTo
                      ? `Reply to @${replyingTo.authorUsername}...`
                      : commentTimestamp != null
                        ? `Comment at ${formatDuration(commentTimestamp)}...`
                        : "Write a comment..."
                  }
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                  style={{
                    ...styles.commentField,
                    ...((commentTimestamp != null || replyingTo) ? { borderColor: "var(--accent-red)" } : {}),
                  }}
                  maxLength={500}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                  style={styles.commentSubmitBtn}
                  className="btn-primary"
                >
                  {submittingComment ? "..." : replyingTo ? "Reply" : "Post"}
                </button>
              </div>
            </div>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <p style={styles.noComments}>No comments yet. Be the first!</p>
          ) : (
            <div style={styles.commentList}>
              {comments.map((comment) => (
                <div key={comment.commentId}>
                  <div style={styles.commentCard}>
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
                        {comment.timestampSec != null && (
                          <button
                            onClick={() => handleTimestampClick(comment.timestampSec!)}
                            style={styles.commentTimestampBtn}
                            title={`Jump to ${formatDuration(comment.timestampSec)}`}
                          >
                            {formatDuration(comment.timestampSec)}
                          </button>
                        )}
                        <span style={styles.commentTime}>{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p style={styles.commentText}>{comment.text}</p>
                      {/* Comment actions */}
                      <div style={styles.commentActions}>
                        <button onClick={() => handleCommentLike(comment)} style={styles.commentActionBtn}>
                          <span style={{ color: comment.isLiked ? "var(--accent-red)" : "var(--text-subtle)" }}>
                            {comment.isLiked ? "♥" : "♡"}
                          </span>
                          {(comment.likes ?? 0) > 0 && (
                            <span style={{ color: comment.isLiked ? "var(--accent-red)" : "var(--text-subtle)", fontSize: "0.72rem" }}>
                              {comment.likes}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => { setReplyingTo(comment); setCommentTimestamp(null); }}
                          style={styles.commentActionBtn}
                        >
                          <span style={{ color: "var(--text-subtle)" }}>Reply</span>
                          {(comment.replyCount ?? 0) > 0 && (
                            <span style={{ color: "var(--text-subtle)", fontSize: "0.72rem" }}>({comment.replyCount})</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Replies */}
                  {(comment.replyCount ?? 0) > 0 && !expandedReplies[comment.commentId] && (
                    <button
                      onClick={() => handleLoadReplies(comment.commentId)}
                      style={styles.viewRepliesBtn}
                    >
                      {loadingReplies[comment.commentId]
                        ? "Loading..."
                        : `View ${comment.replyCount} ${comment.replyCount === 1 ? "reply" : "replies"}`}
                    </button>
                  )}
                  {expandedReplies[comment.commentId]?.map((reply) => (
                    <div key={reply.commentId} style={styles.replyCard}>
                      <Link to={`/looper/user/${reply.authorId}`} style={styles.commentAvatarLink}>
                        <div style={{ ...styles.commentAvatar, backgroundColor: reply.authorAvatarColor, width: 26, height: 26, borderRadius: 13 }}>
                          {reply.authorAvatarUrl ? (
                            <img src={reply.authorAvatarUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ ...styles.commentAvatarInitial, fontSize: "0.65rem" }}>
                              {(reply.authorDisplayName || "?")[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                      </Link>
                      <div style={styles.commentBody}>
                        <div style={styles.commentHeader}>
                          <Link to={`/looper/user/${reply.authorId}`} style={styles.commentAuthor}>
                            {reply.authorDisplayName}
                          </Link>
                          {reply.authorIsPro && <span style={styles.proBadgeSm}>PRO</span>}
                          <span style={styles.commentTime}>{timeAgo(reply.createdAt)}</span>
                        </div>
                        <p style={styles.commentText}>{reply.text}</p>
                        <div style={styles.commentActions}>
                          <button onClick={() => handleCommentLike(reply)} style={styles.commentActionBtn}>
                            <span style={{ color: reply.isLiked ? "var(--accent-red)" : "var(--text-subtle)" }}>
                              {reply.isLiked ? "♥" : "♡"}
                            </span>
                            {(reply.likes ?? 0) > 0 && (
                              <span style={{ color: reply.isLiked ? "var(--accent-red)" : "var(--text-subtle)", fontSize: "0.72rem" }}>
                                {reply.likes}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {/* Load more */}
              {commentsCursor && (
                <button onClick={handleLoadMore} style={styles.loadMoreBtn} disabled={loadingMore}>
                  {loadingMore ? "Loading..." : "Load more comments"}
                </button>
              )}
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

  /* Player */
  playerContainer: {
    backgroundColor: "var(--surface)",
    borderRadius: 14,
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  playerTop: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  playBtnCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    border: "2px solid var(--accent-red)",
    backgroundColor: "transparent",
    color: "var(--accent-red)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    flexShrink: 0,
    fontFamily: "var(--font-body)",
  },
  playBtnCircleActive: {
    backgroundColor: "var(--accent-red)",
    color: "#fff",
  },
  playBtnSpinner: {
    width: 16,
    height: 16,
    border: "2px solid var(--accent-red)",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  playerInfo: { flex: 1, minWidth: 0 },
  songName: {
    fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700,
    color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
  },
  songMeta: { color: "var(--text-subtle)", fontSize: "0.82rem", marginTop: 2 },
  timeDisplay: {
    fontSize: "0.75rem",
    color: "var(--text-subtle)",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },

  /* Waveform */
  waveformContainer: {
    position: "relative",
    height: 40,
    cursor: "pointer",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "var(--bg-light)",
  },
  waveformBars: {
    display: "flex",
    alignItems: "flex-end",
    gap: 1.5,
    height: "100%",
    padding: "4px 2px",
  },
  playhead: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "var(--accent-red)",
    borderRadius: 1,
    zIndex: 2,
    boxShadow: "0 0 6px var(--accent-red)",
    transition: "left 0.05s linear",
  },
  commentDot: {
    position: "absolute",
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "var(--accent-yellow)",
    border: "1px solid var(--surface)",
    zIndex: 3,
    marginLeft: -3,
  },

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

  /* Comment input */
  commentInputWrap: { marginBottom: 20, display: "flex", flexDirection: "column" as const, gap: 8 },
  timestampRow: { display: "flex", alignItems: "center", gap: 10 },
  timestampChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "3px 10px",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    color: "var(--accent-red)",
    fontSize: "0.8rem",
    fontWeight: 700,
    borderRadius: 12,
    fontVariantNumeric: "tabular-nums",
  },
  timestampRemove: {
    background: "none",
    border: "none",
    color: "var(--accent-red)",
    cursor: "pointer",
    fontSize: "0.7rem",
    padding: 0,
    lineHeight: 1,
    fontFamily: "var(--font-body)",
  },
  timestampHint: { color: "var(--text-subtle)", fontSize: "0.75rem" },
  commentInput: { display: "flex", gap: 10 },
  commentField: {
    flex: 1, padding: "10px 14px", backgroundColor: "var(--surface)",
    border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)",
    fontSize: "0.9rem", fontFamily: "var(--font-body)", outline: "none",
    transition: "border-color 0.2s",
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
  commentHeader: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const },
  commentAuthor: { color: "var(--text)", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none" },
  commentTimestampBtn: {
    background: "rgba(239, 68, 68, 0.12)",
    border: "none",
    color: "var(--accent-red)",
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 8,
    cursor: "pointer",
    fontVariantNumeric: "tabular-nums",
    fontFamily: "var(--font-body)",
    transition: "background 0.2s",
  },
  commentTime: { color: "var(--text-subtle)", fontSize: "0.75rem", marginLeft: "auto" },
  commentText: { color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.5, marginTop: 4 },
  commentActions: { display: "flex", alignItems: "center", gap: 12, marginTop: 6 },
  commentActionBtn: {
    display: "inline-flex", alignItems: "center", gap: 4,
    background: "none", border: "none", cursor: "pointer", padding: 0,
    fontSize: "0.8rem", fontFamily: "var(--font-body)", color: "var(--text-subtle)",
    transition: "opacity 0.2s",
  },
  viewRepliesBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "var(--accent-red)", fontSize: "0.8rem", fontWeight: 600,
    padding: "6px 0 6px 56px", fontFamily: "var(--font-body)",
    transition: "opacity 0.2s",
  },
  replyCard: {
    display: "flex", gap: 10, padding: "10px 16px 10px 56px",
    backgroundColor: "var(--surface)", borderRadius: 10,
    borderLeft: "2px solid var(--border)", marginTop: 4,
  },
  sortChip: {
    background: "none", border: "1px solid var(--border)", borderRadius: 14,
    padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600,
    color: "var(--text-subtle)", cursor: "pointer", fontFamily: "var(--font-body)",
    transition: "all 0.2s",
  },
  sortChipActive: {
    backgroundColor: "var(--accent-red)", borderColor: "var(--accent-red)", color: "#fff",
  },
  loadMoreBtn: {
    width: "100%", padding: "10px 0", background: "none",
    border: "1px solid var(--border)", borderRadius: 10,
    color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 500,
    cursor: "pointer", fontFamily: "var(--font-body)", transition: "border-color 0.2s",
  },

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
