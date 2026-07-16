// Importation de la classe Sequelize depuis l'ORM
const { Sequelize } = require('sequelize');

/**
 * Instance unique de connexion à la base de données MySQL.
 * Les paramètres sont lus depuis les variables d'environnement.
 */
const sequelize = new Sequelize(
  process.env.DB_NAME,  // Nom de la base de données
  process.env.DB_USER,  // Utilisateur MySQL
  process.env.DB_PASS,  // Mot de passe MySQL
  {
    host: process.env.DB_HOST,   // Adresse du serveur
    port: process.env.DB_PORT || 3306, // Port MySQL
    dialect: 'mysql',            // Type de base de données
    logging: false,              // Désactive l'affichage des requêtes SQL
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

/**
 * Fonction asynchrone qui teste la connexion à MySQL.
 * À appeler au démarrage de l'application.
 * Si la connexion échoue, le processus s'arrête avec une erreur.
 */
const connectDB = async () => {
  try {
    // authentificate() vérifie simplement que la connexion est possible
    await sequelize.authenticate();
    console.log('MySQL Connecté avec succès');
  } catch (error) {
    // En cas d'erreur (mauvais identifiants, serveur injoignable, etc.)
    console.error(`Erreur de connexion MySQL : ${error.message}`);
    // Arrêt brutal du processus Node.js (code 1 = erreur)
    process.exit(1);
  }
};

// On exporte l'instance Sequelize (pour les modèles) et la fonction de test
module.exports = { sequelize, connectDB };