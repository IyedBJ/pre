const express = require('express');
const router = express.Router();
const { DonneesMensuelles } = require('../models');
const { getForecast, getGlobalForecast } = require('../controllers/forecastController');
// Convertit une valeur en nombre, en retournant 0 si la conversion échoue (ex. chaîne vide, null, non numérique). Utilisé pour normaliser les données d'entrée avant de les stocker en base de données ou de les envoyer au script de prévision.
const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
// Convertit une valeur en booléen, en traitant les différentes représentations possibles de "vrai" (booléen true, chaîne "true", nombre 1, chaîne "1") comme vrai, et tout le reste comme faux. Utile pour normaliser les données d'entrée avant de les stocker ou de les utiliser dans la logique métier.
const toBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';
// Construit un objet de données mensuelles à partir du corps de la requête, en mappant les champs attendus et en appliquant les conversions nécessaires (toNumber, toBoolean) pour garantir que les données sont dans le format correct avant d'être stockées en base de données ou utilisées dans la logique métier.
const buildPayload = (body) => ({
  idEmployé: Number(body.idEmployé || body.employeeId),
  mois: body.mois || body.month,
  tjm: toNumber(body.tjm),
  joursTravaillés: toNumber(body.joursTravaillés ?? body.daysWorked),
  montantFacturé: toNumber(body.montantFacturé ?? body.invoiceAmount),
  facturePayée: toBoolean(body.facturePayée ?? body.invoicePaid),
  salaireBrut: toNumber(body.salaireBrut),
  salaireNetApresPAS: toNumber(body.salaireNetApresPAS),
  salaireNetAvantPAS: toNumber(body.salaireNetAvantPAS),
  salaireNetHorsRepas: toNumber(body.salaireNetHorsRepas),
  fraisRepas: toNumber(body.fraisRepas),
  fraisKilometriques: toNumber(body.fraisKilometriques),
  autresFrais: toNumber(body.autresFrais),
  chargesPatronales: toNumber(body.chargesPatronales),
  chargesSalariales: toNumber(body.chargesSalariales),
  totalPercu: toNumber(body.totalPercu),
  totalFrais: toNumber(body.totalFrais),
  totalCharges: toNumber(body.totalCharges),
  coutTotal: toNumber(body.coutTotal),
  rentabilite: toNumber(body.rentabilite),
  pourcentageRentabilite: toNumber(body.pourcentageRentabilite),
  extra: toNumber(body.extra),
  idProjet: (body.idProjet || body.projectId) ? Number(body.idProjet || body.projectId) : null
});

/**
 * Route GET /
 * Récupère la liste des données mensuelles.
 * Optionnel : filtrer par idEmployé via query string.
 */
router.get('/', async (req, res) => {
  try {
    const where = {};

    if (req.query.idEmployé) {
      where.idEmployé = Number(req.query.idEmployé);
    }

    const entries = await DonneesMensuelles.findAll({
      where,
      order: [['mois', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json(entries);
  } catch (err) {
    console.error('Erreur GET /api/monthly-data:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/employee/:idEmploye', async (req, res) => {
  try {
    const entries = await DonneesMensuelles.findAll({
      where: { idEmployé: Number(req.params.idEmploye) },
      order: [['mois', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json(entries);
  } catch (err) {
    console.error('Erreur GET /api/monthly-data/employee/:idEmploye:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    if (!req.body.idEmployé || !req.body.mois) {
      return res.status(400).json({ message: 'idEmployé et mois sont obligatoires.' });
    }

    const payload = buildPayload(req.body);

    if (!Number.isInteger(payload.idEmployé) || payload.idEmployé <= 0) {
      return res.status(400).json({ message: 'idEmployé invalide.' });
    }

    const [entry, created] = await DonneesMensuelles.findOrCreate({
      where: {
        idEmployé: payload.idEmployé,
        idProjet: payload.idProjet,
        mois: payload.mois
      },
      defaults: payload
    });

    if (!created) {
      await entry.update(payload);
    }

    const savedEntry = await DonneesMensuelles.findByPk(entry.id);

    res.status(created ? 201 : 200).json(savedEntry);
  } catch (err) {
    console.error('Erreur POST /api/monthly-data:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
