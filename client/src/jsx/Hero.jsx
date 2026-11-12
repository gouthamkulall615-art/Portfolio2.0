import React from 'react';
import LivingPortrait from '../components/LivingPortrait';
import '../css/HeroPortrait.css';

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
  return (
    <div className="hero-editorial">
      {/* 3 Continuous Background Marquee Rows (Layer 0) */}
      <div className="hero-marquee-wrapper" aria-hidden="true">
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
        <div className="hero-marquee-row row-rtl speed-2">
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

        {/* Row 4: Mobile-only extra row to keep marquee typography dense and eliminate gaps */}
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

      {/* Centered Dominant Living Portrait (Layer 10) */}
      <LivingPortrait />

      {/* Centered Floating Glass Pill at Bottom (Layer 20) */}
      <nav className="hero-glass-pill" aria-label="Direct links">
        <a
          href="https://www.linkedin.com/in/goutham-m-ba2224385/"
          target="_blank"
          rel="noopener noreferrer"
          className="hero-pill-link contact-btn"
          aria-label="Visit LinkedIn Profile"
        >
          <svg
            className="hero-pill-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
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
            className="hero-pill-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
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
          aria-label="View Resume PDF"
        >
          <svg
            className="hero-pill-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
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

        <a
          href="https://www.linkedin.com/in/goutham-m-ba2224385/"
          target="_blank"
          rel="noopener noreferrer"
          className="hero-pill-link"
          aria-label="Contact Me"
        >
          <span>Contact Me</span>
          <svg
            className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </a>
      </nav>
    </div>
  );
}

export default Hero;
