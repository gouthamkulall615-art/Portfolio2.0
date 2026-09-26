import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './animated-theme-toggler.css';

export function AnimatedThemeToggler({ className = '', ...props }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  const buttonRef = useRef(null);

  const applyTheme = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const toggleTheme = (e) => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    // View Transitions API circular ripple transition
    if (!document.startViewTransition) {
      applyTheme(newTheme);
      return;
    }

    const button = buttonRef.current;
    const rect = button?.getBoundingClientRect();
    const x = e?.clientX ?? (rect ? rect.left + rect.width / 2 : window.innerWidth / 2);
    const y = e?.clientY ?? (rect ? rect.top + rect.height / 2 : window.innerHeight / 2);

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      applyTheme(newTheme);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  const isDark = theme === 'dark';

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      className={`animated-theme-toggler-btn ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      {...props}
    >
      <div className="toggler-icon-wrapper">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="sun-icon"
              initial={{ rotate: -90, scale: 0.2, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.2, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="toggler-icon sun-icon"
            >
              <Sun size={20} strokeWidth={2.2} />
            </motion.div>
          ) : (
            <motion.div
              key="moon-icon"
              initial={{ rotate: -90, scale: 0.2, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.2, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="toggler-icon moon-icon"
            >
              <Moon size={20} strokeWidth={2.2} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}

export default AnimatedThemeToggler;
