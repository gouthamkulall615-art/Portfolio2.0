import React, { useLayoutEffect, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from 'lenis/react';

import SplitStatement from '../components/about/SplitStatement';
import StatsRow, { DEFAULT_STATS } from '../components/about/StatsRow';
import BentoGrid, { CARDS as DEFAULT_CARDS } from '../components/about/BentoGrid';
import '../css/About.css';

// Isomorphic layout effect for clean hydration
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * ============================================================================
 * EDITABLE CONFIGURATION (Easily customize copy, stats, and bento cards)
 * ============================================================================
 */
export const STATEMENT_TEXT =
  "I'm Goutham, a CS student at UVCE who turns ideas into full-stack products and sharpens my thinking with DSA";

export const STATS = DEFAULT_STATS;
export const CARDS = DEFAULT_CARDS;

export default function About() {
  const sectionRef = useRef(null);

  // Sync GSAP ScrollTrigger with Lenis smooth scrolling if active
  try {
    useLenis(() => {
      ScrollTrigger.update();
    });
  } catch {
    // Lenis context fallback if outside provider
  }

  useIsomorphicLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    // Use gsap.context for flawless React StrictMode cleanup & no duplicate triggers
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // ------------------------------------------------------------------------
      // DESKTOP EXPERIENCE: Pinned Statement, Scrubbed Blur, 3D Bento & Counters
      // ------------------------------------------------------------------------
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        const statementWrap = section.querySelector('.statement-pinned-wrapper');
        const words = section.querySelectorAll('.statement-word');
        const underlinePaths = section.querySelectorAll('.statement-underline-path');

        if (statementWrap && words.length > 0) {
          // Initialize statement words to low opacity with subtle blur
          gsap.set(words, {
            opacity: 0.15,
            filter: 'blur(8px)',
            y: 20,
          });

          // Measure and initialize SVG underlines
          underlinePaths.forEach((path) => {
            const len = path.getTotalLength ? path.getTotalLength() : 180;
            path.style.strokeDasharray = `${len}`;
            path.style.strokeDashoffset = `${len}`;
          });

          // Pinned scrub timeline: 150% viewport scrub
          const statementTL = gsap.timeline({
            scrollTrigger: {
              trigger: statementWrap,
              pin: true,
              scrub: 0.8,
              start: 'top top',
              end: '+=150%',
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          // Animate words into crisp focus
          statementTL.to(words, {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            stagger: 0.1,
            ease: 'power1.out',
          });

          // Animate hand-drawn underlines right as the highlighted words resolve
          underlinePaths.forEach((path) => {
            statementTL.to(
              path,
              {
                strokeDashoffset: 0,
                duration: 0.45,
                ease: 'power2.out',
              },
              '<+=0.15'
            );
          });
        }

        // Stats Row Animations (Counters & Dividers)
        const statsWrap = section.querySelector('.stats-section-wrap');
        const statDividers = section.querySelectorAll('.stat-divider');
        const statNumbers = section.querySelectorAll('.stat-number');

        if (statsWrap) {
          // Draw in vertical dividers
          gsap.fromTo(
            statDividers,
            { scaleY: 0 },
            {
              scaleY: 1,
              duration: 1.0,
              stagger: 0.18,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: statsWrap,
                start: 'top 82%',
                once: true,
              },
            }
          );

          // Numeric count-up with precision rounding
          ScrollTrigger.create({
            trigger: statsWrap,
            start: 'top 82%',
            once: true,
            onEnter: () => {
              statNumbers.forEach((el) => {
                const targetVal = parseFloat(el.getAttribute('data-target-value') || '0');
                const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
                const isText = el.getAttribute('data-is-text') === 'true';
                const displayTarget = el.getAttribute('data-display-target') || '';

                if (isText && displayTarget) {
                  el.textContent = displayTarget;
                  return;
                }

                const counter = { val: 0 };
                gsap.to(counter, {
                  val: targetVal,
                  duration: 2.0,
                  ease: 'power2.out',
                  onUpdate: () => {
                    el.textContent = counter.val.toFixed(decimals);
                  },
                  onComplete: () => {
                    el.textContent = targetVal.toFixed(decimals);
                  },
                });
              });
            },
          });
        }

        // Bento Grid Staggered Entrance
        const bentoWrap = section.querySelector('.bento-section-wrap');
        const bentoCards = section.querySelectorAll('.bento-card');

        if (bentoWrap && bentoCards.length > 0) {
          gsap.fromTo(
            bentoCards,
            { y: 45, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.85,
              stagger: 0.12,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: bentoWrap,
                start: 'top 78%',
                once: true,
              },
            }
          );
        }
      });

      // ------------------------------------------------------------------------
      // MOBILE EXPERIENCE: No Pinning, Touch-Friendly Smooth Reveal
      // ------------------------------------------------------------------------
      mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
        const words = section.querySelectorAll('.statement-word');
        const underlinePaths = section.querySelectorAll('.statement-underline-path');
        const statsWrap = section.querySelector('.stats-section-wrap');
        const statNumbers = section.querySelectorAll('.stat-number');
        const bentoWrap = section.querySelector('.bento-section-wrap');
        const bentoCards = section.querySelectorAll('.bento-card');

        // Show underlines without delay on mobile
        underlinePaths.forEach((path) => {
          path.style.strokeDasharray = '200';
          path.style.strokeDashoffset = '0';
        });

        // Gentle fade-in for statement without screen locking
        if (words.length > 0) {
          gsap.fromTo(
            words,
            { opacity: 0.2, filter: 'blur(4px)', y: 14 },
            {
              opacity: 1,
              filter: 'blur(0px)',
              y: 0,
              stagger: 0.04,
              duration: 0.6,
              scrollTrigger: {
                trigger: '.statement-content',
                start: 'top 85%',
                once: true,
              },
            }
          );
        }

        // Mobile numeric count-up
        if (statsWrap) {
          ScrollTrigger.create({
            trigger: statsWrap,
            start: 'top 85%',
            once: true,
            onEnter: () => {
              statNumbers.forEach((el) => {
                const targetVal = parseFloat(el.getAttribute('data-target-value') || '0');
                const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
                const isText = el.getAttribute('data-is-text') === 'true';
                const displayTarget = el.getAttribute('data-display-target') || '';

                if (isText && displayTarget) {
                  el.textContent = displayTarget;
                  return;
                }

                const counter = { val: 0 };
                gsap.to(counter, {
                  val: targetVal,
                  duration: 1.8,
                  ease: 'power2.out',
                  onUpdate: () => {
                    el.textContent = counter.val.toFixed(decimals);
                  },
                  onComplete: () => {
                    el.textContent = targetVal.toFixed(decimals);
                  },
                });
              });
            },
          });
        }

        // Mobile Bento cards reveal
        if (bentoWrap && bentoCards.length > 0) {
          gsap.fromTo(
            bentoCards,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              stagger: 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: bentoWrap,
                start: 'top 85%',
                once: true,
              },
            }
          );
        }
      });

      // ------------------------------------------------------------------------
      // ACCESSIBILITY: PREFERS REDUCED MOTION
      // ------------------------------------------------------------------------
      mm.add('(prefers-reduced-motion: reduce)', () => {
        const words = section.querySelectorAll('.statement-word');
        const underlinePaths = section.querySelectorAll('.statement-underline-path');
        const statNumbers = section.querySelectorAll('.stat-number');
        const bentoCards = section.querySelectorAll('.bento-card');

        gsap.set(words, { opacity: 1, filter: 'none', y: 0 });
        underlinePaths.forEach((path) => {
          path.style.strokeDashoffset = '0';
        });

        statNumbers.forEach((el) => {
          const targetVal = parseFloat(el.getAttribute('data-target-value') || '0');
          const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
          const isText = el.getAttribute('data-is-text') === 'true';
          const displayTarget = el.getAttribute('data-display-target') || '';
          el.textContent = isText && displayTarget ? displayTarget : targetVal.toFixed(decimals);
        });

        gsap.set(bentoCards, { opacity: 1, y: 0 });
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section id="about" ref={sectionRef} className="about-section" aria-labelledby="about-heading">
      {/* Quiet GPU-Light Blurred Ambient Background */}
      <div className="about-ambient-container" aria-hidden="true">
        <div className="about-ambient-shape shape-1" />
        <div className="about-ambient-shape shape-2" />
        <div className="about-ambient-shape shape-3" />
      </div>

      <div className="about-inner">
        {/* 1. Pinned Statement */}
        <SplitStatement statementText={STATEMENT_TEXT} />

        {/* 2. Interactive Stats Row */}
        <StatsRow stats={STATS} />

        {/* 3. Bento Grid "What Makes Me, Me" */}
        <BentoGrid cards={CARDS} />
      </div>
    </section>
  );
}

