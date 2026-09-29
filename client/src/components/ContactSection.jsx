import React, { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
} from 'framer-motion';
import { Send, Mail, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import humanHandImg from '../assets/human-hand.png';
import robotHandImg from '../assets/robot-hand.png';
import ContactCardEffects from './ContactCardEffects';
import ContactParticles from './ContactParticles';
import './ContactSection.css';

const contactMethods = [
  {
    label: 'EMAIL',
    value: 'gouthamkulall615@gmail.com',
    href: 'mailto:gouthamkulall615@gmail.com',
    isExternal: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="contact-icon-svg">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 6l-10 7L2 6" />
      </svg>
    ),
  },
  {
    label: 'GITHUB',
    value: 'github.com/gouthamkulall615-art',
    href: 'https://github.com/gouthamkulall615-art',
    isExternal: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="contact-icon-svg">
        <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 015.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.2.66.79.55A10.51 10.51 0 0023.5 12c0-6.27-5.23-11.5-11.5-11.5z" />
      </svg>
    ),
  },
  {
    label: 'LINKEDIN',
    value: 'linkedin.com/in/goutham-m-ba2224385',
    href: 'https://www.linkedin.com/in/goutham-m-ba2224385/',
    isExternal: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="contact-icon-svg">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
      </svg>
    ),
  },
];

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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Measure stage and calculate responsive hand dimensions
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const stageW = rect.width || (typeof window !== 'undefined' ? window.innerWidth : 1200);
        const stageH = mobile ? 380 : 520;
        // Responsive hand image width
        const handW = mobile
          ? Math.min(Math.max(220, window.innerWidth * 0.65), 300)
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

  // Shared Target Meeting Point in Contact Section stage (exact center X, 48% Y on mobile, 46% Y on desktop)
  const targetPointX = stageMetrics.width * 0.5;
  const targetPointY = stageMetrics.height * (isMobile ? 0.48 : 0.46);

  // Exact resting translate values:
  // finalX = targetPointX - (handImageWidth * fingertipXPercent) +/- OVERLAP
  // finalY = targetPointY - (handImageHeight * fingertipYPercent) -/+ OVERLAP
  const finalHumanX = targetPointX - (stageMetrics.handWidth * HUMAN_TIP_X_PCT) + OVERLAP_X;
  const finalHumanY = targetPointY - (stageMetrics.handHeight * HUMAN_TIP_Y_PCT) - OVERLAP_Y;
  const startHumanX = finalHumanX - (isMobile ? Math.max(stageMetrics.width * 0.38, 140) : Math.max(stageMetrics.width * 0.32, 280));
  const startHumanY = finalHumanY + (isMobile ? 90 : 130);

  const finalRobotX = targetPointX - (stageMetrics.handWidth * ROBOT_TIP_X_PCT) - OVERLAP_X;
  const finalRobotY = targetPointY - (stageMetrics.handHeight * ROBOT_TIP_Y_PCT) + OVERLAP_Y;
  const startRobotX = finalRobotX + (isMobile ? Math.max(stageMetrics.width * 0.38, 140) : Math.max(stageMetrics.width * 0.32, 280));
  const startRobotY = finalRobotY + (isMobile ? 90 : 130);

  // useTransform calls with exact calculated values for both desktop and mobile
  const humanX = useTransform(scrollYProgress, (p) => startHumanX + (finalHumanX - startHumanX) * p);
  const humanY = useTransform(scrollYProgress, (p) => startHumanY + (finalHumanY - startHumanY) * p);
  const robotX = useTransform(scrollYProgress, (p) => startRobotX + (finalRobotX - startRobotX) * p);
  const robotY = useTransform(scrollYProgress, (p) => startRobotY + (finalRobotY - startRobotY) * p);

  // Trigger spark at contact — responsive threshold so mobile never gets stuck
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const triggerThreshold = isMobile ? 0.72 : 0.92;
    if (latest >= triggerThreshold && !hasTouched) {
      setHasTouched(true);
    }
  });

  const validateForm = () => {
    const errs = {};
    if (!formState.name.trim()) {
      errs.name = 'Please enter your name.';
    }
    if (!formState.email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formState.message.trim()) {
      errs.message = 'Please enter your message.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      setErrorMessage(
        'Web3Forms access key is missing. Please configure VITE_WEB3FORMS_ACCESS_KEY in your environment.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: accessKey,
          name: formState.name.trim(),
          email: formState.email.trim(),
          replyto: formState.email.trim(),
          from_name: formState.name.trim(),
          subject: formState.subject?.trim() || `New Portfolio Message from ${formState.name.trim()}`,
          message: formState.message.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSubmitted(true);
        setFormState({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error(data.message || 'Submission failed. Please check your details and try again.');
      }
    } catch (err) {
      setErrorMessage(
        err.message || 'Something went wrong while sending your message. Please check your network and try again.'
      );
    } finally {
      setIsLoading(false);
    }
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
      {/* Floating 3D Particles Effect with smooth Footer transition */}
      <ContactParticles containerRef={sectionRef} />

      {/* Section Watermark Heading matching site design */}
      <div className="section-watermark-heading">
        <span className="watermark-bg" aria-hidden="true">CONTACT</span>
        <h2 className="watermark-fg">CONTACT</h2>
      </div>

      {/* Hands Interactive Touching Stage — tap to touch on mobile */}
      <div
        ref={stageRef}
        className="hands-stage cursor-pointer"
        onClick={() => setHasTouched(true)}
        onTouchStart={() => setHasTouched(true)}
      >

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

        <ContactCardEffects
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect={true}
          spotlightRadius={300}
          particleCount={10}
        >
          <div className="contact-card">
            <div className="contact-card-content contact-two-column-layout">
              {/* Left Column: Heading, Subtext, Contact Methods List */}
              <div className="contact-left-col">
                <h2 className="contact-title">Let's Connect</h2>
                <p className="contact-subtitle">
                  Have an idea, project, or opportunity? Drop a message below.
                </p>

                <div className="contact-info-list">
                  {contactMethods.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.isExternal ? '_blank' : undefined}
                      rel={item.isExternal ? 'noopener noreferrer' : undefined}
                      className="contact-info-item"
                    >
                      <div className="contact-info-icon-box">
                        {item.icon}
                      </div>
                      <div className="contact-info-text">
                        <span className="contact-info-label">{item.label}</span>
                        <span className="contact-info-value">{item.value}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Right Column: Contact Form Card */}
              <div className="contact-right-col">
                <div className="contact-form-card">
                  {isSubmitted ? (
                    <div className="contact-success-msg" role="status">
                      <Sparkles className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                      <p className="font-semibold text-emerald-400">Transmission Received!</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Thank you for reaching out. I will get back to you within 1 business day.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsSubmitted(false)}
                        className="contact-reset-btn"
                      >
                        Send Another Message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} noValidate className="contact-form">
                      {errorMessage && (
                        <div className="contact-error-msg" role="alert">
                          <AlertCircle size={18} className="flex-shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <div className="form-group">
                        <label htmlFor="contact-name" className="form-label">
                          NAME *
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          required
                          disabled={isLoading}
                          placeholder="Your name"
                          value={formState.name}
                          onChange={(e) => {
                            setFormState((prev) => ({ ...prev, name: e.target.value }));
                            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                          }}
                          className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                        />
                        {errors.name && <span className="form-error-text">{errors.name}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="contact-email" className="form-label">
                          EMAIL *
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          required
                          disabled={isLoading}
                          placeholder="your.email@example.com"
                          value={formState.email}
                          onChange={(e) => {
                            setFormState((prev) => ({ ...prev, email: e.target.value }));
                            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                          }}
                          className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                        />
                        {errors.email && <span className="form-error-text">{errors.email}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="contact-subject" className="form-label">
                          SUBJECT
                        </label>
                        <input
                          id="contact-subject"
                          type="text"
                          disabled={isLoading}
                          placeholder="What's this about?"
                          value={formState.subject}
                          onChange={(e) =>
                            setFormState((prev) => ({ ...prev, subject: e.target.value }))
                          }
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="contact-message" className="form-label">
                          MESSAGE *
                        </label>
                        <textarea
                          id="contact-message"
                          required
                          rows={4}
                          disabled={isLoading}
                          placeholder="Your message here..."
                          value={formState.message}
                          onChange={(e) => {
                            setFormState((prev) => ({ ...prev, message: e.target.value }));
                            if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                          }}
                          className={`form-textarea ${errors.message ? 'form-input-error' : ''}`}
                        />
                        {errors.message && <span className="form-error-text">{errors.message}</span>}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="contact-submit-btn"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin-slow" />
                            <span>TRANSMITTING...</span>
                          </>
                        ) : (
                          <>
                            <span>SEND MESSAGE</span>
                            <Send size={16} />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ContactCardEffects>
      </motion.div>
    </section>
  );
}
