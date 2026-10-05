import React, { useEffect, useRef } from 'react';
import './Hero.css';

const row1Units = ['I’M GOUTHAM', 'I’M GOUTHAM', 'I’M GOUTHAM'];
const row2Units = ['WEB DEVELOPER', 'MERN STACK', 'CREATIVE BUILDER'];
const row3Units = ['PROBLEM SOLVER', 'DSA ENTHUSIAST', 'ALWAYS LEARNING'];

const renderRowContent = (units, repeat = 4, isItalic = false) => {
  const items = [];
  for (let r = 0; r < repeat; r++) {
    units.forEach((unit, idx) => {
      items.push(
        <span
          className={`hero-marquee-item ${isItalic ? 'is-italic' : ''}`}
          key={`${r}-${idx}`}
        >
          <span className="hero-text-phrase">{unit}</span>
          <span className="hero-divider" aria-hidden="true">
            •
          </span>
        </span>
      );
    });
  }
  return items;
};

export function Hero() {
  const containerRef = useRef(null);
  const marqueeRef = useRef(null);
  const portraitFrameRef = useRef(null);
  const animeLayerRef = useRef(null);
  const pillRef = useRef(null);

  // 1. Scroll-driven fade transition (Hero -> Projects)
  useEffect(() => {
    let ticking = false;

    const updateHeroFade = () => {
      ticking = false;
      const container = containerRef.current;
      const marquee = marqueeRef.current;
      const portraitFrame = portraitFrameRef.current;
      const pill = pillRef.current;
      if (!container || !marquee || !portraitFrame) return;

      const scrollY = window.scrollY || window.pageYOffset || 0;
      const heroHeight = container.offsetHeight || window.innerHeight;

      // When scrolled deep past Hero, stay completely hidden with zero composite cost
      if (scrollY >= heroHeight) {
        if (container.style.visibility !== 'hidden') {
          container.style.visibility = 'hidden';
          container.style.pointerEvents = 'none';
          marquee.style.opacity = '0';
          portraitFrame.style.opacity = '0';
          portraitFrame.style.transform = 'scale(0.96)';
          if (pill) {
            pill.style.opacity = '0';
            pill.style.pointerEvents = 'none';
          }
        }
        return;
      }

      // Start fading only when user actually begins leaving the Hero section (~4% scroll)
      // Completely fade out by ~82% of hero height, allowing Projects to emerge cleanly
      const startFade = heroHeight * 0.04;
      const endFade = heroHeight * 0.82;

      if (scrollY <= startFade) {
        // Hero fully visible at top — clear inline styles so CSS handles responsive opacities cleanly
        container.style.visibility = 'visible';
        container.style.pointerEvents = 'auto';
        marquee.style.opacity = '';
        portraitFrame.style.opacity = '';
        portraitFrame.style.transform = '';
        if (pill) {
          pill.style.opacity = '';
          pill.style.pointerEvents = '';
        }
      } else if (scrollY >= endFade) {
        // Hero completely faded out before bottom
        container.style.visibility = 'hidden';
        container.style.pointerEvents = 'none';
        marquee.style.opacity = '0';
        portraitFrame.style.opacity = '0';
        portraitFrame.style.transform = 'scale(0.96)';
        if (pill) {
          pill.style.opacity = '0';
          pill.style.pointerEvents = 'none';
        }
      } else {
        // Progressive, scroll-driven natural fade
        const rawProgress = (scrollY - startFade) / (endFade - startFade);
        const progress = Math.max(0, Math.min(1, rawProgress));

        const opacity = 1 - progress;
        const scale = 1 - progress * 0.04; // scale: 1 -> 0.96

        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
        const baseMarqueeOpacity = isMobile ? 0.42 : 1;

        container.style.visibility = 'visible';
        container.style.pointerEvents = opacity < 0.1 ? 'none' : 'auto';
        marquee.style.opacity = (opacity * baseMarqueeOpacity).toFixed(3);
        portraitFrame.style.opacity = opacity.toFixed(3);
        portraitFrame.style.transform = `scale(${scale.toFixed(4)})`;
        if (pill) {
          pill.style.opacity = opacity.toFixed(3);
          pill.style.pointerEvents = opacity < 0.15 ? 'none' : '';
        }
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateHeroFade);
        ticking = true;
      }
    };

    // Initial check on mount
    updateHeroFade();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // 2. Cursor-following radial reveal effect (Easter Egg: Anime image peek)
  useEffect(() => {
    // Disable completely on touch devices / devices without hover
    if (window.matchMedia('(hover: none)').matches) return;

    const frame = portraitFrameRef.current;
    const animeLayer = animeLayerRef.current;
    if (!frame || !animeLayer) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let targetProgress = 0;
    let currentProgress = 0;
    let isHovering = false;
    let rafId = null;

    const lerp = (start, end, factor) => start + (end - start) * factor;

    const renderLoop = () => {
      // Smooth interpolation/lerp for fluid cursor follow
      currentX = lerp(currentX, targetX, 0.15);
      currentY = lerp(currentY, targetY, 0.15);

      // Smooth reveal progress lerp
      currentProgress = lerp(currentProgress, targetProgress, isHovering ? 0.18 : 0.12);

      if (currentProgress > 0.005) {
        // Feathered circular mask: 80px - 140px desktop radius with smooth gradient edge
        const outerRadius = 115 * currentProgress;
        const innerRadius = 38 * currentProgress;
        const mask = `radial-gradient(circle ${outerRadius.toFixed(1)}px at ${currentX.toFixed(1)}px ${currentY.toFixed(1)}px, black 0%, black ${innerRadius.toFixed(1)}px, transparent 100%)`;

        animeLayer.style.maskImage = mask;
        animeLayer.style.webkitMaskImage = mask;
        animeLayer.style.opacity = currentProgress.toFixed(3);
        animeLayer.style.visibility = 'visible';

        rafId = requestAnimationFrame(renderLoop);
      } else {
        // Fully hidden when mouse leaves
        animeLayer.style.opacity = '0';
        animeLayer.style.visibility = 'hidden';
        animeLayer.style.maskImage = 'none';
        animeLayer.style.webkitMaskImage = 'none';
        rafId = null;
      }
    };

    const handlePointerMove = (e) => {
      const rect = frame.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;

      if (!isHovering) {
        isHovering = true;
        targetProgress = 1;
        if (currentProgress < 0.05) {
          currentX = targetX;
          currentY = targetY;
        }
        if (!rafId) {
          rafId = requestAnimationFrame(renderLoop);
        }
      }
    };

    const handlePointerEnter = (e) => {
      const rect = frame.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      currentX = targetX;
      currentY = targetY;
      isHovering = true;
      targetProgress = 1;
      if (!rafId) {
        rafId = requestAnimationFrame(renderLoop);
      }
    };

    const handlePointerLeave = () => {
      isHovering = false;
      targetProgress = 0;
      if (!rafId) {
        rafId = requestAnimationFrame(renderLoop);
      }
    };

    frame.addEventListener('pointermove', handlePointerMove, { passive: true });
    frame.addEventListener('pointerenter', handlePointerEnter, { passive: true });
    frame.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    return () => {
      frame.removeEventListener('pointermove', handlePointerMove);
      frame.removeEventListener('pointerenter', handlePointerEnter);
      frame.removeEventListener('pointerleave', handlePointerLeave);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="hero-editorial">
      {/* 3 Continuous Background Marquee Rows (Layer 1) */}
      <div ref={marqueeRef} className="hero-marquee-wrapper" aria-hidden="true">
        {/* Row 1: Left to Right - Bold Modern Sans */}
        <div className="hero-marquee-row row-ltr speed-1">
          <div className="hero-marquee-track">
            <div className="hero-marquee-content row-1-content">
              {renderRowContent(row1Units, 4, false)}
            </div>
            <div className="hero-marquee-content row-1-content" aria-hidden="true">
              {renderRowContent(row1Units, 4, false)}
            </div>
          </div>
        </div>

        {/* Row 2: Right to Left - Sophisticated Editorial Italic */}
        <div className="hero-marquee-row row-rtl speed-2 row-special-italic">
          <div className="hero-marquee-track">
            <div className="hero-marquee-content row-2-content">
              {renderRowContent(row2Units, 4, true)}
            </div>
            <div className="hero-marquee-content row-2-content" aria-hidden="true">
              {renderRowContent(row2Units, 4, true)}
            </div>
          </div>
        </div>

        {/* Row 3: Left to Right - Bold Modern Sans */}
        <div className="hero-marquee-row row-ltr speed-3">
          <div className="hero-marquee-track">
            <div className="hero-marquee-content row-3-content">
              {renderRowContent(row3Units, 4, false)}
            </div>
            <div className="hero-marquee-content row-3-content" aria-hidden="true">
              {renderRowContent(row3Units, 4, false)}
            </div>
          </div>
        </div>

        {/* Row 4: Mobile-only extra row for dense continuous editorial background */}
        <div className="hero-marquee-row row-rtl speed-2 hero-marquee-row-mobile-only">
          <div className="hero-marquee-track">
            <div className="hero-marquee-content row-2-content">
              {renderRowContent(row2Units, 4, true)}
            </div>
            <div className="hero-marquee-content row-2-content" aria-hidden="true">
              {renderRowContent(row2Units, 4, true)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Foreground Visual: Portrait Stack & Interactive Glass Pill (Layer 10) */}
      <div className="hero-portrait-container">
        <div className="hero-portrait-wrapper">
          {/* Portrait Frame holding both Real Photograph & Anime Reveal Layer */}
          <div ref={portraitFrameRef} className="hero-portrait-frame">
            {/* Primary Real Photograph */}
            <picture className="hero-portrait-picture">
              <source media="(max-width: 768px)" srcSet="/final-profile-portrait.png" />
              <img
                src="/final-profile.png"
                onError={(e) => {
                  e.currentTarget.src = '/mypic.jpeg';
                }}
                alt="Goutham M"
                className="hero-portrait-img hero-portrait-real"
                loading="eager"
                fetchPriority="high"
              />
            </picture>

            {/* Anime Easter-Egg Reveal Layer (feathered radial mask around cursor) */}
            <div
              ref={animeLayerRef}
              className="hero-portrait-anime-layer"
              aria-hidden="true"
            >
              <img
                src="/animeversion.png"
                onError={(e) => {
                  e.currentTarget.src = '/assets/anime version-Photoroom.png';
                }}
                alt=""
                className="hero-portrait-img hero-portrait-anime"
                loading="eager"
              />
            </div>
          </div>

          {/* Interactive Glass Pill directly underneath portrait */}
          <nav
            ref={pillRef}
            className="hero-glass-pill"
            aria-label="Direct links to LinkedIn, GitHub, and Resume"
          >
            <a
              href="https://www.linkedin.com/in/goutham-m-ba2224385/"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-pill-link"
              aria-label="Visit LinkedIn Profile"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="hero-pill-icon"
                aria-hidden="true"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              <span>LinkedIn</span>
            </a>

            <a
              href="https://github.com/gouthamkulall615-art"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-pill-link"
              aria-label="Visit GitHub Profile"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="hero-pill-icon"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub</span>
            </a>

            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-pill-link hero-pill-resume"
              aria-label="View or download Resume PDF"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="hero-pill-icon"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Resume</span>
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default Hero;
