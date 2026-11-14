import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

/**
 * ============================================================================
 * EDITABLE CARDS ARRAY
 * Customize titles, one-liners, badges, and hook values here.
 * ============================================================================
 */
export const CARDS = [
  {
    id: 'mern',
    gridClass: 'bento-mern',
    badge: 'Full-Stack',
    title: 'MERN Stack',
    oneLiner: 'Scalable reactive full-stack web applications.',
    type: 'mern-pipeline',
    nodes: ['Mongo', 'Express', 'React', 'Node'],
    chips: ['React 19', 'Node.js', 'MongoDB'],
  },
  {
    id: 'dsa',
    gridClass: 'bento-dsa',
    badge: 'C++20',
    title: 'DSA in C++',
    oneLiner: 'Algorithmic problem solving and optimization.',
    type: 'dsa-heatmap',
    statNumber: '200+',
    statLabel: 'Problems Solved',
  },
  {
    id: 'gdg',
    gridClass: 'bento-gdg',
    badge: 'Campus',
    title: 'GDG Tech',
    oneLiner: 'Developer community organizer and core team.',
    type: 'gdg-dots',
  },
  {
    id: 'building',
    gridClass: 'bento-building',
    badge: 'Live',
    title: 'Currently Building',
    oneLiner: 'Real-time collaborative tools and interfaces.',
    type: 'live-typing',
    projects: ['SyncCanvas', 'InternIQ', 'Portfolio 2.0'],
  },
  {
    id: 'education',
    gridClass: 'bento-education',
    badge: 'UVCE',
    title: 'UVCE Bangalore',
    oneLiner: 'B.Tech in Computer Science & Engineering.',
    type: 'degree-progress',
    timeline: '2025 — 2029',
    progress: 38,
    progressLabel: 'Year 2 of 4 · Sem 4',
  },
];

// 28 squares for the 7x4 contribution grid (pre-calculated levels for static harmony)
const CONTRIBUTION_LEVELS = [
  1, 2, 0, 3, 2, 1, 3,
  0, 1, 3, 2, 0, 2, 1,
  2, 3, 1, 0, 3, 1, 2,
  1, 0, 2, 3, 1, 3, 2,
];

export default function BentoGrid({ cards = CARDS }) {
  const gridRef = useRef(null);

  // Live Typing Effect for Currently Building card
  const [typedText, setTypedText] = useState('');
  const [projectIndex, setProjectIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const buildingCard = cards.find(c => c.id === 'building');
    const projectList = buildingCard?.projects || ['SyncCanvas', 'InternIQ', 'Portfolio 2.0'];

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setTypedText(projectList[0]);
      return;
    }

    const currentWord = projectList[projectIndex % projectList.length];
    const typingSpeed = isDeleting ? 45 : 95;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setTypedText(currentWord.slice(0, typedText.length + 1));
        if (typedText.length + 1 === currentWord.length) {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        setTypedText(currentWord.slice(0, typedText.length - 1));
        if (typedText.length === 0) {
          setIsDeleting(false);
          setProjectIndex(prev => prev + 1);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, projectIndex, cards]);

  // Setup cursor spotlight tracking & smooth GSAP 3D tilt
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const isTouch = window.matchMedia('(hover: none)').matches;
    const isMobile = window.innerWidth < 768;
    if (isTouch || isMobile) return;

    const cardElements = grid.querySelectorAll('.bento-card');
    const cleanups = [];

    cardElements.forEach(card => {
      const quickTiltX = gsap.quickTo(card, 'rotationX', { duration: 0.35, ease: 'power2.out' });
      const quickTiltY = gsap.quickTo(card, 'rotationY', { duration: 0.35, ease: 'power2.out' });

      const handleMouseMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Custom spotlight coordinates (CSS variables)
        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);

        // Subtle 3D tilt calculation (capped at 5 degrees)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tiltY = ((x - centerX) / centerX) * 5;
        const tiltX = -((y - centerY) / centerY) * 5;

        quickTiltY(tiltY);
        quickTiltX(tiltX);
      };

      const handleMouseLeave = () => {
        quickTiltX(0);
        quickTiltY(0);
      };

      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);

      cleanups.push(() => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      });
    });

    return () => {
      cleanups.forEach(fn => fn());
    };
  }, []);

  return (
    <div className="bento-section-wrap">
      <div className="bento-header">
        <span className="bento-kicker">Core Dimensions</span>
        <h2 id="about-heading" className="bento-main-heading">
          What makes me, <span className="bento-heading-script">me</span>
        </h2>
      </div>

      <div ref={gridRef} className="bento-grid">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`bento-card ${card.gridClass || ''}`}
            data-card-id={card.id}
          >
            {/* Small top-right absolute badge pill */}
            {card.badge && (
              <span className="bento-corner-badge" aria-hidden="true">
                {card.badge}
              </span>
            )}

            <div className="bento-card-content">
              {/* Header with strictly no-wrap title & 1 short line description */}
              <div className="bento-card-header">
                <h3 className="bento-card-title">{card.title}</h3>
                <p className="bento-card-oneliner">{card.oneLiner}</p>
              </div>

              {/* =============================================================
                  VISUAL HOOK 1: MERN Stack Pipeline with travelling dot
                  ============================================================= */}
              {card.type === 'mern-pipeline' && (
                <div className="hook-mern-wrap">
                  <div className="mern-pipeline-track" aria-hidden="true">
                    <div className="mern-travelling-dot" />
                    <div className="mern-nodes-row">
                      {card.nodes.map((node, i) => (
                        <div key={i} className="mern-node-item">
                          <span className="mern-node-indicator" />
                          <span className="mern-node-name">{node}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {card.chips && (
                    <div className="bento-chips-compact">
                      {card.chips.map((chip, i) => (
                        <span key={i} className="bento-chip-pill">{chip}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* =============================================================
                  VISUAL HOOK 2: DSA in C++ (200+ stat & 7x4 contribution grid)
                  ============================================================= */}
              {card.type === 'dsa-heatmap' && (
                <div className="hook-dsa-wrap">
                  <div className="dsa-stat-cluster">
                    <span className="dsa-big-number">{card.statNumber}</span>
                    <span className="dsa-stat-label">{card.statLabel}</span>
                  </div>
                  <div className="dsa-mini-heatmap" aria-hidden="true">
                    {CONTRIBUTION_LEVELS.map((level, idx) => (
                      <div
                        key={idx}
                        className={`heatmap-cell level-${level}`}
                        style={{ animationDelay: `${(idx % 7) * 0.18 + Math.floor(idx / 7) * 0.25}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* =============================================================
                  VISUAL HOOK 3: GDG Tech with 4 pulsing Google-colored dots
                  ============================================================= */}
              {card.type === 'gdg-dots' && (
                <div className="hook-gdg-wrap">
                  <div className="gdg-logo-cluster">
                    <span className="gdg-big-text">GDG</span>
                    <div className="google-dots-row" aria-hidden="true">
                      <span className="g-dot g-blue" />
                      <span className="g-dot g-red" />
                      <span className="g-dot g-yellow" />
                      <span className="g-dot g-green" />
                    </div>
                  </div>
                  <div className="gdg-sub-pill">Campus Core Team</div>
                </div>
              )}

              {/* =============================================================
                  VISUAL HOOK 4: Currently Building with live typing ticker
                  ============================================================= */}
              {card.type === 'live-typing' && (
                <div className="hook-building-wrap">
                  <div className="live-status-pill">
                    <span className="live-pulse-dot" aria-hidden="true" />
                    <span>LIVE STATUS</span>
                  </div>
                  <div className="typing-console-box">
                    <span className="typing-prompt">&gt;</span>
                    <span className="typing-project-name">{typedText}</span>
                    <span className="typing-cursor" aria-hidden="true">_</span>
                  </div>
                </div>
              )}

              {/* =============================================================
                  VISUAL HOOK 5: UVCE Degree Timeline & Progress Bar
                  ============================================================= */}
              {card.type === 'degree-progress' && (
                <div className="hook-education-wrap">
                  <div className="education-timeline-text">{card.timeline}</div>
                  <div className="degree-progress-bar-wrap" aria-hidden="true">
                    <div
                      className="degree-progress-bar-fill"
                      style={{ width: `${card.progress}%` }}
                    />
                  </div>
                  <div className="degree-progress-label">
                    <span>{card.progressLabel}</span>
                    <span>{card.progress}% Completed</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
