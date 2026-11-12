import React, { useEffect, useRef } from 'react';
import { initLivingPortrait } from '../lib/livingPortrait';
import '../css/HeroPortrait.css';

export const LivingPortrait: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const cleanup = initLivingPortrait(rootRef.current);
    return () => {
      cleanup();
    };
  }, []);

  const fallbackSrc = (import.meta.env.BASE_URL || '/') + 'face/rest.webp';

  return (
    <div className="hero-portrait-wrap" id="magnetWrap" ref={rootRef}>
      <div className="hero-portrait-inner fade-in" id="magnetInner" style={{ ['--fade-y' as any]: '30px' }}>
        <img
          id="faceFallback"
          ref={fallbackRef}
          src={fallbackSrc}
          alt="Goutham M portrait"
          onError={(e) => {
            console.error('[portrait] failed to load fallback image', fallbackSrc);
          }}
        />
        <canvas id="faceGl" aria-hidden="true" />
      </div>
    </div>
  );
};

export default LivingPortrait;

