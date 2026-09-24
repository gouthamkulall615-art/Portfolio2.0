import React, { useState } from 'react';
import CinematicIntro from './components/CinematicIntro';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import './styles/anime.css';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  return (
    <div className="portfolio-app-root">
      {/* Minimal Cinematic Intro Sequence */}
      {showIntro && (
        <CinematicIntro onComplete={handleIntroComplete} />
      )}

      {/* Main Anime Portfolio Application */}
      <div className="portfolio-shell">
        <Navbar onReplayIntro={handleReplayIntro} />
        <main>
          <HeroSection onReplayIntro={handleReplayIntro} />
        </main>
      </div>
    </div>
  );
}
