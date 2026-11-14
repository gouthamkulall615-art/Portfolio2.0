import React, { useRef } from 'react';

const HIGHLIGHT_MAP = {
  'ideas': {
    type: 'ideas',
    path: 'M 4 14 Q 35 4, 65 12 T 116 10',
    viewBox: '0 0 120 20',
  },
  'full-stack': {
    type: 'full-stack',
    path: 'M 4 15 C 45 4, 80 18, 115 8 S 145 13, 156 8',
    viewBox: '0 0 160 22',
  },
  'dsa': {
    type: 'dsa',
    path: 'M 4 12 Q 30 18, 60 6 T 96 10',
    viewBox: '0 0 100 20',
  },
};

export default function SplitStatement({ statementText }) {
  const containerRef = useRef(null);

  // Split sentence into words array
  const words = statementText.split(' ');

  return (
    <div ref={containerRef} className="statement-pinned-wrapper">
      <div className="statement-content">
        <div className="statement-kicker">
          <span>Core Philosophy</span>
        </div>

        {/* Screen-reader friendly semantic text */}
        <p className="statement-paragraph" aria-label={statementText}>
          {words.map((word, idx) => {
            const cleanWord = word.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
            const highlightConfig = HIGHLIGHT_MAP[cleanWord];
            const isHighlight = Boolean(highlightConfig);

            return (
              <span
                key={`${word}-${idx}`}
                className={`statement-word ${isHighlight ? 'statement-highlight' : ''}`}
                data-word-idx={idx}
                aria-hidden="true"
              >
                {word}
                {isHighlight && (
                  <svg
                    className={`statement-underline-svg svg-${highlightConfig.type}`}
                    viewBox={highlightConfig.viewBox}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      className={`statement-underline-path path-${highlightConfig.type}`}
                      d={highlightConfig.path}
                    />
                  </svg>
                )}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
