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
  const portraitRef = useRef(null);

  useEffect(() => {
    let ticking = false;

    const updateHeroFade = () => {
      ticking = false;
      const container = containerRef.current;
      const marquee = marqueeRef.current;
      const portrait = portraitRef.current;
      if (!container || !marquee || !portrait) return;

      const scrollY = window.scrollY || window.pageYOffset || 0;
      const heroHeight = container.offsetHeight || window.innerHeight;

      // When scrolled deep past Hero, stay completely hidden with zero composite cost
      if (scrollY >= heroHeight) {
        if (container.style.visibility !== 'hidden') {
          container.style.visibility = 'hidden';
          container.style.pointerEvents = 'none';
          marquee.style.opacity = '0';
          portrait.style.opacity = '0';
          portrait.style.transform = 'scale(0.96)';
        }
        return;
      }

      // Start fading only when user actually begins leaving the Hero section (~4% scroll)
      // Completely fade out by ~82% of hero height, allowing Projects to emerge cleanly
      const startFade = heroHeight * 0.04;
      const endFade = heroHeight * 0.82;

      if (scrollY <= startFade) {
        // Hero fully visible at top
        container.style.visibility = 'visible';
        container.style.pointerEvents = 'auto';
        marquee.style.opacity = '1';
        portrait.style.opacity = '1';
        portrait.style.transform = '';
      } else if (scrollY >= endFade) {
        // Hero completely faded out before bottom
        container.style.visibility = 'hidden';
        container.style.pointerEvents = 'none';
        marquee.style.opacity = '0';
        portrait.style.opacity = '0';
        portrait.style.transform = 'scale(0.96)';
      } else {
        // Progressive, scroll-driven natural fade
        const rawProgress = (scrollY - startFade) / (endFade - startFade);
        const progress = Math.max(0, Math.min(1, rawProgress));

        const opacity = 1 - progress;
        const scale = 1 - progress * 0.04; // scale: 1 -> 0.96

        container.style.visibility = 'visible';
        container.style.pointerEvents = opacity < 0.1 ? 'none' : 'auto';
        marquee.style.opacity = opacity.toFixed(3);
        portrait.style.opacity = opacity.toFixed(3);
        portrait.style.transform = `scale(${scale.toFixed(4)})`;
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
      </div>

      {/* Main Foreground Visual: Centered Profile Cutout (Layer 10) */}
      <div className="hero-portrait-container">
        <img
          ref={portraitRef}
          src="/final-profile.png"
          onError={(e) => {
            e.currentTarget.src = '/mypic.jpeg';
          }}
          alt="Goutham M"
          className="hero-portrait-img"
          loading="eager"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}

export default Hero;
