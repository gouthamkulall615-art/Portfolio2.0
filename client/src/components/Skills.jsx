import React from "react";
import "./Skills.css";

const skills = [
  {
    name: "React",
    icon: "/icons/react.svg",
    fallback: "/images/react.webp",
  },
  {
    name: "JavaScript",
    icon: "/icons/javascript.svg",
    fallback: "/images/javascript.webp",
  },
  {
    name: "Node.js",
    icon: "/icons/nodejs.svg",
    fallback: "/images/nodejs.webp",
  },
  {
    name: "Express.js",
    icon: "/icons/express.svg",
    fallback: "/images/express.webp",
  },
  {
    name: "MongoDB",
    icon: "/icons/mongodb.svg",
    fallback: "/images/mongodb.webp",
  },
  {
    name: "C++",
    icon: "/icons/cpp.svg",
    fallback: "/images/cpp.webp",
  },
  {
    name: "HTML",
    icon: "/icons/html.svg",
    fallback: "/images/html.webp",
  },
  {
    name: "CSS",
    icon: "/icons/css.svg",
    fallback: "/images/css.webp",
  },
  {
    name: "Git",
    icon: "/icons/git.svg",
    fallback: "/images/git.webp",
  },
  {
    name: "GitHub",
    icon: "/icons/github.svg",
    fallback: "/images/github.webp",
    invertInDark: true,
  },
  {
    name: "Socket.IO",
    icon: "/icons/socketio.svg",
    fallback: "/images/socketio.webp",
  },
  {
    name: "WebSockets",
    icon: "/icons/websocket.svg",
    fallback: "/images/websocket.webp",
  },
  {
    name: "Yjs",
    icon: "/icons/yjs.svg",
    fallback: "/images/yjs.webp",
  },
  {
    name: "Vercel",
    icon: "/icons/vercel.svg",
    fallback: "/images/vercel.webp",
    invertInDark: true,
  },
  {
    name: "Postman",
    icon: "/icons/postman.svg",
    fallback: "/images/postman.webp",
  },
];

function SkillOrbitItem({ skill, index, total }) {
  const angle = (360 / total) * index;
  const isDarkMonochrome = skill.invertInDark || skill.name === "GitHub" || skill.name === "Vercel";

  return (
    <div
      className="skill-orbit-item"
      style={{
        "--angle": `${angle}deg`,
        "--index": index,
        "--total": total,
      }}
    >
      <div className={`skill-orbit-circle ${isDarkMonochrome ? 'skill-orbit-circle-monochrome' : ''}`}>
        <img
          src={skill.icon}
          alt={skill.name}
          className={`skill-orbit-icon ${isDarkMonochrome ? 'skill-icon-invert-dark' : ''}`}
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

export default function Skills() {
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
    </section>
  );
}
