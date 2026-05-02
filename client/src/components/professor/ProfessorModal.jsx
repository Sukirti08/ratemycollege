import React from 'react';
import Modal from '../ui/Modal';
import StarRating from '../ui/StarRating';
import { formatRating } from '../../utils/formatRating';

const PROF_DIMENSIONS = [
  { key: 'teaching',      label: 'Teaching Quality' },
  { key: 'grading',       label: 'Grading Fairness' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'research',      label: 'Research Guidance' },
  { key: 'engagement',    label: 'Student Engagement' },
];

function RatingBar({ label, value }) {
  const pct = Math.min(100, ((value ?? 0) / 5) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 font-medium shrink-0" style={{ width: '140px' }}>
        {label}
      </span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-800 shrink-0" style={{ width: '28px', textAlign: 'right' }}>
        {value != null ? value.toFixed(1) : '—'}
      </span>
    </div>
  );
}

function tagFontSize(count, maxCount) {
  const min = 11, max = 18;
  if (!maxCount || maxCount === 0) return min;
  return Math.round(min + ((count / maxCount) * (max - min)));
}

export default function ProfessorModal({ professor, isOpen, onClose }) {
  if (!professor) return null;

  const tags = professor.tags ?? [];
  const maxCount = Math.max(...tags.map((t) => t.count ?? 1), 1);
  const recentReviews = (professor.reviews ?? []).slice(0, 3);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-5 p-1">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">{professor.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {professor.designation && (
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                {professor.designation}
              </span>
            )}
            {professor.department && (
              <span className="text-xs text-gray-500">{professor.department}</span>
            )}
            {professor.college && (
              <span className="text-xs text-gray-400">· {professor.college}</span>
            )}
          </div>
        </div>

        {/* Rating bars */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Ratings</h3>
          {PROF_DIMENSIONS.map(({ key, label }) => (
            <RatingBar key={key} label={label} value={professor.ratings?.[key]} />
          ))}
        </div>

        {/* Tag cloud */}
        {tags.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">What students say</h3>
            <div className="flex flex-wrap gap-2 items-center">
              {tags
                .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
                .map((tag) => {
                  const label = tag.label ?? tag;
                  const count = tag.count ?? 1;
                  const fontSize = tagFontSize(count, maxCount);
                  return (
                    <span
                      key={label}
                      className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium transition-all"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {label}
                      <span className="text-primary/60 ml-1 text-[10px]">{count}</span>
                    </span>
                  );
                })}
            </div>
          </div>
        )}

        {/* Recent reviews */}
        {recentReviews.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Recent Reviews</h3>
            <div className="flex flex-col gap-3">
              {recentReviews.map((review, i) => (
                <div key={review._id ?? review.id ?? i} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating
                      value={review.ratings?.overall ?? review.overallRating ?? 0}
                      size="xs"
                      readOnly
                    />
                    <span className="text-xs font-semibold text-gray-600">
                      {formatRating(review.ratings?.overall ?? review.overallRating)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {review.text ?? review.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
