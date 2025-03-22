// middleware/upload.js

const multer = require("multer");
const { BadRequestError } = require("../errors");

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


module.exports = {
  uploadImages: upload.fields([
    { name: "Gym_image", maxCount: 1 },
  ]),
};
