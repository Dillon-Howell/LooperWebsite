import { useState } from 'react';
import StripeAccent from '../components/StripeAccent';
import ScrollReveal from '../components/ScrollReveal';
import { usePageMeta } from '../hooks/usePageMeta';

const apps = [
  { value: 'looper', label: 'Looper' },
  { value: 'general', label: 'General Inquiry' },
];

export default function Support() {
  usePageMeta({
    title: 'Support — ArchaldStudio',
    description: 'Get help with Looper or reach out to ArchaldStudio with questions and feedback.',
  });
  const [form, setForm] = useState({
    name: '',
    email: '',
    app: 'looper',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:support@archaldstudio.com?subject=${encodeURIComponent(
      `[${form.app.toUpperCase()}] ${form.subject}`
    )}&body=${encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nApp: ${form.app}\n\n${form.message}`
    )}`;
    window.location.href = mailtoLink;
    setSubmitted(true);
  };

  return (
    <div style={styles.page}>
      <div className="container">
        <ScrollReveal direction="left" duration={800}>
          <StripeAccent style={{ marginBottom: 16 }} />
        </ScrollReveal>
        <ScrollReveal direction="up" delay={150} duration={800}>
          <h1 style={styles.title}>Support</h1>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={300} duration={800}>
          <p style={styles.subtitle}>
            Need help or have feedback? Select the relevant app below and let us know how we can help.
            We typically respond within 24–48 hours.
          </p>
        </ScrollReveal>

        <div className="support-grid" style={styles.grid}>
          {/* Contact Form */}
          <ScrollReveal direction="up" delay={400} duration={800}>
            <div style={styles.formWrapper}>
              {submitted ? (
                <div style={styles.successMessage}>
                  <h3 style={{ color: 'var(--accent-green)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>Message prepared!</h3>
                  <p style={{ color: 'var(--text-muted)', fontWeight: 300 }}>
                    Your email client should have opened with the message. If it didn't,
                    you can email us directly at{' '}
                    <a href="mailto:support@archaldstudio.com" style={{ color: 'var(--accent-red)' }}>
                      support@archaldstudio.com
                    </a>
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', app: 'looper', subject: '', message: '' }); }}
                    style={styles.resetBtn}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={styles.form}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label} htmlFor="name">Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      style={styles.input}
                      placeholder="Your name"
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label} htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      style={styles.input}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label} htmlFor="app">App</label>
                    <select
                      id="app"
                      name="app"
                      value={form.app}
                      onChange={handleChange}
                      style={styles.input}
                    >
                      {apps.map(a => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label} htmlFor="subject">Subject</label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      style={styles.input}
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label} htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={form.message}
                      onChange={handleChange}
                      style={{ ...styles.input, resize: 'vertical' as const }}
                      placeholder="Describe your issue or feedback in detail..."
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </ScrollReveal>

          {/* Sidebar Info */}
          <div style={styles.sidebar}>
            <ScrollReveal direction="right" delay={500} duration={800}>
              <div className="card-hover" style={styles.infoCard}>
                <h3 style={styles.infoTitle}>Direct Email</h3>
                <a href="mailto:support@archaldstudio.com" style={styles.infoLink}>
                  support@archaldstudio.com
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={650} duration={800}>
              <div className="card-hover" style={styles.infoCard}>
                <h3 style={styles.infoTitle}>FAQ</h3>
                <div style={styles.faqItem}>
                  <h4 style={styles.faqQ}>Is Looper free?</h4>
                  <p style={styles.faqA}>Looper is free to download with core features. Premium features like the drum machine are available via subscription.</p>
                </div>
                <div style={styles.faqItem}>
                  <h4 style={styles.faqQ}>What devices are supported?</h4>
                  <p style={styles.faqA}>Looper is available on both iOS and Android devices.</p>
                </div>
                <div style={styles.faqItem}>
                  <h4 style={styles.faqQ}>How do I report a bug?</h4>
                  <p style={styles.faqA}>Use the form on this page, select the relevant app, and describe the issue. Include your device model and OS version if possible.</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '120px 0 80px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 800,
    marginBottom: 16,
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
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: 48,
    alignItems: 'start',
  },
  formWrapper: {
    background: 'var(--bg-light)',
    borderRadius: 16,
    border: '1px solid var(--border)',
    padding: 40,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 24,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  label: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  input: {
    padding: '12px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: '0.95rem',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
  },
  successMessage: {
    textAlign: 'center' as const,
    padding: '40px 0',
  },
  resetBtn: {
    marginTop: 20,
    padding: '10px 24px',
    background: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: '0.85rem',
    fontWeight: 500,
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.2s',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 24,
  },
  infoCard: {
    background: 'var(--bg-light)',
    borderRadius: 16,
    border: '1px solid var(--border)',
    padding: 24,
  },
  infoTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    fontWeight: 700,
    marginBottom: 12,
  },
  infoLink: {
    color: 'var(--accent-red)',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQ: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: 4,
  },
  faqA: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    fontWeight: 300,
  },
};
