import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function VelocityMarquee({ phrase = 'Build · Break · Learn · Repeat ·' }) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const track = trackRef.current;
    if (!track) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Endless seamless horizontal marquee loop
    const loopTween = gsap.to(track, {
      xPercent: -50,
      ease: 'none',
      duration: 22,
      repeat: -1,
    });

    const skewSetter = gsap.quickSetter(track, 'skewX', 'deg');

    // ScrollTrigger velocity listener
    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const velocity = self.getVelocity(); // px / sec

        // Boost marquee timeScale based on scroll speed
        const speedBoost = Math.min(Math.max(velocity / 350, -3.5), 3.5);
        const targetTimeScale = 1 + speedBoost;

        gsap.to(loopTween, {
          timeScale: targetTimeScale,
          duration: 0.25,
          ease: 'power1.out',
          overwrite: 'auto',
          onComplete: () => {
            // Smoothly ease back to standard idle speed
            gsap.to(loopTween, {
              timeScale: 1,
              duration: 1.0,
              ease: 'power2.out',
              overwrite: 'auto',
            });
          },
        });

        // Dynamic organic skew based on velocity (max 5 deg)
        const targetSkew = Math.min(Math.max(-velocity * 0.0035, -5), 5);
        skewSetter(targetSkew);

        // Smoothly ease skew back to 0
        gsap.to(track, {
          skewX: 0,
          duration: 0.9,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      },
    });

    return () => {
      st.kill();
      loopTween.kill();
    };
  }, []);

  // Split phrase units with stylized dots
  const units = phrase.split('·').map(u => u.trim()).filter(Boolean);

  const renderContent = () => (
    <div className="velocity-marquee-content">
      {Array.from({ length: 6 }).map((_, repeatIdx) => (
        <React.Fragment key={repeatIdx}>
          {units.map((unit, unitIdx) => (
            <span key={`${repeatIdx}-${unitIdx}`} className="velocity-phrase">
              {unit} <span className="velocity-dot" aria-hidden="true">·</span>
            </span>
          ))}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className="velocity-marquee-section" aria-hidden="true">
      <div ref={trackRef} className="velocity-marquee-track">
        {renderContent()}
        {renderContent()}
      </div>
    </div>
  );
}

