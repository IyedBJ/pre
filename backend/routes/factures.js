// Importation du module Express et création d'un routeur
const express = require('express');
const router = express.Router();

// Importation du modèle Sequelize pour les factures
const { Facture } = require('../models');

/**
 * GET /api/factures
 * Récupère toutes les factures depuis la base locale.
 * Triées par date décroissante (les plus récentes en premier).
 * Remplace l'identifiant interne par dolibarrId pour cohérence avec l'ERP.
 */
router.get('/', async (req, res) => {
  try {
    // Requête Sequelize : tous les enregistrements, tri par date DESC
    const invoices = await Facture.findAll({
      order: [['date', 'DESC']]
    });

    // Transformation des données : on remplace 'id' par la valeur de 'dolibarrId'
    const mappedInvoices = invoices.map(inv => {
      const plain = inv.get({ plain: true }); // objet JS simple
      return {
        ...plain,
        id: plain.dolibarrId   // le frontend utilisera ce champ 'id'
      };
    });

    // Réponse JSON
    res.json(mappedInvoices);
  } catch (err) {
    // Log de l'erreur serveur et réponse 500
    console.error(`Database Error Invoices:`, err.message);
    res.status(500).json({
      message: "Erreur lors de la récupération des factures depuis la base locale",
      error: err.message
    });
  }
});

/**
 * GET /api/factures/:id
 * Récupère une facture spécifique par son dolibarrId.
 * @param {string} id - L'identifiant Dolibarr de la facture
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Recherche d'une facture dont le champ 'dolibarrId' correspond à l'ID fourni
    const inv = await Facture.findOne({
      where: { dolibarrId: String(id) }
    });

    // Si aucune facture trouvée, retour 404
    if (!inv) {
      return res.status(404).json({ message: "Facture non trouvée en local" });
    }

    // Transformation identique à la route précédente
    const plain = inv.get({ plain: true });
    res.json({
      ...plain,
      id: plain.dolibarrId
    });
  } catch (err) {
    console.error(`Database Error Facture Details:`, err.message);
    res.status(500).json({
      message: "Erreur lors de la récupération des détails de la facture",
      error: err.message
    });
  }
});

// Exportation du routeur pour l'utiliser dans l'application principale
module.exports = router;