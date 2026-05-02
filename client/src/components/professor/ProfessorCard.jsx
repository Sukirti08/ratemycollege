import React from 'react';
import { MessageSquare } from 'lucide-react';
import StarRating from '../ui/StarRating';
import TagPill from '../ui/TagPill';
import { formatRating } from '../../utils/formatRating';

const DESIGNATION_STYLES = {
  Professor:           'bg-blue-50 text-blue-700',
  'Associate Professor': 'bg-indigo-50 text-indigo-700',
  'Assistant Professor': 'bg-violet-50 text-violet-700',
  Lecturer:            'bg-teal-50 text-teal-700',
};

export default function ProfessorCard({ professor, onClick }) {
  const designationStyle =
    DESIGNATION_STYLES[professor.designation] ?? 'bg-gray-100 text-gray-600';

  const topTags = (professor.tags ?? [])
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 3);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer p-4 flex flex-col gap-2.5"
    >
      {/* Name + designation */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
          {professor.name}
        </h3>
        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${designationStyle}`}>
          {professor.designation}
        </span>
      </div>

      {/* Department */}
      {professor.department && (
        <p className="text-xs text-gray-500">{professor.department}</p>
      )}

      {/* Rating */}
      <div className="flex items-center gap-2">
        <StarRating
          value={professor.ratings?.overall ?? professor.overallRating ?? 0}
          size="sm"
          readOnly
        />
        <span className="text-xs font-semibold text-gray-700">
          {formatRating(professor.ratings?.overall ?? professor.overallRating)}
        </span>
      </div>

      {/* Top tags */}
      {topTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topTags.map((tag) => (
            <TagPill key={tag.label ?? tag} label={tag.label ?? tag} size="xs" />
          ))}
        </div>
      )}

      {/* Review count */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mt-auto pt-1 border-t border-gray-50">
        <MessageSquare className="w-3.5 h-3.5" />
        {professor.reviewCount ?? 0} reviews
      </div>
    </div>
  );
}
