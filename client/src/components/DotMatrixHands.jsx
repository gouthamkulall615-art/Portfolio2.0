import React, { useEffect, useRef, useState } from 'react';
import '../css/DotMatrixHands.css';

const SHEET_URL =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261030_025250_100df7b8-31fd-4614-aa4a-c1b7d5b6b273.png&w=1600&q=85';

// Sheet layout [x, y, w, h] as fractions of sheet
const LA_RECT = [0, 0.06, 0.47, 0.4];
const RA_RECT = [0.53, 0.06, 0.47, 0.4];
const LB_RECT = [0, 0.55, 0.47, 0.4];
const RB_RECT = [0.53, 0.55, 0.47, 0.4];

function hash(a, b) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smooth(a, b, x) {
  if (x <= a) return 0;
  if (x >= b) return 1;
  const t = (x - a) / (b - a);
  return t * t * (3 - 2 * t);
}

function mixAt(t, on, off, dur) {
  return smooth(on, on + dur, t) * (1 - smooth(off, off + dur, t));
}

export default function DotMatrixHands({ className = '', style = {} }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Theme detection
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false;
    const dt = document.documentElement.getAttribute('data-theme');
    return dt === 'dark' || document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const checkTheme = () => {
      const dt = document.documentElement.getAttribute('data-theme');
      setIsDark(dt === 'dark' || document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });
    window.addEventListener('themechange', checkTheme);
    return () => {
      observer.disconnect();
      window.removeEventListener('themechange', checkTheme);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isDisposed = false;
    let animId = null;
    let t0 = performance.now();

    // 1. Offscreen field canvases for tiny raster sampling
    const fA = document.createElement('canvas');
    const fB = document.createElement('canvas');
    const ctxA = fA.getContext('2d', { willReadFrequently: true });
    const ctxB = fB.getContext('2d', { willReadFrequently: true });

    let tileLA = null,
      tileRA = null,
      tileLB = null,
      tileRB = null;

    // Helper: Create a 420px wide tile from source sheet rect
    const createTile = (img, rect) => {
      const sw = rect[2] * img.naturalWidth;
      const sh = rect[3] * img.naturalHeight;
      const sx = rect[0] * img.naturalWidth;
      const sy = rect[1] * img.naturalHeight;

      const tile = document.createElement('canvas');
      const tw = 420;
      const th = Math.round(tw * (sh / sw));
      tile.width = tw;
      tile.height = th;

      const tctx = tile.getContext('2d');
      tctx.imageSmoothingEnabled = true;
      tctx.imageSmoothingQuality = 'high';
      tctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
      return tile;
    };

    // Procedural fallback tile generator in case network or CORS is blocked
    const createProceduralFallbackTile = (isLeft) => {
      const tile = document.createElement('canvas');
      const tw = 420;
      const th = Math.round(tw * ((0.4 * 1520) / (0.47 * 2688)));
      tile.width = tw;
      tile.height = th;
      const tctx = tile.getContext('2d');
      tctx.fillStyle = '#ffffff';
      tctx.fillRect(0, 0, tw, th);

      tctx.fillStyle = '#111111';
      tctx.beginPath();
      if (isLeft) {
        // Arm entering from left edge pointing/reaching right
        tctx.moveTo(0, th * 0.35);
        tctx.bezierCurveTo(tw * 0.35, th * 0.3, tw * 0.65, th * 0.4, tw * 0.95, th * 0.5);
        tctx.bezierCurveTo(tw * 0.8, th * 0.65, tw * 0.4, th * 0.75, 0, th * 0.7);
      } else {
        // Arm entering from right edge pointing/reaching left
        tctx.moveTo(tw, th * 0.35);
        tctx.bezierCurveTo(tw * 0.65, th * 0.3, tw * 0.35, th * 0.4, tw * 0.05, th * 0.5);
        tctx.bezierCurveTo(tw * 0.2, th * 0.65, tw * 0.6, th * 0.75, tw, th * 0.7);
      }
      tctx.closePath();
      tctx.fill();
      return tile;
    };

    // Load source sheet
    const sheetImg = new Image();
    sheetImg.crossOrigin = 'anonymous';
    sheetImg.onload = () => {
      if (isDisposed) return;
      try {
        tileLA = createTile(sheetImg, LA_RECT);
        tileRA = createTile(sheetImg, RA_RECT);
        tileLB = createTile(sheetImg, LB_RECT);
        tileRB = createTile(sheetImg, RB_RECT);
      } catch (err) {
        console.warn('CORS or canvas slice fallback engaged:', err);
        tileLA = createProceduralFallbackTile(true, false);
        tileRA = createProceduralFallbackTile(false, false);
        tileLB = createProceduralFallbackTile(true, true);
        tileRB = createProceduralFallbackTile(false, true);
      }
    };
    sheetImg.onerror = () => {
      if (isDisposed) return;
      tileLA = createProceduralFallbackTile(true, false);
      tileRA = createProceduralFallbackTile(false, false);
      tileLB = createProceduralFallbackTile(true, true);
      tileRB = createProceduralFallbackTile(false, true);
    };
    sheetImg.src = SHEET_URL;

    // Helper: Draw hand into tiny field canvas
    const drawHandIntoField = (
      fCtx,
      tile,
      isLeft,
      rot,
      scale,
      x,
      hw,
      hh,
      cy,
      W,
      H,
      cols,
      rows
    ) => {
      if (!tile) return;
      fCtx.save();
      fCtx.scale(cols / W, rows / H);
      const pivotX = isLeft ? 0 : W;
      const pivotY = cy;
      fCtx.translate(pivotX, pivotY);
      fCtx.rotate(rot);
      fCtx.scale(scale, scale);
      fCtx.translate(-pivotX, -pivotY);
      fCtx.drawImage(tile, x, cy - hh / 2, hw, hh);
      fCtx.restore();
    };

    // Render loop
    const render = (timeSec) => {
      if (isDisposed) return;

      const W = container.offsetWidth || window.innerWidth;
      const H = container.offsetHeight || window.innerHeight;
      if (!W || !H) return;

      const DPR = Math.min(2, window.devicePixelRatio || 1);
      const step = Math.max(5, W / 205);
      const rowStep = step * 2.05;
      const cols = Math.ceil(W / step);
      const rows = Math.ceil(H / rowStep);
      const R = step * 0.46;

      // Sync visible canvas backing resolution
      const targetW = Math.round(W * DPR);
      const targetH = Math.round(H * DPR);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      // Sync offscreen fields
      if (fA.width !== cols || fA.height !== rows) {
        fA.width = cols;
        fA.height = rows;
        fB.width = cols;
        fB.height = rows;
      }

      // Time & Loop (20s seamless loop)
      const LOOP = 20;
      const t = ((timeSec % LOOP) + LOOP) % LOOP;
      const a = (2 * Math.PI * t) / LOOP;

      const isPortrait = H > W;
      const hw = W * (isPortrait ? 0.66 : 0.53);
      const hh = hw * ((0.4 * 1520) / (0.47 * 2688));
      const cy = H * (isPortrait ? 0.66 : 0.54);

      // Left hand motion (ph = 0)
      const reachL = (0.035 * Math.sin(a) + 0.012 * Math.sin(2 * a + 1.3)) * W;
      const scaleL = 1 + 0.07 * Math.sin(a + 0.9);
      const rotL = 0.045 * Math.sin(a + 2.1);
      const xL = reachL - W * 0.045;

      // Right hand motion (ph = PI)
      const aR = a + Math.PI;
      const reachR = (0.035 * Math.sin(aR) + 0.012 * Math.sin(2 * aR + 1.3)) * W;
      const scaleR = 1 + 0.07 * Math.sin(aR + 0.9);
      const rotR = -0.045 * Math.sin(aR + 2.1);
      const xR = W - hw + W * 0.045 - reachR;

      // Clear fields to white
      ctxA.fillStyle = '#ffffff';
      ctxA.fillRect(0, 0, cols, rows);
      ctxB.fillStyle = '#ffffff';
      ctxB.fillRect(0, 0, cols, rows);

      // Draw Pose A into fA, Pose B into fB
      drawHandIntoField(ctxA, tileLA, true, rotL, scaleL, xL, hw, hh, cy, W, H, cols, rows);
      drawHandIntoField(ctxA, tileRA, false, rotR, scaleR, xR, hw, hh, cy, W, H, cols, rows);

      drawHandIntoField(ctxB, tileLB, true, rotL, scaleL, xL, hw, hh, cy, W, H, cols, rows);
      drawHandIntoField(ctxB, tileRB, false, rotR, scaleR, xR, hw, hh, cy, W, H, cols, rows);

      let dataA, dataB;
      try {
        dataA = ctxA.getImageData(0, 0, cols, rows).data;
        dataB = ctxB.getImageData(0, 0, cols, rows).data;
      } catch {
        return;
      }

      // Clear visible canvas
      ctx.clearRect(0, 0, W, H);

      // Pose switch metrics
      const mL = mixAt(t, 6.2, 14.6, 1.6);
      const mR = mixAt(t, 2.4, 10.4, 1.6);
      const tick = Math.floor(t * 7);

      // Row glitch pre-pass
      const rowShifts = new Int32Array(rows);
      for (let j = 0; j < rows; j++) {
        if (hash(j, tick) > 0.965) {
          rowShifts[j] = Math.round((hash(tick, j) - 0.5) * 8);
        }
      }

      const dotColor = isDark ? '#e4e4e7' : '#0d0d0d';
      ctx.fillStyle = dotColor;

      const midCol = cols * 0.5;

      // Dot rasterization
      for (let j = 0; j < rows; j++) {
        const shift = rowShifts[j];
        const dotY = (j + 0.5) * rowStep;

        for (let i = 0; i < cols; i++) {
          const m = i < midCol ? mL : mR;
          const seed = 0.55 * hash(i, j) + 0.45 * hash(j * 3.1, 7.7);
          const useB = seed < m;

          // Row glitch horizontal shift
          const srcI = Math.max(0, Math.min(cols - 1, i - shift));
          const idx = (j * cols + srcI) * 4;

          const lum = (useB ? dataB[idx] : dataA[idx]) / 255;
          let v = Math.max(0, Math.min(1, (1 - lum - 0.16) / 0.42));
          if (v <= 0) continue;

          // Pose switch front sparkle & flicker
          if (m > 0.001 && m < 0.999) {
            const distToFront = Math.abs(seed - m);
            if (distToFront < 0.12) {
              v *= distToFront / 0.12;
              if (hash(i + tick, j) <= 0.4) {
                v *= 0.3;
              }
            }
          }

          // Shimmer
          v *= 0.86 + 0.14 * Math.sin(t * 3.2 + seed * 40);

          // Centre fade (fingertips dissolve delicately just before touching)
          const cx = Math.abs((i + 0.5) / cols - 0.5);
          v *= smooth(0.012, 0.045, cx);

          // Quantise to LEVELS = [0, 0.26, 0.52, 0.78, 1]
          let level = 0;
          if (v >= 1 - 0.13) level = 1;
          else if (v >= 0.78 - 0.13) level = 0.78;
          else if (v >= 0.52 - 0.13) level = 0.52;
          else if (v >= 0.26 - 0.13) level = 0.26;

          if (level === 0) continue;

          const radius = level === 0.26 ? R * 0.38 : R * level;
          const dotX = (i + 0.5) * step;

          ctx.beginPath();
          ctx.arc(dotX, dotY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // Expose render function globally as specified
    window.__render = render;

    const frameLoop = (now) => {
      render((now - t0) / 1000);
      animId = requestAnimationFrame(frameLoop);
    };

    animId = requestAnimationFrame(frameLoop);

    const ro = new ResizeObserver(() => {
      // Recompute on container resize
      render((performance.now() - t0) / 1000);
    });
    ro.observe(container);

    return () => {
      isDisposed = true;
      if (animId) cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [isDark]);

  return (
    <div ref={containerRef} className={`dot-matrix-hero ${className}`} style={style}>
      {/* Live Canvas Halftone Matrix Hands */}
      <canvas ref={canvasRef} className="dot-matrix-canvas" aria-hidden="true" />
    </div>
  );
}
