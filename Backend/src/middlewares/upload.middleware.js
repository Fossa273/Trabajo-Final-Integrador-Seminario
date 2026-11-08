import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let uploadsDir = path.join(__dirname, "..", "..", "uploads");

// El FS del proyecto puede ser read-only en serverless: se degrada a /tmp
try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.accessSync(uploadsDir, fs.constants.W_OK);
} catch {
    uploadsDir = path.join(process.env.TMPDIR || "/tmp", "stylo-uploads");
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const safeName = file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
        const ext = path.extname(safeName) || path.extname(file.originalname) || ".jpg";
        cb(null, `${unique}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Solo se permiten imágenes (JPG, PNG, WEBP, GIF)."), false);
    }
};

const proofFileFilter = (req, file, cb) => {
    const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf"
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error("Solo se permiten comprobantes en JPG, PNG, WEBP, GIF o PDF."),
            false
        );
    }
};

export const uploadSingleImage = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).single("image");

export const uploadPaymentProof = multer({
    storage,
    fileFilter: proofFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
}).single("proof");