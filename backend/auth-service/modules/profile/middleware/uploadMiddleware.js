const multer = require('multer');
const path = require('path');
const logger = require('../../../config/logger');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type not supported. Only PDF, DOC, or DOCX are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10,
  },
  fileFilter: fileFilter,
});

const uploadSingle = upload.single('resume');

exports.uploadResume = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      logger.warn(`Multer error: ${err.message}`);
      return res.status(400).json({ message: err.message });
    } else if (err) {
      logger.warn(`File upload error: ${err.message}`);
      return res.status(400).json({ message: err.message });
    }

    next();
  });
};
