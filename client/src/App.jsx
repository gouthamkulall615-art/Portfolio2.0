import React, { useState } from 'react';
import CinematicIntro from './components/CinematicIntro';
import SplashCursor from './components/SplashCursor';
import GooeyNav from './components/GooeyNav';
import Lanyard from './components/Lanyard';
import './styles/anime.css';

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Projects', href: '#projects' },
  { label: 'Education', href: '#education' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact', href: '#contact' },
];

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

      {/* Floating Top GooeyNav */}
      <header className="portfolio-header">
        <GooeyNav
          items={navItems}
          particleCount={15}
          particleDistances={[80, 10]}
          particleR={90}
          initialActiveIndex={0}
          animationTime={600}
          timeVariance={250}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
        />
      </header>

      {/* Main Dark Canvas */}
      <div className="portfolio-dark-canvas">
        <div className="portfolio-layout">
          {/* Left: Reserved for details */}
          <div className="portfolio-details-col">
            {/* Details will be added here */}
          </div>

          {/* Right: 3D Draggable Lanyard Card */}
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

        {/* Floating Replay Intro Pill Button */}
        <button
          type="button"
          onClick={handleReplayIntro}
          className="replay-intro-pill"
          title="Replay Cinematic Intro"
        >
          REPLAY INTRO
        </button>
      </div>
    </div>
  );
}
