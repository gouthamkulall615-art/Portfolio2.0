import { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOBILE_BREAKPOINT = 768;
const SPREAD_FACTOR = 1.2;
const MAX_DPR = 2;

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return `rgba(139,92,246,${alpha})`;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff},${alpha})`;
}

function deriveProjection(depth) {
  const t = Math.max(0, Math.min(1, depth));
  const fov = 800 - t * 600;
  const perspectiveDistance = 100 + t * 700;
  const depthRange = t * Math.min(400, fov + perspectiveDistance - 1);
  return { fov, perspectiveDistance, depthRange };
}

function spawnParticle(width, height, size, opacity) {
  const sizeVariance = size * 0.4;
  const opacityVariance = 0.2;
  return {
    angle: Math.random() * Math.PI * 2,
    radius: Math.random() * Math.max(width, height) * SPREAD_FACTOR,
    y: (Math.random() - 0.5) * height * 2,
    size: Math.max(0.5, size - sizeVariance + Math.random() * sizeVariance * 2),
    angularSpeed: 0.0015 + Math.random() * 0.001,
    opacity: Math.min(1, Math.max(0, opacity - opacityVariance + Math.random() * opacityVariance * 2)),
    screenX: 0,
    screenY: 0,
    projectedScale: 1,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Floating3DParticles({
  quantity = 400,
  color = '#ffffff',
  size = 5,
  opacity = 0.3,
  drift = 0.8,
  depth = 0.5,
  style,
  className,
}) {
  const canvasRef = useRef(null);
  const ioRef = useRef(null);
  const colorRef = useRef(color);
  colorRef.current = color;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const state = { mounted: true, paused: false, reducedMotion: false, rafId: null };

    let width = 0, height = 0;
    let particles = [];
    let staticDirty = true;

    const { fov, perspectiveDistance, depthRange } = deriveProjection(depth);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncReducedMotion = () => { state.reducedMotion = mq.matches; };
    syncReducedMotion();

    const draw = (p) => {
      const r = Math.max(0, p.size * p.projectedScale);
      if (r <= 0) return;
      ctx.beginPath();
      ctx.fillStyle = hexToRgba(colorRef.current, p.opacity);
      ctx.arc(p.screenX, p.screenY, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const staticFrame = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2, cy = height / 2;
      for (const p of particles) {
        const denom = Math.max(1, fov + perspectiveDistance);
        const scale = fov / denom;
        p.screenX = cx + Math.cos(p.angle) * p.radius * scale;
        p.screenY = cy + p.y * scale;
        p.projectedScale = scale;
        draw(p);
      }
    };

    const tick = () => {
      if (!state.mounted) return;
      if (state.paused) { state.rafId = requestAnimationFrame(tick); return; }
      if (state.reducedMotion) {
        if (staticDirty) { staticDirty = false; staticFrame(); }
        state.rafId = requestAnimationFrame(tick);
        return;
      }
      staticDirty = true;
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2, cy = height / 2;
      for (const p of particles) {
        p.angle += p.angularSpeed;
        p.y -= drift;
        if (p.y < -height) { p.y = height; p.radius = Math.random() * Math.max(width, height) * SPREAD_FACTOR; }
        else if (p.y > height) { p.y = -height; p.radius = Math.random() * Math.max(width, height) * SPREAD_FACTOR; }
        const denom = Math.max(1, fov + perspectiveDistance + Math.sin(p.angle) * depthRange);
        const scale = fov / denom;
        p.screenX = cx + Math.cos(p.angle) * p.radius * scale;
        p.screenY = cy + p.y * scale;
        p.projectedScale = scale;
      }
      particles.sort((a, b) => a.projectedScale - b.projectedScale);
      for (const p of particles) draw(p);
      state.rafId = requestAnimationFrame(tick);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, MAX_DPR));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      const count = isMobile ? Math.round(quantity * 0.2) : quantity;
      particles = Array.from({ length: Math.max(0, count) }, () => spawnParticle(width, height, size, opacity));
      staticDirty = true;
    };

    const onVisibilityChange = () => { state.paused = document.hidden; };

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas);
    else window.addEventListener('resize', resize);

    if (typeof IntersectionObserver !== 'undefined') {
      ioRef.current = new IntersectionObserver(([entry]) => {
        if (entry) state.paused = document.hidden || !entry.isIntersecting;
      }, { threshold: 0 });
      ioRef.current.observe(canvas);
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    mq.addEventListener('change', syncReducedMotion);

    resize();
    state.rafId = requestAnimationFrame(tick);

    return () => {
      state.mounted = false;
      if (state.rafId !== null) cancelAnimationFrame(state.rafId);
      ro?.disconnect();
      if (!ro) window.removeEventListener('resize', resize);
      ioRef.current?.disconnect();
      ioRef.current = null;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      mq.removeEventListener('change', syncReducedMotion);
    };
  }, [quantity, size, opacity, drift, depth]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        ...style,
      }}
      className={className}
    />
  );
}
