import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function NotFound() {
  usePageMeta({ title: '404 — ArchaldStudio', description: 'Page not found.' });

  return (
    <div style={styles.root}>
      <div style={styles.content}>
        <div style={styles.code}>404</div>
        <h1 style={styles.title}>Lost in the loop.</h1>
        <p style={styles.sub}>This page doesn't exist — but your music still does.</p>
        <Link to="/" className="btn-primary" style={{ marginTop: 40, display: 'inline-block' }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  content: {
    padding: '0 24px',
  },
  code: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(5rem, 15vw, 10rem)',
    fontWeight: 400,
    color: 'var(--accent-red)',
    lineHeight: 1,
    marginBottom: 16,
    opacity: 0.8,
    letterSpacing: '-0.04em',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
    fontWeight: 800,
    marginBottom: 12,
  },
  sub: {
    color: 'var(--text-muted)',
    fontSize: '1.05rem',
    fontWeight: 300,
  },
};
