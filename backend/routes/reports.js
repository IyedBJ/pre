const express = require('express');
const router = express.Router();
const { Projet, Employe, DonneesMensuelles } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

/**
 * Route GET /weekly-stats
 * Génère un rapport de statistiques globales, d'activité récente et financières.
 * Réponse JSON contenant indicateurs clés et logo en base64.
 */
router.get('/weekly-stats', async (req, res) => {
  try {
    // --- 1. Définir les périodes ---
    const now = new Date();
    // Début du mois en cours (ex: 2025-02-01 00:00:00)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // Chaîne YYYY-MM pour interroger DonneesMensuelles
    const monthStr = now.toISOString().substring(0, 7); // "2025-02"

    // --- 2. Statistiques globales ---
    const totalProjects = await Projet.count();
    const totalEmployees = await Employe.count();

    // --- 3. Nouvelles créations dans le mois ---
    const newProjectsThisMonth = await Projet.count({
      where: { createdAt: { [Op.gte]: startOfMonth } }
    });
    const newEmployeesThisMonth = await Employe.count({
      where: { createdAt: { [Op.gte]: startOfMonth } }
    });

    // --- 4. Données financières du mois ---
    const currentMonthData = await DonneesMensuelles.findAll({
      where: { mois: monthStr }
    });

    // Agrégation des montants
    const monthlyRevenue = currentMonthData.reduce(
      (sum, d) => sum + (Number(d.montantFacturé) || 0), 0
    );
    const monthlyCosts = currentMonthData.reduce(
      (sum, d) => sum + (Number(d.coutTotal) || 0), 0
    );
    const monthlyMarge = monthlyRevenue - monthlyCosts;

    // --- 5. Projet le plus rentable du mois ---
    // Trier par marge (montantFacturé - coutTotal) décroissant
    const sortedByMarge = [...currentMonthData].sort((a, b) => {
      const margeA = (a.montantFacturé || 0) - (a.coutTotal || 0);
      const margeB = (b.montantFacturé || 0) - (b.coutTotal || 0);
      return margeB - margeA;
    });
    const topProjectData = sortedByMarge[0];

    let topProjectName = "Aucun (Pas de données)";
    if (topProjectData && topProjectData.idProjet) {
      const proj = await Projet.findByPk(topProjectData.idProjet);
      topProjectName = proj ? proj.titre : "Inconnu";
    }

    // --- 6. Lecture du logo (encodage base64) ---
    let logoBase64 = '';
    // Chemin relatif : on remonte de deux niveaux pour atteindre frontend/src/assets
    const logoPath = path.join(__dirname, '../../frontend/src/assets/logoelzei.png');
    try {
      if (fs.existsSync(logoPath)) {
        logoBase64 = fs.readFileSync(logoPath, 'base64');
      }
    } catch (err) {
      console.error("Impossible de lire le logo :", err.message);
    }
    // Balise HTML prête à l'emploi pour intégration dans un email
    const logoImgTag = logoBase64
      ? `<img src="data:image/png;base64,${logoBase64}" alt="Elzei Logo" style="max-height: 80px;" />`
      : '';

    // --- 7. Construction de la réponse ---
    res.json({
      timestamp: now.toLocaleDateString('fr-FR') + ' à ' + now.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
      global: {
        totalProjects,
        totalEmployees
      },
      recentActivity: {
        newProjectsThisMonth,
        newEmployeesThisMonth
      },
      financialSummaryCurrentMonth: {
        month: monthStr,
        totalRevenue: monthlyRevenue.toFixed(2),
        totalCosts: monthlyCosts.toFixed(2),
        estimatedMarge: monthlyMarge.toFixed(2),
        topProject: topProjectName
      },
      logoBase64: logoBase64,        // données brutes pour usage personnalisé
      message: "Rapport mensuel généré avec succès."
    });

  } catch (err) {
    console.error("Erreur lors de la génération du rapport :", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;