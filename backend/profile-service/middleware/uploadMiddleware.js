const multer = require('multer');
const path = require('path');
const logger = require('../config/logger');

// Define file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to allow only specific document types
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

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10 MB file size limit
  },
  fileFilter: fileFilter,
});

// Create the middleware instance
const uploadSingle = upload.single('resume'); // 'resume' is the field name

//
// --- THIS IS THE CORRECTED FUNCTION ---
// It properly calls the multer middleware
//
exports.uploadResume = (req, res, next) => {
  uploadSingle(req, res, (err) => { 
    if (err instanceof multer.MulterError) {
      // A Multer error occurred (e.g., file size limit)
      logger.warn(`Multer error: ${err.message}`);
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // An unknown error occurred (e.g., file type not allowed)
      logger.warn(`File upload error: ${err.message}`);
      return res.status(400).json({ message: err.message });
    }
    
    // Everything went fine, file is in req.file (or undefined if no file)
    next();
  });
};