import { Link } from 'react-router-dom';
import StripeAccent from '../components/StripeAccent';
import ScrollReveal from '../components/ScrollReveal';
import looperIcon from '../assets/looper-icon.png';
import { usePageMeta } from '../hooks/usePageMeta';

const features = [
  {
    title: 'Multi-Track Looping',
    description: 'Stack unlimited layers in perfect sync. Record rhythm, melody, bass, vocals — each on its own track. Auto Looper detects your tempo, trims silence, and snaps everything to the beat.',
    icon: '🎵',
    glow: 'card-glow-red',
  },
  {
    title: 'Pro Effects Engine',
    description: 'Per-track effects chain: EQ, Drive, Reverb, Delay, Chorus, Lo-Fi, and Stutter. Shape each layer independently and hear changes in real time.',
    icon: '🎛️',
    glow: 'card-glow-green',
  },
  {
    title: 'Smart Metronome & Tools',
    description: 'Count-in, Auto BPM detection, practice mode with speed ramp, and time signature control. The metronome adapts to how you play.',
    icon: '⏱️',
    glow: 'card-glow-yellow',
  },
  {
    title: 'Drum Machine',
    description: '16-step sequencer with kick, snare, hi-hat, and percussion. Build beats from scratch to back your loops — no external gear needed.',
    icon: '🥁',
    glow: 'card-glow-red',
  },
  {
    title: 'Track Editor',
    description: 'Trim, reverse, pitch-shift, speed-change, merge, duplicate, and loop every track. Fade in/out, timeline offsets, and visual waveforms give you studio-level control.',
    icon: '🎚️',
    glow: 'card-glow-green',
  },
  {
    title: 'Share & Discover',
    description: 'Post your loops to the community feed. Like, comment, repost, and remix other creators. Follow musicians and build your audience — all inside the app.',
    icon: '🌐',
    glow: 'card-glow-yellow',
  },
  {
    title: 'Cloud Backup',
    description: 'Save your songs to the cloud with 1 GB of storage. Access your projects from anywhere and never lose a session.',
    icon: '☁️',
    glow: 'card-glow-red',
  },
  {
    title: 'Export Anywhere',
    description: 'Export as WAV, MP3, or shareable .looper project files. Send your music to a DAW, share with bandmates, or post directly to the feed.',
    icon: '📤',
    glow: 'card-glow-green',
  },
];

export default function LooperPage() {
  usePageMeta({
    title: 'Looper Studio — ArchaldStudio',
    description: 'Looper Studio is a professional multi-track looper for musicians. Record layers, add effects, share with the community, and build full songs — all from your phone.',
  });
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
                Layer your sound. Share your music.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={450} duration={800}>
              <p style={styles.description}>
                A multi-track looper built for real musicians. Record layers, stack effects,
                and build full arrangements — right from your phone. Auto Looper handles
                tempo detection and beat-snapping so you stay in the pocket. Share your loops
                with a built-in community of creators, or export to your DAW.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={600} duration={800}>
              <div style={styles.badges}>
                <a
                  href="https://apps.apple.com/app/looper-studio/id6742196498"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...styles.badge, ...styles.badgeLink }}
                >
                  App Store
                </a>
                <span style={styles.badge}>Google Play (Coming Soon)</span>
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
              { step: '01', title: 'Plug In & Record', desc: 'Connect your guitar, mic, or keyboard. Tap record with a count-in and Auto Looper handles the rest — tempo, trimming, and loop points.' },
              { step: '02', title: 'Stack Layers', desc: 'Add rhythm, melody, bass, vocals — each on its own track. Everything stays locked in sync. Merge tracks together or duplicate to experiment.' },
              { step: '03', title: 'Shape Your Sound', desc: 'Add drive, reverb, delay, chorus, and more to each track. Trim, reverse, pitch-shift, and fine-tune the mix until it feels right.' },
              { step: '04', title: 'Share or Export', desc: 'Post to the Looper community feed, export as WAV or MP3, or save a .looper project to pick up later on any device.' },
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
              Free to download. Start recording loops in under a minute.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <a
                href="https://apps.apple.com/app/looper-studio/id6742196498"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Download on the App Store
              </a>
              <Link to="/looper/community" className="btn-secondary">
                Browse the Community
              </Link>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Link to="/looper/help" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Help & FAQ
              </Link>
              <Link to="/support" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Support
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
    color: 'var(--text)',
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
    textDecoration: 'none',
  },
  badgeLink: {
    borderColor: 'var(--accent-red)',
    color: 'var(--accent-red)',
    cursor: 'pointer',
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
    color: 'var(--text)',
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
    color: 'var(--text)',
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
    color: 'var(--text)',
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
