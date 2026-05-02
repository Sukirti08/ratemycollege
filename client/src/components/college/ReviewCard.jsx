import React, { useState } from 'react';
import { ThumbsUp, Flag, ShieldCheck, BadgeCheck } from 'lucide-react';
import StarRating from '../ui/StarRating';
import TagPill from '../ui/TagPill';

const MINI_DIMENSIONS = [
  { key: 'teaching',      label: 'Teaching' },
  { key: 'placement',     label: 'Placement' },
  { key: 'hostel',        label: 'Hostel' },
  { key: 'infrastructure',label: 'Infra' },
  { key: 'faculty',       label: 'Faculty' },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins   = Math.floor(diff / 60_000);
  const hours  = Math.floor(mins / 60);
  const days   = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years  = Math.floor(months / 12);
  if (years  > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days   > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours  > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${mins || 1} min ago`;
}

export default function ReviewCard({ review, onHelpful, onFlag }) {
  const [expanded, setExpanded] = useState(false);
  const isVerified = review.isVerified || review.isCommunityVerified;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2">
        {review.batchYear && (
          <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
            Batch {review.batchYear}
          </span>
        )}
        {review.branch && (
          <span className="text-[11px] font-semibold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
            {review.branch}
          </span>
        )}
        {isVerified && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            {review.isVerified
              ? <><ShieldCheck className="w-3 h-3" /> Verified</>
              : <><BadgeCheck className="w-3 h-3" /> Community Verified</>
            }
          </span>
        )}
        <span className="ml-auto text-[11px] text-gray-400">{timeAgo(review.createdAt)}</span>
      </div>

      {/* Mini ratings row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {MINI_DIMENSIONS.map(({ key, label }) => {
          const val = review.ratings?.[key];
          if (val == null) return null;
          return (
            <div key={key} className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 w-12 shrink-0">{label}</span>
              <StarRating value={val} size="xs" readOnly />
            </div>
          );
        })}
      </div>

      {/* Review text */}
      <div>
        <p className={`text-sm text-gray-700 leading-relaxed ${!expanded ? 'line-clamp-4' : ''}`}>
          {review.text ?? review.content}
        </p>
        {(review.text ?? review.content ?? '').length > 200 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-primary font-medium mt-1 hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Tags */}
      {review.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <TagPill key={tag} label={tag} size="sm" />
          ))}
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex items-center gap-3 mt-auto pt-1 border-t border-gray-50">
        <button
          onClick={() => onHelpful?.(review._id ?? review.id)}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            review.userVoted
              ? 'text-primary'
              : 'text-gray-400 hover:text-primary'
          }`}
        >
          <ThumbsUp
            className="w-3.5 h-3.5"
            fill={review.userVoted ? 'currentColor' : 'none'}
          />
          {review.helpfulCount ?? 0} Helpful
        </button>

        <button
          onClick={() => onFlag?.(review._id ?? review.id)}
          className="flex items-center gap-1 text-xs text-gray-300 hover:text-red-400 transition-colors ml-auto"
          aria-label="Flag review"
        >
          <Flag className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
