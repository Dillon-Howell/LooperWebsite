import { useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import looperIcon from '../assets/looper-icon.png';
import StripeAccent from '../components/StripeAccent';
import { usePageMeta } from '../hooks/usePageMeta';

// App Store URL — update with your real App Store listing
const APP_STORE_URL = 'https://apps.apple.com/app/looper-studio/id6742196498';
const CUSTOM_SCHEME = 'looperstudio://';

export default function DeepLink() {
  const { postId, userId } = useParams<{ postId?: string; userId?: string }>();
  const location = useLocation();
  const [attempted, setAttempted] = useState(false);

  const isPost = location.pathname.startsWith('/looper/post/');
  const isProfile = location.pathname.startsWith('/looper/user/');
  const id = postId || userId;

  usePageMeta({
    title: isPost ? 'Listen on Looper Studio' : isProfile ? 'View Profile on Looper Studio' : 'Open in Looper Studio',
    description: 'Looper Studio — Layer your sound. Create your music.',
  });

  // Try to open the app via custom scheme
  useEffect(() => {
    if (!id || attempted) return;

    const deepLink = isPost
      ? `${CUSTOM_SCHEME}post/${id}`
      : `${CUSTOM_SCHEME}user/${id}`;

    // Try opening the app
    const start = Date.now();
    window.location.href = deepLink;

    // If still here after 1.5s, app probably isn't installed
    const timer = setTimeout(() => {
      if (Date.now() - start >= 1400) {
        setAttempted(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [id, isPost, attempted]);

  const handleOpenApp = () => {
    const deepLink = isPost
      ? `${CUSTOM_SCHEME}post/${id}`
      : `${CUSTOM_SCHEME}user/${id}`;
    window.location.href = deepLink;
  };

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        {/* Glow background */}
        <div style={styles.glow} />

        {/* App icon */}
        <div style={styles.iconWrap}>
          <img src={looperIcon} alt="Looper Studio" style={styles.icon} />
        </div>

        <StripeAccent style={{ marginBottom: 20, width: 60 }} />

        {/* Content */}
        <h1 style={styles.title}>
          {isPost ? 'Listen on ' : isProfile ? 'View Profile on ' : 'Open in '}
          <span style={{ color: 'var(--accent-red)' }}>Looper Studio</span>
        </h1>

        <p style={styles.subtitle}>
          {isPost
            ? 'Someone shared a song with you. Open it in the app to listen, like, and remix.'
            : isProfile
            ? 'Check out this creator on Looper Studio. Follow them and discover their music.'
            : 'Open this link in the Looper Studio app.'}
        </p>

        {/* Buttons */}
        <div style={styles.buttons}>
          {isPost && postId && (
            <a href={`/looper/post/${postId}`} className="btn-primary" style={styles.openBtn}>
              View on Web
            </a>
          )}
          {isProfile && userId && (
            <a href={`/looper/user/${userId}`} className="btn-primary" style={styles.openBtn}>
              View on Web
            </a>
          )}
          <button onClick={handleOpenApp} className="btn-secondary" style={styles.openBtn}>
            Open in App
          </button>
          <a href={APP_STORE_URL} style={styles.downloadBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8, flexShrink: 0 }}>
              <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.82 9.28 4.8C10.56 4.77 11.78 5.68 12.57 5.68C13.36 5.68 14.85 4.58 16.4 4.74C17.06 4.77 18.89 5.02 20.09 6.7C20 6.76 17.93 7.97 17.96 10.51C18 13.54 20.58 14.52 20.61 14.53C20.58 14.61 20.17 16.01 19.2 17.43L18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.09 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" fill="currentColor"/>
            </svg>
            Download on App Store
          </a>
        </div>

        {/* Feature pills */}
        <div style={styles.features}>
          {['Multi-Track Recording', 'Live Effects', 'Social Feed', 'Remix & Share'].map((f) => (
            <span key={f} style={styles.pill}>{f}</span>
          ))}
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div style={styles.bottomSection}>
        <p style={styles.bottomText}>
          Looper Studio is a professional-grade loop station for iOS.
          <br />
          Record, layer, and share your music with the world.
        </p>
        <a href="/looper" style={styles.learnMore}>
          Learn more about Looper Studio &rarr;
        </a>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px 80px',
  },
  card: {
    position: 'relative',
    maxWidth: 480,
    width: '100%',
    textAlign: 'center',
    padding: '48px 32px',
    borderRadius: 20,
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-light)',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -80,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 300,
    height: 300,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(217, 72, 67, 0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  iconWrap: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: 24,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 20,
    boxShadow: '0 8px 32px rgba(217, 72, 67, 0.2), 0 2px 8px rgba(0,0,0,0.3)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.4rem, 4vw, 1.8rem)',
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: 12,
    position: 'relative',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '1rem',
    fontWeight: 300,
    lineHeight: 1.6,
    marginBottom: 32,
    position: 'relative',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    position: 'relative',
  },
  openBtn: {
    display: 'block',
    width: '100%',
    padding: '14px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '14px 24px',
    fontSize: '0.95rem',
    fontWeight: 500,
    color: 'var(--text)',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
  },
  features: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    position: 'relative',
  },
  pill: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--text-muted)',
    padding: '4px 12px',
    borderRadius: 100,
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
    letterSpacing: '0.02em',
  },
  bottomSection: {
    textAlign: 'center',
    marginTop: 48,
    maxWidth: 480,
  },
  bottomText: {
    color: 'var(--text-subtle)',
    fontSize: '0.9rem',
    fontWeight: 300,
    lineHeight: 1.7,
  },
  learnMore: {
    display: 'inline-block',
    marginTop: 16,
    color: 'var(--accent-red)',
    fontSize: '0.9rem',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'opacity 0.2s ease',
  },
};
