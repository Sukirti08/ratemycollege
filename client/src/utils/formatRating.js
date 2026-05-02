/**
 * formatRating.js — Rating display utilities for RateMyCollege India
 */

/**
 * Format a numeric rating to 1 decimal place.
 * @param {number|null|undefined} num
 * @returns {string}
 */
export function formatRating(num) {
  if (num == null || isNaN(num)) return "N/A";
  return Number(num).toFixed(1);
}

/**
 * Get a Tailwind text color class based on rating value.
 * @param {number} num
 * @returns {string}
 */
export function getRatingColor(num) {
  if (num == null || isNaN(num)) return "text-gray-400";
  if (num >= 4.0) return "text-green-600";
  if (num >= 3.0) return "text-yellow-500";
  if (num >= 2.0) return "text-orange-500";
  return "text-red-500";
}

/**
 * Get a Tailwind background color class based on rating value.
 * @param {number} num
 * @returns {string}
 */
export function getRatingBgColor(num) {
  if (num == null || isNaN(num)) return "bg-gray-100";
  if (num >= 4.0) return "bg-green-100";
  if (num >= 3.0) return "bg-yellow-100";
  if (num >= 2.0) return "bg-orange-100";
  return "bg-red-100";
}

/**
 * Get a human-readable label for a rating value.
 * @param {number} num
 * @returns {string}
 */
export function getRatingLabel(num) {
  if (num == null || isNaN(num)) return "Unrated";
  if (num >= 4.0) return "Excellent";
  if (num >= 3.0) return "Good";
  if (num >= 2.0) return "Average";
  return "Poor";
}

/**
 * Format a placement package value in LPA.
 * @param {number} lpa
 * @returns {string}
 */
export function formatPackage(lpa) {
  if (lpa == null || isNaN(lpa)) return "N/A";
  const val = Number(lpa);
  return `${val % 1 === 0 ? val : val.toFixed(1)} LPA`;
}
