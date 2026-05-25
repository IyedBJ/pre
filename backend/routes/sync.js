const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const getDolibarrApi = require('../config/axiosConfig');
const { Client, Facture } = require('../models');
const { extractFinancialData, extractZipData } = require('../controllers/financialController');

/**
 * Configuration de Multer pour gérer l'upload de fichiers (PDF, Images, ZIP)
 */
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/**
 * Utilitaire pour garantir qu'on obtient toujours un tableau à partir des données de l'API.
 * Gère les cas où Dolibarr renvoie un objet si un seul résultat est trouvé.
 */
const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return Object.values(data);
  return [];
};

/**
 * Route POST /
 * Déclenche la synchronisation avec Dolibarr.
 * Récupère les tiers et factures, calcule les statistiques CA et effectue un bulkCreate (Upsert) en base locale.
 */
router.post('/', async (req, res) => {
  try {
    const dolibarrApi = await getDolibarrApi();
    const source_instance = dolibarrApi.defaults.baseURL || 'default_erp';

    console.log(`[Sync] Démarrage de la récupération Dolibarr (Limit: 10000)...`);
    
    const [clientsResponse, invoicesResponse] = await Promise.all([
      dolibarrApi.get('/thirdparties', {
        params: { limit: 10000, sortfield: 't.nom', sortorder: 'ASC' }
      }),
      dolibarrApi.get('/invoices', {
        params: { limit: 10000 }
      })
    ]);

    const dolibarrClients = ensureArray(clientsResponse.data);
    const dolibarrInvoices = ensureArray(invoicesResponse.data);
    
    console.log(`[Sync] Reçus: ${dolibarrClients.length} tiers, ${dolibarrInvoices.length} factures.`);
    
    // Archiver tous les clients et factures existants avant la nouvelle synchro
    await Client.update({ actif: false }, { where: {} });
    await Facture.update({ actif: false }, { where: {} });

    const invoiceStats = {};

    const clientMap = {};
    dolibarrClients.forEach(c => {
        clientMap[String(c.id)] = c;
    });

    dolibarrInvoices.forEach(inv => {
      if (inv.statut === "0") return; // on ignore les factures à l'état "brouillon"
      //Pour chaque client
      const sid = String(inv.socid);
      if (!invoiceStats[sid]) {
        invoiceStats[sid] = {
          total_ht: 0,
          total_ttc: 0,
          resteapayer: 0,
          count: 0,
          last_invoice_ref: inv.ref,
          last_invoice_date: inv.date
        };
      }
      invoiceStats[sid].total_ht += parseFloat(inv.total_ht || 0);
      invoiceStats[sid].total_ttc += parseFloat(inv.total_ttc || 0);
      const outstanding = inv.remaintopay !== undefined ? inv.remaintopay : (inv.resteapayer || 0);
      invoiceStats[sid].resteapayer += parseFloat(outstanding || 0);
      invoiceStats[sid].count += 1;
    });

    const normalizeDate = (d) => {
      if (!d) return 0;
      if (typeof d === 'number') return d;
      const parsed = new Date(d);
      return !isNaN(parsed.getTime()) ? Math.floor(parsed.getTime() / 1000) : 0;
    };

    const clientsToUpsert = dolibarrClients
      .filter(c => c.client === "1" || c.client === 1 || c.client === "3" || c.client === 3)//on ne conserve que les tiers qui sont des clients (client === "1" ou "3"). Les valeurs "2" = prospect, "0" = fournisseur. On filtre pour ne garder que les clients “facturables”.
      .map(c => {
        const stats = invoiceStats[String(c.id)] || { total_ht: 0, total_ttc: 0, resteapayer: 0, count: 0 };
        return {
          dolibarrId: String(c.id),
          source_instance: source_instance,
          actif: true,
          nom: c.name,
          email: c.email || null,
          codeClient: c.code_client || null,
          adresse: c.address || null,
          codePostal: c.zip || null,
          ville: c.town || null,
          phone: c.phone || null,
          url: c.url || null,
          country_code: c.country_code || null,
          capital: c.capital ? parseFloat(c.capital) : null,
          siren: c.idprof1 || null,
          siret: c.idprof2 || null,
          ape: c.idprof3 || null,
          note_public: c.note_public || null,
          totalCaHt: stats.total_ht,
          totalCaTtc: stats.total_ttc,
          montantRestant: stats.resteapayer,
          nombreFactures: stats.count,
          réfDernièreFacture: stats.last_invoice_ref || null,
          dateDernièreFacture: normalizeDate(stats.last_invoice_date) || null,
          dernièreSync: new Date(),
          bg: "bg-blue-100",
          logo: c.logo || null
        };
      });

    if (clientsToUpsert.length > 0) {
      try {
        console.log(`[Sync] Envoi en base: ${clientsToUpsert.length} tiers...`);
        await Client.bulkCreate(clientsToUpsert, {
          updateOnDuplicate: [
            'nom', 'email', 'codeClient', 'adresse', 'codePostal', 'ville', 'phone', 
            'url', 'country_code', 'capital', 'siren', 'siret', 'ape', 'note_public',
            'totalCaHt', 'totalCaTtc', 'montantRestant', 'nombreFactures',
            'réfDernièreFacture', 'dateDernièreFacture', 'dernièreSync', 'logo', 'actif'
          ]
        });
        console.log(`[Sync] Tiers mis à jour.`);
      } catch (clientErr) {
        throw new Error(`Erreur lors de la mise à jour des clients: ${clientErr.message}`);
      }
    }

    const invoicesToUpsert = dolibarrInvoices
      .filter(inv => String(inv.statut || inv.status || "") !== "0")
      .map(inv => {
        const tp = clientMap[String(inv.socid)] || {};
        return {
          dolibarrId: String(inv.id),
          source_instance: source_instance,
          actif: true,
          référence: inv.ref,
          date: normalizeDate(inv.date || inv.date_creation || inv.datec),
          dateEchéance: normalizeDate(inv.date_lim_reglement || inv.date_deadline),
          total_ht: parseFloat(inv.total_ht || 0),
          total_ttc: parseFloat(inv.total_ttc || 0),
          total_tva: parseFloat(inv.total_tva || 0),
          statut: inv.statut || inv.status,
          payé: inv.paye,
          resteAPayer: parseFloat(inv.remaintopay !== undefined ? inv.remaintopay : (inv.resteapayer || 0)),
          idClient: String(inv.socid),
          nomClient: tp.name || inv.client_name || inv.socname || "Client Inconnu", 
          codeClient: tp.code_client || inv.client_code || "",
          lignes: Array.isArray(inv.lines) ? inv.lines : []
        };
      });

    if (invoicesToUpsert.length > 0) {
      try {
        console.log(`[Sync] Envoi en base: ${invoicesToUpsert.length} factures...`);
        await Facture.bulkCreate(invoicesToUpsert, {
          updateOnDuplicate: [
            'référence', 'date', 'dateEchéance', 'total_ht', 'total_ttc', 
            'total_tva', 'statut', 'payé', 'resteAPayer', 'idClient', 
            'nomClient', 'codeClient', 'lignes', 'actif'
          ]
        });
        console.log(`[Sync] Factures mises à jour.`);
      } catch (invErr) {
        throw new Error(`Erreur lors de la mise à jour des factures: ${invErr.message}`);
      }
    }

    res.json({ message: "Synchronisation terminée avec succès" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Route DELETE /reset
 * Vide les tables locales Clients et Factures pour permettre une synchronisation propre.
 */
router.delete('/reset', async (req, res) => {
  try {
    await Promise.all([
      Client.destroy({ where: {}, truncate: false }),
      Facture.destroy({ where: {}, truncate: false })
    ]);
    res.json({ message: "Données locales Dolibarr réinitialisées avec succès" });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la réinitialisation des données." });
  }
});

module.exports = router;
