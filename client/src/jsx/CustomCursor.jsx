import React, { useEffect, useRef } from 'react';
import '../css/CustomCursor.css';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Completely disable on touch devices and coarse pointers
    const touchMedia = window.matchMedia('(pointer: coarse) and (hover: none)');
    if (touchMedia.matches) return;

    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

    const dot = dotRef.current;
    const ring = ringRef.current;
    const container = containerRef.current;
    if (!dot || !ring || !container) return;

    let targetX = -200;
    let targetY = -200;
    let ringX = -200;
    let ringY = -200;
    let isVisible = false;
    let isHovered = false;
    let isInput = false;
    let rafId = null;

    const lerp = (start, end, factor) => start + (end - start) * factor;

    const renderLoop = () => {
      if (reducedMotionMedia.matches) {
        ringX = targetX;
        ringY = targetY;
      } else {
        ringX = lerp(ringX, targetX, 0.2);
        ringY = lerp(ringY, targetY, 0.2);
      }

      // 1. Dot follows pointer with zero lag (whole pixels for razor-sharp rendering)
      dot.style.transform = `translate3d(${Math.round(targetX)}px, ${Math.round(targetY)}px, 0) translate(-50%, -50%)`;

      // 2. Ring follows with 0.2 lerp smoothing
      ring.style.transform = `translate3d(${Math.round(ringX)}px, ${Math.round(ringY)}px, 0) translate(-50%, -50%)`;

      rafId = requestAnimationFrame(renderLoop);
    };

    const handleMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        ringX = targetX;
        ringY = targetY;
        container.classList.add('is-visible');
        document.documentElement.classList.add('has-custom-cursor');
        if (!rafId) {
          rafId = requestAnimationFrame(renderLoop);
        }
      }

      // Detect hover targets
      const target = e.target;
      if (target) {
        // Text inputs & editable elements: hide custom cursor to show native cursor
        const inputEl = target.closest('input, textarea, select, [contenteditable="true"]');
        if (inputEl) {
          if (!isInput) {
            isInput = true;
            container.classList.add('is-input');
          }
        } else {
          if (isInput) {
            isInput = false;
            container.classList.remove('is-input');
          }
        }

        // Clickable interactive elements: links, buttons, pills
        const clickableEl = target.closest(
          'a, button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"], .cursor-pointer, [data-cursor="pointer"]'
        );
        if (clickableEl && !inputEl) {
          if (!isHovered) {
            isHovered = true;
            ring.classList.add('is-hovering');
          }
        } else {
          if (isHovered) {
            isHovered = false;
            ring.classList.remove('is-hovering');
          }
        }
      }
    };

    const handleMouseDown = (e) => {
      // Don't shrink ring on right click
      if (e.button !== 0) return;
      isDown = true;
      ring.classList.add('is-down');
    };

    const handleMouseUp = () => {
      isDown = false;
      ring.classList.remove('is-down');
    };

    const handleMouseLeave = () => {
      isVisible = false;
      container.classList.remove('is-visible');
      document.documentElement.classList.remove('has-custom-cursor');
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.classList.remove('has-custom-cursor');
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="custom-cursor-container" aria-hidden="true">
      <div ref={ringRef} className="custom-cursor-ring" />
      <div ref={dotRef} className="custom-cursor-dot" />
    </div>
  );
}
