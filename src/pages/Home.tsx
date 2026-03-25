import { Link } from 'react-router-dom';
import HeroScene from '../components/HeroScene';
import StripeAccent from '../components/StripeAccent';
import ScrollReveal from '../components/ScrollReveal';
import looperIcon from '../assets/looper-icon.png';

const apps = [
  {
    name: 'Looper',
    tagline: 'Layer your sound. Create your music.',
    description: 'A full-featured guitar looper app for iOS and Android. Record multiple tracks, add effects, and build songs layer by layer — all from your phone.',
    path: '/looper',
    color: 'var(--accent-red)',
    features: ['Multi-track recording', 'Effects chain', 'Built-in metronome', 'Drum machine'],
  },
];

export default function Home() {
  return (
    <div style={{ position: 'relative' }}>
      <HeroScene />

      {/* Hero Section */}
      <section style={styles.hero}>
        <div className="container" style={styles.heroContent}>
          <ScrollReveal direction="left" duration={1000}>
            <StripeAccent style={{ marginBottom: 24 }} />
          </ScrollReveal>
          <ScrollReveal direction="up" delay={200} duration={1000}>
            <h1 style={styles.heroTitle}>
              <span style={{ color: 'var(--accent-red)' }}>Archald</span>Studio
            </h1>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={400} duration={1000}>
            <p style={styles.heroSubtitle}>
              Independent software studio crafting tools for creators.
            </p>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={600} duration={1000}>
            <div style={styles.heroCTA}>
              <Link to="/looper" className="btn-primary">
                Explore Our Apps
              </Link>
              <Link to="/support" className="btn-secondary">
                Get in Touch
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* About Section */}
      <section style={styles.section}>
        <div className="container">
          <ScrollReveal direction="left">
            <StripeAccent style={{ marginBottom: 16 }} />
            <h2 style={styles.sectionTitle}>About the Studio</h2>
          </ScrollReveal>
          <div className="about-grid" style={styles.aboutGrid}>
            <div style={styles.aboutText}>
              <ScrollReveal direction="up" delay={100}>
                <p style={styles.paragraph}>
                  ArchaldStudio is an independent software studio founded by Dillon Howell — a professional
                  software engineer, guitarist, motorcycle rider, and proud golden retriever dad based in
                  Denver, Colorado.
                </p>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={200}>
                <p style={styles.paragraph}>
                  Named after Archie, the golden retriever who keeps the studio grounded (and occasionally
                  interrupts coding sessions for belly rubs), ArchaldStudio is built on the belief that the
                  best tools come from people who actually use them.
                </p>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={300}>
                <p style={styles.paragraph}>
                  As a one-person operation, every line of code is written with intention. No committees, no
                  feature bloat — just focused, well-crafted applications designed to solve real problems for
                  real creators.
                </p>
              </ScrollReveal>
            </div>
            <div style={styles.aboutValues}>
              {[
                { label: 'Craft over scale', desc: 'Quality first, always.', color: 'var(--accent-green)' },
                { label: 'Built by a user', desc: 'Every feature solves a real need.', color: 'var(--accent-yellow)' },
                { label: 'Independent', desc: 'No investors, no compromises.', color: 'var(--accent-red)' },
              ].map(({ label, desc, color }, i) => (
                <ScrollReveal key={label} direction="right" delay={i * 150}>
                  <div className="value-card" style={{ ...styles.valueCard, borderLeftColor: color }}>
                    <h3 style={styles.valueLabel}>{label}</h3>
                    <p style={styles.valueDesc}>{desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Apps Section */}
      <section style={{ ...styles.section, background: 'var(--bg-light)' }}>
        <div className="container">
          <ScrollReveal direction="left">
            <StripeAccent style={{ marginBottom: 16 }} />
            <h2 style={styles.sectionTitle}>Our Apps</h2>
          </ScrollReveal>
          <div style={styles.appsGrid}>
            {apps.map((app, i) => (
              <ScrollReveal key={app.name} direction="scale" delay={i * 200}>
                <Link to={app.path} className="card-hover card-glow-red" style={styles.appCard}>
                  <div style={{ ...styles.appCardAccent, background: app.color }} />
                  <div style={styles.appCardContent}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                      <img src={looperIcon} alt="Looper icon" style={{ width: 48, height: 48, borderRadius: 10 }} />
                      <h3 style={{ ...styles.appName, color: app.color, marginBottom: 0 }}>{app.name}</h3>
                    </div>
                    <p style={styles.appTagline}>{app.tagline}</p>
                    <p style={styles.appDescription}>{app.description}</p>
                    <div style={styles.featureList}>
                      {app.features.map(f => (
                        <span key={f} style={styles.featureTag}>{f}</span>
                      ))}
                    </div>
                    <span style={{ ...styles.learnMore, color: app.color }}>
                      Learn more →
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}

            <ScrollReveal direction="scale" delay={200}>
              <div className="card-hover" style={{ ...styles.appCard, opacity: 0.5, cursor: 'default' }}>
                <div style={{ ...styles.appCardAccent, background: 'var(--text-subtle)' }} />
                <div style={styles.appCardContent}>
                  <h3 style={{ ...styles.appName, color: 'var(--text-subtle)' }}>More Coming Soon</h3>
                  <p style={styles.appTagline}>We're always building.</p>
                  <p style={styles.appDescription}>
                    New apps and tools are in the works. Stay tuned for what's next from ArchaldStudio.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: {
    position: 'relative',
    zIndex: 1,
    minHeight: '90vh',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
    maxWidth: 600,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
    color: 'var(--text-muted)',
    marginBottom: 40,
    maxWidth: 450,
    fontWeight: 300,
    letterSpacing: '0.01em',
  },
  heroCTA: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  section: {
    padding: '100px 0',
    position: 'relative' as const,
    zIndex: 1,
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
    fontWeight: 800,
    marginBottom: 48,
    letterSpacing: '-0.02em',
  },
  aboutGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 64,
    alignItems: 'start',
  },
  aboutText: {},
  paragraph: {
    color: 'var(--text-muted)',
    fontSize: '1.05rem',
    lineHeight: 1.8,
    marginBottom: 20,
    fontWeight: 300,
  },
  aboutValues: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  valueCard: {
    padding: 24,
    background: 'var(--bg-light)',
    borderRadius: 12,
    borderLeft: '3px solid var(--accent-green)',
  },
  valueLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: 4,
  },
  valueDesc: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    fontWeight: 300,
  },
  appsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 32,
  },
  appCard: {
    background: 'var(--surface)',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid var(--border)',
    display: 'block',
  },
  appCardAccent: {
    height: 4,
    width: '100%',
  },
  appCardContent: {
    padding: 32,
  },
  appName: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    fontWeight: 800,
    marginBottom: 8,
  },
  appTagline: {
    fontSize: '1rem',
    color: 'var(--text)',
    fontWeight: 500,
    marginBottom: 12,
  },
  appDescription: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    lineHeight: 1.7,
    marginBottom: 20,
    fontWeight: 300,
  },
  featureList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 20,
  },
  featureTag: {
    padding: '4px 12px',
    background: 'var(--bg)',
    borderRadius: 20,
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    fontWeight: 400,
  },
  learnMore: {
    fontSize: '0.9rem',
    fontWeight: 600,
  },
};
