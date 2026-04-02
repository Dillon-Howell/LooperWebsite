/**
 * OAuth callback page — handles the redirect from Google OAuth.
 *
 * Two flows:
 * 1. Web popup flow: extracts id_token, calls socialAuth, posts result to opener.
 * 2. App redirect flow: extracts id_token, calls socialAuth, generates an auth
 *    code via POST /auth/code, then redirects to the app's redirect_uri with
 *    the code (e.g. looper://auth/callback?code=XYZ).
 */

import { useEffect, useState } from "react";
import { socialAuth, generateAuthCode } from "../services/api";

export default function AuthCallback() {
  const [status, setStatus] = useState("Signing in...");

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get("id_token");

    if (!idToken) {
      if (window.opener) window.close();
      else window.location.href = "/";
      return;
    }

    // Check if this is an app redirect flow
    const appRedirectUri = sessionStorage.getItem("looper_app_redirect_uri");
    const client = appRedirectUri ? "app" : "web";

    socialAuth("google", idToken, undefined, client)
      .then(async (result) => {
        if (appRedirectUri) {
          // App flow: generate a short-lived code and redirect to the app
          sessionStorage.removeItem("looper_app_redirect_uri");
          setStatus("Redirecting to app...");
          try {
            const code = await generateAuthCode();
            const separator = appRedirectUri.includes("?") ? "&" : "?";
            window.location.href = `${appRedirectUri}${separator}code=${encodeURIComponent(code)}`;
          } catch (err) {
            console.error("Auth code generation failed:", err);
            setStatus("Failed to redirect to app. Please try again.");
          }
        } else if (window.opener) {
          // Web popup flow
          window.opener.postMessage(
            { type: "LOOPER_AUTH_SUCCESS", isNewUser: result.isNewUser },
            window.location.origin
          );
          window.close();
        } else {
          // Opened in same window (not popup, not app) — redirect
          window.location.href = result.isNewUser ? "/auth/username" : "/looper/community";
        }
      })
      .catch((err) => {
        console.error("Auth callback failed:", err);
        setStatus("Sign in failed. Please close this window and try again.");
        if (window.opener) {
          window.opener.postMessage({ type: "LOOPER_AUTH_FAILED" }, window.location.origin);
        }
      });
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <p style={{ color: "var(--text-muted)" }}>{status}</p>
    </div>
  );
}
