"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ReactLenis, { useLenis } from "lenis/react";
import { useRef, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import "./StickyProjectCards.css";

const GithubIcon = ({ size = 15, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const StickyProjectCards = ({ cards = [] }) => {
  const container = useRef(null);
  const cardRefs = useRef([]);

  // Keep Lenis scroll synced with GSAP ScrollTrigger
  useLenis(() => {
    ScrollTrigger.update();
  });

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);

      const cardElements = cardRefs.current.filter(Boolean);
      const totalCards = cardElements.length;

      if (totalCards === 0) return;

      const triggerEl = container.current?.querySelector(".sticky-project-cards");
      if (!triggerEl) return;

      const isMobile = window.innerWidth < 640;
      const targetScale = isMobile ? 0.92 : 0.78;
      const targetRotation = isMobile ? 0 : 3.5;
      const targetOpacity = isMobile ? 0.15 : 0.35;

      // Initial state: Card 0 visible, rest positioned 100% down
      gsap.set(cardElements[0], { yPercent: 0, scale: 1, rotation: 0, opacity: 1 });
      for (let i = 1; i < totalCards; i++) {
        gsap.set(cardElements[i], { yPercent: 100, scale: 1, rotation: 0, opacity: 1 });
      }

      const scrollTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: "top top",
          end: () => `+=${window.innerHeight * (totalCards - 1)}`,
          pin: true,
          scrub: 0.5,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
      });

      for (let i = 0; i < totalCards - 1; i++) {
        const currentCard = cardElements[i];
        const nextCard = cardElements[i + 1];
        const position = i;

        // Current card shrinks and fades back smoothly
        scrollTimeline.to(
          currentCard,
          {
            scale: targetScale,
            rotation: targetRotation,
            opacity: targetOpacity,
            duration: 1,
            ease: "power1.inOut",
          },
          position,
        );

        // Next card slides in to cover the stage
        scrollTimeline.to(
          nextCard,
          {
            yPercent: 0,
            opacity: 1,
            duration: 1,
            ease: "power1.inOut",
          },
          position,
        );
      }

      const handleRefresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", handleRefresh);

      return () => {
        window.removeEventListener("load", handleRefresh);
        scrollTimeline.scrollTrigger?.kill();
        scrollTimeline.kill();
      };
    },
    { scope: container, dependencies: [cards.length] },
  );

  useEffect(() => {
    const t = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 400);
    return () => clearTimeout(t);
  }, [cards.length]);

  return (
    <div className="sticky-project-cards-container" ref={container}>
      <div className="sticky-project-cards">
        <div className="sticky-project-card-stage">
          {cards.map((card, i) => (
            <div
              key={card.id || card.title || i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              style={{ zIndex: i + 1 }}
              className="sticky-project-card"
            >
              <div className="project-card-img-wrap">
                <img
                  className="project-card-img"
                  src={card.image}
                  alt={card.title || ""}
                  loading="eager"
                  onLoad={() => ScrollTrigger.refresh()}
                />
              </div>

              {/* Top-Right Action Pill */}
              <div className="project-card-floating-actions">
                {card.githubUrl && (
                  <a
                    href={card.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link-btn"
                    title="View Source on GitHub"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GithubIcon size={14} />
                    <span>GitHub</span>
                  </a>
                )}
                {card.demoUrl && (
                  <a
                    href={card.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link-btn"
                    title="Open Live Website"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={13} />
                    <span>Live Demo</span>
                  </a>
                )}
              </div>

              {/* Bottom Details Overlay */}
              <div className="project-card-overlay">
                <h3 className="project-card-title">{card.title}</h3>
                <p className="project-card-desc">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProjectsStickyScroll = ({ projects = [] }) => {
  return (
    <ReactLenis root>
      <StickyProjectCards cards={projects} />
    </ReactLenis>
  );
};

export { ProjectsStickyScroll, StickyProjectCards };
export default ProjectsStickyScroll;