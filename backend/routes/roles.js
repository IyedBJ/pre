const express = require('express');
const router = express.Router();
const { Role, Employe } = require('../models');
const { Op } = require('sequelize');

// Récupérer tous les rôles
router.get('/', async (req, res) => {
  try {
    const roles = await Role.findAll({ order: [['nom', 'ASC']] });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Créer un nouveau rôle
router.post('/', async (req, res) => {
  try {
    const role = await Role.create({ nom: req.body.name || req.body.nom, description: req.body.description });
    res.status(201).json(role);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Ce nom de rôle existe déjà' });
    }
    res.status(400).json({ message: err.message });
  }
});
// Mettre à jour un rôle existant
router.put('/:id', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: 'Rôle non trouvé' });
    await role.update({ nom: req.body.name || req.body.nom, description: req.body.description });
    res.json(role);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Ce nom de rôle existe déjà' });
    }
    res.status(400).json({ message: err.message });
  }
});
// Supprimer un rôle (seulement s'il n'est pas utilisé par des employés)
router.delete('/:id', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: 'Rôle non trouvé' });

    // Vérifier par ID et aussi par nom au cas où certains employés ont format (nom seul)
    const count = await Employe.count({
      where: {
        [Op.or]: [
          { idRôle: role.id },
          { rôle: role.nom }
        ]
      }
    });

    if (count > 0) {
      return res.status(400).json({ message: `Ce rôle est utilisé par ${count} employé(s), suppression impossible.` });
    }
    
    await role.destroy();
    res.json({ message: 'Rôle supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;