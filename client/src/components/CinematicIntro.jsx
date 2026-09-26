import React, { useState, useEffect, useRef, useCallback } from 'react';
import FuzzyText from './FuzzyText';
import './CinematicIntro.css';

const DEFAULT_CUTOFF_SECONDS = 7.0; // Cut intro video at 7 seconds

/**
 * CinematicIntro
 * 
 * Specs:
 * - Full-viewport 100vw x 100vh pure black background (#000000)
 * - Video plays centered with audio enabled until 7.0 seconds
 * - At 7.0 seconds, video audio and playback cut immediately
 * - Shows centered "UNDER MY GENJUTSU" with FuzzyText in Poppins font
 * - Holds for ~2 seconds, then smoothly reveals the portfolio
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

    // Immediately stop and mute audio on exit/skip
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.muted = true;
    }

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

  // Cut video and sound at 7 seconds & show text in the middle
  const triggerCutoff = useCallback(() => {
    if (hasCutRef.current || isExitingRef.current) return;
    hasCutRef.current = true;

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.muted = true; // Cut sound dead at 7 seconds
    }

    setIsVideoCut(true);
    setShowText(true);

    // Hold text for fade-in duration + ~2s hold, then fade overlay out to portfolio
    timerRef.current = setTimeout(() => {
      startExitTransition();
    }, textFadeDuration + holdDuration);
  }, [startExitTransition, textFadeDuration, holdDuration]);

  // Video playback, audio, & 7-second cutoff tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Enable sound for the video
    video.muted = false;
    video.volume = 1.0;
    video.playsInline = true;

    const attemptPlay = async () => {
      try {
        await video.play();
      } catch (err) {
        // In case browser policy restricts unmuted autoplay before any user gesture
        console.warn('Unmuted autoplay prevented by browser policy; starting muted with click-to-unmute:', err);
        video.muted = true;
        try {
          await video.play();
        } catch (e) {
          console.warn('Autoplay error:', e);
        }

        // Unmute on the first user interaction if still within the 7-second window
        const unmuteOnInteraction = () => {
          if (!hasCutRef.current && videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.volume = 1.0;
          }
          window.removeEventListener('click', unmuteOnInteraction);
          window.removeEventListener('touchstart', unmuteOnInteraction);
          window.removeEventListener('keydown', unmuteOnInteraction);
        };

        window.addEventListener('click', unmuteOnInteraction, { once: true });
        window.addEventListener('touchstart', unmuteOnInteraction, { once: true });
        window.addEventListener('keydown', unmuteOnInteraction, { once: true });
      }
    };

    attemptPlay();

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
      if (video) {
        video.pause();
        video.muted = true;
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
      {/* Skip Intro Button */}
      <button
        type="button"
        className="cinematic-skip-btn"
        onClick={(e) => {
          e.stopPropagation();
          startExitTransition();
        }}
        aria-label="Skip intro"
      >
        <span>Skip Intro</span>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
      </button>

      <div className="cinematic-stage">
        <video
          ref={videoRef}
          src={videoSrc}
          className={`cinematic-video ${isVideoCut ? 'video-cut' : ''}`}
          autoPlay
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
