import React, { useState, useEffect, useRef } from 'react';
import { FastForward, ShieldAlert, Cpu } from 'lucide-react';

const DURATION_LIMIT = 7.0; // Exactly 7 seconds

export default function AnimeLoader({ onComplete }) {
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [slashFlash, setSlashFlash] = useState(false);
  const hasFinishedRef = useRef(false);

  const triggerExit = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    // Trigger anime optic slash / white flash
    setSlashFlash(true);
    setIsExiting(true);

    setTimeout(() => {
      setSlashFlash(false);
    }, 180);

    setTimeout(() => {
      if (onComplete) onComplete();
    }, 750);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure completely muted so no music plays and autoplay is always allowed by browser
    video.muted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Autoplay prevented or video not ready:', err);
      });
    }

    // High precision RAF loop for ultra-smooth HUD progress bar and 7s cap
    let animationFrameId;
    const startTime = performance.now();

    const updateSync = () => {
      if (hasFinishedRef.current) return;

      const videoTime = video.currentTime || 0;
      const elapsedWallTime = (performance.now() - startTime) / 1000;
      // Use max of video time or wall time in case video buffering lags
      const effectiveTime = Math.min(Math.max(videoTime, elapsedWallTime), DURATION_LIMIT);

      const pct = Math.min((effectiveTime / DURATION_LIMIT) * 100, 100);
      setProgress(pct);
      setCurrentTime(effectiveTime);

      if (effectiveTime >= DURATION_LIMIT) {
        triggerExit();
        return;
      }

      animationFrameId = requestAnimationFrame(updateSync);
    };

    animationFrameId = requestAnimationFrame(updateSync);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Optic Shutter / Slash Flash */}
      <div className={`anime-slash-transition ${slashFlash ? 'active' : ''}`} />

      <div className={`anime-intro-container playing ${isExiting ? 'exiting' : ''}`}>
        {/* Seamless Video Layer - Zero player controls, no slider, no play button */}
        <div className="anime-video-wrapper">
          <video
            ref={videoRef}
            src="/eyes-video.mp4"
            autoPlay
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            className="anime-intro-video"
          />
        </div>

        {/* Cinematic Vignette & CRT Scanlines */}
        <div className="cinematic-vignette" />
        <div className="anime-scanlines" />

        {/* Futuristic Anime HUD Overlays */}
        <div className="anime-hud-layer">
          {/* Top Bar: System Boot Status & Skip */}
          <div className="hud-top-bar">
            <div className="hud-sys-badge">
              <span className="hud-pulse-dot" />
              <span>NEO-TOKYO CORE // BOOT SEQUENCE</span>
              <span className="hud-jp-tag">「 眼光解放 」</span>
            </div>

            <button
              id="skip-intro-btn"
              type="button"
              className="hud-skip-btn"
              onClick={triggerExit}
              title="Skip anime sequence"
            >
              <span>SKIP SEQUENCE</span>
              <FastForward size={14} />
            </button>
          </div>

          {/* Center Anime Crosshair & HUD Reticle */}
          <div className="hud-center-frame">
            <div className="reticle-corner reticle-tl" />
            <div className="reticle-corner reticle-tr" />
            <div className="reticle-corner reticle-bl" />
            <div className="reticle-corner reticle-br" />

            <div className="reticle-center-crosshair">
              <div className="reticle-circle">
                <div className="reticle-inner-dot" />
              </div>
              <span className="reticle-label">OCULAR PROTOCOL ENGAGED</span>
            </div>
          </div>

          {/* Bottom Bar: Telemetry, 0-100% Progress & Time Readout */}
          <div className="hud-bottom-bar">
            <div className="hud-status-row">
              <div className="hud-status-text">
                <Cpu size={16} color="var(--neon-cyan)" />
                <span>NEURAL SYNC: <strong style={{ color: 'var(--neon-cyan)' }}>{Math.round(progress)}%</strong></span>
                <span className="hud-kanji-alert">【 覚醒中 】</span>
              </div>
              <div className="hud-time-readout">
                0{currentTime.toFixed(2)}s / 0{DURATION_LIMIT.toFixed(2)}s
              </div>
            </div>

            {/* Glowing Anime Progress Bar */}
            <div className="hud-progress-track">
              <div
                className="hud-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="hud-sub-details">
              <span>AUDIO: MUTED // STREAM DIRECT</span>
              <span>DIMENSION: CYBER SHINOBI v2.4</span>
              <span>BUFFER: STABLE (1080p)</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
