import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import "../css/Skills.css";

// Single Source of Truth for Skills
const skills = [
  {
    name: "React",
    symbol: "Re",
    category: "Frontend",
    blurb: "Component-based library for building dynamic, state-driven, and highly reactive user interfaces.",
    iconMode: "color",
    projects: ["SyncCanvas", "Crypto Tracker", "InternIQ"],
    iconSrc: "/skill-icons/react.svg",
    fallback: "/images/react.webp",
  },
  {
    name: "JavaScript",
    symbol: "Js",
    category: "Languages",
    blurb: "The core programming language powering modern interactive web applications and asynchronous workflows.",
    iconMode: "color",
    projects: ["SyncCanvas", "Taskify", "InternIQ"],
    iconSrc: "/skill-icons/javascript.svg",
    fallback: "/images/javascript.webp",
  },
  {
    name: "HTML",
    symbol: "Ht",
    category: "Frontend",
    blurb: "Semantic markup foundation creating accessible, structured, and search-optimized web document hierarchies.",
    iconMode: "color",
    projects: ["Taskify"],
    iconSrc: "/skill-icons/html.svg",
    fallback: "/images/html.webp",
  },
  {
    name: "CSS",
    symbol: "Cs",
    category: "Frontend",
    blurb: "Modern styling language creating responsive layouts, fluid typography, animations, and glassmorphic designs.",
    iconMode: "color",
    projects: ["Taskify", "Crypto Tracker"],
    iconSrc: "/skill-icons/css.svg",
    fallback: "/images/css.webp",
  },
  {
    name: "Node.js",
    symbol: "No",
    category: "Backend",
    blurb: "Event-driven asynchronous JavaScript runtime powering scalable high-concurrency backend services and APIs.",
    iconMode: "color",
    projects: ["InternIQ"],
    iconSrc: "/skill-icons/nodejs.svg",
    fallback: "/images/nodejs.webp",
  },
  {
    name: "Express.js",
    symbol: "Ex",
    category: "Backend",
    blurb: "Fast, minimalist web framework for building robust RESTful microservices and routing logic.",
    iconMode: "invert",
    projects: ["SyncCanvas", "InternIQ"],
    iconSrc: "/skill-icons/express.svg",
    fallback: "/images/express.webp",
  },
  {
    name: "MongoDB",
    symbol: "Mg",
    category: "Databases",
    blurb: "Flexible document-oriented NoSQL database optimized for high-throughput unstructured and schema-less data storage.",
    iconMode: "color",
    projects: ["SyncCanvas", "InternIQ"],
    iconSrc: "/skill-icons/mongodb.svg",
    fallback: "/images/mongodb.webp",
  },
  {
    name: "C++",
    symbol: "Cp",
    category: "Languages",
    blurb: "High-performance systems programming language enabling fast computations, memory control, and efficient algorithms.",
    iconMode: "color",
    projects: ["TODO"],
    iconSrc: "/skill-icons/cpp.svg",
    fallback: "/images/cpp.webp",
  },

  {
    name: "Git",
    symbol: "Gt",
    category: "Tools",
    blurb: "Distributed version control system managing code branching, team collaboration, and historical revisions.",
    iconMode: "color",
    projects: ["SyncCanvas", "InternIQ", "Taskify"],
    iconSrc: "/skill-icons/git.svg",
    fallback: "/images/git.webp",
  },
  {
    name: "GitHub",
    symbol: "Gh",
    category: "Tools",
    blurb: "Cloud-based hosting platform facilitating Git workflows, collaborative code reviews, and CI/CD pipelines.",
    iconMode: "invert",
    projects: ["SyncCanvas", "Crypto Tracker", "InternIQ", "Taskify"],
    iconSrc: "/skill-icons/github.svg",
    fallback: "/images/github.webp",
  },
  {
    name: "Socket.IO",
    symbol: "So",
    category: "Backend",
    blurb: "Bidirectional event-based library enabling low-latency real-time communication between browser and server.",
    iconMode: "invert",
    projects: ["SyncCanvas"],
    iconSrc: "/skill-icons/socketio.svg",
    fallback: "/images/socketio.webp",
  },
  {
    name: "WebSockets",
    symbol: "Ws",
    category: "Backend",
    blurb: "Full-duplex TCP transport protocol providing persistent real-time client-server communication channels.",
    iconMode: "color",
    projects: ["SyncCanvas"],
    iconSrc: "/skill-icons/websocket.svg",
    fallback: "/images/websocket.webp",
  },
  {
    name: "Yjs",
    symbol: "Yj",
    category: "Tools",
    blurb: "Conflict-free replicated data type framework powering real-time collaborative state and multi-user editing.",
    iconMode: "color",
    projects: ["TODO"],
    iconSrc: "/skill-icons/yjs.svg",
    fallback: "/images/yjs.webp",
  },
  {
    name: "Vercel",
    symbol: "Vc",
    category: "Tools",
    blurb: "Optimized edge deployment platform providing automated CI/CD builds, instant rollouts, and previews.",
    iconMode: "invert",
    projects: ["SyncCanvas", "Crypto Tracker", "InternIQ", "Taskify"],
    iconSrc: "/skill-icons/vercel.svg",
    fallback: "/images/vercel.webp",
  },
  {
    name: "Postman",
    symbol: "Pm",
    category: "Tools",
    blurb: "API lifecycle testing suite for prototyping, validating, and debugging HTTP requests and endpoints.",
    iconMode: "color",
    projects: ["TODO"],
    iconSrc: "/skill-icons/postman.svg",
    fallback: "/images/postman.webp",
  },
];

// Project links mapped from ProjectsSection.jsx
const projectLinks = {
  SyncCanvas: "https://sync-canvas-three.vercel.app/",
  "Crypto Tracker": "https://coinpulse-beryl.vercel.app/",
  InternIQ: "https://intern-iq-omega.vercel.app/",
  Taskify: "https://taskify-self-five.vercel.app/",
};

const CATEGORIES = ["All", "Frontend", "Backend", "Languages", "Databases", "Tools"];

// ---------- Spheres View Orbit Item ----------
function SkillOrbitItem({ skill, index, total }) {
  const angle = (360 / total) * index;
  const isDarkInvert = skill.iconMode === "invert";
  const iconUrl = skill.iconSrc || skill.icon;

  return (
    <div
      className="skill-orbit-item"
      style={{
        "--angle": `${angle}deg`,
        "--index": index,
        "--total": total,
      }}
    >
      <div className={`skill-orbit-circle ${isDarkInvert ? "skill-orbit-circle-monochrome" : ""}`}>
        <img
          src={iconUrl}
          alt={skill.name}
          className={`skill-orbit-icon ${isDarkInvert ? "skill-icon-mode-invert" : ""}`}
          loading="lazy"
          onError={(e) => {
            if (skill.fallback && e.currentTarget.src !== skill.fallback) {
              e.currentTarget.src = skill.fallback;
            }
          }}
        />
        <span className="skill-tooltip">{skill.name}</span>
      </div>
    </div>
  );
}

// ---------- Periodic Table Tile Component (Clean Top-Left Symbol, Bottom-Left Name) ----------
function PeriodicTile({
  skill,
  index,
  total,
  isSelected,
  onSelect,
  isDimmed,
  hasWavePlayed,
  isReducedMotion,
  isTouch,
}) {
  const cardRef = useRef(null);
  const [imgError, setImgError] = useState(false);

  // Euclidean center distance wave calculation
  const waveDelay = useMemo(() => {
    if (isReducedMotion || hasWavePlayed) return 0;
    const cols = 4;
    const rows = Math.ceil(total / cols);
    const r = Math.floor(index / cols);
    const c = index % cols;
    const rMid = (rows - 1) / 2;
    const cMid = (cols - 1) / 2;
    const dist = Math.hypot(r - rMid, c - cMid);
    return dist * 0.04;
  }, [index, total, isReducedMotion, hasWavePlayed]);

  // Micro 3D tilt on pointer move (max 6deg)
  const handlePointerMove = useCallback(
    (e) => {
      if (isTouch || isReducedMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rotX = (0.5 - py) * 12; // [-6deg, +6deg]
      const rotY = (px - 0.5) * 12; // [-6deg, +6deg]
      cardRef.current.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    },
    [isTouch, isReducedMotion]
  );

  const handlePointerLeave = useCallback(() => {
    if (isTouch || isReducedMotion || !cardRef.current) return;
    cardRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
  }, [isTouch, isReducedMotion]);

  const springTransition = { type: "spring", stiffness: 300, damping: 30 };
  const waveTransition = { duration: 0.35, delay: waveDelay, ease: [0.16, 1, 0.3, 1] };

  const iconUrl = skill.iconSrc || skill.icon;
  const isInverted = skill.iconMode === "invert";

  return (
    <motion.div
      layout
      initial={hasWavePlayed ? false : { opacity: 0, y: 16 }}
      animate={{
        opacity: isDimmed ? 0.2 : 1,
        scale: isDimmed ? 0.92 : 1,
        y: 0,
      }}
      transition={hasWavePlayed ? springTransition : waveTransition}
      className={`skill-tile-wrapper ${isDimmed ? "is-dimmed" : ""} ${isSelected ? "is-selected-tile" : ""}`}
      data-category={skill.category}
    >
      <button
        ref={cardRef}
        type="button"
        className={`skill-tile-btn ${isSelected ? "is-active-preview" : ""}`}
        onClick={() => onSelect(skill)}
        onPointerEnter={() => onSelect(skill)}
        onFocus={() => onSelect(skill)}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        aria-describedby="skill-preview-panel"
        aria-label={`${skill.name}, ${skill.category}. ${isSelected ? "Currently previewed." : "Click or hover to preview."}`}
      >
        <div className="skill-tile-face skill-tile-front">
          {/* Top-Left: Large Symbol */}
          <div className="skill-tile-symbol-wrap">
            <span className="skill-tile-symbol">{skill.symbol}</span>
          </div>

          {/* Bottom-Left: Skill Name */}
          <span className="skill-tile-name">{skill.name}</span>

          {/* Bottom-Right: Faint Watermark Logo */}
          {!imgError && iconUrl && (
            <img
              src={iconUrl}
              alt=""
              aria-hidden="true"
              className={`skill-tile-watermark ${isInverted ? "skill-icon-mode-invert" : ""}`}
              loading="lazy"
              onError={() => {
                if (skill.fallback && iconUrl !== skill.fallback) {
                  // try fallback once
                } else {
                  setImgError(true);
                }
              }}
            />
          )}
        </div>
      </button>
    </motion.div>
  );
}

// ---------- Right-Side Skill Preview Panel Component ----------
function SkillPreviewPanel({ skill, isReducedMotion }) {
  const [imgError, setImgError] = useState(false);

  if (!skill) return null;

  const iconUrl = skill.iconSrc || skill.icon;
  const isInverted = skill.iconMode === "invert";

  return (
    <aside
      id="skill-preview-panel"
      className="skills-preview-panel"
      data-category={skill.category}
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={skill.name}
          initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, x: 8 }}
          animate={isReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="skills-preview-content"
        >
          {/* Large Hero Icon Box with Category Glow */}
          <div className={`skills-preview-icon-box ${isInverted ? "has-inverted-icon" : ""}`}>
            {!imgError && iconUrl ? (
              <img
                src={iconUrl}
                alt={`${skill.name} logo`}
                className={`skills-preview-icon-img ${isInverted ? "skill-icon-mode-invert" : ""}`}
                width={88}
                height={88}
                loading="eager"
                onError={() => {
                  if (skill.fallback && iconUrl !== skill.fallback) {
                    // Try fallback image
                  } else {
                    setImgError(true);
                  }
                }}
              />
            ) : (
              <span className="skills-preview-fallback-symbol">
                {skill.symbol}
              </span>
            )}
          </div>

          {/* Skill Full Name */}
          <h3 className="skills-preview-title">{skill.name}</h3>

          {/* Centered Category Pill */}
          <div className="skills-preview-meta">
            <span className="skills-preview-cat-badge">{skill.category}</span>
          </div>

          {/* One-Line Skill Description Blurb */}
          {skill.blurb && (
            <p className="skills-preview-blurb">{skill.blurb}</p>
          )}

          {/* Used In Projects Section */}
          {skill.projects && skill.projects.length > 0 && (
            <div className="skills-preview-projects-wrap">
              <span className="skills-preview-projects-label">USED IN</span>
              <div className="skills-preview-project-chips">
                {skill.projects.map((proj, idx) => {
                  if (proj === "TODO") {
                    return (
                      <span key={idx} className="skills-preview-project-chip is-todo">
                        TODO
                      </span>
                    );
                  }
                  const link = projectLinks[proj];
                  return link ? (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="skills-preview-project-chip has-link"
                    >
                      <span>{proj}</span>
                      <ExternalLink size={12} className="skills-preview-link-icon" aria-hidden="true" />
                    </a>
                  ) : (
                    <span key={idx} className="skills-preview-project-chip">
                      {proj}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </aside>
  );
}

// ---------- Periodic Table View Component (2 Columns: Grid + Preview) ----------
function SkillsTable({ isReducedMotion, isTouch }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeSkill, setActiveSkill] = useState(() => skills[0]);
  const [hasWavePlayed, setHasWavePlayed] = useState(false);
  const gridRef = useRef(null);
  const rAFRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Mark wave reveal as completed after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasWavePlayed(true);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // When category filter changes, ensure activeSkill is within filtered category
  const handleCategorySelect = useCallback(
    (cat) => {
      setSelectedCategory(cat);
      if (cat !== "All") {
        if (!activeSkill || activeSkill.category !== cat) {
          const firstMatching = skills.find((s) => s.category === cat);
          if (firstMatching) {
            setActiveSkill(firstMatching);
          }
        }
      }
    },
    [activeSkill]
  );

  // ~60ms debounced skill selection on hover/focus to prevent erratic switching
  const handleSelectSkill = useCallback(
    (skill) => {
      if (isTouch) {
        // Immediate update on touch tap
        setActiveSkill(skill);
        return;
      }
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        setActiveSkill(skill);
      }, 60);
    },
    [isTouch]
  );

  // Spotlight mouse tracking with rAF throttle
  const handlePointerMove = useCallback(
    (e) => {
      if (isTouch || isReducedMotion || !gridRef.current) return;
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      rAFRef.current = requestAnimationFrame(() => {
        if (!gridRef.current) return;
        const rect = gridRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        gridRef.current.style.setProperty("--mx", `${x}px`);
        gridRef.current.style.setProperty("--my", `${y}px`);
      });
    },
    [isTouch, isReducedMotion]
  );

  return (
    <div className="skills-table-container">
      {/* Category Chips Bar */}
      <div className="skills-chips-wrapper" role="toolbar" aria-label="Filter skills by category">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="button"
              aria-pressed={isSelected}
              className={`skills-category-chip ${isSelected ? "is-active" : ""}`}
              onClick={() => handleCategorySelect(cat)}
              data-category={cat}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Split: Left Grid (~68%) + Right Preview Panel (~32%) */}
      <div className="skills-table-split-layout">
        {/* Left Column: Grid Stage with Spotlight */}
        <div
          ref={gridRef}
          className="skills-table-grid"
          onPointerMove={handlePointerMove}
        >
          <div className="skills-table-spotlight" aria-hidden="true" />

          {skills.map((skill, index) => {
            const isDimmed = selectedCategory !== "All" && skill.category !== selectedCategory;
            const isSelected = activeSkill?.name === skill.name;

            return (
              <PeriodicTile
                key={skill.name}
                skill={skill}
                index={index}
                total={skills.length}
                isSelected={isSelected}
                onSelect={handleSelectSkill}
                isDimmed={isDimmed}
                hasWavePlayed={hasWavePlayed}
                isReducedMotion={isReducedMotion}
                isTouch={isTouch}
              />
            );
          })}
        </div>

        {/* Right Column: Sticky Preview Panel */}
        <div className="skills-table-preview-col">
          <SkillPreviewPanel
            skill={activeSkill}
            isReducedMotion={isReducedMotion}
          />
        </div>
      </div>
    </div>
  );
}

// ---------- Main Export: Skills Section ----------
export default function Skills() {
  const [activeView, setActiveView] = useState("spheres"); // "spheres" | "table"
  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });
  const [isTouch, setIsTouch] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (e) => setIsReducedMotion(e.matches);
    motionQuery.addEventListener("change", handleMotionChange);

    const touchQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
    const handleTouchChange = (e) => setIsTouch(e.matches);
    touchQuery.addEventListener("change", handleTouchChange);

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      touchQuery.removeEventListener("change", handleTouchChange);
    };
  }, []);

  return (
    <section id="skills" className="skills-section">
      {/* Section Heading matching Projects & Education */}
      <div className="section-watermark-heading skills-heading-wrapper">
        <span
          className="watermark-bg skills-heading-background"
          aria-hidden="true"
        >
          SKILLS
        </span>
        <h2 className="watermark-fg skills-heading">SKILLS</h2>
      </div>

      {/* View Segmented Pill Toggle */}
      <div className="skills-view-toggle-wrap">
        <div className="skills-view-toggle" role="tablist" aria-label="Skills view options">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === "spheres"}
            className={`skills-view-toggle-btn ${activeView === "spheres" ? "is-active" : ""}`}
            onClick={() => setActiveView("spheres")}
          >
            Spheres
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === "table"}
            className={`skills-view-toggle-btn ${activeView === "table" ? "is-active" : ""}`}
            onClick={() => setActiveView("table")}
          >
            Table
          </button>
        </div>
      </div>

      {/* Cross-fade views (~300ms, opacity + translateY) */}
      <div className="skills-view-stage">
        <AnimatePresence mode="wait">
          {activeView === "spheres" ? (
            <motion.div
              key="view-spheres"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="skills-orbit-stage"
            >
              <div className="skills-orbit-wrapper">
                <div className="skills-orbit">
                  {/* Subtle celestial dashed orbit guideline */}
                  <svg
                    className="skills-orbit-svg"
                    viewBox="0 0 900 480"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <ellipse
                      cx="450"
                      cy="240"
                      rx="380"
                      ry="190"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="6 8"
                      className="skills-orbit-line"
                    />
                  </svg>

                  {/* Center focal badge */}
                  <div className="skills-center">
                    <span>SKILLS</span>
                  </div>

                  {/* Orbiting technology circles */}
                  {skills.map((skill, index) => (
                    <SkillOrbitItem
                      key={skill.name}
                      skill={skill}
                      index={index}
                      total={skills.length}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="view-table"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="skills-table-stage"
            >
              <SkillsTable
                isReducedMotion={isReducedMotion}
                isTouch={isTouch}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
