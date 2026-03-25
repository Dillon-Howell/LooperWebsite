import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <div className="stripe-bar">
        <div className="red" />
        <div className="green" />
        <div className="yellow" />
      </div>
      <div className="container" style={styles.inner}>
        <div style={styles.left}>
          <p style={styles.brand}>
            <span style={{ color: 'var(--accent-red)', fontWeight: 800 }}>Archald</span>Studio
          </p>
          <p style={styles.copyright}>
            &copy; {year} ArchaldStudio. All rights reserved.
          </p>
        </div>
        <div style={styles.links}>
          <Link to="/privacy" style={styles.link}>Privacy Policy</Link>
          <Link to="/terms" style={styles.link}>Terms of Service</Link>
          <Link to="/support" style={styles.link}>Support</Link>
        </div>
        <div style={styles.contact}>
          <a href="mailto:support@archaldstudio.com" style={styles.link}>
            support@archaldstudio.com
          </a>
        </div>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    background: 'var(--bg-light)',
    borderTop: '1px solid var(--border)',
    marginTop: 'auto',
  },
  inner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '32px 24px',
    flexWrap: 'wrap',
    gap: 24,
  },
  left: {},
  brand: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 700,
    marginBottom: 4,
  },
  copyright: {
    fontSize: '0.8rem',
    color: 'var(--text-subtle)',
  },
  links: {
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap' as const,
  },
  link: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    transition: 'color 0.25s ease',
    fontWeight: 400,
  },
  contact: {
    fontSize: '0.85rem',
  },
};
