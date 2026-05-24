// child_process.spawn permet de lancer un programme externe (ici Python)
const { spawn } = require("child_process");
const path = require("path");

/**
 * Contrôleur : extractFinancialData
 * Traite le téléchargement d'un fichier unique (PDF, Image), lance le microservice Python (OCR/IA)
 * pour en extraire des données financières, et renvoie le JSON structuré généré par Python.
 */
exports.extractFinancialData = (req, res) => {
    // Vérifier qu'un fichier a bien été uploadé (via multer par exemple)
    if (!req.file) return res.status(400).send({ error: "Fichier manquant" });

    // Chemin absolu du fichier temporaire stocké par multer
    const filePath = path.resolve(req.file.path);
    // Extension du fichier original (ex: ".pdf", ".png")
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    // Chemins vers le script Python et l'interpréteur Python (attention chemin fixe !)
    const scriptPath = path.join(__dirname, "../../microservice-python/ai_extractor.py");
    const pythonPath = process.env.PYTHON_PATH || "python3";

    // Récupération d'un éventuel mode d'extraction passé dans le body de la requête
    const mode = req.body.mode || "";
    
    // Lancement du processus Python
    const pythonProcess = spawn(pythonPath, [scriptPath, filePath, fileExt, mode]);

    let dataString = "";  // Accumulateur de la sortie standard (stdout)
    let errorString = ""; // Accumulateur des erreurs (stderr)

    // Collecte des données sur stdout (flux de sortie normal)
    pythonProcess.stdout.on("data", (data) => {
        dataString += data.toString();
    });

    // Collecte des erreurs sur stderr
    pythonProcess.stderr.on("data", (err) => {
        errorString += err.toString();
    });

    // Événement déclenché quand le processus Python se termine
    pythonProcess.on("close", (code) => {
        // Si le code de sortie n'est pas 0, le script a échoué
        if (code !== 0) {
            return res.status(500).json({
                error: "Le script Python a échoué",
                details: errorString
            });
        }
        // Tenter de parser la sortie JSON produite par Python
        try {
            const result = JSON.parse(dataString);
            res.json(result); // Renvoyer le résultat structuré au client
        } catch (err) {
            // Si le JSON est invalide, renvoyer l'erreur et la sortie brute
            res.status(500).send({
                error: "Erreur JSON lors de l'extraction",
                raw: dataString
            });
        }
    });
};

/**
 * Contrôleur : extractZipData
 * Traite un lot de fichiers encapsulés dans un ZIP. Appelle le script Python adapté (`zip_processor.py`)
 * pour analyser plusieurs documents à la fois (ex: plusieurs fiches de paie pour un même salarié).
 */
exports.extractZipData = (req, res) => {
    // Vérifier la présence du fichier ZIP et du nom du salarié
    if (!req.file) return res.status(400).send({ error: "Fichier ZIP manquant" });
    const { employeeName, fileType } = req.body;

    if (!employeeName) return res.status(400).send({ error: "Nom du salarié manquant" });

    // Chemins du fichier ZIP uploadé et du script Python
    const filePath = path.resolve(req.file.path);
    const scriptPath = path.join(__dirname, "../../microservice-python/zip_processor.py");
    const pythonPath = process.env.PYTHON_PATH || "python3";

    // Mode optionnel (peut influencer le comportement de l'extraction)
    const mode = req.body.mode || "";

    // Lancement du processus Python avec les arguments attendus par zip_processor.py
    const pythonProcess = spawn(pythonPath, [
        scriptPath,
        filePath,
        employeeName,
        fileType || "unknown",
        mode
    ]);

    let dataString = "";
    let errorString = "";

    pythonProcess.stdout.on("data", (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (err) => {
        const msg = err.toString();
        errorString += msg;
    });

    pythonProcess.on("close", (code) => {
        if (code !== 0) {
            return res.status(500).json({
                error: "Le traitement du ZIP a échoué",
                details: errorString
            });
        }
        // Vérifier que Python a bien renvoyé quelque chose
        if (!dataString.trim()) {
            return res.status(500).json({
                error: "Python a retourné une réponse vide"
            });
        }
        try {
            const result = JSON.parse(dataString);
            res.json(result);
        } catch (err) {
            console.error("[Backend-ZIP] Erreur de parsing JSON:", dataString);
            res.status(500).send({
                error: "Erreur JSON lors du traitement du ZIP",
                raw: dataString
            });
        }
    });
};

// - Ces contrôleurs supposent que les scripts Python existent dans `microservice-python/` et
//   qu'ils sont capables d'analyser les documents et de produire un JSON valide sur stdout.
// - La gestion des erreurs et du nettoyage des fichiers temporaires (req.file) n'est pas montrée
//   ici ; en production, il faudrait supprimer les fichiers après traitement pour éviter l'accumulation.
// - Le chemin fixe de l'exécutable Python doit être rendu configurable (variable d'environnement)
//   pour fonctionner sur différents environnements.