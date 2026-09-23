import React, { useState } from 'react';
import AnimeLoader from './components/AnimeLoader';
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
      {/* 7-Second Anime Intro / Loader Sequence */}
      {showIntro && (
        <AnimeLoader onComplete={handleIntroComplete} />
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
