/**
 * Canonical list of valid Indian college email domains.
 * Keep in sync with the frontend email validator.
 */
const VALID_DOMAINS = [
  // Generic academic TLDs
  'ac.in',
  'edu.in',

  // IITs
  'iitb.ac.in',       // IIT Bombay
  'iitd.ac.in',       // IIT Delhi
  'iitm.ac.in',       // IIT Madras
  'iitk.ac.in',       // IIT Kanpur
  'iitkgp.ac.in',     // IIT Kharagpur
  'iitr.ac.in',       // IIT Roorkee
  'iitg.ac.in',       // IIT Guwahati
  'iith.ac.in',       // IIT Hyderabad
  'iiti.ac.in',       // IIT Indore
  'iitbbs.ac.in',     // IIT Bhubaneswar
  'iitmandi.ac.in',   // IIT Mandi
  'iitpatna.ac.in',   // IIT Patna
  'iitrpr.ac.in',     // IIT Ropar
  'iitism.ac.in',     // IIT (ISM) Dhanbad
  'iitjammu.ac.in',   // IIT Jammu
  'iitgoa.ac.in',     // IIT Goa
  'iitdh.ac.in',      // IIT Dharwad
  'iitpkd.ac.in',     // IIT Palakkad
  'iittirupati.ac.in',// IIT Tirupati

  // NITs
  'nitt.edu',         // NIT Trichy
  'nitk.edu.in',      // NIT Karnataka (Surathkal)
  'mnit.ac.in',       // MNIT Jaipur
  'nitw.ac.in',       // NIT Warangal
  'nitp.ac.in',       // NIT Patna
  'nitrr.ac.in',      // NIT Raipur
  'nitrkl.ac.in',     // NIT Rourkela
  'nith.ac.in',       // NIT Hamirpur
  'nits.ac.in',       // NIT Silchar
  'mnnit.ac.in',      // MNNIT Allahabad
  'vnit.ac.in',       // VNIT Nagpur

  // BITS Pilani campuses
  'bits-pilani.ac.in',
  'pilani.bits-pilani.ac.in',
  'goa.bits-pilani.ac.in',
  'hyderabad.bits-pilani.ac.in',
  'dubai.bits-pilani.ac.in',

  // IIITs
  'iiit.ac.in',
  'iiitd.ac.in',      // IIIT Delhi
  'iiith.ac.in',      // IIIT Hyderabad
  'iiita.ac.in',      // IIITA Allahabad
  'iiitb.ac.in',      // IIIT Bangalore
  'iiitm.ac.in',      // IIITM Gwalior
  'iiitdmj.ac.in',    // IIITDM Jabalpur
  'iiitdmkancheepuram.ac.in',

  // Other premier institutes
  'iisc.ac.in',       // IISc Bangalore
  'thapar.edu',       // Thapar University
  'vit.ac.in',        // VIT Vellore
  'manipal.edu',      // Manipal University
  'srm.edu.in',       // SRM University
  'amrita.edu',       // Amrita University
  'nit.ac.in',        // Generic NIT
];

/**
 * Extract the domain from an email address.
 * @param {string} email
 * @returns {string}
 */
const getDomainFromEmail = (email) => {
  if (!email || !email.includes('@')) return '';
  return email.split('@')[1].toLowerCase().trim();
};

/**
 * Returns true if the email belongs to a recognised Indian college domain.
 * @param {string} email
 * @returns {boolean}
 */
const isCollegeEmail = (email) => {
  const domain = getDomainFromEmail(email);
  if (!domain) return false;

  // Direct match or suffix match against any valid domain
  if (VALID_DOMAINS.some((valid) => domain === valid || domain.endsWith(`.${valid}`))) {
    return true;
  }

  // Broad catch-all: any subdomain of ac.in
  if (domain.endsWith('.ac.in')) return true;

  return false;
};

/**
 * Map a known email domain to a college shortName.
 * Returns null for unknown domains.
 * @param {string} email
 * @returns {string|null}
 */
const getCollegeFromEmail = (email) => {
  const domain = getDomainFromEmail(email);
  if (!domain) return null;

  const domainMap = {
    'iitb.ac.in': 'IITB',
    'iitd.ac.in': 'IITD',
    'iitm.ac.in': 'IITM',
    'iitk.ac.in': 'IITK',
    'iitkgp.ac.in': 'IIT KGP',
    'iitr.ac.in': 'IITR',
    'iitg.ac.in': 'IITG',
    'iith.ac.in': 'IITH',
    'iiti.ac.in': 'IITI',
    'iitbbs.ac.in': 'IIT BBS',
    'iitmandi.ac.in': 'IIT Mandi',
    'iitpatna.ac.in': 'IIT Patna',
    'iitrpr.ac.in': 'IIT Ropar',
    'iitism.ac.in': 'IIT (ISM)',
    'iitjammu.ac.in': 'IIT Jammu',
    'iitgoa.ac.in': 'IIT Goa',
    'nitt.edu': 'NIT Trichy',
    'nitk.edu.in': 'NITK',
    'mnit.ac.in': 'MNIT Jaipur',
    'nitw.ac.in': 'NITW',
    'nitp.ac.in': 'NIT Patna',
    'nitrr.ac.in': 'NIT Raipur',
    'nitrkl.ac.in': 'NIT Rourkela',
    'nith.ac.in': 'NIT Hamirpur',
    'nits.ac.in': 'NIT Silchar',
    'mnnit.ac.in': 'MNNIT',
    'vnit.ac.in': 'VNIT',
    'bits-pilani.ac.in': 'BITS Pilani',
    'pilani.bits-pilani.ac.in': 'BITS Pilani',
    'goa.bits-pilani.ac.in': 'BITS Goa',
    'hyderabad.bits-pilani.ac.in': 'BITS Hyderabad',
    'iiitd.ac.in': 'IIIT Delhi',
    'iiith.ac.in': 'IIIT Hyderabad',
    'iiita.ac.in': 'IIITA',
    'iiitb.ac.in': 'IIIT Bangalore',
    'iiitm.ac.in': 'IIITM',
    'iisc.ac.in': 'IISc',
    'thapar.edu': 'Thapar',
    'vit.ac.in': 'VIT',
    'manipal.edu': 'Manipal',
    'srm.edu.in': 'SRM',
    'amrita.edu': 'Amrita',
  };

  return domainMap[domain] || null;
};

module.exports = { isCollegeEmail, getDomainFromEmail, getCollegeFromEmail, VALID_DOMAINS };
