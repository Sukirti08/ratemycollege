// server/seed.js
// Run with: node seed.js

require('dotenv').config();
const mongoose = require('mongoose');

const { createHash } = require('node:crypto');
const College = require('./models/College');
const Professor = require('./models/Professor');
const Review = require('./models/Review');
const Placement = require('./models/PlacementData');
const Question = require('./models/Question');

// ─── Helper ───────────────────────────────────────────────────────────────────
const r = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

// ─── Seed Data ────────────────────────────────────────────────────────────────

const COLLEGES_DATA = [
  {
    name: 'Indian Institute of Technology Bombay', shortName: 'IITB', type: 'IIT',
    location: { city: 'Mumbai', state: 'Maharashtra' }, website: 'https://iitb.ac.in',
    establishedYear: 1958,
    branches: ['CSE','ECE','ME','CE','Chemical','Aerospace','Physics','Mathematics'],
    ratings: { overall: 4.6, teaching: 4.5, placements: 4.8, research: 4.7, hostel: 3.9, infrastructure: 4.4, facultyAccessibility: 4.1 },
    claimedAvgPackage: 28, actualAvgPackage: 22,
    topRecruiters: ['Google','Microsoft','Goldman Sachs','McKinsey','DE Shaw'],
    emailDomains: ['iitb.ac.in','cse.iitb.ac.in'],
  },
  {
    name: 'Indian Institute of Technology Delhi', shortName: 'IITD', type: 'IIT',
    location: { city: 'New Delhi', state: 'Delhi' }, website: 'https://iitd.ac.in',
    establishedYear: 1961,
    branches: ['CSE','ECE','ME','CE','Chemical','Textile','Physics','Mathematics'],
    ratings: { overall: 4.5, teaching: 4.4, placements: 4.7, research: 4.6, hostel: 3.8, infrastructure: 4.3, facultyAccessibility: 4.0 },
    claimedAvgPackage: 26, actualAvgPackage: 21,
    topRecruiters: ['Amazon','Google','Flipkart','BCG','Morgan Stanley'],
    emailDomains: ['iitd.ac.in'],
  },
  {
    name: 'Indian Institute of Technology Madras', shortName: 'IITM', type: 'IIT',
    location: { city: 'Chennai', state: 'Tamil Nadu' }, website: 'https://iitm.ac.in',
    establishedYear: 1959,
    branches: ['CSE','ECE','ME','CE','Chemical','Ocean Engineering','Physics','Mathematics'],
    ratings: { overall: 4.5, teaching: 4.6, placements: 4.6, research: 4.8, hostel: 4.0, infrastructure: 4.5, facultyAccessibility: 4.2 },
    claimedAvgPackage: 25, actualAvgPackage: 20,
    topRecruiters: ['Qualcomm','Texas Instruments','Samsung','Cognizant','Accenture'],
    emailDomains: ['iitm.ac.in','smail.iitm.ac.in'],
  },
  {
    name: 'Indian Institute of Technology Kanpur', shortName: 'IITK', type: 'IIT',
    location: { city: 'Kanpur', state: 'Uttar Pradesh' }, website: 'https://iitk.ac.in',
    establishedYear: 1959,
    branches: ['CSE','ECE','ME','CE','Chemical','Aerospace','Physics','Mathematics'],
    ratings: { overall: 4.4, teaching: 4.5, placements: 4.5, research: 4.6, hostel: 3.7, infrastructure: 4.2, facultyAccessibility: 4.3 },
    claimedAvgPackage: 24, actualAvgPackage: 19,
    topRecruiters: ['Microsoft','Adobe','Samsung R&D','Rakuten','D.E. Shaw'],
    emailDomains: ['iitk.ac.in'],
  },
  {
    name: 'Indian Institute of Technology Kharagpur', shortName: 'IITKgp', type: 'IIT',
    location: { city: 'Kharagpur', state: 'West Bengal' }, website: 'https://iitkgp.ac.in',
    establishedYear: 1951,
    branches: ['CSE','ECE','ME','CE','Chemical','Mining','Physics','Mathematics','Aerospace'],
    ratings: { overall: 4.3, teaching: 4.3, placements: 4.4, research: 4.5, hostel: 4.1, infrastructure: 4.3, facultyAccessibility: 3.9 },
    claimedAvgPackage: 22, actualAvgPackage: 18,
    topRecruiters: ['TCS Research','Infosys Labs','Wipro','SAIL','ONGC'],
    emailDomains: ['iitkgp.ac.in','kgpian.iitkgp.ac.in'],
  },
  {
    name: 'BITS Pilani', shortName: 'BITS', type: 'BITS',
    location: { city: 'Pilani', state: 'Rajasthan' }, website: 'https://bits-pilani.ac.in',
    establishedYear: 1964,
    branches: ['CSE','ECE','ME','Chemical','Civil','EEE','Mathematics','Physics','Pharmacy'],
    ratings: { overall: 4.2, teaching: 4.1, placements: 4.4, research: 3.8, hostel: 4.2, infrastructure: 4.3, facultyAccessibility: 3.8 },
    claimedAvgPackage: 18, actualAvgPackage: 15,
    topRecruiters: ['Uber','Razorpay','CRED','Sprinklr','Nutanix'],
    emailDomains: ['pilani.bits-pilani.ac.in','bits-pilani.ac.in'],
  },
  {
    name: 'National Institute of Technology Tiruchirappalli', shortName: 'NITT', type: 'NIT',
    location: { city: 'Tiruchirappalli', state: 'Tamil Nadu' }, website: 'https://nitt.edu',
    establishedYear: 1964,
    branches: ['CSE','ECE','ME','CE','Chemical','Metallurgy','EEE','ICE'],
    ratings: { overall: 4.0, teaching: 4.1, placements: 4.2, research: 3.7, hostel: 3.6, infrastructure: 3.9, facultyAccessibility: 4.0 },
    claimedAvgPackage: 14, actualAvgPackage: 11,
    topRecruiters: ['TCS','Infosys','Wipro','Capgemini','Amazon'],
    emailDomains: ['nitt.edu'],
  },
  {
    name: 'National Institute of Technology Warangal', shortName: 'NITW', type: 'NIT',
    location: { city: 'Warangal', state: 'Telangana' }, website: 'https://nitw.ac.in',
    establishedYear: 1959,
    branches: ['CSE','ECE','ME','CE','Chemical','Metallurgy','EEE','Mathematics'],
    ratings: { overall: 3.9, teaching: 4.0, placements: 4.0, research: 3.6, hostel: 3.5, infrastructure: 3.8, facultyAccessibility: 3.9 },
    claimedAvgPackage: 12, actualAvgPackage: 10,
    topRecruiters: ['Cognizant','Tech Mahindra','HCL','Hexaware','Mphasis'],
    emailDomains: ['nitw.ac.in','student.nitw.ac.in'],
  },
  {
    name: 'International Institute of Information Technology Hyderabad', shortName: 'IIITH', type: 'IIIT',
    location: { city: 'Hyderabad', state: 'Telangana' }, website: 'https://iiit.ac.in',
    establishedYear: 1998,
    branches: ['CSE','ECE','Computational Linguistics','Exact Humanities','Civil'],
    ratings: { overall: 4.1, teaching: 4.2, placements: 4.1, research: 4.4, hostel: 3.8, infrastructure: 4.0, facultyAccessibility: 4.3 },
    claimedAvgPackage: 20, actualAvgPackage: 17,
    topRecruiters: ['Google','Microsoft','Amazon','Oracle','Cisco'],
    emailDomains: ['iiit.ac.in','research.iiit.ac.in','students.iiit.ac.in'],
  },
  {
    name: 'Indian Institute of Science', shortName: 'IISc', type: 'Other',
    location: { city: 'Bangalore', state: 'Karnataka' }, website: 'https://iisc.ac.in',
    establishedYear: 1909,
    branches: ['Mathematics','Physics','Chemistry','Biology','Computer Science','Engineering'],
    ratings: { overall: 4.7, teaching: 4.8, placements: 4.3, research: 4.9, hostel: 4.2, infrastructure: 4.6, facultyAccessibility: 4.1 },
    claimedAvgPackage: 20, actualAvgPackage: 18,
    topRecruiters: ['ISRO','DRDO','Intel Research','IBM Research','Google Research'],
    emailDomains: ['iisc.ac.in','student.iisc.ac.in'],
  },
];

// professors[i] => array of 4 professors for COLLEGES_DATA[i]
const PROFESSORS_TEMPLATE = [
  // IITB (index 0)
  [
    { name: 'Prof. Sunita Sarawagi',   department: 'CSE', designation: 'Professor',
      ratings: { overall: 4.7, clarity: 4.8, helpfulness: 4.5, fairness: 4.6 },
      tags: ['Clear Explanations','Research Mentor','Best in Department','Inspiring'] },
    { name: 'Dr. Amit Agarwal',        department: 'ECE', designation: 'Associate Professor',
      ratings: { overall: 3.9, clarity: 4.0, helpfulness: 3.8, fairness: 4.1 },
      tags: ['Tough Grader','Exam Focused','Heavy Assignments'] },
    { name: 'Prof. Krithi Ramamritham',department: 'CSE', designation: 'Professor',
      ratings: { overall: 4.5, clarity: 4.4, helpfulness: 4.6, fairness: 4.5 },
      tags: ['Clear Explanations','Always Available','Best in Department'] },
    { name: 'Dr. Varsha Apte',         department: 'CSE', designation: 'Associate Professor',
      ratings: { overall: 4.2, clarity: 4.1, helpfulness: 4.3, fairness: 4.4 },
      tags: ['Research Mentor','Inspiring','Heavy Assignments'] },
  ],
  // IITD (index 1)
  [
    { name: 'Prof. Prem Kalra',        department: 'CSE', designation: 'Professor',
      ratings: { overall: 4.6, clarity: 4.5, helpfulness: 4.7, fairness: 4.6 },
      tags: ['Clear Explanations','Research Mentor','Inspiring','Best in Department'] },
    { name: 'Dr. Subodh Kumar',        department: 'CSE', designation: 'Associate Professor',
      ratings: { overall: 4.1, clarity: 4.0, helpfulness: 4.2, fairness: 4.0 },
      tags: ['Tough Grader','Exam Focused'] },
    { name: 'Prof. Maya Ramaratnam',   department: 'ECE', designation: 'Professor',
      ratings: { overall: 4.4, clarity: 4.5, helpfulness: 4.3, fairness: 4.3 },
      tags: ['Clear Explanations','Always Available','Best in Department'] },
    { name: 'Dr. Anshul Kumar',        department: 'CSE', designation: 'Professor',
      ratings: { overall: 4.3, clarity: 4.2, helpfulness: 4.4, fairness: 4.5 },
      tags: ['Research Mentor','Heavy Assignments','Inspiring'] },
  ],
  // IITM (index 2)
  [
    { name: 'Prof. Balaraman Ravindran',department: 'CSE', designation: 'Professor',
      ratings: { overall: 4.9, clarity: 4.8, helpfulness: 4.9, fairness: 4.7 },
      tags: ['Best in Department','Inspiring','Research Mentor','Clear Explanations'] },
    { name: 'Dr. Mitesh Khapra',       department: 'CSE', designation: 'Associate Professor',
      ratings: { overall: 4.7, clarity: 4.8, helpfulness: 4.6, fairness: 4.5 },
      tags: ['Clear Explanations','Always Available','Inspiring'] },
    { name: 'Prof. Andrew Thangaraj',  department: 'ECE', designation: 'Professor',
      ratings: { overall: 4.4, clarity: 4.5, helpfulness: 4.3, fairness: 4.2 },
      tags: ['Research Mentor','Exam Focused','Tough Grader'] },
    { name: 'Dr. Nandan Sudarsanam',   department: 'ME', designation: 'Assistant Professor',
      ratings: { overall: 3.8, clarity: 3.9, helpfulness: 3.7, fairness: 4.0 },
      tags: ['Heavy Assignments','Tough Grader'] },
  ],
  // IITK (index 3)
  [
    { name: 'Prof. Manindra Agrawal',  department: 'CSE', designation: 'Professor',
      ratings: { overall: 4.8, clarity: 4.7, helpfulness: 4.6, fairness: 4.8 },
      tags: ['Best in Department','Research Mentor','Inspiring','Clear Explanations'] },
    { name: 'Dr. Nisheeth Srivastava', department: 'CSE', designation: 'Associate Professor',
      ratings: { overall: 4.3, clarity: 4.2, helpfulness: 4.4, fairness: 4.1 },
      tags: ['Clear Explanations','Always Available','Exam Focused'] },
    { name: 'Prof. Sandeep Shukla',    department: 'CSE', designation: 'Professor',
      ratings: { overall: 4.1, clarity: 4.0, helpfulness: 4.2, fairness: 4.3 },
      tags: ['Research Mentor','Heavy Assignments'] },
    { name: 'Dr. Sumit Ganguly',       department: 'CSE', designation: 'Associate Professor',
      ratings: { overall: 3.7, clarity: 3.6, helpfulness: 3.8, fairness: 3.9 },
      tags: ['Tough Grader','Exam Focused'] },
  ],
  // IITKgp (index 4)
  [
    { name: 'Prof. Sourangshu Bhattacharya', department: 'CSE', designation: 'Professor',
      ratings: { overall: 4.4, clarity: 4.3, helpfulness: 4.5, fairness: 4.4 },
      tags: ['Research Mentor','Clear Explanations','Inspiring'] },
    { name: 'Dr. Niloy Ganguly',       department: 'CSE', designation: 'Professor',
      ratings: { overall: 4.2, clarity: 4.1, helpfulness: 4.3, fairness: 4.0 },
      tags: ['Research Mentor','Heavy Assignments','Best in Department'] },
    { name: 'Prof. Sudeshna Sarkar',   department: 'CSE', designation: 'Professor',
      ratings: { overall: 4.5, clarity: 4.6, helpfulness: 4.4, fairness: 4.3 },
      tags: ['Clear Explanations','Always Available','Best in Department'] },
    { name: 'Dr. Pawan Goyal',         department: 'CSE', designation: 'Associate Professor',
      ratings: { overall: 3.9, clarity: 3.8, helpfulness: 4.0, fairness: 3.9 },
      tags: ['Exam Focused','Tough Grader'] },
  ],
  // BITS (index 5)
  [
    { name: 'Prof. Srinivas Sethi',    department: 'CSE', designation: 'Professor',
      ratings: { overall: 4.1, clarity: 4.2, helpfulness: 4.0, fairness: 4.1 },
      tags: ['Clear Explanations','Exam Focused','Always Available'] },
    { name: 'Dr. Vandana Kushwaha',    department: 'CSE', designation: 'Associate Professor',
      ratings: { overall: 3.8, clarity: 3.7, helpfulness: 3.9, fairness: 3.8 },
      tags: ['Tough Grader','Heavy Assignments'] },
    { name: 'Prof. Raghunathan Rengaswamy', department: 'Chemical', designation: 'Professor',
      ratings: { overall: 4.6, clarity: 4.5, helpfulness: 4.7, fairness: 4.5 },
      tags: ['Best in Department','Inspiring','Research Mentor'] },
    { name: 'Dr. Navneet Goyal',       department: 'CSE', designation: 'Professor',
      ratings: { overall: 4.0, clarity: 3.9, helpfulness: 4.1, fairness: 4.2 },
      tags: ['Research Mentor','Clear Explanations'] },
  ],
  // NITT (index 6)
  [
    { name: 'Prof. T. Thyagarajan',   department: 'ECE', designation: 'Professor',
      ratings: { overall: 4.3, clarity: 4.4, helpfulness: 4.2, fairness: 4.1 },
      tags: ['Clear Explanations','Best in Department','Inspiring'] },
    { name: 'Dr. S. Rajasekaran',     department: 'CSE', designation: 'Associate Professor',
      ratings: { overall: 3.9, clarity: 3.8, helpfulness: 4.0, fairness: 3.9 },
      tags: ['Tough Grader','Exam Focused','Heavy Assignments'] },
    { name: 'Prof. N. Krishnaswamy',  department: 'ME', designation: 'Professor',
      ratings: { overall: 4.1, clarity: 4.0, helpfulness: 4.2, fairness: 4.3 },
      tags: ['Always Available','Research Mentor'] },
    { name: 'Dr. R. Vijayalakshmi',   department: 'CSE', designation: 'Assistant Professor',
      ratings: { overall: 3.6, clarity: 3.5, helpfulness: 3.7, fairness: 3.8 },
      tags: ['Heavy Assignments','Tough Grader'] },
  ],
  // NITW (index 7)
  [
    { name: 'Prof. C. Shoba Bindu',   department: 'ECE', designation: 'Professor',
      ratings: { overall: 4.2, clarity: 4.1, helpfulness: 4.3, fairness: 4.2 },
      tags: ['Clear Explanations','Always Available','Best in Department'] },
    { name: 'Dr. D. Bhanu Sree Reddy',department: 'CSE', designation: 'Associate Professor',
      ratings: { overall: 3.8, clarity: 3.9, helpfulness: 3.7, fairness: 3.8 },
      tags: ['Exam Focused','Tough Grader'] },
    { name: 'Prof. G. Sreenivasulu',  department: 'ME', designation: 'Professor',
      ratings: { overall: 4.0, clarity: 4.1, helpfulness: 3.9, fairness: 4.0 },
      tags: ['Research Mentor','Clear Explanations'] },
    { name: 'Dr. V. Kamakshi Prasad', department: 'CSE', designation: 'Professor',
      ratings: { overall: 3.5, clarity: 3.4, helpfulness: 3.6, fairness: 3.7 },
      tags: ['Heavy Assignments','Tough Grader'] },
  ],
  // IIITH (index 8)
  [
    { name: 'Prof. P.J. Narayanan',   department: 'CSE', designation: 'Professor',
      ratings: { overall: 4.8, clarity: 4.7, helpfulness: 4.8, fairness: 4.7 },
      tags: ['Best in Department','Research Mentor','Inspiring','Clear Explanations'] },
    { name: 'Dr. Vasudeva Varma',     department: 'CSE', designation: 'Associate Professor',
      ratings: { overall: 4.4, clarity: 4.5, helpfulness: 4.3, fairness: 4.3 },
      tags: ['Research Mentor','Always Available','Inspiring'] },
    { name: 'Prof. Radhika Mamidi',   department: 'Computational Linguistics', designation: 'Professor',
      ratings: { overall: 4.2, clarity: 4.3, helpfulness: 4.1, fairness: 4.2 },
      tags: ['Clear Explanations','Best in Department'] },
    { name: 'Dr. Suryakanth Gangashetty', department: 'ECE', designation: 'Associate Professor',
      ratings: { overall: 3.7, clarity: 3.6, helpfulness: 3.8, fairness: 3.9 },
      tags: ['Tough Grader','Heavy Assignments'] },
  ],
  // IISc (index 9)
  [
    { name: 'Prof. Y. Narahari',      department: 'Computer Science', designation: 'Professor',
      ratings: { overall: 4.9, clarity: 4.8, helpfulness: 4.9, fairness: 4.9 },
      tags: ['Best in Department','Inspiring','Research Mentor','Clear Explanations'] },
    { name: 'Dr. Shalabh Bhatnagar', department: 'Computer Science', designation: 'Professor',
      ratings: { overall: 4.5, clarity: 4.4, helpfulness: 4.6, fairness: 4.5 },
      tags: ['Research Mentor','Heavy Assignments','Inspiring'] },
    { name: 'Prof. Vijay Natarajan',  department: 'Computer Science', designation: 'Associate Professor',
      ratings: { overall: 4.3, clarity: 4.4, helpfulness: 4.2, fairness: 4.2 },
      tags: ['Clear Explanations','Always Available'] },
    { name: 'Dr. Chiranjib Bhattacharyya', department: 'Computer Science', designation: 'Professor',
      ratings: { overall: 4.6, clarity: 4.5, helpfulness: 4.7, fairness: 4.6 },
      tags: ['Best in Department','Research Mentor','Tough Grader'] },
  ],
];

// 5 reviews per college (50 total) — realistic & unique
const REVIEWS_DATA = [
  // ── IITB ──
  [
    { batchYear: 2023, branch: 'CSE', isVerified: true,
      ratings: { overall: 5, teaching: 5, placements: 5, research: 4, hostel: 3, infrastructure: 5, facultyAccessibility: 4 },
      tags: ['Great Placements','Top Faculty','Good Research'],
      text: 'The CSE department at IITB is genuinely world-class. Professors like Prof. Sarawagi make algorithms feel intuitive. Placements are excellent with Google, Microsoft visiting on Day 1. Hostel food is the only real complaint — the mess quality varies wildly by mess. Infrastructure is top notch with great labs and computing clusters available 24x7.' },
    { batchYear: 2022, branch: 'ECE', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 5, research: 5, hostel: 3, infrastructure: 4, facultyAccessibility: 3 },
      tags: ['Research Opportunities','Good Placements'],
      text: 'IITB ECE gives you access to cutting-edge research labs and funding opportunities you simply won\'t find elsewhere in India. The chip design lab and the RF research centre are genuinely impressive. Placement packages for ECE are strong — Qualcomm, TI, and Samsung recruit heavily. The workload is intense though; expect to sleep 5 hours on a good day in your third year.' },
    { batchYear: 2024, branch: 'Aerospace', isVerified: false,
      ratings: { overall: 4, teaching: 5, placements: 3, research: 5, hostel: 4, infrastructure: 4, facultyAccessibility: 5 },
      tags: ['Top Faculty','Research Opportunities'],
      text: 'Aerospace at IITB is a niche but incredible experience. The wind tunnel facility is one of the best in Asia and faculty are actively collaborating with ISRO and DRDO. Placements are harder to crack compared to CSE but the research opportunities more than compensate. Prof. Ramamritham\'s open-door policy is something every IIT professor should emulate.' },
    { batchYear: 2021, branch: 'ME', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 3, hostel: 4, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Good Infrastructure','Decent Placements'],
      text: 'Mechanical at IITB is solid. The manufacturing lab and CAD/CAM facilities are state of the art. Core companies like L&T, Bosch, and Cummins recruit regularly. Mumbai location is a huge bonus — weekend trips, internship networking, and the city vibe make college life much richer than being stuck in a remote campus. Hostel rooms are a bit dated in older halls.' },
    { batchYear: 2023, branch: 'Mathematics', isVerified: false,
      ratings: { overall: 5, teaching: 5, placements: 4, research: 5, hostel: 3, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Top Faculty','Research Opportunities','Good Placements'],
      text: 'Pure Maths at IITB might sound risky career-wise but the quant finance and data science crossover has made it extremely lucrative. Multiple batchmates placed at DE Shaw, Graviton, and WorldQuant. The faculty are exceptional — some of the best combinatorialists and algebraists in the country teach here. The peer group is incredibly motivated which pushes you constantly.' },
  ],
  // ── IITD ──
  [
    { batchYear: 2022, branch: 'CSE', isVerified: true,
      ratings: { overall: 5, teaching: 5, placements: 5, research: 4, hostel: 4, infrastructure: 5, facultyAccessibility: 4 },
      tags: ['Great Placements','Top Faculty','Good Infrastructure'],
      text: 'IITD CSE is arguably the best in the country for product placements. Amazon, Google, and Flipkart literally camp here during placement week. The faculty, especially Prof. Kalra and Dr. Anshul Kumar, are world-class researchers who still make time for undergrads. Delhi location means government internship and policy opportunities that other IITs simply can\'t match.' },
    { batchYear: 2023, branch: 'ECE', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 5, hostel: 3, infrastructure: 4, facultyAccessibility: 3 },
      tags: ['Research Opportunities','Good Placements'],
      text: 'IIT Delhi ECE is strong in signal processing and VLSI. The research culture is outstanding — I co-authored two papers by the end of my third year, which is almost unheard of at undergrad level elsewhere. Placements to Texas Instruments and Qualcomm are regular. However, the old hostel blocks really need renovation — the ACs barely work in Delhi\'s brutal summers.' },
    { batchYear: 2024, branch: 'ME', isVerified: false,
      ratings: { overall: 3, teaching: 3, placements: 4, research: 3, hostel: 3, infrastructure: 4, facultyAccessibility: 3 },
      tags: ['Decent Placements','Average Faculty'],
      text: 'Honest review from a 2024 ME grad: the department is decent but not spectacular. Core placements are okay — L&T, Mahindra, Tata Motors visit — but you\'ll need to hustle hard for the good roles. Research opportunities exist but most profs are too busy to give undergrads meaningful projects. The machine shop is well equipped at least. Delhi weather also takes getting used to.' },
    { batchYear: 2021, branch: 'Chemical', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 3, research: 4, hostel: 4, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Good Research','Average Placements'],
      text: 'Chemical Engineering at IITD has a fantastic research culture tied to IIT Delhi\'s strong ties with HPCL and Indian Oil. Many batchmates went on to do PhDs at MIT and Stanford. Industry placements are fewer than CSE but the quality is high — SABIC, Reliance, and BASF recruit here. Prof. Maya Ramaratnam\'s process control course genuinely changed the way I think about systems.' },
    { batchYear: 2022, branch: 'Textile', isVerified: false,
      ratings: { overall: 3, teaching: 4, placements: 3, research: 3, hostel: 3, infrastructure: 3, facultyAccessibility: 4 },
      tags: ['Average Placements','Niche Branch'],
      text: 'Textile at IITD is one of those hidden gems that nobody talks about. Yes, core textile placements are limited but many batchmates pivoted to consulting, management, or software with the IITD brand backing them. The department itself is small which means closer faculty-student interaction. If you are passionate about sustainable fashion tech or smart textiles this is actually a great place to be.' },
  ],
  // ── IITM ──
  [
    { batchYear: 2023, branch: 'CSE', isVerified: true,
      ratings: { overall: 5, teaching: 5, placements: 5, research: 5, hostel: 4, infrastructure: 5, facultyAccessibility: 4 },
      tags: ['Best Faculty','Great Placements','Top Research'],
      text: 'IITM CSE is in a league of its own for AI and ML research in India. Prof. Ravindran and Dr. Khapra have essentially built one of the premier NLP and RL groups on the subcontinent. Placement packages are stellar — multiple 1cr+ international offers in our batch. The campus itself is gorgeous with a resident deer population wandering around which makes evening walks genuinely magical.' },
    { batchYear: 2022, branch: 'ECE', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 5, hostel: 4, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Research Opportunities','Good Infrastructure'],
      text: 'The IITM ECE programme is research-heavy in a good way. Prof. Thangaraj\'s information theory course is legendary — brutal but transforms how you think about communication systems. Qualcomm has a dedicated research tie-up with the department which means internship opportunities. The campus forest actually gets foggy in winter mornings which is oddly peaceful given how intense academic life is.' },
    { batchYear: 2024, branch: 'ME', isVerified: false,
      ratings: { overall: 4, teaching: 4, placements: 3, research: 4, hostel: 4, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Good Research','Average Placements'],
      text: 'ME at IITM is solid academically with a strong focus on manufacturing and thermal sciences. The connections to industries in the Chennai-Sriperumbudur corridor are useful for internships. However core company placements have been declining over the past two batches as fewer manufacturing firms recruit on campus. Most of my batchmates ended up in software roles despite an ME degree — a common story at the IITs.' },
    { batchYear: 2021, branch: 'Ocean Engineering', isVerified: true,
      ratings: { overall: 4, teaching: 5, placements: 3, research: 5, hostel: 4, infrastructure: 4, facultyAccessibility: 5 },
      tags: ['Niche Research','Top Faculty','Good Hostel'],
      text: 'Ocean Engineering at IITM is probably the best programme of its kind in India. The towing tank and wave basin facilities are world-class. Most graduates go on to prestigious research programmes at international universities or join offshore oil companies. Faculty accessibility is genuinely outstanding — I had hour-long coffee discussions with my advisor every week. Rare to find this environment anywhere.' },
    { batchYear: 2023, branch: 'Mathematics', isVerified: true,
      ratings: { overall: 5, teaching: 5, placements: 4, research: 5, hostel: 3, infrastructure: 5, facultyAccessibility: 4 },
      tags: ['Best Faculty','Great Research','Good Placements'],
      text: 'Mathematics at IITM is elite. The department has a long history of producing top researchers in number theory and combinatorics. Several faculty have Shanti Swarup Bhatnagar awards. For a pure math student, the IITM ecosystem — seminars, reading groups, visiting scholars — is as good as it gets in India. Placements into quant finance, data science, and analytics are very strong if you are open to those paths.' },
  ],
  // ── IITK ──
  [
    { batchYear: 2023, branch: 'CSE', isVerified: true,
      ratings: { overall: 5, teaching: 5, placements: 5, research: 5, hostel: 3, infrastructure: 4, facultyAccessibility: 5 },
      tags: ['Top Faculty','Great Placements','Research Excellence'],
      text: 'Prof. Manindra Agrawal literally proved P vs NP partial results from this campus — that tells you everything about the research culture here. IITK CSE is a theorist\'s paradise. Microsoft and Adobe hiring is consistent. The Kanpur city itself is not glamorous but the campus is self-sufficient with everything you need. The freedom and culture of intellectual curiosity at IITK is genuinely addictive.' },
    { batchYear: 2022, branch: 'Aerospace', isVerified: false,
      ratings: { overall: 4, teaching: 4, placements: 3, research: 5, hostel: 3, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Good Research','Tough Curriculum'],
      text: 'IITK Aerospace has incredible research infrastructure — the low-turbulence wind tunnel is unique in India. HAL and ISRO hire regularly. The curriculum is brutally hard with fluid mechanics and structures courses designed to filter students early. If you survive the third year, you come out the other side much stronger. Not for the faint-hearted but deeply rewarding if you love the subject.' },
    { batchYear: 2024, branch: 'ECE', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 4, hostel: 3, infrastructure: 4, facultyAccessibility: 3 },
      tags: ['Good Placements','Decent Research'],
      text: 'ECE at IITK is a strong programme though it sits in the shadow of the legendary CSE department. Samsung R&D and Rakuten recruit from ECE regularly. The VLSI and embedded systems labs are well equipped. Faculty accessibility is hit-or-miss — some professors are deeply engaged with undergrads while others are too absorbed in research to be consistently available for students.' },
    { batchYear: 2021, branch: 'ME', isVerified: true,
      ratings: { overall: 3, teaching: 3, placements: 3, research: 4, hostel: 3, infrastructure: 3, facultyAccessibility: 4 },
      tags: ['Average Placements','Good Research'],
      text: 'I will be honest — mechanical at IITK is not the most exciting experience unless you are research-minded. Core manufacturing companies pay decent but not spectacular packages. The labs are ageing and need investment. That said, the peer group quality is extraordinary and pushes you to do more than you thought possible. Many batchmates pivoted to management consulting or fintech which worked out well.' },
    { batchYear: 2023, branch: 'Mathematics', isVerified: false,
      ratings: { overall: 5, teaching: 5, placements: 4, research: 5, hostel: 3, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Best in India','Great Research'],
      text: 'The mathematics department at IITK is the best in India at the undergraduate level — no debate. The reading culture, the student seminars, the visiting faculty programme — it all comes together to create a uniquely stimulating academic environment. AKA results in pure math research consistently make it to top international journals. Placement-wise, quant finance is a clear favourite among graduates here.' },
  ],
  // ── IITKgp ──
  [
    { batchYear: 2022, branch: 'CSE', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 4, hostel: 4, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Good Placements','Well Rounded','Huge Campus'],
      text: 'IIT Kharagpur is the original IIT and the campus reflects that legacy — 2,100 acres with its own hospital, market, schools, and even a railway station. CSE placements are solid with TCS Research and Infosys Labs for those interested in applied research, plus good software product companies too. The sheer diversity of departments means you can explore literally any field through electives and clubs.' },
    { batchYear: 2023, branch: 'ECE', isVerified: false,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 4, hostel: 4, infrastructure: 4, facultyAccessibility: 3 },
      tags: ['Good Infrastructure','Active Tech Clubs'],
      text: 'The ECE programme at IITKgp gives you excellent hardware exposure that many other IITs lack. The embedded systems and robotics labs are impressive. Kshitij — the annual tech fest — gives ECE students practical project experience that directly helps in placements. Faculty are research-active but can sometimes seem detached from undergrad concerns, which is a common complaint across departments.' },
    { batchYear: 2024, branch: 'Mining', isVerified: false,
      ratings: { overall: 3, teaching: 3, placements: 4, research: 3, hostel: 4, infrastructure: 3, facultyAccessibility: 3 },
      tags: ['SAIL and ONGC Placements','Niche Branch'],
      text: 'Mining Engineering is one of those branches that people regret initially but make peace with once they see the placement numbers. SAIL, ONGC, Coal India — the pay packages from PSU hiring are not flashy but are extremely stable. The fieldwork trips to actual mines in Jharkhand are educational in a way no classroom can replicate. Most people pivot to MBA after a few PSU years anyway.' },
    { batchYear: 2021, branch: 'Chemical', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 3, research: 4, hostel: 4, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Good Research','Average Placements'],
      text: 'Chemical Engineering at IITKgp has strong ties with ONGC and IOCL which provides good summer internship pipelines. The polymer and process simulation labs are well-maintained. Faculty research in computational fluid dynamics is internationally recognized. Core job packages are moderate compared to software but the quality of education and campus experience more than compensates during the four years.' },
    { batchYear: 2022, branch: 'Aerospace', isVerified: true,
      ratings: { overall: 4, teaching: 5, placements: 3, research: 5, hostel: 4, infrastructure: 5, facultyAccessibility: 4 },
      tags: ['Top Research','Best Labs in India'],
      text: 'Aerospace at IITKgp is a hidden gem. The department was set up with significant ISRO and HAL funding and the facilities show it. Hypersonic wind tunnel, composite manufacturing lab, satellite design studio — the infrastructure is phenomenal. Placements are limited by the small aerospace industry in India but those who get ISRO or DRDO positions are extremely well set. The research output from this department punches well above its weight globally.' },
  ],
  // ── BITS ──
  [
    { batchYear: 2023, branch: 'CSE', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 5, research: 3, hostel: 4, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Startup Culture','Great Placements','BITS Pilani Internship'],
      text: 'BITS Pilani CSE is the startup founder factory of India — CRED, Razorpay, and Sprinklr were all co-founded by BITSians. The Practice School programme is genuinely transformative, forcing you into real industry environments in your third year rather than summer internships. Placements are consistently excellent. Research culture is weaker than IITs but if you want industry impact, BITS is arguably better.' },
    { batchYear: 2022, branch: 'ECE', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 3, hostel: 4, infrastructure: 4, facultyAccessibility: 3 },
      tags: ['Good Placements','Industry Focused'],
      text: 'BITS ECE prepares you extremely well for industry. The dual degree option combining ECE with CS or Finance gives you a competitive edge in placements. Nutanix and Sprinklr are big recruiters from ECE. The Pilani campus can feel isolated — there is nothing for miles around — but the campus life is incredibly self-contained with a vibrant cultural and tech fest scene that compensates.' },
    { batchYear: 2024, branch: 'Mathematics', isVerified: false,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 3, hostel: 5, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Quant Finance','Good Dual Degree Options'],
      text: 'MSc Mathematics at BITS combined with any engineering dual degree is one of the best-kept secrets in Indian engineering admissions. The math courses are rigorous and the dual degree lets you specialize while having mathematical depth. Many batchmates ended up at quant firms or data science roles with packages rivalling top CSE graduates. The desert location grows on you — the Rajasthan winters are stunning.' },
    { batchYear: 2021, branch: 'Pharmacy', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 3, research: 4, hostel: 4, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Good Research','Average Industry Placements'],
      text: 'BITS Pharmacy is probably the best pharmacy programme in India given the college brand. Sun Pharma, Cipla, and Dr. Reddy\'s all recruit here. Many graduates go on to PhDs at top US universities. The research exposure in formulation chemistry and pharmacology is genuinely solid. The only caveat is that core pharmacy pay scales are modest compared to software — expect lateral comparison envy from your engineering batchmates.' },
    { batchYear: 2023, branch: 'Chemical', isVerified: false,
      ratings: { overall: 3, teaching: 3, placements: 3, research: 3, hostel: 4, infrastructure: 4, facultyAccessibility: 3 },
      tags: ['Average Placements','Isolated Campus'],
      text: 'BITS Chemical is decent but not spectacular. The department is smaller and the core recruiter base is limited. Many chemical engineers here end up in software or consulting after graduation simply because the brand opens those doors. Prof. Rengaswamy is a standout exception — his process dynamics course is taught at a level comparable to top international programmes. The campus isolation at Pilani is real; plan your weekends around the campus itself.' },
  ],
  // ── NITT ──
  [
    { batchYear: 2022, branch: 'CSE', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 3, hostel: 3, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Good Placements','Competitive Peers'],
      text: 'NIT Trichy CSE is the gold standard among NITs. The peer quality is genuinely outstanding — the competitive culture here rivals many IITs. Amazon and Wipro are consistent recruiters but self-driven students end up at startups and product companies too through aggressive off-campus hunting. The Tamil Nadu location is a bonus for cultural experiences. WiFi in hostels needs major improvement though.' },
    { batchYear: 2023, branch: 'ECE', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 3, hostel: 3, infrastructure: 3, facultyAccessibility: 4 },
      tags: ['Good Placements','Strong Alumni Network'],
      text: 'NITT ECE has a fierce alumni network that actively helps students get internships and jobs. The department has strong industry connections in the semiconductor and telecom space. Cognizant and Infosys hire in bulk but if you put in the effort, quality product companies are reachable too. Prof. Thyagarajan\'s signal processing courses are outstanding — probably the best DSP teaching I have encountered anywhere.' },
    { batchYear: 2024, branch: 'Chemical', isVerified: false,
      ratings: { overall: 3, teaching: 3, placements: 3, research: 3, hostel: 3, infrastructure: 3, facultyAccessibility: 3 },
      tags: ['Average Experience','Limited Core Jobs'],
      text: 'Chemical at NITT is an honest 3-star experience. Infrastructure is functional rather than impressive. Core chemical company recruitment is thin — expect to either go into IT services or pursue higher education. The faculty are adequate but not inspiring. The saving grace is the NITT brand which still carries weight and the peer group quality which pushes you to maintain decent grades even without external motivation.' },
    { batchYear: 2021, branch: 'Metallurgy', isVerified: true,
      ratings: { overall: 3, teaching: 4, placements: 3, research: 3, hostel: 3, infrastructure: 3, facultyAccessibility: 4 },
      tags: ['PSU Placements','Average Infrastructure'],
      text: 'Metallurgy at NITT gives you access to SAIL, JSW, and Tata Steel through campus placements. The salaries are decent for a government job lifestyle. The faculty in the department are genuinely knowledgeable and willing to discuss research. Most graduates pivot to MBA or software after a few core years. Do not join Metallurgy expecting the placement excitement of CSE; manage expectations and you will have a decent four years.' },
    { batchYear: 2022, branch: 'EEE', isVerified: false,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 3, hostel: 3, infrastructure: 4, facultyAccessibility: 3 },
      tags: ['Good Placements','Strong Core'],
      text: 'EEE at NITT is a solid choice if you want a healthy mix of software and core options. The power systems and control labs are well maintained. Students frequently convert to software roles at Capgemini and TCS while others go into the power sector with BHEL and NTPC. The alumni network in the power utility sector is strong and actively facilitates placements. Hostel conditions are the weakest point of the NITT experience.' },
  ],
  // ── NITW ──
  [
    { batchYear: 2022, branch: 'CSE', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 3, hostel: 3, infrastructure: 3, facultyAccessibility: 4 },
      tags: ['Good Placements','Telangana Tech Hub'],
      text: 'NIT Warangal CSE benefits enormously from its proximity to the Hyderabad tech corridor. Cognizant, Tech Mahindra, and HCL hire heavily here. The Hyderabad network means good startup internship opportunities too. Faculty are approachable and the class sizes are smaller than at top IITs which means better mentoring. Infrastructure could use an upgrade — some labs have equipment from the early 2010s that has not been replaced.' },
    { batchYear: 2023, branch: 'ECE', isVerified: false,
      ratings: { overall: 3, teaching: 4, placements: 3, research: 3, hostel: 3, infrastructure: 3, facultyAccessibility: 4 },
      tags: ['Average Placements','Friendly Faculty'],
      text: 'NITW ECE is a mixed bag. Teaching quality is better than the infrastructure would suggest — faculty are dedicated and the department has produced some good research in antenna design and signal processing. However placements are below what you would expect from an NIT of this reputation. Most ECE graduates end up in IT services unless they proactively target core roles. The Warangal city itself has improved a lot post the Telangana state formation.' },
    { batchYear: 2024, branch: 'ME', isVerified: true,
      ratings: { overall: 3, teaching: 3, placements: 3, research: 3, hostel: 3, infrastructure: 3, facultyAccessibility: 3 },
      tags: ['Average Overall','Core Companies Only'],
      text: 'An honest take on NITW ME: it is exactly what a state-tier NIT mechanical programme looks like. Bharat Heavy Electricals and a few auto companies hire from campus. Research is minimal at UG level. The workshop facilities are functional and you will learn machining basics well. If your goal is a PSU job and stable career in core engineering, this works. If you want startup culture or software pivots, you will need to self-drive heavily.' },
    { batchYear: 2021, branch: 'Chemical', isVerified: true,
      ratings: { overall: 3, teaching: 4, placements: 3, research: 3, hostel: 3, infrastructure: 3, facultyAccessibility: 4 },
      tags: ['Faculty Strength','Limited Industry'],
      text: 'The best thing about NITW Chemical is the faculty — most completed their PhDs from IITs or abroad and bring genuine expertise. The placements are limited to process industries in Telangana which pay conservatively. Most of my batchmates ended up taking GATE to pursue MTech at IITs or switching to software. The proximity to Hyderabad at least means weekend escape is easy and internship networking possible with some effort.' },
    { batchYear: 2022, branch: 'Metallurgy', isVerified: false,
      ratings: { overall: 3, teaching: 3, placements: 3, research: 3, hostel: 3, infrastructure: 3, facultyAccessibility: 3 },
      tags: ['PSU Route','Average Experience'],
      text: 'NITW Metallurgy is for the very patient and GATE-focused student. Campus placements lead to Vizag Steel, RINL, and similar PSUs. The academic content is fine but the lab infrastructure is dated. Most students start preparing for GATE from second year itself, which tells you about the placement confidence level here. The peer group is hardworking and academically competitive which keeps you motivated despite the limited campus resources.' },
  ],
  // ── IIITH ──
  [
    { batchYear: 2023, branch: 'CSE', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 5, hostel: 3, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Research Paradise','Good Placements','AI Focus'],
      text: 'IIIT Hyderabad is probably the best place in India for undergraduate AI and computer vision research. Prof. PJ Narayanan\'s CV lab has produced researchers who went on to PhD programmes at top-10 US universities. Google and Microsoft visit on Day 1. The research ecosystem here is genuinely comparable to international institutions at the graduate level — remarkable for an undergrad programme.' },
    { batchYear: 2022, branch: 'ECE', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 4, research: 4, hostel: 4, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['Good Research','Industry Connections'],
      text: 'ECE at IIIT-H has a unique emphasis on speech processing and embedded intelligence which aligns well with the Hyderabad tech industry. Cisco and Oracle hire regularly from ECE. The dual degree format ensures depth over breadth. Prof. Gangashetty\'s speech technology courses are internationally cited. The campus is compact and every faculty member is accessible — the student-to-faculty ratio here is remarkable compared to large institutions.' },
    { batchYear: 2024, branch: 'Computational Linguistics', isVerified: false,
      ratings: { overall: 5, teaching: 5, placements: 4, research: 5, hostel: 4, infrastructure: 4, facultyAccessibility: 5 },
      tags: ['Unique Programme','AI NLP','Top Research'],
      text: 'IIIT-H\'s Computational Linguistics programme is utterly unique in India. The combination of formal linguistics with NLP and ML is intellectually challenging in the best way. Prof. Radhika Mamidi is an exceptional teacher and researcher. Placements to AI companies working on NLP are strong — especially since the LLM revolution. If you are interested in language and computing, there is literally no better place in India than IIIT-H.' },
    { batchYear: 2021, branch: 'CSE', isVerified: true,
      ratings: { overall: 4, teaching: 4, placements: 5, research: 4, hostel: 3, infrastructure: 4, facultyAccessibility: 5 },
      tags: ['Best Placements','Research Culture','Accessible Faculty'],
      text: 'The thing that separates IIIT-H from other colleges is the research-first culture that permeates everything. Even if you are not personally interested in research, the rigour demanded by the programme makes you an exceptionally strong engineer. Amazon and Oracle placed multiple students in my batch in senior engineering roles. The hostel infrastructure is functional but cramped — that is the main quality-of-life complaint.' },
    { batchYear: 2023, branch: 'CSE', isVerified: false,
      ratings: { overall: 4, teaching: 5, placements: 4, research: 5, hostel: 3, infrastructure: 4, facultyAccessibility: 4 },
      tags: ['World Class Faculty','Research Publications'],
      text: 'The caliber of professors at IIIT-H is extraordinary relative to its size. Multiple Turing Award-adjacent researchers and internationally recognized AI lab heads teach here. The coursework is demanding — expect to put in 60-hour weeks during the semester — but the output quality, including research publications as an undergrad, is something recruiters and graduate schools absolutely love. The only downside: Hyderabad rent if you move off-campus is steep.' },
  ],
  // ── IISc ──
  [
    { batchYear: 2022, branch: 'Computer Science', isVerified: true,
      ratings: { overall: 5, teaching: 5, placements: 4, research: 5, hostel: 4, infrastructure: 5, facultyAccessibility: 4 },
      tags: ['Research Paradise','World Class Faculty','Excellent Infrastructure'],
      text: 'IISc is not a college — it is a research civilization. The Computer Science department here operates at a level comparable to top 20 global universities. Prof. Narahari\'s game theory work, Prof. Bhattacharyya\'s ML research — these are people defining their fields internationally. Placements to Google Research, Intel Research, and IBM Research are regular. No undergrad? No problem — the integrated BS-MS programme here is simply the best research track in India.' },
    { batchYear: 2023, branch: 'Physics', isVerified: true,
      ratings: { overall: 5, teaching: 5, placements: 3, research: 5, hostel: 4, infrastructure: 5, facultyAccessibility: 4 },
      tags: ['Pure Research','Elite Faculty','International Collaborations'],
      text: 'Physics at IISc is for those who breathe science. The department has produced multiple Bhatnagar Award winners and the experimental facilities — ultrafast laser lab, low-temperature physics centre — are accessible to students in ways that are unimaginable at most institutions globally. Industry placements are not the focus here; most graduates pursue PhDs at Oxford, Cambridge, Princeton. If research is your calling, IISc Physics is the pinnacle of what India offers.' },
    { batchYear: 2024, branch: 'Engineering', isVerified: false,
      ratings: { overall: 4, teaching: 5, placements: 3, research: 5, hostel: 5, infrastructure: 5, facultyAccessibility: 3 },
      tags: ['Excellent Infrastructure','Research Focus','Good Hostel'],
      text: 'The integrated BE Research programme at IISc is extraordinary but demanding. You are surrounded by PhD students and postdocs which creates an atmosphere of intense academic seriousness. The Bangalore location is fantastic — tech industry access, startup culture, ISRO nearby. Hostel facilities are genuinely the best I have seen at any Indian institution. The challenge is that faculty are so research-absorbed that undergrads can sometimes feel like second-class citizens during semester peaks.' },
    { batchYear: 2021, branch: 'Mathematics', isVerified: true,
      ratings: { overall: 5, teaching: 5, placements: 3, research: 5, hostel: 4, infrastructure: 5, facultyAccessibility: 4 },
      tags: ['Elite Research','World Class Teaching','International PhD Placements'],
      text: 'IISc Mathematics is not for people who want to maximize their campus placement package. It is for people who want to become mathematicians, theoretical physicists, or quantitative researchers at the highest level. The department runs regular colloquiums with visiting Fields Medal nominees and international collaborators. Every graduate I know from this programme has either joined a top PhD programme globally or is doing genuinely meaningful quantitative work. India\'s best-kept academic secret.' },
    { batchYear: 2022, branch: 'Biology', isVerified: false,
      ratings: { overall: 5, teaching: 5, placements: 3, research: 5, hostel: 4, infrastructure: 5, facultyAccessibility: 4 },
      tags: ['Research Heaven','World Class Labs','International Connections'],
      text: 'Biology at IISc gives you access to some of the most sophisticated experimental infrastructure in Asia — cryo-EM, single-cell sequencing platforms, high-throughput drug screening labs. DRDO and DBT fund heavily here. If you are doing biology expecting a campus job, you are in the wrong place. But for an eventual career in biotech, pharma research, or academic science, the IISc Biology pedigree opens doors no other Indian institution can. The peer group of PhD students is extraordinarily motivating.' },
  ],
];

// 3 placements per college
const PLACEMENTS_TEMPLATE = [
  // IITB
  [
    { company: 'Google', role: 'Software Engineer', ctc: 45, branch: 'CSE', year: 2023, isVerified: true },
    { company: 'Goldman Sachs', role: 'Analyst', ctc: 32, branch: 'Mathematics', year: 2023, isVerified: true },
    { company: 'McKinsey & Company', role: 'Business Analyst', ctc: 28, branch: 'ME', year: 2022, isVerified: false },
  ],
  // IITD
  [
    { company: 'Amazon', role: 'SDE-I', ctc: 38, branch: 'CSE', year: 2023, isVerified: true },
    { company: 'BCG', role: 'Consultant', ctc: 30, branch: 'Chemical', year: 2023, isVerified: true },
    { company: 'Morgan Stanley', role: 'Technology Analyst', ctc: 35, branch: 'ECE', year: 2022, isVerified: false },
  ],
  // IITM
  [
    { company: 'Qualcomm', role: 'Chip Design Engineer', ctc: 29, branch: 'ECE', year: 2023, isVerified: true },
    { company: 'Texas Instruments', role: 'Analog Design Intern → FTE', ctc: 22, branch: 'ECE', year: 2022, isVerified: true },
    { company: 'Flipkart', role: 'SDE-II', ctc: 40, branch: 'CSE', year: 2023, isVerified: false },
  ],
  // IITK
  [
    { company: 'Microsoft', role: 'Software Engineer', ctc: 42, branch: 'CSE', year: 2023, isVerified: true },
    { company: 'D.E. Shaw', role: 'Quantitative Analyst', ctc: 55, branch: 'Mathematics', year: 2023, isVerified: true },
    { company: 'Adobe', role: 'MTS', ctc: 30, branch: 'CSE', year: 2022, isVerified: false },
  ],
  // IITKgp
  [
    { company: 'TCS Research', role: 'Research Engineer', ctc: 18, branch: 'CSE', year: 2023, isVerified: true },
    { company: 'ONGC', role: 'Drilling Engineer', ctc: 14, branch: 'Mining', year: 2022, isVerified: true },
    { company: 'Wipro', role: 'Project Engineer', ctc: 12, branch: 'ECE', year: 2023, isVerified: false },
  ],
  // BITS
  [
    { company: 'Razorpay', role: 'Backend Engineer', ctc: 22, branch: 'CSE', year: 2023, isVerified: true },
    { company: 'CRED', role: 'Product Engineer', ctc: 24, branch: 'CSE', year: 2023, isVerified: true },
    { company: 'Nutanix', role: 'Software Engineer', ctc: 28, branch: 'ECE', year: 2022, isVerified: false },
  ],
  // NITT
  [
    { company: 'Amazon', role: 'SDE-I', ctc: 25, branch: 'CSE', year: 2023, isVerified: true },
    { company: 'Capgemini', role: 'Analyst', ctc: 8, branch: 'ECE', year: 2022, isVerified: true },
    { company: 'TCS', role: 'System Engineer', ctc: 7, branch: 'Metallurgy', year: 2023, isVerified: false },
  ],
  // NITW
  [
    { company: 'Cognizant', role: 'Programmer Analyst', ctc: 8, branch: 'CSE', year: 2023, isVerified: true },
    { company: 'Tech Mahindra', role: 'Associate Software Engineer', ctc: 7, branch: 'ECE', year: 2022, isVerified: true },
    { company: 'HCL Technologies', role: 'Software Engineer', ctc: 6.5, branch: 'ME', year: 2023, isVerified: false },
  ],
  // IIITH
  [
    { company: 'Google', role: 'Research Scientist Intern → FTE', ctc: 52, branch: 'CSE', year: 2023, isVerified: true },
    { company: 'Microsoft Research', role: 'Research SDE', ctc: 35, branch: 'CSE', year: 2022, isVerified: true },
    { company: 'Oracle', role: 'Software Developer', ctc: 20, branch: 'ECE', year: 2023, isVerified: false },
  ],
  // IISc
  [
    { company: 'Google Research', role: 'Research Scientist', ctc: 65, branch: 'Computer Science', year: 2023, isVerified: true },
    { company: 'ISRO', role: 'Scientist/Engineer SC', ctc: 12, branch: 'Engineering', year: 2022, isVerified: true },
    { company: 'Intel Research', role: 'Senior Research Engineer', ctc: 40, branch: 'Physics', year: 2023, isVerified: false },
  ],
];

// 3 questions per college (with 1-2 answers each)
const QUESTIONS_TEMPLATE = [
  // IITB
  [
    { question: 'How is the WiFi connectivity in IITB hostels? Is it fast enough for online classes and gaming?',
      answers: [
        { text: 'WiFi at IITB hostels has improved massively since 2022 — the new fiber backbone supports 100Mbps easily. Each room gets a dedicated port and the wireless coverage is decent in common areas. Gaming is fine; streaming is no issue. Late night speeds are best.', upvotes: 24 },
        { text: 'Depends heavily on the hostel. Hostel 5 and 13 have the best connectivity after the upgrade. Older hostels like H1 and H2 can still be patchy. Get a LAN cable as backup.', upvotes: 18 },
      ] },
    { question: 'What is the process to get into research labs at IITB as a second year CSE student?',
      answers: [
        { text: 'Email professors directly with your resume and a genuine statement of interest in their specific research area. Reference their recent papers. Most IITB profs respond within a week if you write a tailored email. The SUPro portal also lists formal research positions each semester.', upvotes: 31 },
      ] },
    { question: 'Is it possible to switch from ECE to CSE at IITB after first year? What is the process?',
      answers: [
        { text: 'Branch change is possible after first year based on CGPA ranking. For ECE to CSE the cutoff is typically 9.0+ CPI since CSE is the most demanded. The competition is intense — around 20-30 students vie for 5-6 seats. Focus entirely on first semester grades if this is your goal.', upvotes: 42 },
        { text: 'My advice: don\'t base your entire first year happiness on a branch change hope. Love for CSE or ECE should drive you, not GATE/package anxiety. If you don\'t make the cutoff, ECE at IITB is still a phenomenal programme.', upvotes: 15 },
      ] },
  ],
  // IITD
  [
    { question: 'What is the placement scenario for CSE at IIT Delhi compared to IITB? Any significant differences?',
      answers: [
        { text: 'The top companies — Google, Amazon, Microsoft — visit both campuses on Day 1 and the offers are comparable. IITD tends to get more Delhi NCR startups and fintech firms while IITB gets more Mumbai finance and Pune/Bangalore product companies. Overall the top-10 percentile placements are essentially identical between the two.', upvotes: 38 },
      ] },
    { question: 'How good is the startup ecosystem at IIT Delhi? Are there incubation facilities for students?',
      answers: [
        { text: 'IITD has the Foundation for Innovation and Technology Transfer (FITT) which provides seed funding, mentorship, and lab access for student startups. Several notable companies including Innov8 co-working emerged from this incubator. The Delhi NCR investor ecosystem is also accessible unlike more remote IIT campuses.', upvotes: 27 },
        { text: 'The E-Cell at IITD is one of the most active in the country. Regular speaker events, hackathons, and startup pitches happen throughout the year. The proximity to Delhi\'s growing startup scene, especially in Gurugram, is a real advantage.', upvotes: 19 },
      ] },
    { question: 'What hostel facilities are like at IIT Delhi for first year students? Are rooms single or shared?',
      answers: [
        { text: 'First year students are typically placed in shared double-occupancy rooms in hostels like Zanskar or Karakoram. The rooms are functional with beds, desks, and wardrobes. The common bathrooms are shared per floor. From second year you can apply for single rooms based on CGPA. The hostel mess food is average — most students supplement with the campus dhaba.', upvotes: 22 },
      ] },
  ],
  // IITM
  [
    { question: 'How safe is the IITM campus at night? I have heard there is wildlife inside the campus forest.',
      answers: [
        { text: 'The IITM campus has a protected forest inside with spotted deer, peacocks, and occasionally a few snakes near the forest edges. Security guards patrol the outer perimeter. The deer are completely harmless and actually quite used to students. Just avoid the forest paths after dark and you will be completely fine.', upvotes: 29 },
        { text: 'The campus is very safe by Indian standards. The bigger wildlife concern is the occasional monkey that raids food left outside. Keep your hostel room closed. The forest adds a unique atmosphere to the campus that makes night walks genuinely pleasant.', upvotes: 18 },
      ] },
    { question: 'What is the CSE placement scenario at IITM for 2024 batch? Any new companies visiting?',
      answers: [
        { text: 'IITM CSE placements for 2024 were outstanding. Several international offers from Google USA, Jane Street, and Optiver. Domestic packages from Flipkart, Amazon India, and Swiggy were competitive. The AI/ML specialization students had multiple dedicated hiring tracks from companies like Sarvam AI and similar deep tech firms. Median package was approximately 25 LPA.', upvotes: 45 },
      ] },
    { question: 'How is the MTech programme at IITM in CSE versus doing a direct PhD? Which is better for a research career?',
      answers: [
        { text: 'Direct PhD is better if you have strong research aptitude and a clear research direction. MTech at IITM is great if you want to explore research areas before committing, or if your undergrad institute was not top-tier and you want to establish credibility first. The MTech-PhD combined programme is the sweet spot if you are unsure.', upvotes: 33 },
      ] },
  ],
  // IITK
  [
    { question: 'Is Kanpur a good city to live in for 4 years? How is the social life outside campus?',
      answers: [
        { text: 'Kanpur city itself is not particularly attractive but the IITK campus is enormous and self-contained. The Social Quad, the Gymkhana clubs, the sports fields — there is enough to do on campus. For off-campus trips, Lucknow is 90 minutes away and Agra is reachable for the occasional weekend trip. The winters in Kanpur are cold and foggy which takes adjustment.', upvotes: 31 },
        { text: 'City life is limited compared to Mumbai or Delhi IITs. But the campus culture makes up for it — the freedom culture at IITK is unmatched. Students regularly form bands, film groups, and reading circles. The intellectual environment is stimulating even if the city is dull.', upvotes: 24 },
      ] },
    { question: 'How difficult is the IITK CSE curriculum compared to IITB and IITM? Is the grading lenient?',
      answers: [
        { text: 'IITK CSE curriculum is theory-heavy and notoriously rigorous. The algorithms course and theory of computation are both more demanding than equivalent courses at most other IITs. Grading follows a relative curve but the absolute difficulty means a 7 CGPA at IITK is quite respectable. Do not expect easy grades here.', upvotes: 28 },
      ] },
    { question: 'What is the process for getting an international internship from IITK in second or third year?',
      answers: [
        { text: 'IITK has exchange agreements with universities in Germany, Japan, Singapore, and the USA. The Office of International Relations manages these. Most international research internships go through MITACS, DAAD, and individual prof-to-prof connections made by your own IITK advisor. A strong CPI above 8.5 and research publications or projects significantly help.', upvotes: 35 },
        { text: 'Cold emailing foreign professors directly is the most reliable route. Make sure your research profile is visible — a GitHub portfolio and arXiv preprint can make a huge difference. IITK brand name opens doors internationally.', upvotes: 22 },
      ] },
  ],
  // IITKgp
  [
    { question: 'What makes IIT Kharagpur unique compared to other IITs? Is the campus really as big as people say?',
      answers: [
        { text: 'The campus is 2,100 acres — the second largest campus in Asia. It has its own hospital, schools, market, post office, and even a railway halt station. This self-sufficiency creates a unique bubble life that is unlike any other IIT. The sheer diversity of disciplines and the volume of student activities enabled by the scale is extraordinary.', upvotes: 41 },
      ] },
    { question: 'How is the BTech Mining Engineering programme at IITKgp in terms of placements and career options?',
      answers: [
        { text: 'Mining gets SAIL, ONGC, Coal India, and NMDC on campus. PSU packages are around 10-14 LPA but come with job security and perks. Many mining graduates go for GATE and switch to higher-paying disciplines or MBA. The department also has some students placed in metal trading firms. It is not a glamour placement profile but stable if you choose wisely.', upvotes: 26 },
        { text: 'The fieldwork component of Mining at IITKgp is genuinely unique — you get hands-on experience at actual mines in Jharkhand which most engineering students will never get. Whether that excites or bores you says everything about whether this branch is right for you.', upvotes: 19 },
      ] },
    { question: 'Is the Gymkhana at IIT Kharagpur good? What kind of student clubs and activities are there?',
      answers: [
        { text: 'The Technology Students\' Gymkhana at IITKgp is one of the most active in India. Over 100 societies and clubs covering robotics, astronomy, dramatics, fine arts, debate, music, and dozens more. Spring Fest (cultural) and Kshitij (tech) are both nationally recognized annual events. The sheer scale of campus activities is a major selling point of IITKgp.', upvotes: 38 },
      ] },
  ],
  // BITS
  [
    { question: 'How does the Practice School programme at BITS Pilani actually work? Is it mandatory?',
      answers: [
        { text: 'Practice School (PS) is a core differentiator of BITS education. PS-1 happens after your second year — typically a 2-month station at a company or research lab. PS-2 in final year is a full semester (5.5 months) at an industry partner. It is essentially a paid working internship and is mandatory for all students. The exposure to real industry problems before graduation is invaluable.', upvotes: 52 },
        { text: 'PS-2 is effectively your pre-placement internship for many students. A significant number of graduates receive their final job offers through PS-2 conversions. The system works extremely well — companies appreciate BITS graduates\' practical orientation compared to other engineering colleges.', upvotes: 34 },
      ] },
    { question: 'Is BITS Pilani better than IIT Bombay for entrepreneurship and startup career paths?',
      answers: [
        { text: 'For entrepreneurship specifically, BITS has a cultural edge. The startup alumni density is remarkable — Sridhar Vembu (Zoho), Nilekani networks, CRED\'s Kunal Shah are all connected to BITS alumni networks. The no-nonsense practical curriculum and PS system produce execution-focused graduates. IITB is better for research-to-startup paths while BITS excels in product and execution focused startups.', upvotes: 29 },
      ] },
    { question: 'What is Pilani town like? Will I feel isolated living there for 4 years?',
      answers: [
        { text: 'Pilani is genuinely isolated — it is a small Rajasthan town with essentially no nightlife or urban amenities within 200km. However the campus is designed to be self-sufficient with multiple food courts, sports facilities, and a vibrant social calendar. Most students adjust within the first month. The desert landscape is actually beautiful, especially winter evenings. The isolation forces you to engage deeply with campus life which many find enriching.', upvotes: 33 },
        { text: 'Come prepared for the isolation. If you need city access regularly, BITS Goa or Hyderabad campuses might suit you better. That said, the Pilani main campus culture and alumni network are second to none. The trade-off is worth it for most people in hindsight.', upvotes: 21 },
      ] },
  ],
  // NITT
  [
    { question: 'What is the CSE placement scenario at NITT? How does it compare to IITs?',
      answers: [
        { text: 'NITT CSE placements are excellent for an NIT — Amazon, Cisco, and Freshworks hire here. The median package hovers around 12-15 LPA with top offers reaching 40+ LPA through off-campus for well-prepared students. Compared to IITs the brand recognition is lower but the cost-quality ratio is outstanding. Many NITT CSE grads end up at the same companies as IIT grads through off-campus routes.', upvotes: 38 },
        { text: 'Self-preparation matters enormously at NITT. The college facilitates placements but the top roles are earned through personal competitive programming and project work. NITT students who put in the effort consistently outperform graduates from higher-ranked colleges.', upvotes: 24 },
      ] },
    { question: 'How is the hostel food at NIT Trichy? Is it edible?',
      answers: [
        { text: 'The mess food at NITT varies by hostel. Megdoot mess is generally considered the best for South Indian food. The quality is functional rather than exciting — rice, sambar, curry, curd are the staples. Weekend special meals are better. Many students supplement with the campus Nescafe, canteens, and the nearby Thillai Nagar market for restaurant food.', upvotes: 19 },
      ] },
    { question: 'Is it worth choosing NITT ECE over IITM CSE if given both options? What are the career trade-offs?',
      answers: [
        { text: 'IITM CSE is the clear choice for long-term research, top product company, and international career paths. The brand, research environment, and alumni network are significantly stronger. NITT ECE is a great choice if your IITM option is ME or a less-preferred branch — comparing like-for-like departments is more meaningful. CSE at any IIT beats ECE at any NIT for software career outcomes in India.', upvotes: 47 },
      ] },
  ],
  // NITW
  [
    { question: 'How is the WiFi at NITW hostels? I heard it is very slow.',
      answers: [
        { text: 'The WiFi situation at NITW has improved since 2022 but is still inconsistent. Peak usage hours (8-11pm) can bring speeds down significantly. Most serious students use a personal mobile data plan as a backup. The LAN ports in rooms are more reliable. The college is aware of the issue and upgrades are supposedly in progress.', upvotes: 21 },
      ] },
    { question: 'What are the best opportunities at NITW for students interested in core engineering rather than IT?',
      answers: [
        { text: 'Core engineering is actually NITW\'s stronger suit compared to most NITs. Metallurgy gets Steel Authority and Vizag Steel visits. ME gets BHEL and Tata Motors. Chemical has HPCL and BPCL visits. The pay is more modest than software but the core technical roles are genuinely interesting. GATE scores from NITW graduates consistently rank among the top NITs which opens PSU and IIT MTech doors.', upvotes: 26 },
        { text: 'DRDO has a dedicated hiring partnership with NITW for select departments which is a unique advantage. Students interested in defence R&D should actively explore this route from second year itself.', upvotes: 17 },
      ] },
    { question: 'Is NITW safer for students from other states compared to regional NITs in terms of language barrier?',
      answers: [
        { text: 'NITW is 45% outside-state students which creates a naturally inclusive environment. English is the primary academic language and most students are comfortable in Hindi too. The Hyderabad connection means the cultural mix is richer than isolated campus NITs. Students from North India adapt quickly here without significant cultural friction.', upvotes: 23 },
      ] },
  ],
  // IIITH
  [
    { question: 'How is the research culture at IIIT Hyderabad compared to IITs? Is it actually comparable?',
      answers: [
        { text: 'For AI, CV, NLP, and speech research specifically, IIIT-H research output is comparable to the top IITs and arguably exceeds some of them in publication quality per faculty. The research-first culture means even undergrads are expected to contribute to lab work. Multiple IIIT-H papers appear at top-tier venues like NeurIPS, CVPR, and ACL regularly.', upvotes: 41 },
        { text: 'The key difference from IITs is focus — IIIT-H goes very deep in CS while IITs cover broader engineering disciplines. If CS research is your goal, IIIT-H is elite. For other disciplines you need an IIT.', upvotes: 28 },
      ] },
    { question: 'What is the fee structure at IIIT Hyderabad and is it worth the investment?',
      answers: [
        { text: 'The annual fee at IIIT-H is approximately 2.5-3 lakh which is slightly higher than NITs but lower than private colleges. Given the placement outcomes — multiple 50L+ packages from Google and Microsoft — the ROI is outstanding. Scholarship opportunities exist for economically weaker sections and merit-based fee waivers are available.', upvotes: 35 },
      ] },
    { question: 'How is the campus life at IIIT Hyderabad? Is there any social life beyond academics?',
      answers: [
        { text: 'IIIT-H is academically intense and that does dominate campus culture. However the college has active clubs for music, dance, robotics, and quizzing. The Felicity cultural fest is a highlight of the academic year. The Hyderabad location is a huge advantage — the city is absolutely accessible for weekend outings, restaurants, and cultural experiences. The compact campus creates a tight-knit student community.', upvotes: 29 },
        { text: 'Expect to spend a lot of time in the lab. The culture rewards academic seriousness but the friendships you build in that environment are lasting. The small batch size means everyone knows everyone which is both cosy and somewhat claustrophobic.', upvotes: 16 },
      ] },
  ],
  // IISc
  [
    { question: 'Is the UG Research programme at IISc (BS degree) better than IIT undergrad for a research career?',
      answers: [
        { text: 'For a pure research career the IISc BS Research programme is arguably the best UG route in India. The immersion in a research-only institution, the access to world-class labs, and the PhD pipeline are unmatched. However if you are unsure about research as a career the IIT UG programme gives you more flexibility to explore industry options. Choose IISc BS only if research is your definitive calling.', upvotes: 52 },
        { text: 'The IISc brand in the global academic community is extraordinary — arguably stronger than all IITs for research purposes. A BS from IISc with strong research letters opens doors at MIT, Caltech, and Oxbridge that even IIT brand sometimes cannot match.', upvotes: 39 },
      ] },
    { question: 'What is the social life like at IISc Bangalore? Is it very isolated given it is a research institute?',
      answers: [
        { text: 'IISc campus in the middle of Bangalore is a green oasis but definitely more serious and quiet than a typical engineering college. Most students are PhD students which creates an older, more research-focused social environment. However being in Bangalore means restaurants, music venues, parks, and the startup scene are all easily accessible on weekends. Indiranagar, Koramangala, and Malleswaram are all close by.', upvotes: 34 },
      ] },
    { question: 'How does IISc placement compare to IITs for industry jobs? Is it hard to get a product company job from IISc?',
      answers: [
        { text: 'IISc placements for UG students have been improving but the culture is still primarily research and PhD oriented. Google Research, IBM Research, and Intel Labs visit for research-oriented roles. For mainstream software product roles, proactive off-campus applications are needed. The IISc brand opens doors but placement infrastructure is not as polished as IIT BTech programmes which have decades of corporate placement traditions.', upvotes: 43 },
        { text: 'Most IISc BS graduates I know either went for international PhDs or are at research labs. Those who wanted industry went to startups where the research depth gave them immediate credibility. It is a different path than IIT placements — choose accordingly.', upvotes: 31 },
      ] },
  ],
];

// ─── Main Seed Function ───────────────────────────────────────────────────────
function sampleId(...parts) {
  const hex = createHash('sha256').update(parts.join(':')).digest('hex').slice(0, 24);
  return new mongoose.Types.ObjectId(hex);
}

async function saveSamples(Model, documents) {
  if (!documents.length) return;
  await Model.bulkWrite(documents.map((document) => ({
    updateOne: {
      filter: { _id: document._id },
      update: { $setOnInsert: document },
      upsert: true,
      timestamps: false,
    },
  })));
}

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    await Promise.all([College, Review, Professor, Placement, Question].map((model) => model.init()));

    for (const [index, data] of COLLEGES_DATA.entries()) {
      const reviews = REVIEWS_DATA[index];
      const college = await College.findOneAndUpdate(
        { name: data.name },
        { $setOnInsert: { ...data, reviewCount: reviews.length } },
        { upsert: true, returnDocument: 'after', timestamps: false }
      );
      const collegeId = college._id;
      const row = (kind, index) => ({
        _id: sampleId(kind, collegeId, index),
        college: collegeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await Promise.all([
        saveSamples(Review, reviews.map(({ upvotes, downvotes, ...review }, i) => ({
          ...row('review', i), ...review, author: sampleId('sample-author', collegeId, i),
          isActive: true, isVerified: false, isSample: true,
        }))),
        saveSamples(Placement, PLACEMENTS_TEMPLATE[index].map(({ ctc, year, ...placement }, i) => ({
          ...row('placement', i), ...placement, ctcLPA: ctc, batch: year,
          submittedBy: sampleId('sample-placement', collegeId, i), isVerified: false, isSample: true,
        }))),
        saveSamples(Professor, PROFESSORS_TEMPLATE[index].map(({ tags, ratings, ...professor }, i) => ({
          ...row('professor', i), ...professor,
          ratings: { overall: ratings.overall, teachingClarity: ratings.clarity, accessibility: ratings.helpfulness, gradingFairness: ratings.fairness },
          tags: (tags || []).map((tag) => ({ tag })),
        }))),
        saveSamples(Question, QUESTIONS_TEMPLATE[index].map(({ question, answers }, i) => ({
          ...row('question', i), text: question, askedBy: sampleId('sample-question', collegeId, i),
          answers: answers.map(({ text, upvotes }) => ({ text, helpfulVotes: upvotes })),
        }))),
      ]);
    }
    console.log(`Demo data ready for ${COLLEGES_DATA.length} colleges.`);
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error('Could not seed sample data:', error.message);
  process.exitCode = 1;
});
