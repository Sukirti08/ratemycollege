/**
 * collegeEmailValidator.js — Validate Indian college/university email addresses
 */

export const COLLEGE_EMAIL_DOMAINS = [
  // IITs
  "iitb.ac.in",
  "iitd.ac.in",
  "iitm.ac.in",
  "iitk.ac.in",
  "iitkgp.ac.in",
  "iitg.ac.in",
  "iith.ac.in",
  "iitbbs.ac.in",
  "iiti.ac.in",
  "iitmandi.ac.in",
  "iitj.ac.in",
  "iitp.ac.in",
  "iitrpr.ac.in",
  "iitgn.ac.in",
  "iitpkd.ac.in",
  // BITS Pilani campuses
  "bits-pilani.ac.in",
  "pilani.bits-pilani.ac.in",
  "goa.bits-pilani.ac.in",
  "hyderabad.bits-pilani.ac.in",
  "dubai.bits-pilani.ac.in",
  // NITs
  "nitt.edu",
  "nitw.ac.in",
  "nitk.ac.in",
  "nitc.ac.in",
  "nitp.ac.in",
  "nitm.ac.in",
  "nita.ac.in",
  "nitdelhi.ac.in",
  "nitrr.ac.in",
  "nitj.ac.in",
  "mnnit.ac.in",
  "vnit.ac.in",
  "svnit.ac.in",
  "mnit.ac.in",
  "nitsri.ac.in",
  // IIITs
  "iiit.ac.in",
  "iiith.ac.in",
  "iiitd.ac.in",
  "iiitb.ac.in",
  "iiita.ac.in",
  "iiitl.ac.in",
  "iiitk.ac.in",
  "iiitdmj.ac.in",
  // IISc, IISERs
  "iisc.ac.in",
  "iiserpune.ac.in",
  "iisermohali.ac.in",
  "iiserkol.ac.in",
  "iiserbhopal.ac.in",
  "iisertvm.ac.in",
  // Central/deemed universities
  "jnu.ac.in",
  "du.ac.in",
  "bhu.ac.in",
  "hyderabad.ac.in",
  "tiss.edu",
  "iimb.ac.in",
  "iima.ac.in",
  "iimc.ac.in",
  "iimcal.ac.in",
  "iimk.ac.in",
  "iiml.ac.in",
  // Generic academic
  "ac.in",
  "edu.in",
];

/**
 * Check whether an email belongs to a known Indian college domain.
 * Also accepts any email whose domain part contains ".ac.in".
 * @param {string} email
 * @returns {boolean}
 */
export function isCollegeEmail(email) {
  if (!email || typeof email !== "string") return false;

  const lower = email.trim().toLowerCase();
  const atIdx = lower.lastIndexOf("@");
  if (atIdx < 0) return false;

  const domain = lower.slice(atIdx + 1);

  // Accept any .ac.in domain (catches state & private colleges not listed)
  if (domain.includes(".ac.in")) return true;

  // Check explicit domain list
  return COLLEGE_EMAIL_DOMAINS.some(
    (d) => domain === d || domain.endsWith(`.${d}`)
  );
}

/**
 * Extract the domain portion of an email address.
 * @param {string} email
 * @returns {string|null}
 */
export function extractCollegeDomain(email) {
  if (!email || typeof email !== "string") return null;
  const atIdx = email.trim().lastIndexOf("@");
  if (atIdx < 0) return null;
  return email.slice(atIdx + 1).toLowerCase();
}
