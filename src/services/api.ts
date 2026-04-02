/**
 * API service for Looper social features.
 * Handles auth tokens and all social API calls.
 */

const API_BASE = "https://l9i0ppdygd.execute-api.us-west-1.amazonaws.com";

// ── Token management ─────────────────────────────────────────────────

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem("looper_token", token);
  else localStorage.removeItem("looper_token");
}

export function getAccessToken(): string | null {
  if (!accessToken) accessToken = localStorage.getItem("looper_token");
  return accessToken;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
  if (token) localStorage.setItem("looper_refresh_token", token);
  else localStorage.removeItem("looper_refresh_token");
}

function getRefreshToken(): string | null {
  if (!refreshToken) refreshToken = localStorage.getItem("looper_refresh_token");
  return refreshToken;
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

let _currentUserId: string | null = null;

export function setCurrentUserId(id: string | null) {
  _currentUserId = id;
  if (id) localStorage.setItem("looper_user_id", id);
  else localStorage.removeItem("looper_user_id");
}

export function getCurrentUserId(): string | null {
  if (!_currentUserId) _currentUserId = localStorage.getItem("looper_user_id");
  return _currentUserId;
}

export function logout() {
  setAccessToken(null);
  setRefreshToken(null);
  setCurrentUserId(null);
  localStorage.removeItem("looper_id_token");
}

/** Try to refresh the access token using the stored refresh token */
async function tryRefreshToken(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

// ── Social Auth ─────────────────────────────────────────────────────

export interface AuthResult {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  isNewUser?: boolean;
}

export async function socialAuth(
  provider: "apple" | "google",
  identityToken: string,
  fullName?: string,
  client?: "web" | "app"
): Promise<AuthResult> {
  const body: Record<string, unknown> = { provider, identityToken, client: client ?? "web" };
  if (fullName) body.fullName = fullName;
  const res = await fetch(`${API_BASE}/auth/social`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Social auth failed (${res.status})`);
  const data: AuthResult = await res.json();
  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);
  setCurrentUserId(data.userId);
  // Store idToken for potential auth code generation (app redirect flow)
  if (data.idToken) localStorage.setItem("looper_id_token", data.idToken);
  return data;
}

/**
 * Generate a short-lived auth code for the mobile app.
 * Called after web sign-in when the app initiated the flow via redirect_uri.
 */
export async function generateAuthCode(): Promise<string> {
  const token = getAccessToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/auth/code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      accessToken: getAccessToken(),
      idToken: localStorage.getItem("looper_id_token") || "",
      refreshToken: getRefreshToken(),
      email: localStorage.getItem("looper_user_email") || "",
    }),
  });
  if (!res.ok) throw new Error(`Auth code generation failed (${res.status})`);
  const data = await res.json();
  return data.code;
}

// ── Email Auth (Cognito direct) ──────────────────────────────────────

const COGNITO_ENDPOINT = "https://cognito-idp.us-west-1.amazonaws.com/";
const COGNITO_CLIENT_ID = "4lp7h9mh5oqv4ud5a15l1p51vl";

async function cognitoRequest(target: string, body: Record<string, unknown>) {
  const res = await fetch(COGNITO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.__type) {
    throw new Error(data.message || data.__type);
  }
  return data;
}

export async function emailSignIn(email: string, password: string): Promise<AuthResult & { isNewUser: boolean }> {
  const data = await cognitoRequest("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: COGNITO_CLIENT_ID,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  if (!data.AuthenticationResult) throw new Error("Unexpected auth response");
  const { IdToken, AccessToken, RefreshToken } = data.AuthenticationResult;
  // Decode the userId from the ID token
  const payload = JSON.parse(atob(IdToken.split(".")[1]));
  setAccessToken(AccessToken);
  setRefreshToken(RefreshToken);
  setCurrentUserId(payload.sub);
  localStorage.setItem("looper_id_token", IdToken);
  localStorage.setItem("looper_user_email", email);
  return { accessToken: AccessToken, idToken: IdToken, refreshToken: RefreshToken, userId: payload.sub, email, isNewUser: false };
}

export async function emailSignUp(email: string, password: string): Promise<{ needsConfirmation: boolean }> {
  const data = await cognitoRequest("SignUp", {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }],
  });
  return { needsConfirmation: !data.UserConfirmed };
}

export async function confirmEmail(email: string, code: string): Promise<void> {
  await cognitoRequest("ConfirmSignUp", {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
}

export async function resendConfirmation(email: string): Promise<void> {
  await cognitoRequest("ResendConfirmationCode", {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await cognitoRequest("ForgotPassword", {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
  });
}

export async function confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
  await cognitoRequest("ConfirmForgotPassword", {
    ClientId: COGNITO_CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });
}

// ── Fetch helper ─────────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Auto-refresh on 401 and retry once
  if (res.status === 401 && token) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`;
      return fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  return res;
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
  isBookmarked?: boolean;
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

// ── Profile Management ──────────────────────────────────────────────

export async function getMyProfile(): Promise<PublicUserProfile> {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("Not signed in");
  return getUserProfile(userId);
}

export async function setUsername(username: string): Promise<void> {
  const res = await apiFetch("/users/me/username", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed (${res.status})`);
  }
}

export async function updateMyProfile(updates: {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  avatarColor?: string;
  highlightColor?: string;
}): Promise<void> {
  const res = await apiFetch("/users/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed (${res.status})`);
  }
}

// ── Upload & Post ──────────────────────────────────────────────────

export async function presignUpload(fileName: string, fileSizeBytes: number, contentType = "application/octet-stream"): Promise<{
  uploadUrl: string;
  key: string;
  expiresIn: number;
  remainingBytes: number;
}> {
  const res = await apiFetch("/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, fileSizeBytes, contentType }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Presign failed (${res.status})`);
  }
  return res.json();
}

export async function completeUpload(key: string): Promise<void> {
  const res = await apiFetch("/uploads/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Complete upload failed (${res.status})`);
  }
}

export async function createPost(post: {
  songName: string;
  bpm: number;
  duration: number;
  trackCount: number;
  s3Key: string;
  description?: string;
  hashtags?: string[];
}): Promise<{ post: FeedPost }> {
  const res = await apiFetch("/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Create post failed (${res.status})`);
  }
  return res.json();
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

// ── Bookmark ──────────────────────────────────────────────────────────

export async function toggleBookmark(postId: string): Promise<{ bookmarked: boolean }> {
  const res = await apiFetch(`/posts/${postId}/bookmark`, { method: "POST" });
  if (!res.ok) throw new Error(`Toggle bookmark failed (${res.status})`);
  return res.json();
}

export async function getBookmarks(cursor?: string, limit = 20): Promise<{ posts: FeedPost[]; nextCursor?: string }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const res = await apiFetch(`/bookmarks?${params}`);
  if (!res.ok) throw new Error(`Get bookmarks failed (${res.status})`);
  return res.json();
}

// ── Post Management ──────────────────────────────────────────────────

export async function deletePost(postId: string): Promise<void> {
  const res = await apiFetch(`/posts/${postId}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Delete failed (${res.status})`);
  }
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

// ── Admin User Management ───────────────────────────────────────────

export interface AdminUser {
  userId: string;
  email?: string;
  username?: string;
  displayName?: string;
  avatarColor?: string;
  avatarUrl?: string;
  isPro?: boolean;
  proUntil?: number;
  createdAt?: number;
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
  apps?: string[];
}

export async function getAdminUsers(
  options: { limit?: number; cursor?: string; search?: string } = {}
): Promise<{ users: AdminUser[]; nextCursor?: string }> {
  const params = new URLSearchParams({ action: "users", limit: String(options.limit ?? 25) });
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.search) params.set("search", options.search);
  const res = await apiFetch(`/admin/analytics?${params}`);
  if (!res.ok) throw new Error(`Admin users failed (${res.status})`);
  return res.json();
}

export async function grantPro(
  targetUserId: string,
  _app: string,
  durationDays: number
): Promise<void> {
  const proUntil = Date.now() + durationDays * 86400000;
  const params = new URLSearchParams({
    action: "set-user-status",
    targetUserId,
    field: "proUntil",
    value: String(proUntil),
  });
  const res = await apiFetch(`/admin/analytics?${params}`);
  if (!res.ok) throw new Error(`Grant pro failed (${res.status})`);
}

export async function revokePro(targetUserId: string): Promise<void> {
  const params = new URLSearchParams({
    action: "set-user-status",
    targetUserId,
    field: "proUntil",
    value: "0",
  });
  const res = await apiFetch(`/admin/analytics?${params}`);
  if (!res.ok) throw new Error(`Revoke pro failed (${res.status})`);
}

export async function getAdminUserDetail(
  targetUserId: string
): Promise<{ user: AdminUser; recentPosts: FeedPost[] }> {
  const params = new URLSearchParams({ action: "user-detail", targetUserId });
  const res = await apiFetch(`/admin/analytics?${params}`);
  if (!res.ok) throw new Error(`User detail failed (${res.status})`);
  return res.json();
}
