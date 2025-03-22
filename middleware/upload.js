// middleware/upload.js

let multer;
try {
  multer = require("multer");
} catch (error) {
  console.error(
    "Multer package is missing. Please install it using 'npm install multer'"
  );
  multer = null;
}

const { BadRequestError } = require("../errors");

// Fallback middleware in case multer is not available
const fallbackUploadMiddleware = (req, res, next) => {
  console.error(
    "File upload is not available because the multer package is not installed"
  );
  next();
};

// Only set up multer if the package is available
let uploadImages = fallbackUploadMiddleware;

if (multer) {
  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new BadRequestError("Only image files are allowed!"), false);
    }
  };

  // Configure upload
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit (Cloudflare's limit)
    },
  });

  uploadImages = upload.fields([{ name: "Gym_image", maxCount: 1 }]);
}

module.exports = {
  uploadImages,
};
