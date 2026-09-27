"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

// Register ScrollTrigger safely for React
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. THEME-ADAPTIVE INLINE STYLES
// -------------------------------------------------------------------------
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;

  --c-fg: hsl(var(--foreground, 0 0% 98%));
  --c-bg: hsl(var(--background, 240 10% 3.9%));
  --c-primary: hsl(var(--primary, 352 61% 30%));
  --c-secondary: hsl(var(--secondary, 240 3.7% 15.9%));
  --c-destructive: hsl(var(--destructive, 0 62.8% 30.6%));

  --pill-bg-1: color-mix(in oklch, var(--c-fg) 3%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--c-fg) 1%, transparent);
  --pill-shadow: color-mix(in oklch, var(--c-bg) 50%, transparent);
  --pill-highlight: color-mix(in oklch, var(--c-fg) 10%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--c-bg) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--c-fg) 8%, transparent);

  --pill-bg-1-hover: color-mix(in oklch, var(--c-fg) 8%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--c-fg) 2%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--c-fg) 20%, transparent);
  --pill-shadow-hover: color-mix(in oklch, var(--c-bg) 70%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--c-fg) 20%, transparent);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px color-mix(in oklch, var(--c-destructive) 50%, transparent)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px color-mix(in oklch, var(--c-destructive) 80%, transparent)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

.footer-bg-grid {
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right, color-mix(in oklch, var(--c-fg) 3%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--c-fg) 3%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%,
    color-mix(in oklch, var(--c-primary) 15%, transparent) 0%,
    color-mix(in oklch, var(--c-secondary) 15%, transparent) 40%,
    transparent 70%
  );
}

.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow:
      0 10px 30px -10px var(--pill-shadow),
      inset 0 1px 1px var(--pill-highlight),
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow:
      0 20px 40px -10px var(--pill-shadow-hover),
      inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--c-fg);
}

.footer-giant-bg-text {
  font-size: 26vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--c-fg) 5%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--c-fg) 10%, transparent) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

.footer-text-glow {
  background: linear-gradient(180deg, var(--c-fg) 0%, color-mix(in oklch, var(--c-fg) 40%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px color-mix(in oklch, var(--c-fg) 15%, transparent));
}

@media (max-width: 768px) {
  .cinematic-footer-wrapper {
    position: relative !important;
    height: auto !important;
    min-height: 100vh !important;
    bottom: auto !important;
    left: auto !important;
    display: flex !important;
    opacity: 1 !important;
    padding: 3rem 0;
  }
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (Zero Dependency)
// -------------------------------------------------------------------------
const MagneticButton = React.forwardRef(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.4,
            y: y * 0.4,
            rotationX: -y * 0.15,
            rotationY: x * 0.15,
            scale: 1.05,
            ease: "power2.out",
            duration: 0.4,
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
          });
        };

        const handleTouchStart = () => {
          gsap.to(element, {
            scale: 0.94,
            duration: 0.15,
            ease: "power2.out",
          });
        };

        const handleTouchEnd = () => {
          gsap.to(element, {
            scale: 1,
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            ease: "elastic.out(1, 0.4)",
            duration: 0.8,
          });
        };

        element.addEventListener("mousemove", handleMouseMove);
        element.addEventListener("mouseleave", handleMouseLeave);
        element.addEventListener("touchstart", handleTouchStart, { passive: true });
        element.addEventListener("touchend", handleTouchEnd, { passive: true });
        element.addEventListener("touchcancel", handleTouchEnd, { passive: true });

        return () => {
          element.removeEventListener("mousemove", handleMouseMove);
          element.removeEventListener("mouseleave", handleMouseLeave);
          element.removeEventListener("touchstart", handleTouchStart);
          element.removeEventListener("touchend", handleTouchEnd);
          element.removeEventListener("touchcancel", handleTouchEnd);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node) => {
          localRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// 3. MAIN COMPONENT
// -------------------------------------------------------------------------
export function CinematicFooter() {
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const wrapperRef = useRef(null);
  const giantTextRef = useRef(null);
  const headingRef = useRef(null);
  const linksRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsResumeOpen(false);
    };
    if (isResumeOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isResumeOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    // On mobile, ensure elements are immediately visible and not hidden by desktop scrub animation
    if (window.innerWidth <= 768) {
      if (giantTextRef.current) gsap.set(giantTextRef.current, { y: "0vh", scale: 1, opacity: 0.85 });
      if (headingRef.current) gsap.set(headingRef.current, { y: 0, opacity: 1 });
      if (linksRef.current) gsap.set(linksRef.current, { y: 0, opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: "10vh", scale: 0.8, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 80%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 40%",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, [isMobile]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div
        ref={wrapperRef}
        className={cn("w-full z-10", isMobile ? "relative min-h-screen" : "relative h-screen")}
        style={isMobile ? {} : { clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <footer
          className={cn(
            "flex w-full flex-col justify-between overflow-hidden bg-background text-foreground cinematic-footer-wrapper",
            isMobile ? "relative min-h-screen py-10" : "fixed bottom-0 left-0 h-screen"
          )}
        >
          {/* Ambient Light & Grid Background */}
          <div className="footer-aurora absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] pointer-events-none z-0" />
          <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

          {/* Giant background text — swap to your name or a short signature word */}
          <div
            ref={giantTextRef}
            className="footer-giant-bg-text absolute -bottom-[5vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none"
          >
            GOUTHAM
          </div>

          {/* Main Center Content */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-6 w-full max-w-5xl mx-auto">
            <h2
              ref={headingRef}
              className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black footer-text-glow tracking-tighter mb-6 sm:mb-8 md:mb-12 text-center px-2"
            >
              Let's build something great
            </h2>

            <div ref={linksRef} className="flex flex-col items-center gap-4 sm:gap-6 w-full">
              {/* Primary actions — resume + GitHub */}
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 w-full">
                <MagneticButton
                  as="a"
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsResumeOpen(true);
                  }}
                  className="footer-glass-pill px-6 py-3.5 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-full text-foreground font-bold text-xs sm:text-sm md:text-base flex items-center gap-2.5 sm:gap-3 group"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Resume
                </MagneticButton>

                <MagneticButton
                  as="a"
                  href="https://github.com/gouthamkulall615-art"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-glass-pill px-6 py-3.5 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-full text-foreground font-bold text-xs sm:text-sm md:text-base flex items-center gap-2.5 sm:gap-3 group"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 015.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.2.66.79.55A10.51 10.51 0 0023.5 12c0-6.27-5.23-11.5-11.5-11.5z" />
                  </svg>
                  View GitHub
                </MagneticButton>
              </div>

              {/* Secondary links — site nav */}
              <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4 md:gap-6 w-full mt-1 sm:mt-2">
                <MagneticButton as="a" href="#projects" className="footer-glass-pill px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-muted-foreground font-medium text-xs sm:text-sm hover:text-foreground">
                  Projects
                </MagneticButton>
                <MagneticButton as="a" href="#skills" className="footer-glass-pill px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-muted-foreground font-medium text-xs sm:text-sm hover:text-foreground">
                  Skills
                </MagneticButton>
                <MagneticButton as="a" href="#contact" className="footer-glass-pill px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-muted-foreground font-medium text-xs sm:text-sm hover:text-foreground">
                  Contact
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* Bottom Bar / Credits */}
          <div className="relative z-20 w-full pb-5 sm:pb-8 px-4 sm:px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 md:gap-6">
            <div className="text-muted-foreground text-[10px] md:text-xs font-semibold tracking-widest uppercase order-2 md:order-1 text-center">
              © 2026 Goutham. All rights reserved.
            </div>

            <div className="footer-glass-pill px-6 py-3 rounded-full flex items-center gap-2 order-1 md:order-2 cursor-default border-border/50">
              <span className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest">Crafted with</span>
              <span className="animate-footer-heartbeat text-sm md:text-base text-destructive">❤</span>
              <span className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest">by</span>
              <span className="text-foreground font-black text-xs md:text-sm tracking-normal ml-1">Goutham</span>
            </div>

            <MagneticButton
              as="button"
              onClick={scrollToTop}
              className="w-12 h-12 rounded-full footer-glass-pill flex items-center justify-center text-muted-foreground hover:text-foreground group order-3"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-y-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
            </MagneticButton>
          </div>
        </footer>
      </div>

      {/* Interactive Resume View Modal */}
      {isResumeOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md"
          onClick={() => setIsResumeOpen(false)}
        >
          <div
            className="relative flex flex-col w-full max-w-4xl h-[92vh] bg-card text-foreground rounded-2xl border border-border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm md:text-base">Goutham M — Resume</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in New Tab
                </a>
                <a
                  href="/resume.pdf"
                  download="Goutham-Resume.pdf"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setIsResumeOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors ml-1"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body / Embedded PDF */}
            <div className="flex-1 w-full h-full bg-neutral-900/10 dark:bg-black/40">
              <iframe
                src="/resume.pdf#view=FitH"
                title="Goutham M - Resume"
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CinematicFooter;
