import StripeAccent from '../components/StripeAccent';

export default function Terms() {
  return (
    <div style={styles.page}>
      <div className="container" style={styles.content}>
        <StripeAccent style={{ marginBottom: 16 }} />
        <h1 style={styles.title}>Terms of Service</h1>
        <p style={styles.updated}>Last updated: March 22, 2026</p>

        <section style={styles.section}>
          <h2 style={styles.heading}>1. Acceptance of Terms</h2>
          <p style={styles.text}>
            By downloading, installing, or using any application developed by ArchaldStudio ("we,"
            "our," or "us"), you agree to be bound by these Terms of Service. If you do not agree to
            these terms, please do not use our applications.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>2. Use of Our Applications</h2>
          <p style={styles.text}>
            Our applications are provided for personal, non-commercial use. You agree to use our
            applications only for lawful purposes and in accordance with these Terms. You may not:
          </p>
          <ul style={styles.list}>
            <li>Reverse engineer, decompile, or disassemble any of our applications</li>
            <li>Use our applications to infringe on the intellectual property rights of others</li>
            <li>Attempt to gain unauthorized access to our systems or services</li>
            <li>Distribute, sublicense, or resell our applications</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>3. Intellectual Property</h2>
          <p style={styles.text}>
            All content, features, and functionality of our applications — including but not limited
            to design, code, graphics, and audio — are owned by ArchaldStudio and protected by
            copyright, trademark, and other intellectual property laws.
          </p>
          <p style={styles.text}>
            Content you create using our applications (such as audio recordings) remains your property.
            We claim no ownership over user-generated content.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>4. Subscriptions and Purchases</h2>
          <p style={styles.text}>
            Some features of our applications require a paid subscription or one-time purchase. All
            purchases are processed through the Apple App Store or Google Play Store and are subject
            to their respective terms and refund policies.
          </p>
          <ul style={styles.list}>
            <li>Subscription prices are displayed before purchase</li>
            <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
            <li>You can manage or cancel subscriptions through your device's app store settings</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>5. Disclaimer of Warranties</h2>
          <p style={styles.text}>
            Our applications are provided "as is" and "as available" without warranties of any kind,
            either express or implied. We do not warrant that our applications will be uninterrupted,
            error-free, or free of harmful components.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>6. Limitation of Liability</h2>
          <p style={styles.text}>
            To the fullest extent permitted by law, ArchaldStudio shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising out of or related to your
            use of our applications, including but not limited to loss of data or audio recordings.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>7. Modifications to Terms</h2>
          <p style={styles.text}>
            We reserve the right to modify these Terms at any time. We will notify users of material
            changes by updating the "Last updated" date. Continued use of our applications after
            changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>8. Governing Law</h2>
          <p style={styles.text}>
            These Terms shall be governed by and construed in accordance with the laws of the State
            of Colorado, United States, without regard to conflict of law provisions.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.heading}>9. Contact Us</h2>
          <p style={styles.text}>
            If you have any questions about these Terms of Service, please contact us at{' '}
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
