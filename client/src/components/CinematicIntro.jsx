import React, { useState, useEffect, useRef, useCallback } from 'react';
import FuzzyText from './FuzzyText';
import './CinematicIntro.css';

const DEFAULT_CUTOFF_SECONDS = 7.0; // Cut intro video at 7 seconds

/**
 * CinematicIntro
 * 
 * Specs:
 * - Full-viewport 100vw x 100vh pure black background (#000000)
 * - Video plays centered with object-fit: contain, capped max-width/max-height
 * - Intro video cuts at exactly 7 seconds
 * - After 7 seconds, shows "Under my Genjutsu" right in the middle with FuzzyText & Poppins font
 * - Holds for ~2 seconds, then smoothly fades out the overlay to reveal the portfolio
 * - Click or tap anywhere to smoothly skip ahead
 */
export default function CinematicIntro({
  onComplete,
  videoSrc = '/eyes-video.mp4',
  text = 'UNDER MY GENJUTSU',
  cutoffSeconds = DEFAULT_CUTOFF_SECONDS,
  textFadeDuration = 1200,
  holdDuration = 2000,
  overlayFadeDuration = 1000,
}) {
  const [isVideoCut, setIsVideoCut] = useState(false);
  const [showText, setShowText] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const videoRef = useRef(null);
  const hasCutRef = useRef(false);
  const isExitingRef = useRef(false);
  const timerRef = useRef(null);

  // Smooth exit transition to reveal portfolio
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

  // Cut video at 7 seconds & show text in the middle
  const triggerCutoff = useCallback(() => {
    if (hasCutRef.current || isExitingRef.current) return;
    hasCutRef.current = true;

    const video = videoRef.current;
    if (video) {
      video.pause();
    }

    setIsVideoCut(true);
    setShowText(true);

    // Hold text for fade-in duration + ~2s hold, then fade overlay out to portfolio
    timerRef.current = setTimeout(() => {
      startExitTransition();
    }, textFadeDuration + holdDuration);
  }, [startExitTransition, textFadeDuration, holdDuration]);

  // Video playback & 7-second cutoff tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Cinematic intro autoplay notice:', err);
      });
    }

    let animationFrameId;

    // High-precision RAF loop checking for 7.0s cutoff
    const checkPlaybackTime = () => {
      if (hasCutRef.current) return;

      const currentTime = video.currentTime || 0;
      if (currentTime >= cutoffSeconds) {
        triggerCutoff();
        return;
      }

      animationFrameId = requestAnimationFrame(checkPlaybackTime);
    };

    animationFrameId = requestAnimationFrame(checkPlaybackTime);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [cutoffSeconds, triggerCutoff]);

  // Handle video ended event if video finishes before 7s
  const handleVideoEnded = useCallback(() => {
    triggerCutoff();
  }, [triggerCutoff]);

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
          className={`cinematic-video ${isVideoCut ? 'video-cut' : ''}`}
          autoPlay
          muted
          playsInline
          controls={false}
          disablePictureInPicture
          onEnded={handleVideoEnded}
        />

        <div
          className={`cinematic-center-text ${showText ? 'visible' : ''}`}
          aria-hidden={!showText}
        >
          <FuzzyText
            baseIntensity={0.2}
            hoverIntensity={0.55}
            enableHover={true}
            color="#c41e3a"
            fontFamily="'Poppins', sans-serif"
            fontSize="clamp(2rem, 5.2vw, 4rem)"
            fontWeight={700}
            letterSpacing={4}
            fuzzRange={24}
            direction="horizontal"
            className="genjutsu-fuzzy-canvas"
          >
            {typeof text === 'string' ? text.toUpperCase() : text}
          </FuzzyText>
        </div>
      </div>
    </div>
  );
}
