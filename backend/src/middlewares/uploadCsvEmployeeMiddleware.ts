import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "public/uploads/csvEmployee";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "csvEmployee-" + uniqueSuffix + ext);
  },
});

// validasi file
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = /csv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === "text/csv" || file.mimetype === "application/vnd.ms-excel";

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file CSV yang diperbolehkan!"));
  }
};

const uploadCsvEmployee = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter,
});

export default uploadCsvEmployee;
