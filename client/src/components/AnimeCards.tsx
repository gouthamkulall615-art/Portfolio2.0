import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import "./AnimeCards.css";

type Anime = {
  id: "aot" | "naruto" | "deathnote" | "vinland" | "jjk" | "demonslayer";
  title: string;
  tag: string;
  note: string;
  image?: string;
};

const ANIME: Anime[] = [
  {
    id: "aot",
    title: "Attack on Titan",
    tag: "Dark fantasy",
    note: "Freedom, sacrifice and the best plot twists I have ever watched.",
    image: "/anime/aot.jpg",
  },
  {
    id: "naruto",
    title: "Naruto",
    tag: "Shonen",
    note: "Never giving up, and the bond between rivals.",
    image: "/anime/naruto.jpg",
  },
  {
    id: "deathnote",
    title: "Death Note",
    tag: "Psychological thriller",
    note: "A battle of minds where every move is planned three steps ahead.",
    image: "/anime/deathnote.jpg",
  },
  {
    id: "vinland",
    title: "Vinland Saga",
    tag: "Historical epic",
    note: "A story that goes from revenge to finding what a real life is.",
    image: "/anime/vinland.jpg",
  },
  {
    id: "jjk",
    title: "Jujutsu Kaisen",
    tag: "Dark shonen",
    note: "Cursed energy, domain clashes and unreal animation.",
    image: "/anime/jjk.jpg",
  },
  {
    id: "demonslayer",
    title: "Demon Slayer",
    tag: "Action",
    note: "Breathing styles, family and stunning fights.",
    image: "/anime/demonslayer.jpg",
  },
];

function AnimeCard({ anime, index }: { anime: Anime; index: number }) {
  const itemRef = useRef<HTMLLIElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      threshold: 0.15,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
    el.style.setProperty("--rx", `${-(y - 0.5) * 14}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const onLeave = (e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <li
      ref={itemRef}
      className={`anime__item ${inView ? "is-in" : ""}`}
      style={{ "--i": index } as CSSProperties}
    >
      <article
        className={`acard acard--${anime.id} ${anime.image ? "has-img" : ""}`}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        {anime.image && <img className="acard__img" src={anime.image} alt="" loading="lazy" />}
        <div className={`fx fx--${anime.id}`} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span className="acard__glare" aria-hidden="true" />
        <div className="acard__body">
          <span className="acard__tag">{anime.tag}</span>
          <h3>{anime.title}</h3>
          <p>{anime.note}</p>
        </div>
      </article>
    </li>
  );
}

export default function AnimeCards() {
  return (
    <section className="anime" id="beyond-code" aria-labelledby="anime-heading">
      <header className="anime__head">
        <div className="section-watermark-heading">
          <span className="watermark-bg" aria-hidden="true">ANIME</span>
          <h2 className="watermark-fg" id="anime-heading">Beyond Code</h2>
        </div>
        <p>The anime that shaped how I think about stories, discipline and never giving up.</p>
      </header>
      <ul className="anime__grid">
        {ANIME.map((a, i) => (
          <AnimeCard key={a.id} anime={a} index={i} />
        ))}
      </ul>
    </section>
  );
}
