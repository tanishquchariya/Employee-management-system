import multer from "multer";

// Keeps the uploaded image in memory (req.file.buffer); the controller then sends
// it to ImageKit (or local disk). Field name must be "profileImage".
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      const error = new Error("Only image files are allowed.");
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  },
});

export default upload;
