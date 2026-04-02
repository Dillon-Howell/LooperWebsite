/**
 * Auth context — manages Google Sign-In state across the website.
 * Provides signIn, signOut, and current user info.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { socialAuth, getAccessToken, logout as apiLogout, getCurrentUserId } from "../services/api";

const GOOGLE_CLIENT_ID = "1002957418099-uj0c535pn5096raeiq1b8dm8rj04lvns.apps.googleusercontent.com";

interface AuthUser {
  userId: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signInWithEmail: (userId: string, email: string) => void;
  signOut: () => void;
  pendingNewUser: boolean;
  clearPendingNewUser: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithGoogle: () => {},
  signInWithEmail: () => {},
  signOut: () => {},
  pendingNewUser: false,
  clearPendingNewUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (cb?: (notification: { isNotDisplayed: () => boolean }) => void) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
          revoke: (email: string, cb: () => void) => void;
        };
      };
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingNewUser, setPendingNewUser] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = getAccessToken();
    const userId = getCurrentUserId();
    if (token && userId) {
      const email = localStorage.getItem("looper_user_email") || "";
      setUser({ userId, email });
      // Check if we need to redirect to username setup
      if (localStorage.getItem("looper_pending_username_setup")) {
        localStorage.removeItem("looper_pending_username_setup");
        setPendingNewUser(true);
        window.location.href = "/auth/username";
      }
    }
    setLoading(false);
  }, []);

  // Handle Google credential response
  const handleGoogleResponse = useCallback(async (response: { credential: string }) => {
    try {
      const result = await socialAuth("google", response.credential);
      localStorage.setItem("looper_user_email", result.email);
      setUser({ userId: result.userId, email: result.email });
    } catch (err) {
      console.error("Google sign-in failed:", err);
    }
  }, []);

  // Initialize Google Identity Services once the script loads
  useEffect(() => {
    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    };

    // Script might already be loaded
    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    // Wait for script to load
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initGoogle();
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [handleGoogleResponse]);

  const signInWithGoogle = useCallback(() => {
    // Open Google OAuth popup directly on user click to avoid popup blockers.
    // One Tap (google.accounts.id.prompt) is unreliable due to 3rd-party cookie
    // restrictions and prior dismissals, so we skip it.
    const width = 450;
    const height = 550;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(window.location.origin + "/auth/callback")}` +
      `&response_type=id_token` +
      `&scope=email+profile+openid` +
      `&nonce=${Math.random().toString(36).slice(2)}` +
      `&prompt=select_account`;
    window.open(authUrl, "GoogleSignIn", `width=${width},height=${height},left=${left},top=${top}`);
  }, []);

  const signInWithEmail = useCallback((userId: string, email: string) => {
    localStorage.setItem("looper_user_email", email);
    setUser({ userId, email });
  }, []);

  const signOut = useCallback(() => {
    const email = localStorage.getItem("looper_user_email");
    apiLogout();
    localStorage.removeItem("looper_user_email");
    setUser(null);
    // Revoke Google session
    if (email && window.google?.accounts?.id) {
      window.google.accounts.id.revoke(email, () => {});
    }
  }, []);

  const clearPendingNewUser = useCallback(() => setPendingNewUser(false), []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signOut, pendingNewUser, clearPendingNewUser }}>
      {children}
    </AuthContext.Provider>
  );
}
