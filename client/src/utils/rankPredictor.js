/**
 * rankPredictor.js — JEE rank-based college prediction for RateMyCollege India
 */

/**
 * COLLEGE_CUTOFFS: Approximate JEE Advanced / JEE Mains closing ranks (General, 2024).
 * Lower rank number = better.
 * Cutoffs here are CLOSING ranks (last rank admitted in that branch in 2024 rounds).
 */
export const COLLEGE_CUTOFFS = [
  {
    collegeId: "iitb",
    name: "IIT Bombay",
    shortName: "IITB",
    type: "IIT",
    exam: "JEE Advanced",
    cutoffs: {
      CSE: 65,
      ECE: 250,
      EE: 400,
      ME: 900,
      Civil: 1100,
      Chemical: 1300,
      Aerospace: 1500,
    },
  },
  {
    collegeId: "iitd",
    name: "IIT Delhi",
    shortName: "IITD",
    type: "IIT",
    exam: "JEE Advanced",
    cutoffs: {
      CSE: 98,
      ECE: 320,
      EE: 520,
      ME: 950,
      Civil: 1200,
      Chemical: 1400,
      "Textile Technology": 2000,
    },
  },
  {
    collegeId: "iitm",
    name: "IIT Madras",
    shortName: "IITM",
    type: "IIT",
    exam: "JEE Advanced",
    cutoffs: {
      CSE: 110,
      ECE: 370,
      EE: 600,
      ME: 1050,
      Civil: 1350,
      Chemical: 1450,
      Aerospace: 1700,
    },
  },
  {
    collegeId: "iitk",
    name: "IIT Kanpur",
    shortName: "IITK",
    type: "IIT",
    exam: "JEE Advanced",
    cutoffs: {
      CSE: 125,
      ECE: 410,
      EE: 680,
      ME: 1150,
      Civil: 1500,
      Chemical: 1650,
      Physics: 1800,
    },
  },
  {
    collegeId: "iitkgp",
    name: "IIT Kharagpur",
    shortName: "IITKgp",
    type: "IIT",
    exam: "JEE Advanced",
    cutoffs: {
      CSE: 180,
      ECE: 480,
      EE: 750,
      ME: 1200,
      Civil: 1600,
      Chemical: 1750,
      "Mining Engineering": 3000,
    },
  },
  {
    collegeId: "bits_pilani",
    name: "BITS Pilani (Pilani Campus)",
    shortName: "BITS Pilani",
    type: "Deemed",
    exam: "BITSAT",
    cutoffs: {
      CSE: 360,
      ECE: 330,
      EE: 290,
      "Mechanical Engineering": 260,
      "Chemical Engineering": 235,
      Physics: 320,
      Mathematics: 330,
    },
  },
  {
    collegeId: "nitt",
    name: "NIT Trichy",
    shortName: "NITT",
    type: "NIT",
    exam: "JEE Mains",
    cutoffs: {
      CSE: 2500,
      ECE: 5500,
      EE: 9000,
      ME: 14000,
      Civil: 20000,
      Chemical: 22000,
      "Instrumentation & Control": 18000,
    },
  },
  {
    collegeId: "nitw",
    name: "NIT Warangal",
    shortName: "NITW",
    type: "NIT",
    exam: "JEE Mains",
    cutoffs: {
      CSE: 3500,
      ECE: 8000,
      EE: 12000,
      ME: 18000,
      Civil: 24000,
      Chemical: 26000,
      Biotechnology: 30000,
    },
  },
  {
    collegeId: "iiith",
    name: "IIIT Hyderabad",
    shortName: "IIITH",
    type: "IIIT",
    exam: "JEE Mains",
    cutoffs: {
      CSE: 700,
      ECE: 1200,
      "CSD (CS+Design)": 800,
      "CSB (CS+Bioinformatics)": 900,
      "CSAM (CS+AI+ML)": 600,
    },
  },
  {
    collegeId: "iiitd",
    name: "IIIT Delhi",
    shortName: "IIITD",
    type: "IIIT",
    exam: "JEE Mains",
    cutoffs: {
      CSE: 4500,
      ECE: 7000,
      "CSE with AI": 3500,
      "CSE with Bioinformatics": 5000,
      "CSAM": 4000,
    },
  },
];

/**
 * Predict colleges a student might get based on their rank.
 *
 * @param {number} rank — The student's rank (JEE Advanced rank for IITs, JEE Mains for NITs/IIITs)
 * @param {string[]} preferredBranches — Array of branch names the student prefers e.g. ['CSE', 'ECE']
 * @returns {Array<{ college: object, matchPercent: number, matchedBranches: string[], reason: string }>}
 */
export function predictColleges(rank, preferredBranches = []) {
  if (!rank || isNaN(rank)) return [];

  const results = [];

  for (const college of COLLEGE_CUTOFFS) {
    // Find branches where cutoff rank >= student's rank (student qualifies)
    const qualifyingBranches = Object.entries(college.cutoffs)
      .filter(([, cutoff]) => rank <= cutoff)
      .map(([branch]) => branch);

    if (qualifyingBranches.length === 0) continue;

    // Find which preferred branches the student qualifies for
    const matchedBranches =
      preferredBranches.length > 0
        ? qualifyingBranches.filter((b) =>
            preferredBranches.some(
              (p) => p.toLowerCase() === b.toLowerCase()
            )
          )
        : qualifyingBranches;

    const matchPercent =
      preferredBranches.length > 0
        ? Math.round((matchedBranches.length / preferredBranches.length) * 100)
        : 100;

    const branchList =
      matchedBranches.length > 0
        ? matchedBranches.slice(0, 3).join(", ")
        : qualifyingBranches.slice(0, 2).join(", ");

    const reason =
      matchedBranches.length > 0
        ? `Your rank qualifies for ${branchList} at this college`
        : `Qualifying branches: ${branchList}${qualifyingBranches.length > 2 ? " & more" : ""}`;

    results.push({
      college,
      matchPercent,
      matchedBranches: matchedBranches.length > 0 ? matchedBranches : qualifyingBranches,
      reason,
    });
  }

  // Sort: more preferred branch matches first, then by number of qualifying branches
  results.sort((a, b) => {
    if (b.matchPercent !== a.matchPercent) return b.matchPercent - a.matchPercent;
    return b.matchedBranches.length - a.matchedBranches.length;
  });

  return results.slice(0, 5);
}
