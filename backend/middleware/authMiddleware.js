// Importation de la bibliothèque JWT
const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification : vérifie la présence et la validité du token JWT.
 * Doit être utilisé sur toutes les routes protégées.
 */
const protect = (req, res, next) => {
  let token;

  // Vérifie si l'en-tête Authorization existe et commence par "Bearer "
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extrait le token (deuxième partie de la chaîne)
      token = req.headers.authorization.split(' ')[1];
      
      // Vérifie et décode le token avec la clé secrète
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_jwt");
      
      // Attache le contenu du token (user) à l'objet req pour les middlewares suivants
      req.user = decoded;
      
      // Passe à la suite (route ou middleware suivant)
      next();
    } catch (error) {
      // Token invalide (expiré, falsifié, signature incorrecte)
      console.error(error);
      return res.status(401).json({ message: 'Non autorisé, token invalide' });
    }
  }

  // Si aucun token n'a été extrait => requête non authentifiée
  if (!token) {
    return res.status(401).json({ message: 'Non autorisé, pas de token' });
  }
};

/**
 * Middleware d'autorisation : réserve l'accès aux administrateurs.
 * Doit être placé après protect.
 */
const admin = (req, res, next) => {
  // Vérifie que l'utilisateur existe et que son rôle est "admin"
  if (req.user && req.user.role === 'admin') {
    next(); // Autorisation accordée
  } else {
    res.status(403).json({ message: 'Non autorisé, rôle administrateur requis' });
  }
};

/**
 * Middleware d'autorisation : autorise les utilisateurs finance et admin.
 * Doit être placé après protect.
 */
const finance = (req, res, next) => {
  // Vérifie rôle "finance" ou "admin" (admin a tous les droits)
  if (req.user && (req.user.role === 'finance' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Non autorisé, accès finance requis' });
  }
};

// Exportation des trois middlewares pour utilisation dans les routes
module.exports = { protect, admin, finance };
//  Utilisation dans une route Express


// authController.js est appelé une seule fois au moment de la connexion.

// Les middlewares (protect, admin, finance) sont appelés à chaque requête sur les routes protégées.

// Le middleware protect est indispensable pour que req.user existe ; sans lui, admin et finance échoueront.

// La sécurité repose sur le secret JWT : il doit être identique dans authController et dans le script de middlewares.