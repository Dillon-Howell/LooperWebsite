/**
 * API service for Looper social features.
 * Handles auth tokens and all social API calls.
 */

const API_BASE = "https://l9i0ppdygd.execute-api.us-west-1.amazonaws.com";

// ── Token management ─────────────────────────────────────────────────

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem("looper_token", token);
  } else {
    localStorage.removeItem("looper_token");
  }
}

export function getAccessToken(): string | null {
  if (!accessToken) {
    accessToken = localStorage.getItem("looper_token");
  }
  return accessToken;
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

// ── Fetch helper ─────────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

// ── Types ────────────────────────────────────────────────────────────

export interface FeedPost {
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarColor: string;
  authorAvatarUrl?: string;
  authorIsPro?: boolean;
  authorHighlightColor?: string;
  songName: string;
  description?: string;
  hashtags?: string[];
  bpm: number;
  duration: number;
  trackCount: number;
  s3Key: string;
  plays: number;
  likes: number;
  comments: number;
  reposts: number;
  remixes: number;
  createdAt: number;
  isLiked?: boolean;
  isReposted?: boolean;
  remixOfPostId?: string;
  rootPostId?: string;
  remixDepth?: number;
  remixHistory?: Array<{ postId: string; songName: string; authorUsername: string }>;
  reposterId?: string;
  reposterUsername?: string;
  reposterDisplayName?: string;
}

export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarColor: string;
  authorAvatarUrl?: string;
  authorIsPro?: boolean;
  authorHighlightColor?: string;
  text: string;
  timestampSec?: number;
  likes: number;
  replyCount: number;
  parentCommentId?: string;
  isLiked?: boolean;
  createdAt: number;
}

export interface PublicUserProfile {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  avatarUrl?: string;
  highlightColor?: string;
  isPro?: boolean;
  followerCount: number;
  followingCount: number;
  totalPlays: number;
  postCount: number;
  isFollowing?: boolean;
  createdAt: number;
}

export interface RemixChainEntry {
  postId: string;
  authorId: string;
  authorUsername: string;
  songName: string;
  remixDepth: number;
  createdAt: number;
}

// ── Feed ─────────────────────────────────────────────────────────────

export async function getFeed(cursor?: string, limit = 20): Promise<{ posts: FeedPost[]; nextCursor?: string }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const res = await apiFetch(`/feed?${params}`);
  if (!res.ok) throw new Error(`Get feed failed (${res.status})`);
  return res.json();
}

export async function getPopularFeed(cursor?: string, limit = 20): Promise<{ posts: FeedPost[]; nextCursor?: string }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const res = await apiFetch(`/feed/popular?${params}`);
  if (!res.ok) throw new Error(`Get popular feed failed (${res.status})`);
  return res.json();
}

export async function getFollowingFeed(cursor?: string, limit = 20): Promise<{ posts: FeedPost[]; nextCursor?: string }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const res = await apiFetch(`/feed/following?${params}`);
  if (!res.ok) throw new Error(`Get following feed failed (${res.status})`);
  return res.json();
}

// ── Posts ─────────────────────────────────────────────────────────────

export async function getPost(postId: string): Promise<FeedPost> {
  const res = await apiFetch(`/posts/${postId}`);
  if (!res.ok) throw new Error(`Get post failed (${res.status})`);
  const data = await res.json();
  return data.post;
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
  const res = await apiFetch(`/posts/${postId}/like`, { method: "POST" });
  if (!res.ok) throw new Error(`Toggle like failed (${res.status})`);
  return res.json();
}

export async function incrementPlays(postId: string): Promise<{ plays: number }> {
  const res = await apiFetch(`/posts/${postId}/play`, { method: "POST" });
  if (!res.ok) throw new Error(`Increment plays failed (${res.status})`);
  return res.json();
}

// ── Comments ─────────────────────────────────────────────────────────

export async function getComments(
  postId: string,
  options: { cursor?: string; limit?: number; sort?: "popular" | "recent" } = {}
): Promise<{ comments: Comment[]; nextCursor?: string; totalCount?: number }> {
  const params = new URLSearchParams();
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.limit) params.set("limit", String(options.limit));
  if (options.sort) params.set("sort", options.sort);
  const qs = params.toString();
  const res = await apiFetch(`/posts/${postId}/comments${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(`Get comments failed (${res.status})`);
  return res.json();
}

export async function createComment(
  postId: string,
  text: string,
  timestampSec?: number,
  parentCommentId?: string
): Promise<Comment> {
  const body: Record<string, unknown> = { text };
  if (timestampSec != null && timestampSec >= 0) body.timestampSec = timestampSec;
  if (parentCommentId) body.parentCommentId = parentCommentId;
  const res = await apiFetch(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Create comment failed (${res.status})`);
  const data = await res.json();
  return data.comment;
}

export async function toggleCommentLike(postId: string, commentId: string): Promise<{ liked: boolean; likeCount: number }> {
  const res = await apiFetch(`/posts/${postId}/comments/${commentId}/like`, { method: "POST" });
  if (!res.ok) throw new Error(`Toggle comment like failed (${res.status})`);
  return res.json();
}

export async function getReplies(
  postId: string,
  commentId: string,
  options: { cursor?: string; limit?: number } = {}
): Promise<{ replies: Comment[]; nextCursor?: string }> {
  const params = new URLSearchParams();
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.limit) params.set("limit", String(options.limit));
  const qs = params.toString();
  const res = await apiFetch(`/posts/${postId}/comments/${commentId}/replies${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(`Get replies failed (${res.status})`);
  return res.json();
}

// ── Users ────────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<PublicUserProfile> {
  const res = await apiFetch(`/users/${userId}`);
  if (!res.ok) throw new Error(`Get user failed (${res.status})`);
  const data = await res.json();
  return data.user;
}

export async function getUserPosts(userId: string): Promise<{ posts: FeedPost[] }> {
  const res = await apiFetch(`/users/${userId}/posts`);
  if (!res.ok) throw new Error(`Get user posts failed (${res.status})`);
  return res.json();
}

export async function toggleFollow(userId: string): Promise<{ following: boolean; followerCount: number }> {
  const res = await apiFetch(`/users/${userId}/follow`, { method: "POST" });
  if (!res.ok) throw new Error(`Toggle follow failed (${res.status})`);
  return res.json();
}

// ── Search ───────────────────────────────────────────────────────────

export async function searchPosts(query: string): Promise<{ posts: FeedPost[] }> {
  const res = await apiFetch(`/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return res.json();
}

export async function searchUsers(query: string): Promise<{ users: PublicUserProfile[] }> {
  const res = await apiFetch(`/search/users?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search users failed (${res.status})`);
  return res.json();
}

export async function searchHashtag(tag: string, cursor?: string, limit = 20): Promise<{ posts: FeedPost[]; nextCursor?: string }> {
  const params = new URLSearchParams({ tag, limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const res = await apiFetch(`/search/hashtag?${params}`);
  if (!res.ok) throw new Error(`Hashtag search failed (${res.status})`);
  return res.json();
}

// ── Remix Chain ──────────────────────────────────────────────────────

export async function getRemixChain(postId: string): Promise<{ rootPostId: string; chain: RemixChainEntry[] }> {
  const res = await apiFetch(`/posts/${postId}/remix-chain`);
  if (!res.ok) throw new Error(`Get remix chain failed (${res.status})`);
  return res.json();
}

// ── Stream URL ───────────────────────────────────────────────────────

export async function getStreamUrl(key: string): Promise<{ downloadUrl: string; expiresIn: number }> {
  const res = await apiFetch(`/uploads/stream?key=${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error(`Stream URL failed (${res.status})`);
  return res.json();
}

// ── Repost ───────────────────────────────────────────────────────────

export async function toggleRepost(postId: string): Promise<{ reposted: boolean; repostCount: number }> {
  const res = await apiFetch(`/posts/${postId}/repost`, { method: "POST" });
  if (!res.ok) throw new Error(`Toggle repost failed (${res.status})`);
  return res.json();
}

// ── Admin Analytics ─────────────────────────────────────────────────

export interface AnalyticsOverview {
  dau: number;
  mau: number;
  totalUsers: number;
  totalPosts: number;
  today: {
    signups: number;
    logins: number;
    posts: number;
    plays: number;
    likes: number;
    comments: number;
    replies: number;
    remixes: number;
    reposts: number;
    bookmarks: number;
    follows: number;
    searches: number;
    uploads: number;
  };
  topPosts: Array<{
    postId: string;
    songName: string;
    authorUsername: string;
    plays: number;
    likes: number;
    comments: number;
    remixes: number;
    reposts: number;
    createdAt: number;
  }>;
}

export interface DailyMetric {
  date: string;
  dau?: number;
  signup?: number;
  login?: number;
  post_create?: number;
  post_play?: number;
  post_like?: number;
  comment_create?: number;
  comment_reply?: number;
  remix?: number;
  repost?: number;
  bookmark?: number;
  follow?: number;
  search?: number;
  upload?: number;
  app_open?: number;
}

export interface RetentionData {
  retention: { d1: number; d7: number; d30: number };
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const res = await apiFetch("/admin/analytics?action=overview");
  if (!res.ok) throw new Error(`Analytics overview failed (${res.status})`);
  return res.json();
}

export async function getAnalyticsDaily(from: string, to: string): Promise<{ daily: DailyMetric[] }> {
  const res = await apiFetch(`/admin/analytics?action=daily&from=${from}&to=${to}`);
  if (!res.ok) throw new Error(`Analytics daily failed (${res.status})`);
  return res.json();
}

export async function getAnalyticsEvents(
  date: string,
  type?: string,
  limit = 100
): Promise<{ events: Record<string, unknown>[]; nextCursor?: string }> {
  const params = new URLSearchParams({ action: "events", date, limit: String(limit) });
  if (type) params.set("type", type);
  const res = await apiFetch(`/admin/analytics?${params}`);
  if (!res.ok) throw new Error(`Analytics events failed (${res.status})`);
  return res.json();
}

export async function getAnalyticsTopPosts(
  limit = 20,
  sortBy = "plays"
): Promise<{ posts: AnalyticsOverview["topPosts"] }> {
  const res = await apiFetch(`/admin/analytics?action=top-posts&limit=${limit}&sortBy=${sortBy}`);
  if (!res.ok) throw new Error(`Analytics top posts failed (${res.status})`);
  return res.json();
}

export async function getAnalyticsRetention(): Promise<RetentionData> {
  const res = await apiFetch("/admin/analytics?action=retention");
  if (!res.ok) throw new Error(`Analytics retention failed (${res.status})`);
  return res.json();
}
