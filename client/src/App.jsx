import React, { useState } from 'react';
import CinematicIntro from './components/CinematicIntro';
import GooeyNav from './components/GooeyNav';
import StaggeredMenu from './components/StaggeredMenu';
import { Hero } from './components/Hero';
import Lanyard from './components/Lanyard';
import Floating3DParticles from './components/Floating3DParticles';
import ProjectsSection from './components/ProjectsSection';
import EducationSection from './components/EducationSection';
import TechStack from './components/TechStack';
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";
import './styles/anime.css';

const navItems = [
  { label: 'Home', href: '#home', ariaLabel: 'Go to home section' },
  { label: 'Projects', href: '#projects', ariaLabel: 'View projects' },
  { label: 'Education', href: '#education', ariaLabel: 'View education' },
  { label: 'Skills', href: '#skills', ariaLabel: 'View skills' },
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
      {/* 3D Floating Particle Background — sits below everything */}
      <Floating3DParticles
        quantity={350}
        color="#374151"
        size={7}
        opacity={0.55}
        drift={0.6}
        depth={0.65}
      />

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
        />
        <div className="mobile-theme-toggler-wrapper">
          <AnimatedThemeToggler />
        </div>
      </div>

      {/* Hero Section — full viewport */}
      <section id="home" className="portfolio-hero-section">
        <div className="portfolio-layout">
          {/* Left: Hero text */}
          <div className="portfolio-details-col">
            <Hero />
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
      </section>

      {/* Projects Section — ScrollStack cards */}
      <ProjectsSection />

      {/* Education Timeline Section */}
      <EducationSection />

      {/* 3D Interactive Tech Stack Spheres */}
      <TechStack />
    </div>
  );
}