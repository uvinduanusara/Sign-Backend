import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Ensure upload directories exist
const createUploadDirs = () => {
  const uploadDir = path.join(process.cwd(), 'uploads');
  const learningMaterialsDir = path.join(uploadDir, 'learning-materials');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  if (!fs.existsSync(learningMaterialsDir)) {
    fs.mkdirSync(learningMaterialsDir, { recursive: true });
  }
};

// Initialize directories
createUploadDirs();

// Configure storage for learning materials
const learningMaterialStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/learning-materials/');
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter function
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer for learning materials
export const uploadLearningMaterialImages = multer({
  storage: learningMaterialStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  }
}).any(); // Accept files from any field name

// Middleware to handle upload errors
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 images allowed.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed!'
    });
  }
  
  next(error);
};

// Utility function to delete old images
export const deleteImageFile = (filename) => {
  try {
    const filePath = path.join(process.cwd(), 'uploads', 'learning-materials', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted image file: ${filename}`);
    }
  } catch (error) {
    console.error(`Error deleting image file ${filename}:`, error);
  }
};