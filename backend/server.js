// Chargement des variables d'environnement (fichier .env)
const dotenv = require('dotenv');
dotenv.config();

// Modules principaux
const express = require('express');
const cors = require('cors');
const fs = require('fs');

// Connexion à la base de données (MySQL)
const { connectDB, sequelize } = require('./config/db');

// Importation de tous les routeurs (chaque fichier expose un router Express)
const uploadRouter = require("./routes/upload");
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employes");
const clientRoutes = require("./routes/clients");
const projectRoutes = require("./routes/projets");
const invoiceRoutes = require("./routes/factures");
const rolesRoutes = require("./routes/roles");
const monthlyDataRoutes = require("./routes/donnees_mensuelles");
const forecastRoutes = require("./routes/forecast");
const syncRoutes = require("./routes/sync");
const chatbotRoutes = require("./routes/chatbot");
const reportRoutes = require("./routes/reports");
const configRoutes = require("./routes/configurations");

// Middleware d'authentification (utilisé dans certains routeurs)
const { protect } = require('./middleware/authMiddleware');

// Service de nettoyage automatique des fichiers uploadés
const { initCleanupTask } = require('./services/cleanupService');

// Création du dossier "uploads/" s'il n'existe pas (pour stocker fichiers temporaires)
if (!fs.existsSync("uploads/")) {
    fs.mkdirSync("uploads/");
}

// Lancement du nettoyage : vérifie toutes les heures (3600000 ms) et supprime les fichiers de plus de 24h (86400000 ms)
initCleanupTask("uploads/", 3600000, 86400000);

// Fonction asynchrone pour synchroniser les modèles avec la base de données
const syncDB = async () => {
    try {
        await connectDB();                    // Teste la connexion MySQL
        await sequelize.sync({ alter: false }); // Crée les tables si elles n'existent pas (sans modifier l'existant)
        console.log("Les tables ont été synchronisées.");
    } catch (err) {
        console.error("Erreur lors de la synchronisation SQL:", err);
    }
};
syncDB(); // Exécution de la synchronisation au démarrage

// Initialisation de l'application Express
const app = express();

// Middlewares globaux
app.use((req, res, next) => {
    const origin = req.headers.origin;
    // On autorise tout ce qui est Vercel ou Localhost
    if (origin && (origin.endsWith('.vercel.app') || origin.startsWith('http://localhost'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Réponse immédiate pour le Preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());    // Parse automatiquement le JSON des requêtes entrantes

// Route de test
app.get('/', (req, res) => res.send('Hello World!'));

// Montage de tous les routeurs avec leurs préfixes respectifs
app.use("/api", uploadRouter);                  // Upload de fichiers (extraction financière)
app.use("/api/auth", authRoutes);               // Authentification (LDAP, JWT)
app.use("/api/employes", employeeRoutes);       // Gestion des employés
app.use("/api/clients", clientRoutes);          // Gestion des clients (sync Dolibarr)
app.use("/api/projets", projectRoutes);         // Gestion des projets
app.use("/api/factures", invoiceRoutes);        // Gestion des factures
app.use("/api/roles", rolesRoutes);             // Gestion des rôles utilisateurs
app.use("/api/donnees-mensuelles", monthlyDataRoutes); // Données financières mensuelles
app.use("/api/forecast", forecastRoutes);       // Prévisions IA (Prophet)
app.use("/api/sync", syncRoutes);               // Synchronisation avec Dolibarr
app.use("/api/chatbot", chatbotRoutes);         // Assistant conversationnel (Groq)
app.use("/api/reports", reportRoutes);          // Rapports statistiques
app.use("/api/configurations", configRoutes);   // Configuration (clés API, modèles)

// Démarrage du serveur sur le port défini dans .env ou 5000 par défaut
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));