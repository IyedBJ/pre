const { spawn } = require("child_process");
const path = require("path");
const { DonneesMensuelles } = require("../models");

/**
 * Cache en mémoire (RAM) pour éviter de relancer le lourd script Python
 * lorsque les données d'entrée et le nombre de mois sont identiques.
 */
const forecastCache = new Map();

/**
 * Contrôleur : getForecast
 * Calcule une prévision pour un projet spécifique.
 * URL : GET /api/forecast/:projectId?months=6
 */
exports.getForecast = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { months } = req.query; // nombre de mois à prédire (optionnel)

    // Récupération de tout l'historique financier du projet, trié par mois
    const history = await DonneesMensuelles.findAll({
      where: { idProjet: projectId },
      order: [['mois', 'ASC']]
    });

    // Délégation à la fonction commune runForecaster
    return runForecaster(history, res, months);
  } catch (error) {
    console.error("Forecast Controller Error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Contrôleur : getGlobalForecast
 * Calcule une prévision macro pour l'ensemble de l'entreprise.
 * URL : GET /api/forecast/global?months=6
 */
exports.getGlobalForecast = async (req, res) => {
  try {
    const { months } = req.query;
    // Récupération de TOUS les enregistrements financiers, sans filtre projet
    const history = await DonneesMensuelles.findAll({
      order: [['mois', 'ASC']]
    });
    return runForecaster(history, res, months);
  } catch (error) {
    console.error("Global Forecast Controller Error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Fonction principale : runForecaster
 * Agrège les données mensuelles, vérifie la suffisance des données,
 * lance le script Python forecaster.py (Prophet) et retourne les prédictions.
 *
 * @param {Array} history   - Liste des objets DonneesMensuelles bruts
 * @param {Object} res      - Objet response Express
 * @param {number} nMonths  - Nombre de mois à prédire (par défaut 6)
 */
const runForecaster = (history, res, nMonths = 6) => {
  // ---------- ÉTAPE 1 : Agrégation par mois ----------
  // On additionne les valeurs qui ont le même mois (YYYY-MM)
  const aggregated = history.reduce((acc, curr) => {
    const month = curr.mois;
    if (!acc[month]) {
      acc[month] = {
        month,
        rentabilite: 0,
        coutTotal: 0,
        invoiceAmount: 0
      };
    }
    acc[month].rentabilite += curr.rentabilite || 0;
    acc[month].coutTotal += curr.coutTotal || 0;
    acc[month].invoiceAmount += curr.invoiceAmount || 0;
    return acc;
  }, {});

  // Transformation en tableau et tri chronologique (ex: 2024-01, 2024-02, ...)
  const uniqueMonths = Object.values(aggregated).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  // ---------- ÉTAPE 2 : Vérification des données suffisantes ----------
  // Prophet nécessite au moins 2 points historiques
  if (uniqueMonths.length < 2) {
    return res.json({
      predictions: [],
      alert: false,
      reason: "Données insuffisantes (minimum 2 mois distincts d'historique requis).",
      history: uniqueMonths
    });
  }

  // ---------- ÉTAPE 3 : Cache ----------
  // Empreinte unique des données agrégées (séquentialisation JSON)
  const dataFingerprint = JSON.stringify(uniqueMonths);
  const cacheKey = `${dataFingerprint}_${nMonths}`;

  // Vérifier si le résultat est déjà en cache
  if (forecastCache.has(cacheKey)) {
    const cachedResult = forecastCache.get(cacheKey);
    return res.json({
      ...cachedResult,
      history: uniqueMonths,
      cached: true      // Indique que la réponse vient du cache
    });
  }

  // ---------- ÉTAPE 4 : Appel du microservice Python ----------
  const scriptPath = path.join(__dirname, "../../microservice-python/forecaster.py");
  
  // Utilise l'environnement (ex: python3 sur Render) ou le chemin par défaut
  const pythonPath = process.env.PYTHON_PATH || "python3";

  // Lancement du script Python
  const pythonProcess = spawn(pythonPath, [scriptPath, dataFingerprint, nMonths.toString()]);

  let dataString = "";
  let errorString = "";

  // Gestion des erreurs de lancement (ex: python non trouvé)
  pythonProcess.on("error", (err) => {
    console.error(`[Forecast] Failed to start python process: ${err.message}`);
    if (!res.headersSent) {
      res.status(500).json({ error: "Could not start prediction engine", detail: err.message });
    }
  });

  // Collecte de la sortie standard (stdout)
  pythonProcess.stdout.on("data", (data) => {
    dataString += data.toString();
  });

  // Collecte des erreurs (stderr)
  pythonProcess.stderr.on("data", (err) => {
    errorString += err.toString();
  });

  // Fin du processus Python
  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`[Forecast] Python Error: ${errorString}`);
      if (!res.headersSent) {
        return res.status(500).json({
          error: "Prediction script failed",
          details: errorString
        });
      }
      return;
    }
    try {
      // Parsing du JSON retourné par Python
      const result = JSON.parse(dataString);

      // Stockage dans le cache pour de futures requêtes identiques
      forecastCache.set(cacheKey, result);

      // Réponse finale : prédictions + historique + indicateur cache=false
      res.json({
        ...result,
        history: uniqueMonths,
        cached: false
      });
    } catch (err) {
      console.error("JSON parse error:", dataString);
      res.status(500).json({
        error: "Failed to parse prediction result",
        raw: dataString
      });
    }
  });
};