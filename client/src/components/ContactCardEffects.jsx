import { useRef, useEffect, useCallback, useState } from 'react';
import { gsap } from 'gsap';
import './ContactCardEffects.css';

const DEFAULT_PARTICLE_COUNT = 10;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const GLOW_COLOR = '132, 0, 255'; // purple only
const MOBILE_BREAKPOINT = 768;

const createParticleElement = (x, y) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${GLOW_COLOR}, 1);
    box-shadow: 0 0 6px rgba(${GLOW_COLOR}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
    will-change: transform, opacity;
  `;
  return el;
};

const calculateSpotlightValues = (radius) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75,
});

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

/**
 * High-performance MagicBento card effects wrapper.
 * Uses requestAnimationFrame and GPU transform properties to ensure 60-120 FPS.
 */
const ContactCardEffects = ({
  children,
  className = '',
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  disableAnimations = false,
}) => {
  const cardRef = useRef(null);
  const wrapperRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);
  const spotlightRef = useRef(null);
  const rafIdRef = useRef(null);

  const isMobile = useMobileDetection();
  // Do not disable animations on mobile; spotlight, border glow, particles and ripple are touch-interactive
  const shouldDisableAnimations = disableAnimations;
  const shouldEnableTilt = enableTilt && !isMobile;
  const shouldEnableMagnetism = enableMagnetism && !isMobile;

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height)
    );
    particlesInitialized.current = true;
  }, [particleCount]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => particle.parentNode?.removeChild(particle),
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current || !enableStars) return;
    if (!particlesInitialized.current) initializeParticles();

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true);
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(
          clone,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
        );
        gsap.to(clone, {
          x: (Math.random() - 0.5) * 80,
          y: (Math.random() - 0.5) * 80,
          rotation: Math.random() * 360,
          duration: 2.5 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        });
        gsap.to(clone, {
          opacity: 0.25,
          duration: 1.8,
          ease: 'power1.inOut',
          repeat: -1,
          yoyo: true,
        });
      }, index * 120);

      timeoutsRef.current.push(timeoutId);
    });
  }, [enableStars, initializeParticles]);

  // Card-level effects: smooth tilt, magnetism, particles, click ripple, touch interaction
  useEffect(() => {
    if (shouldDisableAnimations || !cardRef.current) return;
    const element = cardRef.current;

    let rotateXTo = null;
    let rotateYTo = null;
    let xTo = null;
    let yTo = null;

    if (shouldEnableTilt) {
      rotateXTo = gsap.quickTo(element, 'rotateX', { duration: 0.25, ease: 'power2.out' });
      rotateYTo = gsap.quickTo(element, 'rotateY', { duration: 0.25, ease: 'power2.out' });
    }
    if (shouldEnableMagnetism) {
      xTo = gsap.quickTo(element, 'x', { duration: 0.3, ease: 'power2.out' });
      yTo = gsap.quickTo(element, 'y', { duration: 0.3, ease: 'power2.out' });
    }

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();
      if (rotateXTo && rotateYTo) {
        rotateXTo(0);
        rotateYTo(0);
      }
      if (xTo && yTo) {
        xTo(0);
        yTo(0);
      }
    };

    const handleMouseMove = (e) => {
      if (!shouldEnableTilt && !shouldEnableMagnetism) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (shouldEnableTilt && rotateXTo && rotateYTo) {
        const rotX = ((y - centerY) / centerY) * -5;
        const rotY = ((x - centerX) / centerX) * 5;
        rotateXTo(rotX);
        rotateYTo(rotY);
      }

      if (shouldEnableMagnetism && xTo && yTo) {
        const magnetX = (x - centerX) * 0.025;
        const magnetY = (y - centerY) * 0.025;
        xTo(magnetX);
        yTo(magnetY);
      }
    };

    const triggerRippleAt = (clientX, clientY) => {
      if (!clickEffect) return;
      const rect = element.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${GLOW_COLOR}, 0.35) 0%, rgba(${GLOW_COLOR}, 0.15) 35%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
        will-change: transform, opacity;
      `;
      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        { scale: 1, opacity: 0, duration: 0.75, ease: 'power2.out', onComplete: () => ripple.remove() }
      );
    };

    const handleClick = (e) => {
      triggerRippleAt(e.clientX, e.clientY);
    };

    let touchTimeout = null;

    const handleTouchStart = (e) => {
      if (touchTimeout) clearTimeout(touchTimeout);
      isHoveredRef.current = true;
      element.classList.add('is-touched');
      animateParticles();
      if (e.touches && e.touches[0]) {
        triggerRippleAt(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      touchTimeout = setTimeout(() => {
        isHoveredRef.current = false;
        element.classList.remove('is-touched');
        clearAllParticles();
      }, 1600);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      isHoveredRef.current = false;
      if (touchTimeout) clearTimeout(touchTimeout);
      element.classList.remove('is-touched');
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      clearAllParticles();
    };
  }, [shouldDisableAnimations, shouldEnableTilt, shouldEnableMagnetism, clickEffect, animateParticles, clearAllParticles]);

  // High-performance cursor & touch spotlight scoped to card
  useEffect(() => {
    if (shouldDisableAnimations || !enableSpotlight || !wrapperRef.current) return;

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 700px;
      height: 700px;
      margin-left: -350px;
      margin-top: -350px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${GLOW_COLOR}, 0.14) 0%,
        rgba(${GLOW_COLOR}, 0.07) 18%,
        rgba(${GLOW_COLOR}, 0.03) 30%,
        rgba(${GLOW_COLOR}, 0.015) 45%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      mix-blend-mode: screen;
      will-change: transform, opacity;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const xTo = gsap.quickTo(spotlight, 'x', { duration: 0.15, ease: 'power2.out' });
    const yTo = gsap.quickTo(spotlight, 'y', { duration: 0.15, ease: 'power2.out' });

    let latestEvent = null;
    let cardRect = null;
    let wrapperRect = null;

    const updateRects = () => {
      if (wrapperRef.current) wrapperRect = wrapperRef.current.getBoundingClientRect();
      if (cardRef.current) cardRect = cardRef.current.getBoundingClientRect();
    };

    updateRects();
    window.addEventListener('resize', updateRects, { passive: true });
    window.addEventListener('scroll', updateRects, { passive: true });

    const onFrame = () => {
      if (!latestEvent || !cardRef.current || !wrapperRef.current) {
        rafIdRef.current = null;
        return;
      }

      const e = latestEvent;
      latestEvent = null;

      if (!wrapperRect) updateRects();

      const mouseInside =
        wrapperRect &&
        e.clientX >= wrapperRect.left - 80 &&
        e.clientX <= wrapperRect.right + 80 &&
        e.clientY >= wrapperRect.top - 80 &&
        e.clientY <= wrapperRect.bottom + 80;

      if (!mouseInside) {
        gsap.to(spotlight, { opacity: 0, duration: 0.25, overwrite: 'auto' });
        cardRef.current.style.setProperty('--glow-intensity', '0');
        rafIdRef.current = null;
        return;
      }

      xTo(e.clientX);
      yTo(e.clientY);

      if (cardRect) {
        const relativeX = ((e.clientX - cardRect.left) / cardRect.width) * 100;
        const relativeY = ((e.clientY - cardRect.top) / cardRect.height) * 100;

        const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance = Math.max(
          0,
          Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2
        );

        let glowIntensity = 0;
        if (distance <= proximity) glowIntensity = 1;
        else if (distance <= fadeDistance) {
          glowIntensity = (fadeDistance - distance) / (fadeDistance - proximity);
        }

        cardRef.current.style.setProperty('--glow-x', `${relativeX}%`);
        cardRef.current.style.setProperty('--glow-y', `${relativeY}%`);
        cardRef.current.style.setProperty('--glow-intensity', glowIntensity.toFixed(2));
        cardRef.current.style.setProperty('--glow-radius', `${spotlightRadius}px`);

        const targetOpacity =
          distance <= proximity
            ? 0.8
            : distance <= fadeDistance
            ? ((fadeDistance - distance) / (fadeDistance - proximity)) * 0.8
            : 0;

        gsap.to(spotlight, {
          opacity: targetOpacity,
          duration: targetOpacity > 0 ? 0.15 : 0.4,
          overwrite: 'auto',
        });
      }

      rafIdRef.current = null;
    };

    const handleMouseMove = (e) => {
      latestEvent = e;
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(onFrame);
      }
    };

    const handleTouch = (e) => {
      if (e.touches && e.touches.length > 0) {
        latestEvent = {
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY,
        };
        if (!rafIdRef.current) {
          rafIdRef.current = requestAnimationFrame(onFrame);
        }
      }
    };

    const handleTouchEnd = () => {
      setTimeout(() => {
        if (!isHoveredRef.current) {
          gsap.to(spotlight, { opacity: 0, duration: 0.8, overwrite: 'auto' });
          if (cardRef.current) cardRef.current.style.setProperty('--glow-intensity', '0');
        }
      }, 1200);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', updateRects);
      window.removeEventListener('scroll', updateRects);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      spotlight.parentNode?.removeChild(spotlight);
    };
  }, [shouldDisableAnimations, enableSpotlight, spotlightRadius]);

  return (
    <div ref={wrapperRef} className="contact-card-effects-wrapper">
      <div
        ref={cardRef}
        className={`${className} contact-card-magic ${
          enableBorderGlow ? 'contact-card-magic--border-glow' : ''
        }`.trim()}
      >
        {children}
      </div>
    </div>
  );
};

export default ContactCardEffects;
