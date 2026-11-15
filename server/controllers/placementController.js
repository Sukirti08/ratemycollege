const PlacementData = require('../models/PlacementData');
const College = require('../models/College');

const validatePlacement = async (req, res, next) => {
  const { collegeId, company, role, ctcLPA, batch, branch } = req.body;
  const amount = Number(ctcLPA);
  const year = Number(batch);
  if (!College.base.isObjectIdOrHexString(collegeId) ||
      ![company, role, branch].every((field) => typeof field === 'string' && field.trim()) ||
      !Number.isFinite(amount) || amount < 1 || amount > 500 ||
      !Number.isInteger(year) || year < 1900 || year > 2100) {
    return res.status(400).json({ message: 'Enter a college, company, role, valid CTC, branch and batch year.' });
  }
  if (!(await College.exists({ _id: collegeId }))) {
    return res.status(404).json({ message: 'College not found.' });
  }
  req.placementInput = {
    college: collegeId, submittedBy: req.user._id, company, role, ctcLPA: amount, batch: year, branch,
  };
  next();
};

const submitPlacement = async (req, res) => {
  try {
    const placement = await PlacementData.create({
      ...req.placementInput,
      offerLetterUrl: req.uploadedFile?.url,
      offerLetterPublicId: req.uploadedFile?.publicId,
      isVerified: false,
    });

    const [stats] = await PlacementData.aggregate([
      { $match: { college: placement.college, isSample: { $ne: true } } },
      { $group: { _id: null, average: { $avg: '$ctcLPA' } } },
    ]);
    if (stats) await College.findByIdAndUpdate(placement.college, { actualAvgPackage: Number(stats.average.toFixed(2)) });
    return res.status(201).json({ _id: placement._id, isVerified: false });
  } catch (err) {
    console.error('Placement submission failed:', err.name);
    return res.status(500).json({ message: 'Could not submit the placement.' });
  }
};

// GET /placements/college/:id
const getPlacementStats = async (req, res) => {
  try {
    const { id: collegeId } = req.params;

    const allPlacements = await PlacementData.find({ college: collegeId });
    if (!allPlacements.length) {
      return res.status(200).json({ message: 'No placement data found', stats: null });
    }

    const ctcValues = allPlacements.map((p) => p.ctcLPA).sort((a, b) => a - b);
    const verifiedPlacements = allPlacements.filter((p) => p.isVerified);
    const verifiedCTC = verifiedPlacements.map((p) => p.ctcLPA).sort((a, b) => a - b);

    const median = (arr) => {
      if (!arr.length) return 0;
      const mid = Math.floor(arr.length / 2);
      return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    };

    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    // Group by company
    const companyMap = Object.create(null);
    for (const p of allPlacements) {
      companyMap[p.company] = (companyMap[p.company] || 0) + 1;
    }
    const topCompanies = Object.entries(companyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([company, count]) => ({ company, count }));

    // Group by branch: avg CTC
    const branchMap = Object.create(null);
    for (const p of allPlacements) {
      if (!branchMap[p.branch]) branchMap[p.branch] = [];
      branchMap[p.branch].push(p.ctcLPA);
    }
    const branchStats = Object.entries(branchMap).map(([branch, ctcs]) => ({
      branch,
      avgCTC: parseFloat(avg(ctcs).toFixed(2)),
      count: ctcs.length,
    }));

    // Recent records (latest 10, no submittedBy)
    const recentPlacements = await PlacementData.find({ college: collegeId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('company role ctcLPA batch branch isVerified isSample createdAt');

    return res.status(200).json({
      overall: {
        avg: parseFloat(avg(ctcValues).toFixed(2)),
        median: parseFloat(median(ctcValues).toFixed(2)),
        max: ctcValues[ctcValues.length - 1],
        min: ctcValues[0],
        count: ctcValues.length,
      },
      verified: {
        avg: parseFloat(avg(verifiedCTC).toFixed(2)),
        median: parseFloat(median(verifiedCTC).toFixed(2)),
        max: verifiedCTC.length ? verifiedCTC[verifiedCTC.length - 1] : null,
        min: verifiedCTC.length ? verifiedCTC[0] : null,
        count: verifiedCTC.length,
      },
      topCompanies,
      branchStats,
      recentPlacements,
    });
  } catch (err) {
    console.error('getPlacementStats error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { validatePlacement, submitPlacement, getPlacementStats };
