import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import "./AnimeDeck.css";

type Anime = {
  id: string;
  title: string;
  tag: string;
  note: string; // shown on the back of the card.
  hue: number; // accent colour, 0-360
  image?: string;
};

const ANIME: Anime[] = [
  { id: "aot",        title: "Attack on Titan",  tag: "Dark fantasy",         hue: 215, note: "Freedom, sacrifice and the best plot twists I have ever watched.",         image: "/anime/aot.jpg" },
  { id: "naruto",     title: "Naruto",            tag: "Shonen",               hue: 28,  note: "Never giving up, and the bond between rivals.",                            image: "/anime/naruto.jpg" },
  { id: "deathnote",  title: "Death Note",        tag: "Psychological thriller",hue: 350, note: "A battle of minds where every move is planned three steps ahead.",         image: "/anime/deathnote.jpg" },
  { id: "vinland",    title: "Vinland Saga",      tag: "Historical epic",      hue: 180, note: "A story that goes from revenge to finding what a real life is.",           image: "/anime/vinland.jpg" },
  { id: "jjk",        title: "Jujutsu Kaisen",   tag: "Dark shonen",          hue: 270, note: "Cursed energy, domain clashes and unreal animation.",                      image: "/anime/jjk.jpg" },
  { id: "demonslayer",title: "Demon Slayer",      tag: "Action",               hue: 145, note: "Breathing styles, family and stunning fights.",                            image: "/anime/demonslayer.jpg" },
];

type Mode = "ring" | "grid";
type Pose = { x: number; y: number; z: number; ry: number; rz: number };

const N = ANIME.length;
const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "ring", label: "3D Ring", hint: "Drag to spin the ring. Tap a card to flip it." },
  { id: "grid", label: "Grid",    hint: "Tap a card to read why I love it." },
];

const rad = (d: number) => (d * Math.PI) / 180;
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

function poses(mode: Mode, W: number, cardW: number, cardH: number, spin: number) {
  if (mode === "grid") {
    const gap = 20;
    const cols = Math.max(1, Math.floor((W + gap) / (cardW + gap)));
    const rows = Math.ceil(N / cols);
    const list: Pose[] = [];
    for (let i = 0; i < N; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const inRow = Math.min(cols, N - row * cols);
      list.push({ x: (col - (inRow - 1) / 2) * (cardW + gap), y: row * (cardH + gap), z: 0, ry: 0, rz: 0 });
    }
    return { list, height: rows * cardH + (rows - 1) * gap };
  }

  // 3D ring (default)
  const list: Pose[] = [];
  const radius = cardW / 2 / Math.tan(Math.PI / N) + 36;
  for (let i = 0; i < N; i++) {
    const a = (i * 360) / N + spin;
    list.push({ x: radius * Math.sin(rad(a)), y: 24, z: radius * Math.cos(rad(a)) - radius, ry: a, rz: 0 });
  }
  return { list, height: cardH + 48 };
}

const stackPose = (i: number): Pose => ({ x: 0, y: 40, z: i * 3, ry: 0, rz: (i % 2 ? 1 : -1) * (5 + i * 2) });

export default function AnimeDeck() {
  const [mode, setMode] = useState<Mode>("ring");
  const [flipped, setFlipped] = useState<boolean[]>(() => Array(N).fill(false));
  const [size, setSize] = useState({ W: 1000, cardW: 240, cardH: 336 });

  const deckRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const S = useRef({
    mode: "ring" as Mode,
    size,
    spin: 0,
    paused: false,
    dragging: false,
    moved: false,
    dist: 0,
    lastX: 0,
    visible: false,
    shuffleUntil: 0,
    wasShuffling: false,
    switchAt: 0,
    cur: [] as Pose[],
  });
  S.current.size = size;

  /* measure the deck */
  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;
    const measure = () => {
      const W = el.clientWidth;
      const cardW = W < 520 ? 180 : W < 820 ? 210 : 240;
      setSize({ W, cardW, cardH: Math.round(cardW * 1.4) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* only animate while the section is on screen */
  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (S.current.visible = Boolean(e?.isIntersecting)), {
      rootMargin: "200px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* animation loop */
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let raf = 0;
    let last = performance.now();
    let lastHeight = -1;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const s = S.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!s.visible) return;

      if (s.mode === "ring" && !s.paused && !s.dragging && !reduced) s.spin += dt * 16;

      const shuffling = now < s.shuffleUntil;
      if (s.wasShuffling && !shuffling) s.switchAt = now;
      s.wasShuffling = shuffling;

      const { W, cardW, cardH } = s.size;
      const { list, height } = poses(s.mode, W, cardW, cardH, s.spin);
      if (height !== lastHeight && deckRef.current) {
        lastHeight = height;
        deckRef.current.style.height = `${height}px`;
      }

      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const target = shuffling ? stackPose(i) : list[i];
        const cur = (s.cur[i] ??= { ...target });

        if (reduced || s.switchAt + i * 70 <= now) {
          const k = reduced ? 1 : 1 - Math.exp(-dt * (shuffling ? 16 : 6.5));
          cur.x += (target.x - cur.x) * k;
          cur.y += (target.y - cur.y) * k;
          cur.z += (target.z - cur.z) * k;
          cur.ry += wrap(target.ry - cur.ry) * k;
          cur.rz += wrap(target.rz - cur.rz) * k;
        }
        el.style.transform = `translate3d(${cur.x}px, ${cur.y}px, ${cur.z}px) rotateY(${cur.ry}deg) rotateZ(${cur.rz}deg)`;

        if (s.mode === "ring" && !shuffling) {
          const cos = Math.cos(rad(cur.ry));
          if (cos <= 0) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            el.style.visibility = "hidden";
          } else {
            const alpha = Math.min(1, cos / 0.25);
            el.style.opacity = alpha < 0.99 ? alpha.toFixed(3) : "1";
            el.style.pointerEvents = alpha > 0.5 ? "auto" : "none";
            el.style.visibility = "visible";
          }
          el.style.zIndex = String(Math.round(cur.z + 1000));
        } else {
          el.style.opacity = "";
          el.style.pointerEvents = "";
          el.style.visibility = "";
          el.style.zIndex = "";
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---------- actions ---------- */
  const chooseMode = (m: Mode) => {
    if (m === S.current.mode) return;
    S.current.mode = m;
    S.current.switchAt = performance.now();
    setMode(m);
    if (m !== "ring") {
      cardRefs.current.forEach((el) => {
        if (el) {
          el.style.opacity = "";
          el.style.pointerEvents = "";
          el.style.visibility = "";
          el.style.zIndex = "";
        }
      });
    }
  };

  const shuffle = () => {
    const now = performance.now();
    S.current.shuffleUntil = now + 600;
    S.current.switchAt = now;
    setFlipped(Array(N).fill(false));
    cardRefs.current.forEach((el) => {
      if (el) {
        el.style.opacity = "";
        el.style.pointerEvents = "";
        el.style.visibility = "";
        el.style.zIndex = "";
      }
    });
  };

  const toggleFlip = (i: number) => setFlipped((f) => f.map((v, j) => (j === i ? !v : v)));

  const onDown = (e: PointerEvent) => {
    const s = S.current;
    s.moved = false;
    s.dist = 0;
    if (s.mode !== "ring") return;
    s.dragging = true;
    s.lastX = e.clientX;
  };
  const onMove = (e: PointerEvent) => {
    const s = S.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.lastX;
    s.lastX = e.clientX;
    s.spin += dx * 0.35;
    s.dist += Math.abs(dx);
    if (s.dist > 6) s.moved = true;
  };
  const onUp = () => (S.current.dragging = false);
  const onEnter = (e: PointerEvent) => {
    if (e.pointerType === "mouse") S.current.paused = true;
  };
  const onLeave = () => {
    S.current.paused = false;
    S.current.dragging = false;
  };

  const onCardClick = (i: number) => {
    if (S.current.moved) { S.current.moved = false; return; }
    toggleFlip(i);
  };
  const onCardKey = (e: KeyboardEvent, i: number) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleFlip(i); }
  };

  const hint = MODES.find((m) => m.id === mode)?.hint;

  return (
    <section className="ad" id="beyond-code" aria-labelledby="ad-heading">
      <header className="ad__head">
        <div className="section-watermark-heading">
          <span className="watermark-bg" aria-hidden="true">ANIME</span>
          <h2 className="watermark-fg" id="ad-heading">Beyond Code</h2>
        </div>
        <p>The anime that shaped how I think about stories, discipline and never giving up.</p>
      </header>

      <div className="ad__controls">
        <div className="ad__seg" role="group" aria-label="Card layout">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={mode === m.id ? "is-active" : ""}
              aria-pressed={mode === m.id}
              onClick={() => chooseMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button type="button" className="ad__shuffle" onClick={shuffle}>
          Shuffle
        </button>
      </div>
      <p className="ad__hint">{hint}</p>

      <div
        ref={deckRef}
        className="ad__deck"
        data-mode={mode}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
      >
        {ANIME.map((a, i) => (
          <div
            key={a.id}
            ref={(el) => (cardRefs.current[i] = el)}
            className="ad__card"
            role="button"
            tabIndex={0}
            aria-pressed={flipped[i]}
            aria-label={`${a.title}. Press to ${flipped[i] ? "hide" : "read"} why I love it.`}
            style={
              {
                "--hue": a.hue,
                width: size.cardW,
                height: size.cardH,
                marginLeft: -size.cardW / 2,
              } as CSSProperties
            }
            onClick={() => onCardClick(i)}
            onKeyDown={(e) => onCardKey(e, i)}
          >
            <div className="ad__lift">
              <div className={`ad__flip ${flipped[i] ? "is-flipped" : ""}`}>
                <div className={`ad__face ad__front ${a.image ? "has-img" : ""}`}>
                  {a.image && <img className="ad__img" src={a.image} alt="" loading="lazy" draggable={false} />}
                  <span className="ad__num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <div className="ad__text">
                    <span className="ad__tag">{a.tag}</span>
                    <h3 className="ad__title">{a.title}</h3>
                  </div>
                </div>
                <div className="ad__face ad__back">
                  <h3 className="ad__title">{a.title}</h3>
                  <p>{a.note}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
