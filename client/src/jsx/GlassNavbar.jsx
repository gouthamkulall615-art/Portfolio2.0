import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';
import '../css/GlassNavbar.css';

export default function GlassNavbar({ items = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({
    transform: 'translate3d(0, 0, 0)',
    width: '0px',
    opacity: 0,
  });

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  const barRef = useRef(null);
  const listRef = useRef(null);
  const linkRefs = useRef([]);
  const isClickingRef = useRef(false);

  // Measure and align the liquid active indicator
  const updateIndicator = useCallback(() => {
    const list = listRef.current;
    const activeLink = linkRefs.current[activeIndex];
    if (!list || !activeLink) return;

    const listRect = list.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    const left = linkRect.left - listRect.left;
    const width = linkRect.width;

    setIndicatorStyle({
      transform: `translate3d(${Math.round(left)}px, 0, 0)`,
      width: `${Math.round(width)}px`,
      opacity: 1,
    });
  }, [activeIndex]);

  // Update indicator position whenever activeIndex changes or layout adjusts
  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const handleResize = () => {
      updateIndicator();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(list);
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(updateIndicator);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [updateIndicator]);

  // Scroll detection: elevate blur past 24px + scroll-spy section tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      setIsScrolled(scrollY > 24);

      if (isClickingRef.current) return;

      // Scroll-spy active link detection
      const scrollPosition = scrollY + 180;
      let currentIdx = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.href || !item.href.startsWith('#')) continue;
        const targetId = item.href.slice(1);
        const el = document.getElementById(targetId);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            currentIdx = i;
          }
        }
      }

      setActiveIndex(prev => (prev !== currentIdx ? currentIdx : prev));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  // Synchronize theme with local storage & external changes
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
    const handleExternalThemeChange = (e) => {
      if (e.detail?.theme && e.detail.theme !== theme) {
        setTheme(e.detail.theme);
      }
    };
    window.addEventListener('themechange', handleExternalThemeChange);
    return () => window.removeEventListener('themechange', handleExternalThemeChange);
  }, [theme]);

  const toggleTheme = (e) => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    if (!document.startViewTransition) {
      applyTheme(newTheme);
      return;
    }

    const rect = e?.currentTarget?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

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

  const handleLinkClick = (e, index, href) => {
    setActiveIndex(index);
    isClickingRef.current = true;

    // Reset lock after scroll completes
    setTimeout(() => {
      isClickingRef.current = false;
    }, 700);

    if (href.startsWith('#')) {
      const targetId = href.slice(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', href);
      }
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      ref={barRef}
      className={`glass-nav-bar ${isScrolled ? 'is-scrolled' : ''}`}
      role="navigation"
      aria-label="Main Navigation"
    >
      <ul ref={listRef} className="glass-nav-list">
        {/* Sliding Liquid Indicator */}
        <li
          className="glass-nav-indicator"
          style={{
            transform: indicatorStyle.transform,
            width: indicatorStyle.width,
            opacity: indicatorStyle.opacity,
          }}
          aria-hidden="true"
        />

        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <li key={item.label} className="glass-nav-item">
              <a
                ref={el => (linkRefs.current[index] = el)}
                href={item.href}
                className={`glass-nav-link ${isActive ? 'is-active' : ''}`}
                onClick={e => handleLinkClick(e, index, item.href)}
                aria-label={item.ariaLabel || item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Hidden Bold Sizer guarantees zero layout shift on weight change */}
                <span className="glass-nav-sizer" aria-hidden="true">
                  {item.label}
                </span>
                <span className="glass-nav-label">
                  {item.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      {/* Subtle Integrated Glass Divider */}
      <div className="glass-nav-divider" aria-hidden="true" />

      {/* Embedded Circular Glass Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="glass-nav-toggle"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        aria-pressed={isDark}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <span className="glass-toggle-icon">
          {isDark ? (
            <Sun size={18} strokeWidth={2.2} />
          ) : (
            <Moon size={18} strokeWidth={2.2} />
          )}
        </span>
      </button>
    </div>
  );
}
