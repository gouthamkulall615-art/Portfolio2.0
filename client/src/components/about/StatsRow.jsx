import React from 'react';

/**
 * EDITABLE STATS LIST
 * Update values, labels, decimals, or suffixes as needed.
 */
export const DEFAULT_STATS = [
  {
    id: 'problems',
    value: 200,
    decimals: 0,
    suffix: '+',
    label: 'Problems Solved',
  },
  {
    id: 'projects',
    value: 4,
    decimals: 0,
    suffix: '+',
    label: 'Projects Shipped',
  },
  {
    id: 'cgpa',
    value: 9.64,
    decimals: 2,
    suffix: '',
    label: 'Cumulative CGPA',
  },
  {
    id: 'gdg',
    value: 1,
    decimals: 0,
    suffix: '',
    isText: true,
    displayTarget: 'GDG',
    label: 'Tech Team Member',
  },
];

export default function StatsRow({ stats = DEFAULT_STATS }) {
  return (
    <div className="stats-section-wrap">
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={stat.id || idx} className="stat-item">
            <div className="stat-number-wrap">
              <span
                className="stat-number"
                data-stat-idx={idx}
                data-target-value={stat.value}
                data-decimals={stat.decimals}
                data-is-text={stat.isText ? 'true' : 'false'}
                data-display-target={stat.displayTarget || ''}
              >
                {stat.isText ? stat.displayTarget : '0'}
              </span>
              {stat.suffix && (
                <span className="stat-suffix">{stat.suffix}</span>
              )}
            </div>
            <span className="stat-label">{stat.label}</span>

            {/* Vertical Divider line between stats (desktop) */}
            {idx < stats.length - 1 && (
              <div className="stat-divider" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

