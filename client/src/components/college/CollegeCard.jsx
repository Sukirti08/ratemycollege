import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, MessageSquare, CheckCircle } from 'lucide-react';
import { useCompareStore } from '../../store/compareStore';
import { useToastStore } from '../../store/toastStore';
import StarRating from '../ui/StarRating';
import TagPill from '../ui/TagPill';
import { formatRating } from '../../utils/formatRating';

const TYPE_STYLES = {
  IIT:  'bg-blue-100 text-blue-700',
  NIT:  'bg-green-100 text-green-700',
  IIIT: 'bg-purple-100 text-purple-700',
  BITS: 'bg-orange-100 text-orange-700',
};

const MINI_STATS = [
  { key: 'placement',      label: 'Placement' },
  { key: 'teaching',       label: 'Teaching' },
  { key: 'hostel',         label: 'Hostel' },
];

export default function CollegeCard({ college, showCompare = true }) {
  const navigate = useNavigate();
  const compareStore = useCompareStore();
  const { addToast } = useToastStore();

  const compareColleges = compareStore.colleges ?? [];
  const isInCompare = compareColleges.some((c) => c.id === college.id || c._id === college._id);
  const isFull = compareColleges.length >= 3;

  const typeStyle = TYPE_STYLES[college.type] ?? 'bg-gray-100 text-gray-600';

  function handleCompareClick(e) {
    e.stopPropagation();
    if (isInCompare) return;
    if (isFull) {
      addToast({ message: 'You can compare up to 3 colleges at a time.', type: 'warning' });
      return;
    }
    compareStore.addCollege(college);
  }

  return (
    <div
      onClick={() => navigate(`/college/${college._id ?? college.id}`)}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer p-4 flex flex-col gap-3 border border-gray-100"
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${typeStyle}`}>
          {college.type}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <MapPin className="w-3 h-3" />
          {college.location?.city ?? college.city}
        </span>
      </div>

      {/* Name */}
      <div>
        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
          {college.name}
        </h3>
        {college.shortName && (
          <p className="text-xs text-gray-400 mt-0.5">{college.shortName}</p>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <StarRating value={college.ratings?.overall ?? college.overallRating ?? 0} size="sm" readOnly />
        <span className="text-sm font-semibold text-gray-800">
          {formatRating(college.ratings?.overall ?? college.overallRating)}
        </span>
      </div>

      {/* Mini stats */}
      <div className="flex gap-2 flex-wrap">
        {MINI_STATS.map(({ key, label }) => {
          const val = college.ratings?.[key] ?? college[`${key}Rating`];
          if (val == null) return null;
          return (
            <span
              key={key}
              className="text-[11px] bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-600 font-medium"
            >
              {label}: <span className="text-gray-800 font-semibold">{formatRating(val)}</span>
            </span>
          );
        })}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <MessageSquare className="w-3.5 h-3.5" />
          {college.reviewCount ?? 0} reviews
        </span>

        {showCompare && (
          <button
            onClick={handleCompareClick}
            disabled={!isInCompare && isFull}
            className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
              isInCompare
                ? 'bg-green-50 border-green-400 text-green-600'
                : isFull
                ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                : 'bg-white border-primary text-primary hover:bg-primary/5'
            }`}
          >
            {isInCompare ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Added
              </span>
            ) : '+ Compare'}
          </button>
        )}
      </div>
    </div>
  );
}
