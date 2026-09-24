import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CinematicIntro.css';

/**
 * CinematicIntro
 * 
 * Minimal, cinematic intro sequence matching exact specifications:
 * - Full-viewport 100vw x 100vh pure black background (#000000)
 * - Zero borders, frames, corner brackets, HUD panels, header bars, or timers
 * - Video is the only visual element on screen, centered horizontally and vertically
 * - Video has object-fit: contain, capped max-width (900px) & max-height (75-80vh)
 * - Autoplay, muted, plays once, playsInline for mobile compatibility
 * - Listens for video `ended` event -> fades in "Under my Genjutsu" (1.3s ease-in, soft red #c41e3a, widened letter-spacing)
 * - Holds for ~2s -> fades out entire overlay to opacity 0 -> reveals portfolio
 * - Click/tap anywhere on screen to smoothly skip ahead
 */
export default function CinematicIntro({
  onComplete,
  videoSrc = '/eyes-video.mp4',
  text = 'Under my Genjutsu',
  textFadeDuration = 1300,
  holdDuration = 2000,
  overlayFadeDuration = 1000,
}) {
  const [showCaption, setShowCaption] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef(null);
  const hasEndedRef = useRef(false);
  const isExitingRef = useRef(false);
  const timerRef = useRef(null);

  // Smooth fade-to-black / opacity transition out to reveal portfolio
  const startExitTransition = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsFadingOut(true);

    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, overlayFadeDuration);
  }, [onComplete, overlayFadeDuration]);

  // Video ended listener: trigger text fade-in, hold 2s, then fade to portfolio
  const handleVideoEnded = useCallback(() => {
    if (hasEndedRef.current || isExitingRef.current) return;
    hasEndedRef.current = true;

    // Fade in "Under my Genjutsu"
    setShowCaption(true);

    // Hold for ~2s after text transition completes, then fade out overlay
    timerRef.current = setTimeout(() => {
      startExitTransition();
    }, textFadeDuration + holdDuration);
  }, [startExitTransition, textFadeDuration, holdDuration]);

  // Handle Autoplay & PlaysInline initialization
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay may be restricted if browser requires direct user interaction
        console.warn('Cinematic intro autoplay notice:', err);
      });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Keyboard accessibility: Escape, Space, or Enter to skip
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        startExitTransition();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startExitTransition]);

  return (
    <div
      className={`cinematic-intro-root ${isFadingOut ? 'fade-out' : ''}`}
      onClick={startExitTransition}
      role="button"
      tabIndex={0}
      aria-label="Cinematic intro sequence - click anywhere to skip"
    >
      <div className="cinematic-stage">
        <video
          ref={videoRef}
          src={videoSrc}
          className="cinematic-video"
          autoPlay
          muted
          playsInline
          controls={false}
          disablePictureInPicture
          onEnded={handleVideoEnded}
        />
        <p
          className={`cinematic-caption ${showCaption ? 'visible' : ''}`}
          aria-hidden={!showCaption}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
