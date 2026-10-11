import type { CSSProperties } from "react";
import type { CarouselItem } from "./ConcaveCarousel";

interface AnimeCardProps {
  item: CarouselItem;
  index: number;
  isFlipped: boolean;
  onToggleFlip: () => void;
  isCenter?: boolean;
}

export default function AnimeCard({
  item,
  index,
  isFlipped,
  onToggleFlip,
  isCenter = false,
}: AnimeCardProps) {
  const hue = item.hue ?? 215;
  const padIndex = String(index + 1).padStart(2, "0");

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onToggleFlip();
      }}
      className="relative w-full h-full select-none cursor-pointer [perspective:1000px] group"
      title="Click to flip card"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggleFlip();
        }
      }}
      aria-label={`${item.title}. Press to flip.`}
    >
      <div
        className={`relative w-full h-full rounded-2xl transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
        }`}
      >
        {/* FRONT FACE */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden [backface-visibility:hidden] [WebkitBackfaceVisibility:hidden] flex flex-col justify-end p-5 transition-shadow duration-300"
          style={
            {
              background: `radial-gradient(120% 80% at 100% 0%, hsl(${hue} 80% 45% / 0.4), transparent 60%), linear-gradient(160deg, #181820, #0c0c12)`,
              border: `1px solid hsl(${hue} 60% 50% / 0.45)`,
              boxShadow: isCenter
                ? `0 20px 40px -15px hsl(${hue} 80% 50% / 0.35), 0 0 0 1px hsl(${hue} 70% 60% / 0.5)`
                : `0 15px 30px -15px rgba(0, 0, 0, 0.75)`,
            } as CSSProperties
          }
        >
          {/* Background image */}
          {item.image && (
            <img
              src={item.image}
              alt={item.title}
              draggable={false}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none transition-transform duration-700 group-hover:scale-105"
            />
          )}

          {/* Vignette / Bottom Gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(10, 10, 14, 0.96) 24%, rgba(10, 10, 14, 0.45) 60%, transparent 88%)",
            }}
          />

          {/* Top Row: Outline Index Number & Flip Indicator */}
          <div className="absolute top-3.5 inset-x-4 flex items-center justify-between z-10 pointer-events-none">
            <span
              className="font-mono font-black text-3xl leading-none select-none"
              style={{
                color: "transparent",
                WebkitTextStroke: `1.5px hsl(${hue} 85% 70% / 0.85)`,
              }}
            >
              {padIndex}
            </span>

            <span
              className="text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-semibold pointer-events-auto backdrop-blur-md transition-all group-hover:scale-105 shadow-sm"
              style={{
                background: `hsl(${hue} 80% 50% / 0.28)`,
                border: `1px solid hsl(${hue} 85% 65% / 0.55)`,
                color: `hsl(${hue} 85% 90%)`,
              }}
            >
              Tap to flip
            </span>
          </div>

          {/* Bottom Info */}
          <div className="relative z-10 flex flex-col items-start gap-1">
            {item.tag && (
              <span
                className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full"
                style={{
                  background: `hsl(${hue} 85% 55% / 0.25)`,
                  border: `1px solid hsl(${hue} 85% 65% / 0.5)`,
                  color: `hsl(${hue} 85% 85%)`,
                }}
              >
                {item.tag}
              </span>
            )}
            <h4 className="text-lg md:text-xl font-bold text-white tracking-tight leading-snug drop-shadow-md">
              {item.title}
            </h4>
          </div>
        </div>

        {/* BACK FACE */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden [backface-visibility:hidden] [WebkitBackfaceVisibility:hidden] [transform:rotateY(180deg)] p-6 flex flex-col justify-between text-left"
          style={
            {
              background: `linear-gradient(160deg, hsl(${hue} 55% 18%), #0c0c14)`,
              border: `1px solid hsl(${hue} 70% 55% / 0.65)`,
              boxShadow: `0 24px 45px -20px hsl(${hue} 85% 45% / 0.45)`,
            } as CSSProperties
          }
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full"
                style={{
                  background: `hsl(${hue} 85% 50% / 0.25)`,
                  border: `1px solid hsl(${hue} 85% 65% / 0.6)`,
                  color: `hsl(${hue} 85% 85%)`,
                }}
              >
                {item.tag ?? "Anime"}
              </span>
              <span className="text-xs text-white/50 font-mono">#{padIndex}</span>
            </div>

            <h4 className="text-xl font-bold text-white tracking-tight mb-3">
              {item.title}
            </h4>

            <p className="text-sm sm:text-base leading-relaxed text-zinc-200/90 font-normal italic">
              "{item.note ?? item.subtitle}"
            </p>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
            <span>Beyond Code</span>
            <span
              className="text-[11px] underline underline-offset-2 font-medium"
              style={{ color: `hsl(${hue} 85% 85%)` }}
            >
              Tap to flip back
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
