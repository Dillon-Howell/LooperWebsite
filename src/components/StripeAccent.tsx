export default function StripeAccent({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      display: 'flex',
      height: 3,
      width: 60,
      borderRadius: 2,
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{ flex: 1, background: 'var(--accent-red)' }} />
      <div style={{ flex: 1, background: 'var(--accent-green)' }} />
      <div style={{ flex: 1, background: 'var(--accent-yellow)' }} />
    </div>
  );
}
