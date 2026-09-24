import React, { useState } from 'react';
import CinematicIntro from './components/CinematicIntro';
import SplashCursor from './components/SplashCursor';
import Lanyard from './components/Lanyard';
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
      {/* Fluid Interactive Mouse Cursor Effect */}
      <SplashCursor />

      {/* Minimal Cinematic Intro Sequence */}
      {showIntro && (
        <CinematicIntro onComplete={handleIntroComplete} />
      )}

      {/* Main Dark Canvas */}
      <div className="portfolio-dark-canvas">
        <div className="portfolio-layout">
          {/* Details area */}
          <div className="portfolio-details-col">
            {/* Reserved for user details */}
          </div>

          {/* 3D Lanyard Card with user picture */}
          <div className="portfolio-lanyard-col">
            <Lanyard
              position={[0, 0, 13]}
              gravity={[0, -40, 0]}
              frontImage="/mypic.jpeg"
              backImage="/mypic.jpeg"
              imageFit="cover"
              cardScale={3.2}
              lanyardWidth={1.4}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleReplayIntro}
          className="replay-intro-pill"
          title="Replay Intro"
        >
          REPLAY INTRO
        </button>
      </div>
    </div>
  );
}
