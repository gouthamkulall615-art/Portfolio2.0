import React, { useState, lazy, Suspense } from 'react';
import CinematicIntro from './jsx/CinematicIntro';
import GooeyNav from './jsx/GooeyNav';
import StaggeredMenu from './jsx/StaggeredMenu';
import { Hero } from './jsx/Hero';
import EducationSection from './jsx/EducationSection';
import MarqueeBanner from './jsx/MarqueeBanner';
import { AnimatedThemeToggler } from './jsx/AnimatedThemeToggler';
import './css/anime.css';

import Skills from './jsx/Skills';
import CustomCursor from './jsx/CustomCursor';

// Code-split heavy 3D and media-rich sections for fast initial load
const ProjectsSection = lazy(() => import('./jsx/ProjectsSection'));
const ContactSection = lazy(() => import('./jsx/ContactSection'));
const CinematicFooter = lazy(() => import('./jsx/CinematicFooter'));
const AnimeCards = lazy(() => import('./jsx/AnimeDeck'));

const navItems = [
  { label: 'Home', href: '#home', ariaLabel: 'Go to home section' },
  { label: 'Projects', href: '#projects', ariaLabel: 'View projects' },
  { label: 'Skills', href: '#skills', ariaLabel: 'View skills' },
  { label: 'Education', href: '#education', ariaLabel: 'View education' },
  { label: 'Contact', href: '#contact', ariaLabel: 'Get in touch' },
];

const socialItems = [
  { label: 'GitHub', link: 'https://github.com/gouthamkulall615-art' },
  { label: 'LinkedIn', link: 'https://linkedin.com' },
];

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  return (
    <div className="portfolio-app-root">
      {/* Crisp high-contrast custom cursor */}
      <CustomCursor />

      {/* Minimal Cinematic Intro Sequence */}
      {showIntro && (
        <CinematicIntro onComplete={handleIntroComplete} />
      )}

      {/* Floating Top GooeyNav for Desktop with AnimatedThemeToggler on right */}
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
        <AnimatedThemeToggler />
      </header>

      {/* Mobile Responsive Staggered Sidebar Menu (Opens from Left to Right) */}
      <div className="mobile-staggered-menu">
        <StaggeredMenu
          position="left"
          items={navItems}
          socialItems={socialItems}
          displaySocials={true}
          displayItemNumbering={true}
          menuButtonColor="#ffffff"
          openMenuButtonColor="#ffffff"
          changeMenuColorOnOpen={true}
          colors={['#18181b', '#27272a', '#c41e3a', '#e12b48']}
          accentColor="#e12b48"
          isFixed={true}
          logoText="GOUTHAM M"
          toggleAddon={<AnimatedThemeToggler />}
        />
      </div>

      {/* Hero Section — full viewport (no grid) */}
      <section id="home" className="portfolio-hero-section">
        <Hero />
      </section>

      {/* Main content below Hero — persistent subtle grid background matching footer */}
      <div className="portfolio-subhero-wrapper">
        <div className="portfolio-subhero-grid" aria-hidden="true" />

        {/* Heavy sections loaded smoothly via Suspense */}
        <Suspense fallback={null}>
          <ProjectsSection />
        </Suspense>

        {/* Orbiting Technology Skills Section */}
        <Skills />

        {/* Education Timeline Section */}
        <EducationSection />

        {/* Beyond Code — animated anime cards */}
        <Suspense fallback={null}>
          <AnimeCards />
        </Suspense>

        {/* Full-width Horizontal Marquee Ticker Banner */}
        <MarqueeBanner />

        {/* Scroll-triggered Hands Touching Contact Section */}
        <Suspense fallback={null}>
          <ContactSection />
        </Suspense>

        {/* Full-screen Cinematic Curtain Reveal Footer */}
        <Suspense fallback={null}>
          <CinematicFooter />
        </Suspense>
      </div>
    </div>
  );
}