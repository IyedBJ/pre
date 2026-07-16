// routes/projets.js
const express = require('express');
const router = express.Router();
// Importation des modèles Sequelize
const { Projet, Employe, DonneesMensuelles } = require('../models');

/**
 * GET /projets
 * Récupère tous les projets avec les informations de l'employé associé,
 * triés du plus récent au plus ancien.
 */
router.get('/', async (req, res) => {
  try {
    const projects = await Projet.findAll({
      // Jointure avec la table Employe (alias 'employe')
      include: [{
        model: Employe,
        as: 'employe',
        // On ne sélectionne que les champs utiles pour l'affichage
        attributes: ['nom', 'email', 'rôle', 'avatar', 'tjm']
      }],
      order: [['createdAt', 'DESC']] // Tri par date de création décroissante
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /projets
 * Crée un nouveau projet.
 * Corps attendu (JSON) :
 * {
 *   "title": string,
 *   "ref": string (optionnel),
 *   "employeeId": number,
 *   "clientDolibarrId": string,
 *   "clientName": string,
 *   "tjm": number,
 *   "status": string (optionnel, défaut "En cours"),
 *   "marge": number (optionnel),
 *   "remarque": string (optionnel)
 * }
 */
router.post('/', async (req, res) => {
  try {
    // Création du projet avec les données du formulaire
    const project = await Projet.create({
      titre: req.body.title,
      // Génération d'une référence unique si non fournie
      référence: req.body.ref || `PRJ-${Date.now()}`,
      idEmployé: req.body.employeeId,
      idDolibarrClient: req.body.clientDolibarrId,
      nomClient: req.body.clientName,
      tjm: Number(req.body.tjm) || 0,        // Conversion en nombre, fallback 0
      statut: req.body.status || 'En cours', // Valeur par défaut
      marge: Number(req.body.marge) || 0,
      remarque: req.body.remarque || '',
    });

    // Recharger le projet créé avec l'employé associé (pour renvoyer un objet complet)
    const populated = await Projet.findByPk(project.id, {
      include: [{
        model: Employe,
        as: 'employe',
        attributes: ['nom', 'email', 'rôle', 'avatar', 'tjm']
      }]
    });

    res.status(201).json(populated);
  } catch (err) {
    console.error('POST /projets error:', err);
    res.status(400).json({ message: err.message });
  }
});

/**
 * PUT /projets/:id
 * Modifie un projet existant.
 * Corps identique au POST, mais tous les champs sont obligatoires (sauf ref optionnelle).
 */
router.put('/:id', async (req, res) => {
  try {
    const [updatedCount] = await Projet.update(
      {
        titre: req.body.title,
        référence: req.body.ref,
        idEmployé: req.body.employeeId,
        idDolibarrClient: req.body.clientDolibarrId,
        nomClient: req.body.clientName,
        tjm: Number(req.body.tjm),
        statut: req.body.status,
        marge: Number(req.body.marge),
        remarque: req.body.remarque,
      },
      { where: { id: req.params.id } }
    );

    // Si aucun projet n'a été trouvé avec cet ID
    if (updatedCount === 0) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    // Recharger le projet mis à jour avec l'employé
    const updated = await Projet.findByPk(req.params.id, {
      include: [{
        model: Employe,
        as: 'employe',
        attributes: ['nom', 'email', 'rôle', 'avatar', 'tjm']
      }]
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * DELETE /projets/:id
 * Supprime un projet uniquement s'il n'a pas de données mensuelles associées.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier l'existence de données de saisie mensuelle liées à ce projet
    const monthlyDataCount = await DonneesMensuelles.count({
      where: { idProjet: id }
    });

    if (monthlyDataCount > 0) {
      // Refuser la suppression pour préserver l'intégrité référentielle
      return res.status(400).json({
        message: 'Impossible de supprimer ce projet : il contient des données de saisie mensuelle (historique).'
      });
    }

    // Tenter la suppression
    const deletedCount = await Projet.destroy({ where: { id } });
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    res.json({ message: 'Projet supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;