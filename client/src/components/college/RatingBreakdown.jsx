import React, { useRef, useEffect, useState } from 'react';

const DIMENSIONS = [
  { key: 'overall',         label: 'Overall',               bold: true },
  { key: 'teaching',        label: 'Teaching Quality' },
  { key: 'placement',       label: 'Placements' },
  { key: 'research',        label: 'Research' },
  { key: 'hostel',          label: 'Hostel & Mess' },
  { key: 'infrastructure',  label: 'Infrastructure' },
  { key: 'faculty',         label: 'Faculty Accessibility' },
];

function RatingBar({ label, value, bold, animate }) {
  const pct = Math.min(100, ((value ?? 0) / 5) * 100);

  const barColor = value >= 4
    ? 'bg-green-500'
    : value >= 3
    ? 'bg-primary'
    : value >= 2
    ? 'bg-orange-400'
    : 'bg-red-400';

  return (
    <div className="flex items-center gap-3">
      <span
        className={`shrink-0 text-sm text-gray-600 ${bold ? 'font-bold text-gray-900' : 'font-medium'}`}
        style={{ width: '150px' }}
      >
        {label}
      </span>
      <div className={`flex-1 rounded-full overflow-hidden ${bold ? 'h-3' : 'h-2'} bg-gray-100`}>
        <div
          className={`${barColor} h-full rounded-full transition-all duration-700 ease-out`}
          style={{ width: animate ? `${pct}%` : '0%' }}
        />
      </div>
      <span className={`shrink-0 text-sm font-semibold text-gray-800 ${bold ? 'text-base' : ''}`}
        style={{ width: '32px', textAlign: 'right' }}>
        {value != null ? value.toFixed(1) : '—'}
      </span>
    </div>
  );
}

export default function RatingBreakdown({ ratings = {}, reviewCount = 0 }) {
  const containerRef = useRef(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setAnimate(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <div>
        <h3 className="font-bold text-gray-900 text-base">Ratings Breakdown</h3>
        <p className="text-xs text-gray-400 mt-0.5">Based on {reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex flex-col gap-3">
        {DIMENSIONS.map(({ key, label, bold }) => (
          <RatingBar
            key={key}
            label={label}
            value={ratings[key]}
            bold={bold}
            animate={animate}
          />
        ))}
      </div>
    </div>
  );
}
