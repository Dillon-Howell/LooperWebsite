import StripeAccent from '../components/StripeAccent';

export default function Privacy() {
  return (
    <div style={styles.page}>
      <div className="container" style={styles.content}>
        <StripeAccent style={{ marginBottom: 16 }} />
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.updated}>Last updated: March 22, 2026</p>

        <section style={styles.section}>
          <h2 style={styles.heading}>1. Introduction</h2>
          <p style={styles.text}>
            ArchaldStudio ("we," "our," or "us") is committed to protecting your privacy. This Privacy
            Policy explains how we collect, use, and safeguard your information when you use our
            applications and services.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>2. Information We Collect</h2>
          <p style={styles.text}>We may collect the following types of information:</p>
          <ul style={styles.list}>
            <li><strong>Usage Data:</strong> Information about how you interact with our apps, including features used, session duration, and crash reports.</li>
            <li><strong>Device Information:</strong> Device type, operating system, and app version for compatibility and bug-fixing purposes.</li>
            <li><strong>Support Communications:</strong> Name, email address, and message content when you contact us through our support form.</li>
            <li><strong>Purchase Information:</strong> Transaction records for in-app purchases, processed securely through Apple App Store or Google Play Store.</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>3. How We Use Your Information</h2>
          <p style={styles.text}>We use the information we collect to:</p>
          <ul style={styles.list}>
            <li>Provide, maintain, and improve our applications</li>
            <li>Respond to support requests and communicate with you</li>
            <li>Monitor app performance and fix bugs</li>
            <li>Process transactions and manage subscriptions</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>4. Data Storage and Security</h2>
          <p style={styles.text}>
            Your audio recordings and app data are stored locally on your device. We do not upload,
            store, or have access to your recordings. We implement industry-standard security measures
            to protect any data we do collect.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>5. Third-Party Services</h2>
          <p style={styles.text}>Our apps may use the following third-party services:</p>
          <ul style={styles.list}>
            <li><strong>Sentry:</strong> For error tracking and crash reporting</li>
            <li><strong>Apple StoreKit / Google Play Billing:</strong> For subscription and purchase management (processed directly through the platform stores)</li>
            <li><strong>Apple App Store / Google Play Store:</strong> For app distribution and payment processing</li>
          </ul>
          <p style={styles.text}>
            Each third-party service has its own privacy policy governing the use of your information.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>6. Children's Privacy</h2>
          <p style={styles.text}>
            Our services are not directed to children under 13. We do not knowingly collect personal
            information from children under 13. If we discover that a child under 13 has provided us
            with personal information, we will delete it promptly.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>7. Your Rights</h2>
          <p style={styles.text}>You have the right to:</p>
          <ul style={styles.list}>
            <li>Request access to your personal data</li>
            <li>Request correction or deletion of your data</li>
            <li>Opt out of analytics data collection</li>
            <li>Request a copy of your data in a portable format</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>8. Changes to This Policy</h2>
          <p style={styles.text}>
            We may update this Privacy Policy from time to time. We will notify you of any changes
            by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>9. Contact Us</h2>
          <p style={styles.text}>
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:support@archaldstudio.com" style={{ color: 'var(--accent-red)' }}>
              support@archaldstudio.com
            </a>.
          </p>
        </section>
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
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 800,
    marginBottom: 8,
    letterSpacing: '-0.02em',
  },
  updated: {
    color: 'var(--text-subtle)',
    fontSize: '0.85rem',
    marginBottom: 48,
  },
  section: {
    marginBottom: 40,
  },
  heading: {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: 12,
    color: 'var(--text)',
  },
  text: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    lineHeight: 1.8,
    marginBottom: 12,
  },
  list: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    lineHeight: 1.8,
    paddingLeft: 24,
    listStyleType: 'disc',
  },
};
