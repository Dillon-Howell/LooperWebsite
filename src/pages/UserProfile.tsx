/**
 * User profile page — view user info and their posts.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import PostCard from "../components/PostCard";
import StripeAccent from "../components/StripeAccent";
import { usePageMeta } from "../hooks/usePageMeta";
import { useAuth } from "../contexts/AuthContext";
import type { PublicUserProfile as UserProfileType, FeedPost } from "../services/api";
import {
  getUserProfile, getUserPosts, toggleFollow, isLoggedIn, updateMyProfile,
  presignUpload, completeUpload, createPost,
} from "../services/api";

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: authUser } = useAuth();
  const isOwnProfile = authUser?.userId === userId;
  const [user, setUser] = useState<UserProfileType | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Post upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postSongName, setPostSongName] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postHashtags, setPostHashtags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const startEditing = useCallback(() => {
    if (!user) return;
    setEditDisplayName(user.displayName || "");
    setEditBio(user.bio || "");
    setEditError(null);
    setEditing(true);
  }, [user]);

  const saveProfile = useCallback(async () => {
    setSaving(true);
    setEditError(null);
    try {
      await updateMyProfile({
        displayName: editDisplayName.trim(),
        bio: editBio.trim(),
      });
      // Refresh profile data
      if (userId) {
        const refreshed = await getUserProfile(userId);
        setUser(refreshed);
      }
      setEditing(false);
    } catch (err: any) {
      setEditError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [editDisplayName, editBio, userId]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".looper")) {
      setUploadError("Only .looper files are supported");
      return;
    }
    setSelectedFile(file);
    setPostSongName(file.name.replace(/\.looper$/, ""));
    setUploadError(null);
    setShowPostForm(true);
  }, []);

  const handlePost = useCallback(async () => {
    if (!selectedFile || !postSongName.trim()) return;
    setUploading(true);
    setUploadError(null);
    try {
      // 1. Get presigned URL
      setUploadProgress("Preparing upload...");
      const presign = await presignUpload(selectedFile.name, selectedFile.size);

      // 2. Upload file to S3
      setUploadProgress("Uploading...");
      const uploadRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: selectedFile,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      // 3. Complete upload (record quota)
      setUploadProgress("Finalizing upload...");
      await completeUpload(presign.key);

      // 4. Create post
      setUploadProgress("Creating post...");
      // Parse hashtags
      const tags = postHashtags
        .split(/[,\s#]+/)
        .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""))
        .filter((t) => t.length > 0)
        .slice(0, 10);

      await createPost({
        songName: postSongName.trim(),
        bpm: 120,
        duration: 0,
        trackCount: 1,
        s3Key: presign.key,
        description: postDescription.trim() || undefined,
        hashtags: tags.length > 0 ? tags : undefined,
      });

      // 5. Refresh posts
      if (userId) {
        const postsData = await getUserPosts(userId);
        setPosts(postsData.posts);
      }

      // Reset form
      setShowPostForm(false);
      setSelectedFile(null);
      setPostSongName("");
      setPostDescription("");
      setPostHashtags("");
      setUploadProgress("");
    } catch (err: any) {
      setUploadError(err.message || "Failed to post");
    } finally {
      setUploading(false);
    }
  }, [selectedFile, postSongName, postDescription, userId]);

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
          {editing ? (
            <div style={{ textAlign: "left" as const, marginBottom: 16 }}>
              <label style={styles.editLabel}>Display Name</label>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                maxLength={50}
                style={styles.editInput}
              />
              <label style={{ ...styles.editLabel, marginTop: 12 }}>Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={150}
                rows={3}
                placeholder="Tell people about yourself..."
                style={{ ...styles.editInput, resize: "vertical" as const }}
              />
              <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)", textAlign: "right" as const }}>{editBio.length}/150</div>
              {editError && <p style={{ color: "var(--accent-red)", fontSize: "0.82rem", margin: "8px 0 0" }}>{editError}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
                <button onClick={saveProfile} disabled={saving} style={styles.saveBtn}>
                  {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setEditing(false)} style={styles.cancelBtn}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div style={styles.nameRow}>
                <h1 style={styles.displayName}>
                  {user.displayName}
                  {user.isPro && <span style={styles.proBadge}>PRO</span>}
                </h1>
                <span style={styles.username}>@{user.username}</span>
              </div>
              {user.bio && <p style={styles.bio}>{user.bio}</p>}
            </>
          )}

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

          {/* Action buttons */}
          {isOwnProfile ? (
            !editing && (
              <button onClick={startEditing} style={styles.editBtn}>
                Edit Profile
              </button>
            )
          ) : (
            isLoggedIn() && (
              <button
                onClick={handleFollow}
                style={{
                  ...styles.followBtn,
                  ...(isFollowing ? styles.followBtnFollowing : {}),
                }}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )
          )}
        </div>

        {/* Posts */}
        <div style={styles.postsSection}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ ...styles.postsTitle, marginBottom: 0 }}>
              <StripeAccent style={{ width: 40, marginRight: 8 }} />
              Posts ({posts.length})
            </h3>
            {isOwnProfile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={styles.postBtn}
              >
                + Post
              </button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".looper"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          {/* Post form */}
          {showPostForm && (
            <div style={styles.postForm}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={styles.fileIcon}>♫</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text)" }}>{selectedFile?.name}</span>
              </div>
              <label style={styles.editLabel}>Song Name</label>
              <input
                type="text"
                value={postSongName}
                onChange={(e) => setPostSongName(e.target.value)}
                maxLength={200}
                style={styles.editInput}
              />
              <label style={{ ...styles.editLabel, marginTop: 12 }}>Description (optional)</label>
              <textarea
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Say something about your loop..."
                style={{ ...styles.editInput, resize: "vertical" as const }}
              />
              <label style={{ ...styles.editLabel, marginTop: 12 }}>Hashtags (optional)</label>
              <input
                type="text"
                value={postHashtags}
                onChange={(e) => setPostHashtags(e.target.value)}
                placeholder="lofi, chill, guitar (comma separated)"
                style={styles.editInput}
              />
              <p style={{ fontSize: "0.7rem", color: "var(--text-subtle)", margin: "4px 0 0" }}>Up to 10 tags, comma or space separated</p>
              {uploadError && <p style={{ color: "var(--accent-red)", fontSize: "0.82rem", margin: "8px 0 0" }}>{uploadError}</p>}
              {uploadProgress && <p style={{ color: "var(--text-subtle)", fontSize: "0.82rem", margin: "8px 0 0" }}>{uploadProgress}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={handlePost} disabled={uploading || !postSongName.trim()} style={styles.saveBtn}>
                  {uploading ? "Posting..." : "Post"}
                </button>
                <button onClick={() => { setShowPostForm(false); setSelectedFile(null); }} style={styles.cancelBtn}>
                  Cancel
                </button>
              </div>
            </div>
          )}

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
  postBtn: {
    padding: "8px 18px", borderRadius: 8, border: "none",
    backgroundColor: "var(--accent-red)", color: "#fff", fontWeight: 600,
    fontSize: "0.82rem", cursor: "pointer", fontFamily: "var(--font-body)",
    transition: "opacity 0.2s",
  },
  postForm: {
    backgroundColor: "var(--bg-light)", border: "1px solid var(--border)",
    borderRadius: 12, padding: 20, marginBottom: 20,
  },
  fileIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: "var(--accent-red)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1rem", fontWeight: 700, flexShrink: 0,
  },
  postsList: {},
  noPosts: {
    color: "var(--text-subtle)", fontSize: "0.9rem",
    textAlign: "center" as const, padding: "32px 0",
  },
  editBtn: {
    marginTop: 20, padding: "10px 32px", borderRadius: 10,
    border: "1px solid var(--border)", backgroundColor: "transparent",
    color: "var(--text)", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
    transition: "all 0.2s ease", fontFamily: "var(--font-body)",
  },
  editLabel: {
    display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-subtle)",
    marginBottom: 4, textAlign: "left" as const,
  },
  editInput: {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: "1px solid var(--border)", backgroundColor: "var(--surface)",
    color: "var(--text)", fontSize: "0.88rem", fontFamily: "var(--font-body)",
    outline: "none", boxSizing: "border-box" as const,
  },
  saveBtn: {
    padding: "8px 24px", borderRadius: 8, border: "none",
    backgroundColor: "var(--accent-red)", color: "#fff", fontWeight: 600,
    fontSize: "0.85rem", cursor: "pointer", fontFamily: "var(--font-body)",
  },
  cancelBtn: {
    padding: "8px 24px", borderRadius: 8, border: "1px solid var(--border)",
    backgroundColor: "transparent", color: "var(--text-subtle)", fontWeight: 600,
    fontSize: "0.85rem", cursor: "pointer", fontFamily: "var(--font-body)",
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
