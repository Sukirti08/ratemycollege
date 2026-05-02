const PlacementData = require('../models/PlacementData');
const College = require('../models/College');
const User = require('../models/User');

// POST /placements/
const submitPlacement = async (req, res) => {
  try {
    const { company, role, ctcLPA, batch, branch } = req.body;
    const userId = req.user._id;

    const placementPayload = {
      college: req.body.collegeId,
      submittedBy: userId,
      company,
      role,
      ctcLPA: parseFloat(ctcLPA),
      batch,
      branch,
      isVerified: false,
    };

    if (req.uploadedFile) {
      placementPayload.offerLetter = req.uploadedFile.url;
      placementPayload.offerLetterPublicId = req.uploadedFile.publicId;
      placementPayload.isVerified = true;
    }

    const placement = await PlacementData.create(placementPayload);

    // Recalculate college actualAvgPackage
    const allPlacements = await PlacementData.find({ college: placementPayload.college });
    const avgPackage =
      allPlacements.reduce((sum, p) => sum + p.ctcLPA, 0) / allPlacements.length;

    await College.findByIdAndUpdate(placementPayload.college, {
      actualAvgPackage: parseFloat(avgPackage.toFixed(2)),
    });

    // Karma update
    const karmaBonus = placement.isVerified ? 5 : 2;
    await User.findByIdAndUpdate(userId, { $inc: { karma: karmaBonus } });

    return res.status(201).json(placement);
  } catch (err) {
    console.error('submitPlacement error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
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
    const companyMap = {};
    for (const p of allPlacements) {
      companyMap[p.company] = (companyMap[p.company] || 0) + 1;
    }
    const topCompanies = Object.entries(companyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([company, count]) => ({ company, count }));

    // Group by branch: avg CTC
    const branchMap = {};
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
      .select('-submittedBy');

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

module.exports = { submitPlacement, getPlacementStats };
