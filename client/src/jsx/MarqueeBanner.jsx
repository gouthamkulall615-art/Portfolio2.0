import { useEffect, useRef, useState, useCallback } from 'react';
import '@fontsource/anton';
import '../css/MarqueeBanner.css';

const DEFAULT_TEXT = 'ALWAYS SHIPPING SOMETHING NEW';
const STEP = 34; // degrees between lines (bigger = more curve)

export default function MarqueeBanner({ text = DEFAULT_TEXT }) {
  const lines = text.trim().split(/\s+/);
  const n = lines.length;

  const sectionRef = useRef(null);
  const lineRefs = useRef([]);

  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return true;
    return (
      document.documentElement.getAttribute('data-theme') !== 'light' &&
      !document.documentElement.classList.contains('light')
    );
  });

  // Observe theme changes (theme toggler custom event + attribute change)
  useEffect(() => {
    const handleTheme = () => {
      const dark =
        document.documentElement.getAttribute('data-theme') !== 'light' &&
        !document.documentElement.classList.contains('light');
      setIsDark(dark);
    };

    window.addEventListener('themechange', handleTheme);
    const observer = new MutationObserver(handleTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    return () => {
      window.removeEventListener('themechange', handleTheme);
      observer.disconnect();
    };
  }, []);

  // radius in em so neighbouring lines (line-height: 1) touch exactly
  const radiusEm = 0.5 / Math.tan((STEP / 2) * (Math.PI / 180));

  const update = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const p = Math.min(1, Math.max(0, -rect.top / total));
    const current = Math.min(1, p / 0.85) * (n - 1); // hold last line at the end

    const colorFull = isDark ? '#ffffff' : '#111111';
    const colorFaded = isDark ? 'rgba(255, 255, 255, 0.42)' : 'rgba(17, 17, 17, 0.42)';

    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      const a = (current - i) * STEP; // + above centre, - below
      const abs = Math.abs(a);

      el.style.transform = `rotateX(${a}deg) translateZ(${radiusEm}em)`;
      el.style.opacity = String(Math.max(0, 1 - abs / (STEP * 3)));
      el.style.visibility = abs > 88 ? 'hidden' : 'visible';
      el.style.backgroundImage =
        abs < 1
          ? `linear-gradient(${colorFull}, ${colorFull})`
          : a > 0
          ? `linear-gradient(to bottom, ${colorFaded}, ${colorFull} 70%)`
          : `linear-gradient(to top, ${colorFaded}, ${colorFull} 70%)`;
    });
  }, [n, radiusEm, isDark]);

  useEffect(() => {
    if (reduced) return;

    let frame = 0;
    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          update();
        });
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced, update]);

  // Reduced motion: simple static stack
  if (reduced) {
    return (
      <section className="reveal-static" aria-label={text}>
        {lines.map((l, i) => (
          <div key={i} className="reveal-static-line">{l}</div>
        ))}
      </section>
    );
  }

  return (
    <section className="reveal-section" ref={sectionRef} aria-label={text}>
      <div className="reveal-sticky">
        <div
          className="reveal-cylinder"
          aria-hidden="true"
          style={{ transform: `translateZ(-${radiusEm}em)` }}
        >
          {lines.map((word, i) => (
            <div
              key={i}
              className="reveal-line"
              ref={(el) => (lineRefs.current[i] = el)}
            >
              {word}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
