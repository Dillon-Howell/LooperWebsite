import { useEffect, useState, useRef } from 'react';

const KONAMI = [
  'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
  'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
  'b','a',
];

interface Paw {
  id: number;
  x: number;
  delay: number;
  color: string;
  rotate: number;
  size: number;
}

const PAW_COLORS = ['#D94843', '#4CAF50', '#E2B347', '#8B949E'];

export default function EasterEgg() {
  const [active, setActive] = useState(false);
  const [paws, setPaws] = useState<Paw[]>([]);
  const progress = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      progress.current.push(e.key);
      if (progress.current.length > KONAMI.length) {
        progress.current = progress.current.slice(-KONAMI.length);
      }
      if (progress.current.join(',') === KONAMI.join(',')) {
        trigger();
        progress.current = [];
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function trigger() {
    const newPaws: Paw[] = Array.from({ length: 28 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      delay: Math.random() * 1.8,
      color: PAW_COLORS[Math.floor(Math.random() * PAW_COLORS.length)],
      rotate: Math.random() * 60 - 30,
      size: Math.random() * 24 + 20,
    }));
    setPaws(newPaws);
    setActive(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActive(false);
      setPaws([]);
    }, 4500);
  }

  if (!active) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {/* Paw rain */}
      {paws.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          top: '-80px',
          left: `${p.x}vw`,
          fontSize: p.size,
          color: p.color,
          transform: `rotate(${p.rotate}deg)`,
          animation: `pawFall 2.5s ${p.delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
          filter: `drop-shadow(0 0 6px ${p.color})`,
        }}>🐾</div>
      ))}

      {/* Center message */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'eggFadeIn 0.5s ease both',
      }}>
        <div style={{
          background: 'rgba(13, 17, 23, 0.9)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '32px 48px',
          textAlign: 'center',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 60px rgba(217, 72, 67, 0.2)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐶</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            fontWeight: 800,
            color: 'var(--accent-yellow)',
            marginBottom: 8,
          }}>Archie approves.</div>
          <div style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            fontWeight: 300,
          }}>The real CEO of ArchaldStudio.</div>
        </div>
      </div>
    </div>
  );
}
