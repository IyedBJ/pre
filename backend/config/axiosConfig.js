const axios = require('axios');

/**
 * Récupère dynamiquement la configuration Dolibarr (depuis la base de données ou les variables d'environnement)
 * et retourne une instance Axios prête à être utilisée pour appeler l'API Dolibarr.
 * 
 */
const getDolibarrApi = async () => {
  // Importation dynamique pour éviter une dépendance circulaire avec le modèle Configuration
  const { Configuration } = require('../models');

  // Valeurs par défaut depuis les variables d'environnement
  let baseURL = process.env.DOLIBARR_API_URL;
  let apiKey = process.env.DOLIBARR_API_KEY;

  try {
    // Récupération simultanée des deux configurations stockées en base de données
    const [urlConfig, keyConfig] = await Promise.all([
      Configuration.findOne({ where: { key: 'DOLIBARR_API_URL' } }),
      Configuration.findOne({ where: { key: 'DOLIBARR_API_KEY' } })
    ]);

    // Surcharge si des valeurs sont trouvées en DB
    if (urlConfig && urlConfig.value) baseURL = urlConfig.value;
    if (keyConfig && keyConfig.value) apiKey = keyConfig.value;
  } catch (err) {
    // En cas d'erreur (ex. table non existante, base hors ligne), on conserve les variables d'environnement
    console.error("[DolibarrConfig] Erreur lors de la récupération en base de données:", err.message);
  }

  // Création de l'instance Axios avec l'URL de base et les en-têtes fixes
  const instance = axios.create({
    baseURL,
    timeout: 30000, // Timeout de 30 secondes pour éviter les blocages en prod
    headers: {
      'DOLIAPIKEY': apiKey,   // Clé API dans l'en-tête (standard Dolibarr)
      'Accept': 'application/json' // On demande une réponse JSON
    }
  });

  // Intercepteur : ajoute systématiquement le paramètre "api_key" à chaque requête
  // (certaines versions de Dolibarr attendent la clé aussi dans l'URL)
  instance.interceptors.request.use(config => {
    config.params = {
      ...config.params,    // Conserve les paramètres existants
      api_key: apiKey      // Ajoute la clé API
    };
    return config;
  });

  return instance;
};

module.exports = getDolibarrApi;