/**
 * Positive words relevant to college / professor reviews.
 * 40+ entries covering academics, campus, faculty, placements, and culture.
 */
const POSITIVE_WORDS = [
  'excellent',
  'amazing',
  'helpful',
  'friendly',
  'supportive',
  'clear',
  'organized',
  'modern',
  'clean',
  'great',
  'wonderful',
  'fantastic',
  'knowledgeable',
  'inspiring',
  'accessible',
  'research',
  'opportunity',
  'placement',
  'innovative',
  'collaborative',
  'vibrant',
  'engaging',
  'passionate',
  'thorough',
  'resourceful',
  'welcoming',
  'diverse',
  'safe',
  'inclusive',
  'professional',
  'responsive',
  'dedicated',
  'stimulating',
  'productive',
  'enriching',
  'exceptional',
  'top',
  'best',
  'rewarding',
  'efficient',
  'rigorous',
  'prestigious',
  'motivated',
  'celebrated',
  'well-equipped',
];

/**
 * Negative words relevant to college / professor reviews.
 * 40+ entries covering poor teaching, infrastructure, culture, and administration.
 */
const NEGATIVE_WORDS = [
  'terrible',
  'poor',
  'worst',
  'useless',
  'corrupt',
  'dirty',
  'crowded',
  'slow',
  'broken',
  'outdated',
  'nepotism',
  'unfair',
  'boring',
  'unclear',
  'absent',
  'strict',
  'pressure',
  'hopeless',
  'disappointing',
  'inadequate',
  'overrated',
  'mediocre',
  'negligent',
  'rude',
  'incompetent',
  'unhelpful',
  'biased',
  'disorganized',
  'overcrowded',
  'unsafe',
  'outdated',
  'frustrating',
  'monotonous',
  'dismissive',
  'arrogant',
  'toxic',
  'stressful',
  'inconsistent',
  'confusing',
  'pathetic',
  'awful',
  'horrible',
  'failing',
  'neglected',
  'bureaucratic',
];

/**
 * Analyse the sentiment of a review text.
 *
 * Algorithm:
 *  - Tokenise by splitting on whitespace and stripping punctuation.
 *  - Count positive and negative word hits.
 *  - score = (positiveCount - negativeCount) / (totalWords * 0.1), clamped to [-1, 1].
 *
 * @param {string} text - Raw review text.
 * @returns {{ score: number, positiveCount: number, negativeCount: number, label: 'positive'|'negative'|'neutral' }}
 */
const analyzeSentiment = (text) => {
  if (!text || typeof text !== 'string') {
    return { score: 0, positiveCount: 0, negativeCount: 0, label: 'neutral' };
  }

  const words = text
    .toLowerCase()
    .replace(/[^a-z\s-]/g, '') // keep hyphens for compound words
    .split(/\s+/)
    .filter(Boolean);

  const totalWords = words.length;

  if (totalWords === 0) {
    return { score: 0, positiveCount: 0, negativeCount: 0, label: 'neutral' };
  }

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    if (POSITIVE_WORDS.includes(word)) positiveCount++;
    else if (NEGATIVE_WORDS.includes(word)) negativeCount++;
  }

  // Normalise: divide by 10% of total word count to get a [-1, 1] range
  const rawScore = (positiveCount - negativeCount) / (totalWords * 0.1);
  const score = Math.max(-1, Math.min(1, rawScore));

  let label;
  if (score > 0.05) label = 'positive';
  else if (score < -0.05) label = 'negative';
  else label = 'neutral';

  return { score: parseFloat(score.toFixed(4)), positiveCount, negativeCount, label };
};

module.exports = { analyzeSentiment, POSITIVE_WORDS, NEGATIVE_WORDS };
