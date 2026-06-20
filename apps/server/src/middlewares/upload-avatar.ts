import multer from "multer";

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp"
]);

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Envie uma imagem PNG, JPG, JPEG ou WEBP."));
      return;
    }

    callback(null, true);
  }
});
