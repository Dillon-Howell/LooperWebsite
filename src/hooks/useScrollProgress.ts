import { useEffect, useRef, useCallback } from 'react';

/** Returns a mutable ref whose `.current` is always 0–1 representing page scroll progress */
export function useScrollProgress() {
  const progress = useRef(0);

  const update = useCallback(() => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progress.current = scrollable > 0 ? window.scrollY / scrollable : 0;
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [update]);

  return progress;
}

/** Returns a mutable ref whose `.current` is the raw scrollY in pixels */
export function useScrollY() {
  const scrollY = useRef(0);

  useEffect(() => {
    const update = () => { scrollY.current = window.scrollY; };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return scrollY;
}
