// Importation de la bibliothèque Axios pour effectuer des requêtes HTTP
import axios from 'axios';

// URL de base du backend (à adapter selon l'environnement)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';

// Création d'une instance Axios préconfigurée
// Toutes les requêtes partiront de cette instance, ce qui évite de répéter l'URL de base
const api = axios.create({
  baseURL: `${API_URL}/api`, // Toutes les routes seront préfixées par /api
});

/**
 * INTERCEPTEUR DE REQUÊTE
 * Se déclenche avant l'envoi de chaque requête HTTP.
 * Permet d'ajouter automatiquement le token JWT (si présent) dans l'en-tête Authorization.
 */
api.interceptors.request.use(
  (config) => {
    // Récupération du token stocké dans le localStorage (après connexion réussie)
    const token = localStorage.getItem('userToken');

    // Si le token existe, on l'ajoute à l'en-tête Authorization avec le préfixe "Bearer"
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // On retourne la configuration modifiée (ou non) pour que la requête soit envoyée
    return config;
  },
  (error) => {
    // En cas d'erreur dans la préparation de la requête (très rare), on la propage
    return Promise.reject(error);
  }
);

/**
 * INTERCEPTEUR DE RÉPONSE
 * Se déclenche lorsqu'une réponse est reçue (succès) ou en cas d'erreur HTTP (4xx, 5xx).
 * Permet de formater uniformément les messages d'erreur provenant du backend.
 */
api.interceptors.response.use(
  // En cas de succès (statut 2xx), on renvoie la réponse telle quelle
  (response) => response,

  // En cas d'erreur (statut >= 400)
  (error) => {
    // Tentative d'extraction du message d'erreur fourni par le backend
    // Le backend renvoie généralement une structure { message: "..." }
    const message = error.response?.data?.message || "Une erreur est survenue";

    // On attache le message formaté à l'objet erreur sous une propriété personnalisée
    // Cela permet aux composants d'afficher un message compréhensible pour l'utilisateur
    error.formattedMessage = message;

    // On rejette la promesse avec l'erreur enrichie
    return Promise.reject(error);
  }
);

// Export de l'instance configurée pour l'utiliser dans toute l'application
export default api;