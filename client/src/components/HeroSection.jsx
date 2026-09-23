import React, { useState, useEffect } from 'react';
import { Shield, Zap, Sparkles, Code2, Server, ArrowRight, Activity } from 'lucide-react';

export default function HeroSection({ onReplayIntro }) {
  const [profile, setProfile] = useState({
    codename: 'KAGE // 影',
    role: 'Full-Stack Shinobi & Creative Engineer',
    level: 'LVL 99',
    stats: {
      reactPower: '98%',
      nodeMastery: '95%',
      uiAesthetics: '99%',
      speed: 'MAX'
    },
    bio: 'Bridging high-octane anime aesthetics with mission-critical React and Node.js fullstack engineering.'
  });
  const [serverOnline, setServerOnline] = useState(false);

  useEffect(() => {
    // Check Express backend
    fetch('http://localhost:5000/api/profile')
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setServerOnline(true);
      })
      .catch(() => {
        // Express might still be booting or offline, fallback data remains active
        setServerOnline(false);
      });
  }, []);

  return (
    <div id="home" className="hero-wrapper">
      {/* Left Column: Hero Content */}
      <div className="hero-left-content">
        <div className="hero-tag-badge">
          <Zap size={14} />
          <span>CYBERNETIC PORTFOLIO INITIATIVE // 2026</span>
        </div>

        <h1 className="hero-headline">
          CREATING DIGITAL REALMS WITH <br />
          <span className="neon-gradient-text">ANIME INTENSITY.</span>
        </h1>

        <p className="hero-subtext">
          {profile.bio}
        </p>

        <div className="hero-cta-group">
          <a href="#projects" className="btn-primary-neon">
            <span>EXPLORE ARSENAL</span>
            <ArrowRight size={16} />
          </a>

          <button
            type="button"
            onClick={onReplayIntro}
            className="btn-secondary-cyber"
          >
            <Sparkles size={16} />
            <span>PLAY INTRO AGAIN</span>
          </button>
        </div>
      </div>

      {/* Right Column: Anime Shinobi Stat HUD Card */}
      <div className="hero-right-content">
        <div className="shinobi-card">
          <div className="card-header-status">
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--neon-crimson)', letterSpacing: '0.2em' }}>
                SHINOBI PROFILE
              </div>
              <div className="shinobi-name">{profile.codename}</div>
            </div>
            <div className="shinobi-level">{profile.level}</div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            {profile.role}
          </p>

          <div className="stat-bars-container">
            <div className="stat-row">
              <div className="stat-labels">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Code2 size={14} color="var(--neon-crimson)" /> REACT & FRONTEND NINJUTSU
                </span>
                <span style={{ color: 'var(--neon-crimson)' }}>{profile.stats.reactPower}</span>
              </div>
              <div className="stat-bar-track">
                <div className="stat-bar-fill fill-crimson" style={{ width: profile.stats.reactPower }} />
              </div>
            </div>

            <div className="stat-row">
              <div className="stat-labels">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Server size={14} color="var(--neon-cyan)" /> NODE.JS & EXPRESS BACKEND
                </span>
                <span style={{ color: 'var(--neon-cyan)' }}>{profile.stats.nodeMastery}</span>
              </div>
              <div className="stat-bar-track">
                <div className="stat-bar-fill fill-cyan" style={{ width: profile.stats.nodeMastery }} />
              </div>
            </div>

            <div className="stat-row">
              <div className="stat-labels">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} color="var(--neon-purple)" /> UI / ANIME AESTHETICS
                </span>
                <span style={{ color: 'var(--neon-purple)' }}>{profile.stats.uiAesthetics}</span>
              </div>
              <div className="stat-bar-track">
                <div className="stat-bar-fill fill-purple" style={{ width: profile.stats.uiAesthetics }} />
              </div>
            </div>
          </div>

          <div className="system-status-indicator">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={14} color={serverOnline ? '#00f0ff' : '#ff0055'} />
              EXPRESS BACKEND CORE:
            </span>
            <span style={{ color: serverOnline ? '#00f0ff' : '#ffaa00', fontWeight: 'bold' }}>
              {serverOnline ? 'ONLINE [PORT 5000]' : 'READY / STANDBY'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
