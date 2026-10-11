import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Calculate dimensions responsively
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      let scale = 1;
      let w = cardWidth;
      let h = cardHeight;
      let r = radius;
      let s = step;

      if (width < 420) {
        scale = 0.62;
        w = 165;
        h = 245;
        r = 450;
        s = 29;
      } else if (width < 640) {
        scale = 0.72;
        w = 185;
        h = 275;
        r = 500;
        s = 29;
      } else if (width < 768) {
        scale = 0.8;
        w = 210;
        h = 310;
        r = 560;
        s = 29;
      } else if (width < 1024) {
        scale = 0.88;
        w = 240;
        h = 350;
        r = 630;
        s = 30;
      } else {
        scale = 1;
        w = cardWidth;
        h = cardHeight;
        r = radius;
        s = step;
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

  // Scroll Progress Calculator using native sticky parent bounds (NO GSAP pin-spacer bugs!)
  const updateScrollProgress = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) return;

    // Progress 0 to 1 strictly within this section's height
    const p = Math.min(1, Math.max(0, -rect.top / total));
    const currentPos = p * (n - 1);

    applyCylinderTransforms(currentPos);

    const nearest = Math.min(n - 1, Math.max(0, Math.round(currentPos)));
    if (nearest !== activeRef.current) {
      activeRef.current = nearest;
      setActive(nearest);
    }
  }, [n, applyCylinderTransforms]);

  // Sync with Lenis smooth scroll
  useLenis(() => {
    updateScrollProgress();
  });

  // Standard scroll listener
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          updateScrollProgress();
        });
      }
    };

    updateScrollProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [updateScrollProgress]);

  const current = items[active] || items[0];
  const { w, h } = dimensions;

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-transparent ${className}`}
      style={{ height: dimensions.w < 200 ? "210vh" : "260vh" }}
      aria-label="Anime concave scroll showcase"
    >
      {/* Sticky Viewport Stage (Sticks only while scrolling inside this container) */}
      <div className="sticky top-[58px] sm:top-[70px] w-full h-[calc(100vh-58px)] sm:h-[calc(100vh-70px)] flex flex-col justify-center items-center overflow-visible select-none pointer-events-auto">
        {/* 3D Stage (Transparent, no black box) */}
        <div
          className="relative w-full flex items-center justify-center overflow-visible"
          style={{
            height: h + (dimensions.w < 200 ? 75 : 110),
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

        {/* Caption + Scroll Status (Theme adaptive: dark and light) */}
        <div className="relative mt-3 sm:mt-8 flex flex-col items-center gap-1.5 sm:gap-2 text-center px-4 z-20">
          <div
            key={active}
            className="carousel-caption animate-[fadeUp_.35s_ease] text-center max-w-xl transition-all"
          >
            <div className="inline-flex items-center gap-2 mb-0.5 sm:mb-1">
              {current?.tag && (
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest px-2 sm:px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-800 dark:text-white/80 border border-zinc-300 dark:border-white/15">
                  {current.tag}
                </span>
              )}
              <span className="text-[11px] sm:text-xs font-mono font-medium text-zinc-500 dark:text-white/50 tracking-wider">
                {pad(active + 1)} / {pad(n)}
              </span>
            </div>

            <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white drop-shadow-sm leading-tight">
              {current?.title}
            </h3>

            {current?.subtitle && (
              <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-sm text-zinc-600 dark:text-zinc-300/85 max-w-lg mx-auto leading-relaxed line-clamp-2">
                {current?.subtitle}
              </p>
            )}
          </div>

          {/* Minimal Scroll Helper Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-zinc-200/60 dark:bg-white/5 border border-zinc-300/80 dark:border-white/10 backdrop-blur-md text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-400">
            <svg
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-bounce text-zinc-500 dark:text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>Scroll to rotate • Click any card to flip</span>
          </div>
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
