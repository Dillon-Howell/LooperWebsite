import { Link } from 'react-router-dom';
import StripeAccent from '../components/StripeAccent';
import ScrollReveal from '../components/ScrollReveal';
import looperIcon from '../assets/looper-icon.png';

const features = [
  {
    title: 'Multi-Track Recording',
    description: 'Record up to 8 independent audio layers. Build complex arrangements one track at a time with intuitive controls.',
    icon: '🎵',
    glow: 'card-glow-red',
  },
  {
    title: 'Effects Chain',
    description: 'Shape your sound with reverb, delay, distortion, EQ, and chorus. Each effect fully customizable with real-time preview.',
    icon: '🎛️',
    glow: 'card-glow-green',
  },
  {
    title: 'Built-in Metronome',
    description: 'Stay in time with a fully configurable metronome. Adjust BPM, time signature, and accent patterns to match your groove.',
    icon: '⏱️',
    glow: 'card-glow-yellow',
  },
  {
    title: 'Drum Machine',
    description: 'Create 16-step drum patterns to back your loops. Layer percussion without needing external tools.',
    icon: '🥁',
    glow: 'card-glow-red',
  },
  {
    title: 'Track Controls',
    description: 'Individual volume, pan, loop mode, and reverse playback for each track. Full control over your mix.',
    icon: '🎚️',
    glow: 'card-glow-green',
  },
  {
    title: 'Song Library',
    description: 'Save and organize your sessions. Pick up where you left off with auto-save and session management.',
    icon: '📚',
    glow: 'card-glow-yellow',
  },
];

export default function LooperPage() {
  return (
    <div>
      {/* Hero */}
      <section style={styles.hero}>
        <div className="container" style={{ display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' as const }}>
          <ScrollReveal direction="scale" duration={800}>
            <img
              src={looperIcon}
              alt="Looper app icon"
              style={styles.appIcon}
            />
          </ScrollReveal>
          <div>
            <ScrollReveal direction="left" duration={800}>
              <StripeAccent style={{ marginBottom: 16 }} />
            </ScrollReveal>
            <ScrollReveal direction="up" delay={150} duration={800}>
              <h1 style={styles.title}>
                <span style={{ color: 'var(--accent-red)' }}>Looper</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={300} duration={800}>
              <p style={styles.tagline}>
                Layer your sound. Create your music.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={450} duration={800}>
              <p style={styles.description}>
                Looper is a professional-grade guitar looping app for iOS and Android. Record, layer,
                and sculpt multi-track arrangements — all from your phone. Whether you're jamming alone
                or building full compositions, Looper gives you the tools to capture every idea.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={600} duration={800}>
              <div style={styles.badges}>
                <span style={styles.badge}>iOS</span>
                <span style={styles.badge}>Android</span>
                <span style={styles.badge}>Free to Start</span>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={styles.section}>
        <div className="container">
          <ScrollReveal direction="left">
            <StripeAccent style={{ marginBottom: 16 }} />
            <h2 style={styles.sectionTitle}>Features</h2>
          </ScrollReveal>
          <div style={styles.featuresGrid}>
            {features.map((f, i) => (
              <ScrollReveal key={f.title} direction="up" delay={i * 100}>
                <div className={`card-hover ${f.glow}`} style={styles.featureCard}>
                  <span style={styles.featureIcon}>{f.icon}</span>
                  <h3 style={styles.featureTitle}>{f.title}</h3>
                  <p style={styles.featureDesc}>{f.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ ...styles.section, background: 'var(--bg-light)' }}>
        <div className="container">
          <ScrollReveal direction="left">
            <StripeAccent style={{ marginBottom: 16 }} />
            <h2 style={styles.sectionTitle}>How It Works</h2>
          </ScrollReveal>
          <div style={styles.steps}>
            {[
              { step: '01', title: 'Record', desc: 'Tap record and play your first layer. Looper captures high-quality audio directly from your microphone.' },
              { step: '02', title: 'Layer', desc: 'Add more tracks on top. Each layer plays in sync, building your arrangement piece by piece.' },
              { step: '03', title: 'Shape', desc: 'Apply effects, adjust volume and panning, toggle loop modes — fine-tune every detail of your mix.' },
              { step: '04', title: 'Save', desc: 'Save your session to your library. Come back anytime to continue building or share your creation.' },
            ].map((s, i) => (
              <ScrollReveal key={s.step} direction="up" delay={i * 150}>
                <div style={styles.stepCard}>
                  <span style={styles.stepNumber}>{s.step}</span>
                  <h3 style={styles.stepTitle}>{s.title}</h3>
                  <p style={styles.stepDesc}>{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <div className="container" style={{ textAlign: 'center' as const }}>
          <ScrollReveal direction="scale">
            <h2 style={{ ...styles.sectionTitle, marginBottom: 16 }}>Ready to loop?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '1.05rem', fontWeight: 300 }}>
              Available on iOS and Android. Download Looper and start creating today.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <Link to="/support" className="btn-primary">
                Get Support
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  hero: {
    padding: '120px 0 80px',
    background: `linear-gradient(180deg, var(--bg-light) 0%, var(--bg) 100%)`,
  },
  appIcon: {
    width: 160,
    height: 160,
    borderRadius: 32,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(3rem, 8vw, 5rem)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    marginBottom: 16,
  },
  tagline: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 24,
  },
  description: {
    fontSize: '1.05rem',
    color: 'var(--text-muted)',
    lineHeight: 1.8,
    maxWidth: 640,
    marginBottom: 32,
    fontWeight: 300,
  },
  badges: {
    display: 'flex',
    gap: 12,
  },
  badge: {
    padding: '6px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--text-muted)',
    transition: 'border-color 0.2s',
  },
  section: {
    padding: '100px 0',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
    fontWeight: 800,
    marginBottom: 48,
    letterSpacing: '-0.02em',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 24,
  },
  featureCard: {
    padding: 32,
    background: 'var(--bg-light)',
    borderRadius: 16,
    border: '1px solid var(--border)',
    height: '100%',
  },
  featureIcon: {
    fontSize: '2rem',
    display: 'block',
    marginBottom: 16,
  },
  featureTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.15rem',
    fontWeight: 700,
    marginBottom: 8,
  },
  featureDesc: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    lineHeight: 1.7,
    fontWeight: 300,
  },
  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 32,
  },
  stepCard: {
    padding: 24,
  },
  stepNumber: {
    fontSize: '2.5rem',
    fontWeight: 900,
    background: 'linear-gradient(135deg, var(--accent-red), var(--accent-yellow))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'block',
    marginBottom: 12,
    fontFamily: 'var(--font-mono)',
  },
  stepTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: 8,
  },
  stepDesc: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    lineHeight: 1.7,
    fontWeight: 300,
  },
  cta: {
    padding: '100px 0',
    borderTop: '1px solid var(--border)',
  },
};
