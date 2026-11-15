const express = require('express');
const router = express.Router();
const { validatePlacement, submitPlacement, getPlacementStats } = require('../controllers/placementController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSingle, processUpload } = require('../middleware/uploadMiddleware');

router.post('/', protect, uploadSingle, validatePlacement, processUpload, submitPlacement);
router.get('/college/:id', getPlacementStats);

module.exports = router;