import ConcaveCarousel, { type CarouselItem } from "./ConcaveCarousel";
import AnimeCard from "./AnimeCard";

const ANIME_ITEMS: CarouselItem[] = [
  {
    id: "aot",
    title: "Attack on Titan",
    subtitle: "Freedom, sacrifice and the best plot twists in modern fiction.",
    image: "/anime/aot.jpg",
    tag: "Dark Fantasy",
    hue: 215,
    note: "Freedom, sacrifice and the best plot twists I have ever watched.",
  },
  {
    id: "naruto",
    title: "Naruto",
    subtitle: "Never giving up, hard work, and the unbreakable bond between rivals.",
    image: "/anime/naruto.jpg",
    tag: "Shonen",
    hue: 28,
    note: "Never giving up, and the bond between rivals.",
  },
  {
    id: "deathnote",
    title: "Death Note",
    subtitle: "A battle of minds where every move is calculated three steps ahead.",
    image: "/anime/deathnote.jpg",
    tag: "Psychological",
    hue: 350,
    note: "A battle of minds where every move is planned three steps ahead.",
  },
  {
    id: "vinland",
    title: "Vinland Saga",
    subtitle: "A story that evolves from vengeance to discovering true purpose in life.",
    image: "/anime/vinland.jpg",
    tag: "Historical Epic",
    hue: 180,
    note: "A story that goes from revenge to finding what a real life is.",
  },
  {
    id: "jjk",
    title: "Jujutsu Kaisen",
    subtitle: "Cursed energy, lethal domain expansions, and peak kinetic animation.",
    image: "/anime/jjk.jpg",
    tag: "Dark Shonen",
    hue: 270,
    note: "Cursed energy, domain clashes and unreal animation.",
  },
  {
    id: "demonslayer",
    title: "Demon Slayer",
    subtitle: "Elemental breathing forms, familial loyalty, and breathtaking swordcraft.",
    image: "/anime/demonslayer.jpg",
    tag: "Action",
    hue: 145,
    note: "Breathing styles, family and stunning fights.",
  },
];

export default function AnimeSection() {
  return (
    <section
      id="anime"
      className="relative w-full max-w-7xl mx-auto py-12 md:py-20 px-4 sm:px-6 overflow-visible"
      aria-labelledby="anime-heading"
    >
      {/* Anchor alias for backward compatibility */}
      <span id="beyond-code" className="sr-only" />

      {/* Header with portfolio watermark tokens */}
      <header className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
        <div className="section-watermark-heading">
          <span className="watermark-bg" aria-hidden="true">ANIME</span>
          <h2 className="watermark-fg" id="anime-heading">Beyond Code</h2>
        </div>
        <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
          The anime that shaped how I think about stories, discipline and never giving up.
        </p>
      </header>

      {/* Scroll-Driven Concave Carousel */}
      <ConcaveCarousel
        items={ANIME_ITEMS}
        cardWidth={280}
        cardHeight={400}
        radius={680}
        step={30}
        perspective={1400}
        renderCard={(item, index, isFlipped, onToggleFlip, isCenter) => (
          <AnimeCard
            item={item}
            index={index}
            isFlipped={isFlipped}
            onToggleFlip={onToggleFlip}
            isCenter={isCenter}
          />
        )}
      />
    </section>
  );
}
