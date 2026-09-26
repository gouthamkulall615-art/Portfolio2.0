import React, { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
} from 'framer-motion';
import { Send, Mail, Sparkles } from 'lucide-react';
import humanHandImg from '../assets/human-hand.png';
import robotHandImg from '../assets/robot-hand.png';
import './ContactSection.css';

const GithubIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedinIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28M5.07 18.5h2.78v-8.37H5.07v8.37Z" />
  </svg>
);

// Exact glowing fingertip coordinates from raw image analysis (2528 x 1696 px)
// Human Hand: glowing fingertip core at pixel (2019, 446) => 79.87% width, 26.30% height
// Robot Hand: glowing fingertip core at pixel (568, 293)  => 22.47% width, 17.28% height
const HUMAN_TIP_X_PCT = 0.7987;
const HUMAN_TIP_Y_PCT = 0.2630;
const ROBOT_TIP_X_PCT = 0.2247;
const ROBOT_TIP_Y_PCT = 0.1728;

// Deliberate inward overlap (in pixels) so glowing fingertip cores visibly merge
const OVERLAP_X = 6;
const OVERLAP_Y = 2;

export default function ContactSection() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const [hasTouched, setHasTouched] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [stageMetrics, setStageMetrics] = useState({
    width: 1200,
    height: 520,
    handWidth: 420,
    handHeight: 281.77,
  });
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Measure stage and calculate responsive hand dimensions
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const stageW = rect.width || 1200;
        const stageH = rect.height || 520;
        // Responsive hand image width matching clamp(280px, 36vw, 540px)
        const handW = mobile
          ? Math.min(Math.max(220, window.innerWidth * 0.7), 320)
          : Math.min(Math.max(280, window.innerWidth * 0.36), 540);
        const handH = handW * (1696 / 2528);

        setStageMetrics({
          width: stageW,
          height: stageH,
          handWidth: handW,
          handHeight: handH,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track scroll position within Contact section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'center center'],
  });

  // Shared Target Meeting Point in Contact Section stage (exact center X, 46% Y)
  const targetPointX = stageMetrics.width * 0.5;
  const targetPointY = stageMetrics.height * 0.46;

  // Exact resting translate values:
  // finalX = targetPointX - (handImageWidth * fingertipXPercent) +/- OVERLAP
  // finalY = targetPointY - (handImageHeight * fingertipYPercent) -/+ OVERLAP
  const finalHumanX = targetPointX - (stageMetrics.handWidth * HUMAN_TIP_X_PCT) + OVERLAP_X;
  const finalHumanY = targetPointY - (stageMetrics.handHeight * HUMAN_TIP_Y_PCT) - OVERLAP_Y;
  const startHumanX = finalHumanX - Math.max(stageMetrics.width * 0.32, 280);
  const startHumanY = finalHumanY + 130;

  const finalRobotX = targetPointX - (stageMetrics.handWidth * ROBOT_TIP_X_PCT) - OVERLAP_X;
  const finalRobotY = targetPointY - (stageMetrics.handHeight * ROBOT_TIP_Y_PCT) + OVERLAP_Y;
  const startRobotX = finalRobotX + Math.max(stageMetrics.width * 0.32, 280);
  const startRobotY = finalRobotY + 130;

  // Mobile vertical stack targets
  const mobileTargetX = stageMetrics.width * 0.5;
  const mobileTargetY = stageMetrics.height * 0.5;
  const finalHumanXMobile = mobileTargetX - (stageMetrics.handWidth * HUMAN_TIP_X_PCT);
  const finalHumanYMobile = mobileTargetY - (stageMetrics.handHeight * HUMAN_TIP_Y_PCT) - OVERLAP_Y;
  const startHumanYMobile = finalHumanYMobile + 180;

  const finalRobotXMobile = mobileTargetX - (stageMetrics.handWidth * ROBOT_TIP_X_PCT);
  const finalRobotYMobile = mobileTargetY - (stageMetrics.handHeight * ROBOT_TIP_Y_PCT) + OVERLAP_Y;
  const startRobotYMobile = finalRobotYMobile - 180;

  // Desktop useTransform calls with exact calculated values
  const humanXDesktop = useTransform(scrollYProgress, (p) => startHumanX + (finalHumanX - startHumanX) * p);
  const humanYDesktop = useTransform(scrollYProgress, (p) => startHumanY + (finalHumanY - startHumanY) * p);
  const robotXDesktop = useTransform(scrollYProgress, (p) => startRobotX + (finalRobotX - startRobotX) * p);
  const robotYDesktop = useTransform(scrollYProgress, (p) => startRobotY + (finalRobotY - startRobotY) * p);

  // Mobile useTransform calls
  const humanXMob = useTransform(scrollYProgress, (p) => finalHumanXMobile);
  const humanYMob = useTransform(scrollYProgress, (p) => startHumanYMobile + (finalHumanYMobile - startHumanYMobile) * p);
  const robotXMob = useTransform(scrollYProgress, (p) => finalRobotXMobile);
  const robotYMob = useTransform(scrollYProgress, (p) => startRobotYMobile + (finalRobotYMobile - startRobotYMobile) * p);

  // Assign active transforms based on screen size
  const humanX = isMobile ? humanXMob : humanXDesktop;
  const humanY = isMobile ? humanYMob : humanYDesktop;
  const robotX = isMobile ? robotXMob : robotXDesktop;
  const robotY = isMobile ? robotYMob : robotYDesktop;

  // Trigger spark at actual contact (progress >= 0.98), not an arbitrary early guess
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (latest >= 0.98 && !hasTouched) {
      setHasTouched(true);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormState({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 35, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section ref={sectionRef} id="contact" className="contact-section-root">
      {/* Section Watermark Heading matching site design */}
      <div className="section-watermark-heading">
        <span className="watermark-bg" aria-hidden="true">CONTACT</span>
        <h2 className="watermark-fg">CONTACT</h2>
      </div>

      {/* Hands Interactive Touching Stage */}
      <div ref={stageRef} className="hands-stage">
        {/* Step 4: Temporary Visual Debug Aid (4px Red Dot at Target Meeting Point) */}
        <div
          className="debug-meeting-point-dot"
          style={{
            position: 'absolute',
            left: `${targetPointX}px`,
            top: `${targetPointY}px`,
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: '#ff0000',
            transform: 'translate(-50%, -50%)',
            zIndex: 999,
            boxShadow: '0 0 8px 3px rgba(255, 0, 0, 0.95)',
            pointerEvents: 'none',
          }}
          title="Target Meeting Point Calibration Aid"
        />

        {/* Human Hand (reaches from bottom-left) */}
        <motion.div
          className="hand-wrapper human-hand-wrapper"
          style={{
            x: humanX,
            y: humanY,
            width: `${stageMetrics.handWidth}px`,
          }}
        >
          <img
            src={humanHandImg}
            alt="Human Hand"
            className="hand-image"
            loading="lazy"
          />
        </motion.div>

        {/* Robot Hand (reaches from bottom-right) */}
        <motion.div
          className="hand-wrapper robot-hand-wrapper"
          style={{
            x: robotX,
            y: robotY,
            width: `${stageMetrics.handWidth}px`,
          }}
        >
          <img
            src={robotHandImg}
            alt="Robot Hand"
            className="hand-image"
            loading="lazy"
          />
        </motion.div>

        {/* Touch Spark Emitter Point (positioned exactly at targetPoint) */}
        <div
          className="spark-emitter-point"
          style={{
            left: `${targetPointX}px`,
            top: `${targetPointY}px`,
          }}
        >
          <AnimatePresence>
            {hasTouched && (
              <motion.div
                key="touch-spark"
                className="touch-spark"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>

          {/* Persistent Ambient Violet Glow once touched */}
          {hasTouched && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="touch-ambient-glow"
            />
          )}
        </div>
      </div>

      {/* Reveal Container: "Let's Connect" & Contact Form */}
      <motion.div
        className="contact-reveal-container"
        initial="hidden"
        animate={hasTouched ? 'visible' : 'hidden'}
        variants={containerVariants}
      >
        <div className="contact-card">
          <motion.div className="contact-header" variants={itemVariants}>
            <span className="contact-tag">
              <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
              TRANSMISSION
            </span>
            <h3 className="contact-title">Let's Connect</h3>
            <p className="contact-subtitle">
              Have an idea, project, or opportunity? Drop a message below.
            </p>
          </motion.div>

          {isSubmitted ? (
            <motion.div
              className="contact-success-msg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              Message received! I will get back to you shortly.
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              className="contact-form"
              variants={itemVariants}
            >
              <div className="form-group-row">
                <div className="form-group">
                  <label htmlFor="contact-name" className="form-label">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="Your Name"
                    value={formState.name}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-email" className="form-label">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={formState.email}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="contact-subject" className="form-label">
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  placeholder="Project Inquiry / Collaboration"
                  value={formState.subject}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-message" className="form-label">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  placeholder="Tell me about your project..."
                  value={formState.message}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="form-textarea"
                />
              </div>

              <motion.button
                type="submit"
                className="contact-submit-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Send Message</span>
                <Send size={16} />
              </motion.button>
            </motion.form>
          )}

          {/* Direct Social Links */}
          <motion.div className="contact-social-row" variants={itemVariants}>
            <a
              href="mailto:gouthamkulal@gmail.com"
              className="contact-social-link"
              title="Direct Email"
            >
              <Mail size={16} />
              <span>Email</span>
            </a>
            <a
              href="https://github.com/gouthamkulall615-art"
              target="_blank"
              rel="noreferrer"
              className="contact-social-link"
              title="GitHub Profile"
            >
              <GithubIcon size={16} />
              <span>GitHub</span>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="contact-social-link"
              title="LinkedIn Profile"
            >
              <LinkedinIcon size={16} />
              <span>LinkedIn</span>
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
