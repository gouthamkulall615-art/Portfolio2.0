import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

export type CarouselItem = {
  id?: string;
  title: string;
  subtitle?: string;
  image: string;
  tag?: string;
  hue?: number;
  note?: string;
  [key: string]: any;
};

export type ConcaveCarouselProps = {
  items: CarouselItem[];
  cardWidth?: number;
  cardHeight?: number;
  step?: number;
  radius?: number;
  perspective?: number;
  className?: string;
  renderCard?: (
    item: CarouselItem,
    index: number,
    isFlipped: boolean,
    onToggleFlip: () => void,
    isCenter: boolean
  ) => ReactNode;
};

const pad = (n: number) => String(n).padStart(2, "0");

export default function ConcaveCarousel({
  items,
  cardWidth = 280,
  cardHeight = 400,
  step = 30,
  radius = 680,
  perspective = 1400,
  className = "",
  renderCard,
}: ConcaveCarouselProps) {
  const n = items.length;
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const [flippedMap, setFlippedMap] = useState<Record<number, boolean>>({});
  const [dimensions, setDimensions] = useState({
    w: cardWidth,
    h: cardHeight,
    r: radius,
    s: step,
    scale: 1,
  });

  const dimsRef = useRef(dimensions);

  useEffect(() => {
    dimsRef.current = dimensions;
  }, [dimensions]);

  // Toggle individual card flip
  const toggleCardFlip = useCallback((index: number) => {
    setFlippedMap((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  // Sync GSAP ScrollTrigger with Lenis
  useLenis(() => {
    ScrollTrigger.update();
  });

  // Calculate dimensions responsively
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      let scale = 1;
      let w = cardWidth;
      let h = cardHeight;
      let r = radius;
      let s = step;

      if (width < 480) {
        scale = 0.68;
        w = 200;
        h = 290;
        r = 440;
        s = 24;
      } else if (width < 768) {
        scale = 0.8;
        w = 230;
        h = 330;
        r = 540;
        s = 26;
      } else if (width < 1024) {
        scale = 0.9;
        w = 250;
        h = 360;
        r = 620;
        s = 28;
      }

      setDimensions({ w, h, r, s, scale });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [cardWidth, cardHeight, radius, step]);

  // Update card transform positions on cylinder
  const applyCylinderTransforms = useCallback(
    (pos: number) => {
      const { r, s } = dimsRef.current;
      for (let i = 0; i < n; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        const off = i - pos;
        const abs = Math.abs(off);

        const theta = (off * s * Math.PI) / 180;
        const x = Math.sin(theta) * r;
        const z = (1 - Math.cos(theta)) * r;
        const rotY = -off * s;

        // Smooth fade for cards further down the curve
        const opacity = abs > 2.5 ? Math.max(0, 1 - (abs - 2.5) * 1.6) : 1;
        const zIndex = Math.round(100 - abs * 10);

        el.style.transform = `translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) rotateY(${rotY.toFixed(2)}deg)`;
        el.style.opacity = String(opacity.toFixed(3));
        el.style.zIndex = String(zIndex);
      }
    },
    [n]
  );

  // Initialize and bind GSAP ScrollTrigger
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    // Apply initial placement at pos 0
    applyCylinderTransforms(0);

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const scrollObj = { pos: 0 };

    const ctx = gsap.context(() => {
      gsap.to(scrollObj, {
        pos: n - 1,
        ease: "none",
        scrollTrigger: {
          trigger: sectionEl,
          start: "top top+=65",
          end: () => `+=${Math.max(window.innerHeight * 2.2, 1900)}`,
          pin: true,
          pinSpacing: true,
          scrub: prefersReduced ? 0.1 : 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const currentPos = self.progress * (n - 1);
            applyCylinderTransforms(currentPos);

            const nearest = Math.min(n - 1, Math.max(0, Math.round(currentPos)));
            if (nearest !== activeRef.current) {
              activeRef.current = nearest;
              setActive(nearest);
            }
          },
        },
      });
    }, sectionEl);

    return () => {
      ctx.revert();
    };
  }, [n, applyCylinderTransforms, dimensions]);

  const current = items[active] || items[0];
  const { w, h } = dimensions;

  return (
    <div
      ref={sectionRef}
      className={`relative w-full select-none bg-transparent outline-none flex flex-col justify-center items-center py-6 md:py-10 ${className}`}
      aria-label="Anime concave scroll showcase"
    >
      {/* 3D Stage (Transparent, no black box) */}
      <div
        ref={stageRef}
        className="relative w-full flex items-center justify-center overflow-visible"
        style={{
          height: h + 130,
          perspective,
          perspectiveOrigin: "50% 45%",
        }}
      >
        <div
          className="relative mx-auto"
          style={{
            width: w,
            height: h,
            transformStyle: "preserve-3d",
          }}
        >
          {items.map((item, i) => {
            const isFlipped = Boolean(flippedMap[i]);
            const isCenter = active === i;

            return (
              <div
                key={item.id ?? i}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="absolute top-0 cursor-pointer rounded-2xl will-change-transform"
                style={{
                  width: w,
                  height: h,
                  left: 0,
                  WebkitBoxReflect:
                    "below 10px linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.45))",
                }}
              >
                {renderCard ? (
                  renderCard(item, i, isFlipped, () => toggleCardFlip(i), isCenter)
                ) : (
                  <div
                    onClick={() => toggleCardFlip(i)}
                    className="relative w-full h-full rounded-2xl overflow-hidden [perspective:1000px]"
                  >
                    <div
                      className={`relative w-full h-full rounded-2xl transition-transform duration-700 [transform-style:preserve-3d] ${
                        isFlipped ? "[transform:rotateY(180deg)]" : ""
                      }`}
                    >
                      <div className="absolute inset-0 rounded-2xl overflow-hidden [backface-visibility:hidden]">
                        <img
                          src={item.image}
                          alt={item.title}
                          draggable={false}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 rounded-2xl p-6 bg-zinc-900 text-white flex flex-col justify-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                        <p className="text-sm text-zinc-300">{item.note ?? item.subtitle}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Caption + Scroll Status (Clean, transparent, seamlessly integrates into portfolio) */}
      <div className="relative mt-8 md:mt-12 flex flex-col items-center gap-3 text-center px-4 z-20">
        <div
          key={active}
          className="carousel-caption animate-[fadeUp_.35s_ease] text-center max-w-xl transition-all"
        >
          <div className="inline-flex items-center gap-2 mb-1.5">
            {current?.tag && (
              <span className="text-[11px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/15">
                {current.tag}
              </span>
            )}
            <span className="text-xs font-mono font-medium text-white/50 tracking-wider">
              {pad(active + 1)} / {pad(n)}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
            {current?.title}
          </h3>

          {current?.subtitle && (
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-300/85 max-w-lg mx-auto leading-relaxed">
              {current?.subtitle}
            </p>
          )}
        </div>

        {/* Minimal Scroll Helper Badge */}
        <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[11px] text-zinc-400">
          <svg
            className="w-3.5 h-3.5 animate-bounce text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <span>Scroll to rotate • Click any card to flip</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .carousel-caption {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
