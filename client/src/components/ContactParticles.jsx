import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ---------------------------------------------------------------------------
// Palettes for Dark and Light Themes
// ---------------------------------------------------------------------------
const DARK_PALETTE = [
  { r: 168, g: 85, b: 247 },  // Electric violet #a855f7
  { r: 192, g: 132, b: 252 }, // Radiant lilac #c084fc
  { r: 139, g: 92, b: 246 },  // Purple #8b5cf6
  { r: 129, g: 140, b: 248 }, // Indigo glow #818cf8
  { r: 56, g: 189, b: 248 },  // Celestial cyan #38bdf8
  { r: 244, g: 63, b: 94 },   // Warm fuchsia/rose #f43f5e
  { r: 248, g: 250, b: 252 }, // Specular starlight
];

const LIGHT_PALETTE = [
  { r: 124, g: 58, b: 237 },  // Amethyst #7c3aed
  { r: 109, g: 40, b: 217 },  // Deep violet #6d28d9
  { r: 147, g: 51, b: 234 },  // Royal purple #9333ea
  { r: 79, g: 70, b: 229 },   // Deep indigo #4f46e5
  { r: 2, g: 132, b: 199 },   // Ocean cyan #0284c7
  { r: 225, g: 29, b: 72 },   // Vibrant rose #e11d48
  { r: 99, g: 102, b: 241 },  // Violet-indigo #6366f1
];

// Helper: Cubic smoothstep for smooth transitions
function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export default function ContactParticles({ containerRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const container = containerRef?.current || canvas.parentElement;
    if (!container) return;

    // Detect mobile / low-power devices
    const isMobile =
      window.innerWidth <= 768 ||
      (typeof window !== 'undefined' &&
        window.matchMedia('(hover: none) and (pointer: coarse)').matches);

    // Particle count: rich 3D density on desktop, lightweight on mobile
    const PARTICLE_COUNT = isMobile ? 24 : 52;
    const MAX_DPR = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let animationFrameId = null;
    let isVisible = true;
    let isDark = true;

    // Track Theme
    const updateTheme = () => {
      const themeAttr = document.documentElement.getAttribute('data-theme');
      isDark = themeAttr ? themeAttr !== 'light' : !document.documentElement.classList.contains('light');
    };
    updateTheme();

    const themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    // Parallax & Scroll state
    const mouse = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
    };

    const scrollState = {
      enterProgress: 1, // 0 (above view) -> 1 (entered)
      exitProgress: 0,  // 0 (full contact view) -> 1 (scrolled into footer)
      speedFactor: 1,
    };

    // -------------------------------------------------------------------------
    // Particle Factory
    // -------------------------------------------------------------------------
    const MIN_Z = -120;
    const MAX_Z = 460;
    const Z_RANGE = MAX_Z - MIN_Z;

    const createParticle = (i) => {
      // Stratified depth distribution so we have foreground, midground, and background
      const depthTier = i / PARTICLE_COUNT; // 0 (near) to 1 (far)
      const z = MIN_Z + depthTier * Z_RANGE + (Math.random() - 0.5) * 60;
      const depthLayer = (z - MIN_Z) / Z_RANGE; // 0 (deepest) to 1 (closest)

      // Radius & type based on depth
      let baseRadius;
      let type;
      let baseOpacity;

      if (depthLayer > 0.68) {
        // Foreground luminous orbs
        type = 'orb';
        baseRadius = isMobile ? 12 + Math.random() * 10 : 16 + Math.random() * 16;
        baseOpacity = 0.55 + Math.random() * 0.35;
      } else if (depthLayer > 0.32) {
        // Midground floating energy embers
        type = 'spark';
        baseRadius = isMobile ? 6 + Math.random() * 6 : 7 + Math.random() * 9;
        baseOpacity = 0.4 + Math.random() * 0.35;
      } else {
        // Deep background celestial starlight
        type = 'star';
        baseRadius = isMobile ? 2 + Math.random() * 3 : 2.5 + Math.random() * 4.5;
        baseOpacity = 0.25 + Math.random() * 0.3;
      }

      return {
        x: (Math.random() - 0.5) * (width || 1200) * 1.15,
        y: (Math.random() - 0.5) * (height || 800) * 1.15,
        z,
        depthLayer,
        baseRadius,
        baseOpacity,
        type,
        colorIndex: Math.floor(Math.random() * DARK_PALETTE.length),

        // 3D Harmonic floating motion (independent frequencies)
        freqX: 0.0006 + Math.random() * 0.0008,
        freqY: 0.0008 + Math.random() * 0.001,
        freqZ: 0.0005 + Math.random() * 0.0007,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
        ampX: 18 + Math.random() * 24,
        ampY: 22 + Math.random() * 28,
        ampZ: 15 + Math.random() * 25,

        // Slow organic constant drift
        driftX: (Math.random() - 0.5) * 0.25,
        driftY: -0.15 - Math.random() * 0.2, // gentle upward floating drift
        driftZ: (Math.random() - 0.5) * 0.15,

        // Twinkle
        twinkleSpeed: 0.002 + Math.random() * 0.003,
        twinklePhase: Math.random() * Math.PI * 2,
      };
    };

    let particles = [];

    // -------------------------------------------------------------------------
    // Canvas Resizing
    // -------------------------------------------------------------------------
    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));

      canvas.width = Math.round(width * MAX_DPR);
      canvas.height = Math.round(height * MAX_DPR);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(MAX_DPR, 0, 0, MAX_DPR, 0, 0);

      // Initialize or adapt particles
      if (particles.length === 0) {
        particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => createParticle(i));
      } else {
        // Keep existing particles within bounds
        const halfW = width * 0.6;
        const halfH = height * 0.6;
        particles.forEach((p) => {
          if (Math.abs(p.x) > halfW) p.x = (Math.random() - 0.5) * width;
          if (Math.abs(p.y) > halfH) p.y = (Math.random() - 0.5) * height;
        });
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // -------------------------------------------------------------------------
    // Parallax Event Listeners
    // -------------------------------------------------------------------------
    const onMouseMove = (e) => {
      if (isMobile) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouse.targetX = (e.clientX - cx) / cx; // [-1, 1]
      mouse.targetY = (e.clientY - cy) / cy; // [-1, 1]
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // -------------------------------------------------------------------------
    // Scroll Transition (ScrollTrigger + Native Listener for 100% Reliability)
    // -------------------------------------------------------------------------
    const updateScrollProgress = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight;

      // 1. Exit Progress towards Footer:
      // Start fading when bottom of contact section is within 1.3 viewports of viewport bottom
      // and complete the fade when bottom of contact section approaches viewport top (footer takes over)
      // This spans ~1.2 viewports (>1000px of scrolling!), fulfilling the "reasonable scroll distance" requirement.
      const startExit = vh * 1.35;
      const endExit = vh * 0.12;

      const rawExit = (startExit - rect.bottom) / (startExit - endExit);
      const exitProgress = Math.max(0, Math.min(1, rawExit));

      // 2. Entrance Progress from Previous Section:
      const startEnter = vh * 1.05;
      const endEnter = vh * 0.5;
      const rawEnter = (startEnter - rect.top) / (startEnter - endEnter);
      const enterProgress = Math.max(0, Math.min(1, rawEnter));

      scrollState.exitProgress = exitProgress;
      scrollState.enterProgress = enterProgress;
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    // GSAP ScrollTrigger Integration for fine-grained sync if active
    let scrollTriggerInstance = null;
    try {
      if (ScrollTrigger && container) {
        scrollTriggerInstance = ScrollTrigger.create({
          trigger: container,
          start: 'bottom bottom+=450',
          end: 'bottom top+=100',
          scrub: true,
          onUpdate: (self) => {
            scrollState.exitProgress = self.progress;
          },
        });
      }
    } catch {
      // Native listener handles fallback gracefully
    }

    // IntersectionObserver to pause rendering when offscreen
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry ? entry.isIntersecting : true;
      },
      { rootMargin: '200px 0px 200px 0px' }
    );
    intersectionObserver.observe(container);

    // -------------------------------------------------------------------------
    // Animation Render Loop
    // -------------------------------------------------------------------------
    const fov = 420;
    const halfW = () => width * 0.5;
    const halfH = () => height * 0.5;

    let lastTime = performance.now();

    const render = (currentTime) => {
      animationFrameId = requestAnimationFrame(render);

      if (!isVisible) return;

      const delta = Math.min(currentTime - lastTime, 40); // Cap frame delta
      lastTime = currentTime;

      // Smooth mouse lerp
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.05;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.05;

      const exitProgress = scrollState.exitProgress;
      const enterProgress = scrollState.enterProgress;

      // Decelerate movement organically as we approach the footer
      const speedFactor = Math.max(0.12, 1.0 - exitProgress * 0.88);

      ctx.clearRect(0, 0, width, height);

      const cx = halfW();
      const cy = halfH();
      const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

      // Sort particles by depth Z descending (draw far particles first, near particles last)
      particles.sort((a, b) => b.z - a.z);

      const boundsX = cx * 1.25;
      const boundsY = cy * 1.2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Organic Sinusoidal Hovering + Drift
        const harmonicX = Math.sin(currentTime * p.freqX + p.phaseX) * p.ampX;
        const harmonicY = Math.cos(currentTime * p.freqY + p.phaseY) * p.ampY;
        const harmonicZ = Math.sin(currentTime * p.freqZ + p.phaseZ) * p.ampZ;

        p.x += (p.driftX + harmonicX * 0.02) * speedFactor;
        p.y += (p.driftY + harmonicY * 0.02) * speedFactor;
        p.z += (p.driftZ + harmonicZ * 0.01) * speedFactor;

        // Wrap around smoothly within 3D boundary volume
        if (p.x < -boundsX) p.x = boundsX;
        else if (p.x > boundsX) p.x = -boundsX;

        if (p.y < -boundsY) p.y = boundsY;
        else if (p.y > boundsY) p.y = -boundsY;

        if (p.z < MIN_Z) p.z = MAX_Z;
        else if (p.z > MAX_Z) p.z = MIN_Z;

        // Update depthLayer ratio: 0 (deepest) to 1 (closest foreground)
        const depthLayer = 1.0 - (p.z - MIN_Z) / Z_RANGE;

        // 2. Parallax: Near particles displace more with mouse, distant particles displace less
        const parallaxDisplacement = 0.25 + depthLayer * 0.75;
        const mouseShiftX = mouse.currentX * 42 * parallaxDisplacement;
        const mouseShiftY = mouse.currentY * 32 * parallaxDisplacement;

        // 3. 3D Perspective Projection
        const scale = fov / (fov + p.z);
        const projX = cx + (p.x + mouseShiftX) * scale;
        const projY = cy + (p.y + mouseShiftY) * scale;
        const projRadius = p.baseRadius * scale;

        // 4. Smooth Transition Into Footer (Core Requirement):
        // Foreground particles fade earlier; background particles remain visible longest.
        // As scroll approaches the footer, density and size smoothly reduce to 0.
        const fadeStart = (1.0 - depthLayer) * 0.42; // foreground starts fading at 0.0, background at 0.42
        const fadeEnd = 0.55 + (1.0 - depthLayer) * 0.45; // foreground finishes at 0.55, background at 1.0

        let particleExitAlpha = 1.0;
        if (exitProgress > fadeStart) {
          particleExitAlpha = 1.0 - smoothstep(fadeStart, fadeEnd, exitProgress);
        }

        // Particle size reduction as it fades into the background
        const sizeScale = 0.35 + 0.65 * particleExitAlpha;
        const currentRadius = projRadius * sizeScale;

        // Skip rendering early if faded out or shrunk to non-visible
        if (particleExitAlpha <= 0.005 || currentRadius <= 0.2) continue;

        // 5. Spatial Soft Edge Fade (Guarantees zero hard line at top & bottom borders)
        const bottomFadeZone = Math.min(240, height * 0.22);
        const distFromBottom = height - projY;
        let edgeBottomFade = 1.0;
        if (distFromBottom < bottomFadeZone) {
          edgeBottomFade = smoothstep(0, bottomFadeZone, Math.max(0, distFromBottom));
        }

        const topFadeZone = Math.min(140, height * 0.14);
        let edgeTopFade = 1.0;
        if (projY < topFadeZone) {
          edgeTopFade = smoothstep(0, topFadeZone, Math.max(0, projY));
        }

        // Entrance fade when scrolling down from previous section
        const entranceAlpha = smoothstep(0, 1, enterProgress);

        const totalAlpha =
          p.baseOpacity *
          particleExitAlpha *
          edgeBottomFade *
          edgeTopFade *
          entranceAlpha;

        if (totalAlpha <= 0.008) continue;

        // 6. Color Selection
        const color = palette[p.colorIndex % palette.length];

        // 7. Render 3D Sphere Orb with Shading & Bokeh
        if (p.type === 'orb') {
          // A. Soft optical bokeh glow halo for large foreground orbs
          if (currentRadius > 8) {
            const haloGrad = ctx.createRadialGradient(
              projX,
              projY,
              currentRadius * 0.4,
              projX,
              projY,
              currentRadius * 2.2
            );
            haloGrad.addColorStop(
              0,
              `rgba(${color.r}, ${color.g}, ${color.b}, ${totalAlpha * 0.3})`
            );
            haloGrad.addColorStop(
              0.55,
              `rgba(${color.r}, ${color.g}, ${color.b}, ${totalAlpha * 0.08})`
            );
            haloGrad.addColorStop(
              1,
              `rgba(${color.r}, ${color.g}, ${color.b}, 0)`
            );

            ctx.fillStyle = haloGrad;
            ctx.beginPath();
            ctx.arc(projX, projY, currentRadius * 2.2, 0, Math.PI * 2);
            ctx.fill();
          }

          // B. 3D Sphere Body with Offset Specular Light Source
          const lightOffsetX = -currentRadius * 0.32;
          const lightOffsetY = -currentRadius * 0.32;

          const sphereGrad = ctx.createRadialGradient(
            projX + lightOffsetX,
            projY + lightOffsetY,
            currentRadius * 0.05,
            projX,
            projY,
            currentRadius
          );

          if (isDark) {
            sphereGrad.addColorStop(
              0,
              `rgba(255, 255, 255, ${totalAlpha * 0.95})`
            );
            sphereGrad.addColorStop(
              0.28,
              `rgba(${color.r}, ${color.g}, ${color.b}, ${totalAlpha * 0.88})`
            );
            sphereGrad.addColorStop(
              0.68,
              `rgba(${color.r}, ${color.g}, ${color.b}, ${totalAlpha * 0.45})`
            );
            sphereGrad.addColorStop(
              1,
              `rgba(${color.r}, ${color.g}, ${color.b}, 0)`
            );
          } else {
            sphereGrad.addColorStop(
              0,
              `rgba(255, 255, 255, ${totalAlpha * 0.9})`
            );
            sphereGrad.addColorStop(
              0.3,
              `rgba(${color.r}, ${color.g}, ${color.b}, ${totalAlpha * 0.82})`
            );
            sphereGrad.addColorStop(
              0.72,
              `rgba(${color.r}, ${color.g}, ${color.b}, ${totalAlpha * 0.5})`
            );
            sphereGrad.addColorStop(
              1,
              `rgba(${color.r}, ${color.g}, ${color.b}, 0)`
            );
          }

          ctx.fillStyle = sphereGrad;
          ctx.beginPath();
          ctx.arc(projX, projY, currentRadius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'spark') {
          // Midground luminous embers
          const sparkGrad = ctx.createRadialGradient(
            projX,
            projY,
            0,
            projX,
            projY,
            currentRadius
          );
          sparkGrad.addColorStop(
            0,
            `rgba(255, 255, 255, ${totalAlpha * 0.92})`
          );
          sparkGrad.addColorStop(
            0.4,
            `rgba(${color.r}, ${color.g}, ${color.b}, ${totalAlpha * 0.72})`
          );
          sparkGrad.addColorStop(
            1,
            `rgba(${color.r}, ${color.g}, ${color.b}, 0)`
          );

          ctx.fillStyle = sparkGrad;
          ctx.beginPath();
          ctx.arc(projX, projY, currentRadius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Deep background delicate starlight with twinkling
          const twinkle =
            0.7 +
            0.3 * Math.sin(currentTime * p.twinkleSpeed + p.twinklePhase);
          const starAlpha = totalAlpha * twinkle;

          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${starAlpha})`;
          ctx.beginPath();
          ctx.arc(projX, projY, Math.max(1, currentRadius * 0.8), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    animationFrameId = requestAnimationFrame(render);

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', updateScrollProgress);
      if (scrollTriggerInstance) scrollTriggerInstance.kill();
    };
  }, [containerRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="contact-particles-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2, // Layered behind hands (z-index: 5,6) and contact card (z-index: 12)
      }}
    />
  );
}
