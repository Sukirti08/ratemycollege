const College = require('../models/College');
const Review = require('../models/Review'); // assumed model for college reviews

// GET /trends/
const getTrends = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

    // Trending colleges by weeklyViewCount
    const trending = await College.find()
      .sort({ weeklyViewCount: -1 })
      .limit(5)
      .select('name shortName weeklyViewCount ratings');

    // Recently reviewed: colleges with most reviews in last 7 days
    const recentlyReviewed = await Review.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$college', reviewCount: { $sum: 1 } } },
      { $sort: { reviewCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'colleges',
          localField: '_id',
          foreignField: '_id',
          as: 'college',
        },
      },
      { $unwind: '$college' },
      {
        $project: {
          reviewCount: 1,
          'college.name': 1,
          'college.shortName': 1,
          'college._id': 1,
        },
      },
    ]);

    // Sentiment trends for each trending college
    const sentimentTrends = await Promise.all(
      trending.map(async (college) => {
        const currentReviews = await Review.find({
          college: college._id,
          createdAt: { $gte: thirtyDaysAgo },
        }).select('sentimentScore');

        const previousReviews = await Review.find({
          college: college._id,
          createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
        }).select('sentimentScore');

        const avgSentiment = (reviews) => {
          if (!reviews.length) return null;
          return reviews.reduce((sum, r) => sum + (r.sentimentScore || 0), 0) / reviews.length;
        };

        const currentSentiment = avgSentiment(currentReviews);
        const previousSentiment = avgSentiment(previousReviews);
        const change =
          currentSentiment != null && previousSentiment != null
            ? parseFloat((currentSentiment - previousSentiment).toFixed(2))
            : null;

        return {
          college: { _id: college._id, name: college.name, shortName: college.shortName },
          currentSentiment,
          previousSentiment,
          change,
        };
      })
    );

    return res.status(200).json({ trending, recentlyReviewed, sentimentTrends });
  } catch (err) {
    console.error('getTrends error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /trends/roast/:collegeId
const getRoastCard = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const college = await College.findById(collegeId);
    if (!college) return res.status(404).json({ message: 'College not found' });

    const ratings = college.ratings || {};
    const ratingEntries = Object.entries(ratings).filter(([k]) => k !== 'overall');

    if (!ratingEntries.length) {
      return res.status(400).json({ message: 'No ratings data available for roast.' });
    }

    ratingEntries.sort((a, b) => b[1] - a[1]);
    const [bestDim, bestStat] = ratingEntries[0];
    const [worstDim, worstStat] = ratingEntries[ratingEntries.length - 1];

    const claimed = college.claimedAvgPackage || 0;
    const actual = college.actualAvgPackage || 0;
    const packageGap = claimed - actual;

    let roastLine;
    if (packageGap > 3) {
      roastLine = `Claims ${claimed} LPA avg. Students report ${actual} LPA. The gap is doing a PhD.`;
    } else if (worstDim === 'hostel') {
      roastLine = `${bestStat} in placements, ${worstStat} in hostel. Sleep on it.`;
    } else if (worstDim === 'infrastructure') {
      roastLine = `${bestStat} research reputation, WiFi last seen in 2019.`;
    } else {
      roastLine = `${bestStat} in ${bestDim}. ${worstStat} in ${worstDim}. At least it's honest.`;
    }

    return res.status(200).json({
      collegeName: college.name,
      shortName: college.shortName,
      bestDim,
      bestStat,
      worstDim,
      worstStat,
      packageGap: parseFloat(packageGap.toFixed(2)),
      roastLine,
      claimedAvgPackage: claimed,
      actualAvgPackage: actual,
    });
  } catch (err) {
    console.error('getRoastCard error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /trends/weekly-insight
const getWeeklyInsight = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const topColleges = await Review.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$college', reviewCount: { $sum: 1 } } },
      { $sort: { reviewCount: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'colleges',
          localField: '_id',
          foreignField: '_id',
          as: 'college',
        },
      },
      { $unwind: '$college' },
      {
        $project: {
          reviewCount: 1,
          'college.name': 1,
          'college.shortName': 1,
          'college.ratings': 1,
        },
      },
    ]);

    let insight = 'Not enough data this week to generate an insight.';

    if (topColleges.length >= 2) {
      const c1 = topColleges[0].college;
      const c2 = topColleges[1].college;
      const c1PlacementScore = c1.ratings?.placements?.toFixed(1) || 'N/A';
      const c2TeachingScore = c2.ratings?.teaching?.toFixed(1) || 'N/A';
      insight = `This week, ${c1.shortName || c1.name} leads in placements with ${c1PlacementScore}★ while ${c2.shortName || c2.name} tops teaching with ${c2TeachingScore}★.`;
    }

    return res.status(200).json({ insight, generatedAt: new Date() });
  } catch (err) {
    console.error('getWeeklyInsight error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getTrends, getRoastCard, getWeeklyInsight };
