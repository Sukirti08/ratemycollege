const multer = require('multer');
const { uploadToCloudinary } = require('../config/cloudinary');

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Use memory storage — buffers are passed to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Unsupported file format. Accepted: JPEG, PNG, PDF'), {
        code: 'UNSUPPORTED_FORMAT',
      }),
      false
    );
  }
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

/**
 * uploadSingle — multer middleware that expects a single file field named 'offerLetter'.
 */
const uploadSingle = multerInstance.single('offerLetter');

/**
 * processUpload — async middleware.
 * Reads req.file buffer, uploads to Cloudinary, attaches result to req.uploadedFile.
 * Must be used AFTER uploadSingle.
 */
const processUpload = async (req, res, next) => {
  // No file attached — skip silently (caller decides if required)
  if (!req.file) {
    return next();
  }

  try {
    const folder = req.uploadFolder || 'ratemycollege/uploads';
    const result = await uploadToCloudinary(req.file.buffer, folder);
    req.uploadedFile = result; // { url, publicId }
    next();
  } catch (error) {
    console.error('[processUpload] Cloudinary error:', error.message);
    return res.status(500).json({ success: false, message: 'File upload failed. Please try again.' });
  }
};

/**
 * Wrap uploadSingle so multer errors are caught and returned as JSON.
 */
const uploadSingleWithErrorHandling = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'UNSUPPORTED_FORMAT') {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
      });
    }

    // Generic multer error
    return res.status(400).json({ success: false, message: err.message });
  });
};

module.exports = {
  uploadSingle: uploadSingleWithErrorHandling,
  processUpload,
};
