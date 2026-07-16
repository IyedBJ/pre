const fs = require('fs');   // pour interagir avec le système de fichiers (lire dossiers, supprimer fichiers)
const path = require('path'); // pour manipuler les chemins de fichiers

/**
 * Parcourt un répertoire et supprime les fichiers dont la dernière modification
 * est plus vieille que la durée de rétention spécifiée.
 * 
 * @param {string} dirPath      - Chemin du dossier à nettoyer
 * @param {number} retentionMs  - Âge maximum autorisé en millisecondes
 */
const cleanupOldFiles = (dirPath, retentionMs) => {
    const now = Date.now(); // horodatage actuel (ms)

    // Lecture asynchrone du contenu du dossier
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error(`Erreur lors de la lecture du dossier ${dirPath} :`, err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(dirPath, file);

            // Ne pas supprimer les fichiers spéciaux utiles pour le versionnement (Git)
            if (file === '.gitkeep' || file === '.gitignore') return;

            // Récupération des informations sur le fichier (taille, dates, etc.)
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`Erreur lors de l'accès au fichier ${filePath} :`, err);
                    return;
                }

                // Ne traiter que les fichiers (ignorer les sous-dossiers)
                if (stats.isFile()) {
                    const ageMs = now - stats.mtimeMs; // âge en millisecondes (modification)
                    if (ageMs > retentionMs) {
                        // Suppression asynchrone du fichier
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                console.error(`Erreur lors de la suppression de ${filePath} :`, err);
                            } else {
                                const ageHours = Math.round(ageMs / (1000 * 60 * 60));
                                console.log(`Fichier supprimé : ${file} (âge : ${ageHours} heures)`);
                            }
                        });
                    }
                }
            });
        });
    });
};

/**
 * Initialise une tâche périodique de nettoyage des fichiers anciens.
 * Exécute un premier nettoyage immédiat, puis planifie des nettoyages réguliers.
 * 
 * @param {string} uploadsDir   - Dossier à surveiller (par défaut 'uploads/')
 * @param {number} intervalMs   - Intervalle entre deux nettoyages (ms, par défaut 1h)
 * @param {number} retentionMs  - Âge maximum de conservation (ms, par défaut 24h)
 */
const initCleanupTask = (uploadsDir = 'uploads/', intervalMs = 3600000, retentionMs = 86400000) => {
    // Nettoyage immédiat au démarrage
    cleanupOldFiles(uploadsDir, retentionMs);

    // Planification des nettoyages périodiques
    setInterval(() => {
        cleanupOldFiles(uploadsDir, retentionMs);
    }, intervalMs);
};

// Export des fonctions pour les utiliser dans d'autres fichiers
module.exports = { initCleanupTask };