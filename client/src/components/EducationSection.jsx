import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import uvceImg from '../assets/uvce.webp';
import sipucImg from '../assets/sipuc.avif';
import './EducationSection.css';

const milestones = [
  {
    id: 'uvce',
    institution: 'UVCE',
    fullName: 'University Visvesvaraya College of Engineering',
    period: '2025 – 2029',
    degree: 'B.Tech, Computer Science & Engineering',
    image: uvceImg,
    alt: 'UVCE Campus',
    side: 'left',
  },
  {
    id: 'sipuc',
    institution: 'Seshadripuram Independent PU College',
    fullName: 'Pre-University Education',
    period: '2023 – 2025',
    degree: 'PCMC (Physics, Chemistry, Maths, Computer Science)',
    score: 'Scored 98%',
    image: sipucImg,
    alt: 'Seshadripuram Independent PU College',
    side: 'right',
  },
];

export default function EducationSection() {
  const containerRef = useRef(null);

  // Track scroll progress within the education section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 75%', 'end 70%'],
  });

  // Smooth out spine drawing progress
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 25,
    restDelta: 0.001,
  });

  return (
    <section id="education" className="education-section">
      {/* Layered Watermark Heading matching Projects & Skills */}
      <div className="section-watermark-heading">
        <span className="watermark-bg" aria-hidden="true">EDUCATION</span>
        <h2 className="watermark-fg">EDUCATION</h2>
      </div>

      <div ref={containerRef} className="timeline-container">
        {/* Underline Faint Guideline */}
        <div className="timeline-spine-track" />

        {/* Animated Drawing Spine Line */}
        <motion.div
          className="timeline-spine-progress"
          style={{ scaleY }}
        />

        {milestones.map((item, index) => {
          const isLeft = item.side === 'left';

          return (
            <div
              key={item.id}
              className={`timeline-item ${isLeft ? 'item-left' : 'item-right'}`}
            >
              {/* Circular Marker Dot on Spine */}
              <div className="timeline-marker-wrapper">
                <motion.div
                  className="timeline-marker-dot"
                  initial={{ scale: 0.4, opacity: 0.3 }}
                  whileInView={{ scale: [0.4, 1.35, 1], opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                />
              </div>

              {/* Horizontal Branch Line connecting Spine to Card */}
              <motion.div
                className="timeline-branch-line"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
              />

              {/* Milestone Card */}
              <motion.div
                className="timeline-card"
                initial={{ opacity: 0, x: isLeft ? -55 : 55 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.65,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {/* Header Badge */}
                <div className="timeline-card-header">
                  <div className="timeline-badge">
                    <span>{item.period}</span>
                  </div>
                </div>

                {/* Institution & Degree */}
                <h3 className="timeline-institution">{item.institution}</h3>
                <p className="timeline-degree">
                  {item.degree}
                  {item.score && (
                    <>
                      {' — '}
                      <strong>{item.score}</strong>
                    </>
                  )}
                </p>

                {/* Institution Image */}
                <div className="timeline-image-wrapper">
                  <img
                    src={item.image}
                    alt={item.alt}
                    className="timeline-image"
                    loading="lazy"
                  />
                  <div className="timeline-image-overlay" />
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
