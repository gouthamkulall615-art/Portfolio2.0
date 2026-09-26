import React from 'react';
import './MarqueeBanner.css';

const DEFAULT_TEXT = 'ALWAYS SHIPPING SOMETHING NEW';

export default function MarqueeBanner({ text = DEFAULT_TEXT }) {
  const items = [
    { text, outline: false },
    { text, outline: true },
    { text, outline: false },
    { text, outline: true },
  ];

  return (
    <section className="marquee-section" aria-label="Announcement ticker">
      <div className="marquee-track">
        {/* Set 1 */}
        <div className="marquee-content">
          {items.map((item, index) => (
            <React.Fragment key={`marquee-set1-${index}`}>
              <span className={`marquee-text ${item.outline ? 'text-outline' : ''}`}>
                {item.text}
              </span>
              <span className="marquee-separator" aria-hidden="true">
                ✦
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Set 2 (Exact duplicate for seamless 0% to -50% CSS loop) */}
        <div className="marquee-content" aria-hidden="true">
          {items.map((item, index) => (
            <React.Fragment key={`marquee-set2-${index}`}>
              <span className={`marquee-text ${item.outline ? 'text-outline' : ''}`}>
                {item.text}
              </span>
              <span className="marquee-separator" aria-hidden="true">
                ✦
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
