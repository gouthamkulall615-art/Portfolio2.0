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
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoCut, setIsVideoCut] = useState(false);
  const [showText, setShowText] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const videoRef = useRef(null);
  const hasCutRef = useRef(false);
  const isExitingRef = useRef(false);
  const timerRef = useRef(null);
  const isAudioMutedRef = useRef(false);

  // Helper to unlock Web Audio API on iOS and mobile browsers
  const unlockAudioContext = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch {
      // Audio context unlock fallback
    }
  }, []);

  // Unmute audio immediately and keep playing
  const unmuteAudio = useCallback(async () => {
    if (hasCutRef.current || isExitingRef.current) return;
    unlockAudioContext();
    const video = videoRef.current;
    if (video) {
      try {
        video.muted = false;
        video.volume = 1.0;
        await video.play();
        isAudioMutedRef.current = false;
        setIsAudioMuted(false);
      } catch (err) {
        console.warn('Playback error during unmute:', err);
      }
    }
  }, [unlockAudioContext]);

  // Toggle audio between muted and unmuted
  const toggleAudio = useCallback(() => {
    if (hasCutRef.current || isExitingRef.current) return;
    const video = videoRef.current;
    if (!video) return;

    if (isAudioMutedRef.current) {
      unmuteAudio();
    } else {
      video.muted = true;
      isAudioMutedRef.current = true;
      setIsAudioMuted(true);
    }
  }, [unmuteAudio]);

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

    video.playsInline = true;
    video.volume = 1.0;

    let cleanupListeners = null;

    const attemptPlay = async () => {
      // 1. First attempt unmuted autoplay (succeeds automatically if browser allows sound)
      video.muted = false;
      try {
        await video.play();
        isAudioMutedRef.current = false;
        setIsAudioMuted(false);
      } catch (err) {
        // 2. Browser blocked unmuted autoplay: start muted immediately so video never stalls
        console.log('Unmuted autoplay prevented by browser policy; starting muted and enabling auto-unmute on first touch:', err);
        video.muted = true;
        isAudioMutedRef.current = true;
        setIsAudioMuted(true);
        try {
          await video.play();
        } catch (e) {
          console.warn('Autoplay error:', e);
        }

        // 3. Automatically turn on sound on the VERY FIRST touch or interaction anywhere
        const onFirstInteraction = (e) => {
          if (e.target && e.target.closest && e.target.closest('.cinematic-skip-btn')) {
            return;
          }
          unmuteAudio();
          cleanup();
        };

        const cleanup = () => {
          window.removeEventListener('pointerdown', onFirstInteraction, true);
          window.removeEventListener('touchstart', onFirstInteraction, true);
          window.removeEventListener('touchend', onFirstInteraction, true);
          window.removeEventListener('mousedown', onFirstInteraction, true);
          window.removeEventListener('click', onFirstInteraction, true);
          window.removeEventListener('keydown', onFirstInteraction, true);
        };
        cleanupListeners = cleanup;

        window.addEventListener('pointerdown', onFirstInteraction, { once: true, capture: true });
        window.addEventListener('touchstart', onFirstInteraction, { once: true, capture: true });
        window.addEventListener('touchend', onFirstInteraction, { once: true, capture: true });
        window.addEventListener('mousedown', onFirstInteraction, { once: true, capture: true });
        window.addEventListener('click', onFirstInteraction, { once: true, capture: true });
        window.addEventListener('keydown', onFirstInteraction, { once: true, capture: true });
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
      if (cleanupListeners) {
        cleanupListeners();
      }
      if (video) {
        video.pause();
        video.muted = true;
      }
    };
  }, [cutoffSeconds, triggerCutoff, unmuteAudio]);

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
      onClick={() => {
        if (!isVideoCut && isAudioMuted) {
          unmuteAudio();
        } else if (showText) {
          startExitTransition();
        }
      }}
      role="region"
      aria-label="Cinematic intro sequence"
    >
      {/* Sound Toggle Button (Top Left) */}
      {!isVideoCut && (
        <button
          type="button"
          className={`cinematic-sound-btn ${isAudioMuted ? 'is-muted' : 'is-unmuted'}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleAudio();
          }}
          aria-label={isAudioMuted ? 'Turn on sound' : 'Sound is on - click to mute'}
        >
          {isAudioMuted ? (
            <>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
              <span>Tap for sound</span>
            </>
          ) : (
            <>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
              <span className="sound-wave-bars" aria-hidden="true">
                <span className="bar bar-1"></span>
                <span className="bar bar-2"></span>
                <span className="bar bar-3"></span>
              </span>
              <span>Sound On</span>
            </>
          )}
        </button>
      )}

      {/* Skip Intro Button (Top Right) */}
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
          muted={isAudioMuted}
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
