import StripeAccent from '../components/StripeAccent';
import ScrollReveal from '../components/ScrollReveal';
import { usePageMeta } from '../hooks/usePageMeta';
import { Link } from 'react-router-dom';

const faqs = [
  {
    q: 'How do I record my first loop?',
    a: 'Tap the record button to start recording. When you\'re done, tap stop. Your loop will play back automatically. Tap record again to add another layer on top.',
  },
  {
    q: 'How do I add more tracks?',
    a: 'While your loop is playing, tap the record button to layer a new track on top. Free users can record up to 4 tracks. Pro users get unlimited tracks.',
  },
  {
    q: 'What is the metronome count-in?',
    a: 'The count-in gives you a few beats before recording starts so you can get in time. You can configure the count-in length in Settings.',
  },
  {
    q: 'How do I use effects?',
    a: 'Tap on a track to open the track editor, then tap "Effects" to access EQ, Drive, Chorus, Delay, and Reverb. Effects are a Pro feature.',
  },
  {
    q: 'How do I export my song?',
    a: 'Go to your Library, tap the share icon on any song, and choose MP3 or WAV export. You can also export as a .looper project file to share editable projects with other Looper users.',
  },
  {
    q: 'What is Cloud Storage?',
    a: 'Cloud Storage lets you back up your songs to the cloud with 1 GB of storage. Upload from your Library and download on any device signed into your account. Cloud is a Pro feature.',
  },
  {
    q: 'How do I share my music?',
    a: 'From the Library, tap the share icon to post your song to the Discover feed. Other users can listen, like, comment, and even remix your loops.',
  },
  {
    q: 'What does Pro include?',
    a: 'Pro unlocks unlimited tracks, the effects engine (EQ, Drive, Chorus, Delay, Reverb), drum machine, cloud storage, chromatic tuner, custom themes, ad-free experience, and WAV/project export.',
  },
  {
    q: 'How do I restore my subscription?',
    a: 'Go to Settings > Subscription and tap "Restore Purchases." Make sure you\'re signed in with the same Apple ID or Google account you used to subscribe.',
  },
  {
    q: 'Can I use Looper with an external audio interface?',
    a: 'Yes! Looper supports external audio interfaces. Go to Settings > Audio I/O to select your input and output devices.',
  },
  {
    q: 'How do I tune my instrument?',
    a: 'Open the tuner from the toolbar. It uses your device microphone (or connected audio interface) to detect pitch. The tuner is a Pro feature.',
  },
  {
    q: 'What is a .looper file?',
    a: 'A .looper file is a project bundle containing all your tracks, effects settings, and song metadata. Share it with other Looper users so they can open and remix your project.',
  },
];

export default function Help() {
  usePageMeta({
    title: 'Help — ArchaldStudio',
    description: 'Guides, tips, and answers to common questions about Looper Studio.',
  });

  return (
    <div style={styles.page}>
      <div className="container" style={styles.content}>
        <ScrollReveal direction="left" duration={800}>
          <StripeAccent style={{ marginBottom: 16 }} />
        </ScrollReveal>
        <ScrollReveal direction="up" delay={150} duration={800}>
          <h1 style={styles.title}>Help & FAQ</h1>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={300} duration={800}>
          <p style={styles.subtitle}>
            Everything you need to know about Looper Studio. Can't find what you're looking for?{' '}
            <Link to="/support" style={{ color: 'var(--accent-red)' }}>Contact us</Link>.
          </p>
        </ScrollReveal>

        {/* Getting Started */}
        <ScrollReveal direction="up" delay={400} duration={800}>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Getting Started</h2>
            <p style={styles.sectionDesc}>
              Looper Studio is a multi-track loop recorder. Record a base layer, then keep adding
              tracks on top to build full arrangements — all from your phone.
            </p>
            <div style={styles.steps}>
              <div style={styles.step}>
                <span style={styles.stepNum}>1</span>
                <div>
                  <h4 style={styles.stepTitle}>Record</h4>
                  <p style={styles.stepDesc}>Tap the record button and play your first loop.</p>
                </div>
              </div>
              <div style={styles.step}>
                <span style={styles.stepNum}>2</span>
                <div>
                  <h4 style={styles.stepTitle}>Layer</h4>
                  <p style={styles.stepDesc}>Add more tracks to build your arrangement.</p>
                </div>
              </div>
              <div style={styles.step}>
                <span style={styles.stepNum}>3</span>
                <div>
                  <h4 style={styles.stepTitle}>Share</h4>
                  <p style={styles.stepDesc}>Export or post to the Discover feed for others to hear.</p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* FAQ */}
        <section style={styles.section}>
          <ScrollReveal direction="up" delay={200} duration={800}>
            <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
          </ScrollReveal>
          <div style={styles.faqList}>
            {faqs.map((faq, i) => (
              <ScrollReveal key={i} direction="up" delay={100 + i * 50} duration={600}>
                <div className="card-hover" style={styles.faqCard}>
                  <h3 style={styles.faqQ}>{faq.q}</h3>
                  <p style={styles.faqA}>{faq.a}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Still need help? */}
        <ScrollReveal direction="up" delay={200} duration={800}>
          <div style={styles.ctaSection}>
            <h3 style={styles.ctaTitle}>Still need help?</h3>
            <p style={styles.ctaDesc}>
              Our support team typically responds within 24-48 hours.
            </p>
            <Link to="/support" className="btn-primary" style={styles.ctaBtn}>
              Contact Support
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '120px 0 80px',
  },
  content: {
    maxWidth: 800,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 800,
    marginBottom: 8,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '1.05rem',
    lineHeight: 1.7,
    maxWidth: 600,
    marginBottom: 48,
    fontWeight: 300,
  },
  section: {
    marginBottom: 56,
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: 16,
    letterSpacing: '-0.01em',
  },
  sectionDesc: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    lineHeight: 1.7,
    marginBottom: 32,
    fontWeight: 300,
  },
  steps: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    background: 'var(--bg-light)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '20px 24px',
  },
  stepNum: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--accent-red)',
    color: '#fff',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '0.9rem',
    flexShrink: 0,
  },
  stepTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '1rem',
    marginBottom: 4,
  },
  stepDesc: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    fontWeight: 300,
    lineHeight: 1.5,
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  faqCard: {
    background: 'var(--bg-light)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '20px 24px',
  },
  faqQ: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 700,
    marginBottom: 8,
  },
  faqA: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    lineHeight: 1.7,
    fontWeight: 300,
  },
  ctaSection: {
    textAlign: 'center' as const,
    background: 'var(--bg-light)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '48px 32px',
    marginTop: 24,
  },
  ctaTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: 8,
  },
  ctaDesc: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    marginBottom: 24,
    fontWeight: 300,
  },
  ctaBtn: {
    display: 'inline-block',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    textDecoration: 'none',
  },
};
