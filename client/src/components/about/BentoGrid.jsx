import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * EDITABLE CARDS ARRAY
 * Customize titles, descriptions, and details for each card.
 */
export const DEFAULT_CARDS = [
  {
    id: 'mern',
    gridClass: 'bento-card-featured bento-card-span-2',
    badge: 'Full-Stack Architecture',
    title: 'MERN Stack Engineering',
    desc: 'Engineering scalable, reactive web platforms with React 19, Node.js, Express, and MongoDB. Focused on clean state machines, modular RESTful APIs, real-time WebSockets, and fluid motion design.',
    type: 'chips',
    chips: ['React 19', 'Node.js', 'Express', 'MongoDB', 'TypeScript', 'WebSockets', 'Tailwind'],
  },
  {
    id: 'dsa',
    gridClass: 'bento-card-span-1',
    badge: 'Algorithms',
    title: 'DSA in C++',
    desc: 'Practicing algorithmic intuition and time-space optimization with modern C++. Consistently solving complex graph algorithms, dynamic programming, and data structure problems.',
    type: 'chips',
    chips: ['C++20', 'STL', 'Dynamic Programming', 'Graphs', 'Trees'],
  },
  {
    id: 'gdg',
    gridClass: 'bento-card-span-1',
    badge: 'Community',
    title: 'GDG Tech Team',
    desc: 'Active core contributor on the Google Developer Groups campus tech team. Organizing developer workshops, hackathons, and technical hands-on bootcamps.',
    type: 'status',
    statusText: 'Core Contributor · GDG UVCE',
  },
  {
    id: 'building',
    gridClass: 'bento-card-span-1',
    badge: 'In Progress',
    title: 'Currently Building',
    desc: 'Architecting real-time collaborative applications, generative canvas environments, and experimental WebGL interactive canvas components with high frame rates.',
    type: 'pulse',
    pulseText: 'Live Audio & Canvas Workspaces',
  },
  {
    id: 'education',
    gridClass: 'bento-card-span-1',
    badge: '2025 — 2029',
    title: 'UVCE Bangalore',
    desc: 'Pursuing B.Tech in Computer Science & Engineering at University Visvesvaraya College of Engineering. Merging strong computer science fundamentals with modern production software craft.',
    type: 'accentLine',
    accentText: 'Dept of Computer Science & Engineering',
  },
];

export default function BentoGrid({ cards = DEFAULT_CARDS }) {
  const gridRef = useRef(null);

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
      // gsap.quickTo for smooth 60fps tilt
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
            <div className="bento-card-content">
              <div className="bento-card-top">
                <h3 className="bento-card-title">{card.title}</h3>
                {card.badge && (
                  <span className="bento-card-badge">{card.badge}</span>
                )}
              </div>

              <p className="bento-card-desc">{card.desc}</p>

              {/* Sub-details depending on card type */}
              {card.type === 'chips' && card.chips && (
                <div className="bento-chips-row">
                  {card.chips.map((chip, idx) => (
                    <span key={idx} className="bento-chip">{chip}</span>
                  ))}
                </div>
              )}

              {card.type === 'pulse' && (
                <div className="bento-status-row">
                  <span className="bento-pulse-dot" aria-hidden="true" />
                  <span>{card.pulseText}</span>
                </div>
              )}

              {card.type === 'status' && (
                <div className="bento-status-row">
                  <span>{card.statusText}</span>
                </div>
              )}

              {card.type === 'accentLine' && (
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--about-dim-text)', marginBottom: '0.6rem' }}>
                    {card.accentText}
                  </div>
                  <div className="bento-accent-line" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

