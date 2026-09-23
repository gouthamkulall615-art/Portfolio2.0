import React from 'react';
import { Play, Sparkles, Terminal } from 'lucide-react';

export default function Navbar({ onReplayIntro }) {
  return (
    <nav className="anime-nav">
      <a href="#home" className="nav-brand">
        <span className="brand-kanji">影</span>
        <span className="brand-text">KAGE.DEV</span>
      </a>

      <ul className="nav-links">
        <li><a href="#about" className="nav-item active">OVERVIEW</a></li>
        <li><a href="#skills" className="nav-item">NINJUTSU / TECH</a></li>
        <li><a href="#projects" className="nav-item">PROJECT ARSENAL</a></li>
        <li><a href="#contact" className="nav-item">TRANSMISSION</a></li>
      </ul>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button
          id="replay-intro-btn"
          type="button"
          onClick={onReplayIntro}
          className="nav-action-btn"
          title="Re-play the 7s Anime Intro"
        >
          <Play size={14} fill="currentColor" />
          <span>REPLAY INTRO</span>
        </button>
      </div>
    </nav>
  );
}
