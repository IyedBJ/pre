const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { extractFinancialData, extractZipData } = require("../controllers/financialController");

/**
 * Configuration du stockage Multer :
 * - Destination : dossier "uploads/" à la racine du projet
 * - Nom du fichier : timestamp + nombre aléatoire + extension d'origine
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  }
});

/**
 * Initialisation de Multer avec la configuration de stockage.
 * On pourrait ajouter des limites : fileSize, etc.
 */
const upload = multer({ storage });

/**
 * Route POST /upload
 * Reçoit un fichier unique (PDF, image) dans le champ "file".
 * Délègue l'extraction des données financières au contrôleur extractFinancialData.
 */
router.post("/upload", upload.single("file"), extractFinancialData);

/**
 * Route POST /upload-zip
 * Reçoit un fichier ZIP contenant plusieurs documents (ex: fiches de paie).
 * Délègue le traitement au contrôleur extractZipData.
 */
router.post("/upload-zip", upload.single("file"), extractZipData);

module.exports = router;