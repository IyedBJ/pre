// routes/employes.js
const express = require('express');
const router = express.Router();
// Importation des modèles Sequelize
const { Employe, Role, Projet, DonneesMensuelles } = require('../models');

/**
 * GET /employes
 * Récupère tous les employés avec leurs informations de rôle associées,
 * triés du plus récent au plus ancien.
 */
router.get('/', async (req, res) => {
  try {
    const employees = await Employe.findAll({
      // Jointure avec la table Role (alias 'donneesRole')
      include: [{ model: Role, as: 'donneesRole' }],
      order: [['createdAt', 'DESC']] // Tri par date de création décroissante
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /employes
 * Crée un nouvel employé.
 * Corps attendu (JSON) :
 * {
 *   "idEmployé": string (optionnel, sinon généré),
 *   "nom": string,
 *   "email": string,
 *   "rôle": string,
 *   "idRôle": number,
 *   "numSécu": string (optionnel),
 *   "adresse": string (optionnel),
 *   "tjm": number,
 *   "statut": string (optionnel, défaut "Neutre"),
 *   "avatar": string (optionnel, URL)
 * }
 */
router.post('/', async (req, res) => {
  try {
    const newEmployee = await Employe.create({
      // Génération d'un identifiant métier unique si non fourni
      idEmployé: req.body.idEmployé || `EMP-${Date.now()}`,
      nom: req.body.nom,
      email: req.body.email,
      rôle: req.body.rôle,
      idRôle: req.body.idRôle,
      numSécu: req.body.numSécu,
      adresse: req.body.adresse,
      tjm: req.body.tjm,
      statut: req.body.statut || "Neutre", // Valeur par défaut
      avatar: req.body.avatar
    });
    res.status(201).json(newEmployee);
  } catch (err) {
    console.error("Erreur détaillée POST /employes:", err);
    res.status(400).json({ message: err.message, detailedError: err });
  }
});

/**
 * DELETE /employes/:id
 * Supprime un employé uniquement s'il n'est lié à aucun projet
 * et à aucune donnée de saisie mensuelle.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier l'existence de projets associés à cet employé
    const projectCount = await Projet.count({
      where: { idEmployé: id }
    });
    if (projectCount > 0) {
      return res.status(400).json({
        message: `Impossible de supprimer ce salarié : il est affecté à ${projectCount} projet(s).`
      });
    }

    // Vérifier l'existence de données mensuelles associées à cet employé
    const monthlyDataCount = await DonneesMensuelles.count({
      where: { idEmployé: id }
    });
    if (monthlyDataCount > 0) {
      return res.status(400).json({
        message: "Impossible de supprimer ce salarié : il possède un historique de saisies mensuelles."
      });
    }

    // Tenter la suppression
    const deletedCount = await Employe.destroy({ where: { id } });
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Salarié non trouvé' });
    }
    res.json({ message: 'Salarié supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUT /employes/:id
 * Met à jour un employé existant.
 * Corps attendu (même structure que POST, tous les champs obligatoires sauf avatar ?).
 */
router.put('/:id', async (req, res) => {
  try {
    const [updatedCount] = await Employe.update(
      {
        nom: req.body.nom,
        email: req.body.email,
        rôle: req.body.rôle,
        idRôle: req.body.idRôle,
        numSécu: req.body.numSécu,
        adresse: req.body.adresse,
        tjm: req.body.tjm,
        statut: req.body.statut,
        avatar: req.body.avatar
      },
      { where: { id: req.params.id } }
    );

    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Salarié non trouvé' });
    }

    // Recharger l'employé mis à jour (sans jointure avec Role ici)
    const updatedEmployee = await Employe.findByPk(req.params.id);
    res.json(updatedEmployee);
  } catch (err) {
    console.error("Erreur détaillée PUT /employes/:id:", err);
    res.status(400).json({ message: err.message, detailedError: err });
  }
});

module.exports = router;